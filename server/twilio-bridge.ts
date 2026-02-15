import type { Server } from "http";
import { textToSpeechBuffer } from "./elevenlabs";
import { snowflakeCortexComplete } from "./snowflake";
import { storage } from "./storage";
import { syncToMongo } from "./mongodb";

interface ConversationState {
  callLogId: string;
  cleanupId: string;
  operationName: string;
  cityName: string;
  messages: Array<{ role: "assistant" | "user"; content: string }>;
  transcript: Array<{ role: "agent" | "user"; text: string; timestamp: number }>;
  outcome: string | null;
  callSid: string;
  turnCount: number;
}

const conversations = new Map<string, ConversationState>();
const audioCache = new Map<string, Buffer>();
const callTranscriptListeners = new Map<string, Set<(data: any) => void>>();

export function subscribeToTranscript(callLogId: string, listener: (data: any) => void) {
  if (!callTranscriptListeners.has(callLogId)) {
    callTranscriptListeners.set(callLogId, new Set());
  }
  callTranscriptListeners.get(callLogId)!.add(listener);
  return () => {
    callTranscriptListeners.get(callLogId)?.delete(listener);
    if (callTranscriptListeners.get(callLogId)?.size === 0) {
      callTranscriptListeners.delete(callLogId);
    }
  };
}

function notifyListeners(callLogId: string, data: any) {
  const listeners = callTranscriptListeners.get(callLogId);
  if (listeners) {
    for (const listener of listeners) {
      listener(data);
    }
  }
}

function getServerDomain(): string {
  if (process.env.REPLIT_DEV_DOMAIN) return process.env.REPLIT_DEV_DOMAIN;
  if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
    return `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
  }
  return "localhost:5000";
}

export function cleanupConversation(callLogId: string) {
  const state = conversations.get(callLogId);
  if (state && !state.outcome) {
    state.outcome = "inconclusive";
    finalizeConversation(callLogId).catch(() => {});
  }
  for (const key of audioCache.keys()) {
    if (key.includes(callLogId)) {
      audioCache.delete(key);
    }
  }
}

function buildSystemPrompt(operationName: string, cityName: string): string {
  return `You are a phone agent for OceanGuard, an AI-powered ocean health monitoring platform. You are on a live phone call verifying conditions at a marine cleanup site.

CONTEXT:
- Operation: ${operationName}
- Location: ${cityName || "a monitored coastal area"}
- Purpose: Verify site readiness for a scheduled marine debris cleanup

YOUR BEHAVIOR:
- Be professional, warm, and conversational like a real person on the phone
- Keep responses concise (1-3 sentences max) since this is a phone call
- Ask follow-up questions naturally based on what the person says
- If they mention conditions, ask for more detail
- If they seem hesitant, reassure them about the cleanup process
- Work toward getting a clear confirmation or denial of site availability
- If they ask about OceanGuard, briefly explain it monitors ocean health using drones and AI

IMPORTANT: Generate ONLY your spoken response. No prefixes, labels, or formatting. Just natural speech.`;
}

export async function initConversation(params: {
  callLogId: string;
  cleanupId: string;
  operationName: string;
  cityName: string;
  callSid: string;
}): Promise<string> {
  const greeting = `Hello! This is OceanGuard's verification system calling about the ${params.operationName} cleanup operation${params.cityName ? ` in ${params.cityName}` : ""}. We'd like to verify the current conditions at the site. Could you tell me about the situation there?`;

  const state: ConversationState = {
    ...params,
    messages: [{ role: "assistant", content: greeting }],
    transcript: [{ role: "agent", text: greeting, timestamp: Date.now() }],
    outcome: null,
    turnCount: 0,
  };

  conversations.set(params.callLogId, state);

  const audioId = `greeting-${params.callLogId}`;
  try {
    const audioBuffer = await textToSpeechBuffer(greeting);
    audioCache.set(audioId, audioBuffer);
  } catch (err: any) {
    console.error("ElevenLabs TTS greeting failed:", err.message);
    audioCache.set(audioId, Buffer.alloc(0));
  }

  notifyListeners(params.callLogId, {
    type: "status",
    status: "connected",
  });
  notifyListeners(params.callLogId, {
    type: "transcript",
    role: "agent",
    text: greeting,
    timestamp: Date.now(),
  });

  return audioId;
}

export function updateCallSid(callLogId: string, callSid: string) {
  const state = conversations.get(callLogId);
  if (state) {
    state.callSid = callSid;
  }
}

export async function processUserSpeech(
  callLogId: string,
  speechText: string
): Promise<{
  responseText: string;
  audioId: string;
  isFinished: boolean;
  outcome: string | null;
}> {
  const state = conversations.get(callLogId);
  if (!state) throw new Error("Conversation not found");

  state.turnCount++;
  state.transcript.push({ role: "user", text: speechText, timestamp: Date.now() });

  notifyListeners(callLogId, {
    type: "transcript",
    role: "user",
    text: speechText,
    timestamp: Date.now(),
  });

  analyzeOutcome(state, speechText);

  let responseText: string;
  let isFinished = false;

  if (state.outcome === "accepted") {
    responseText = `That's great to hear! I've confirmed that the ${state.operationName} site${state.cityName ? ` in ${state.cityName}` : ""} is available for the cleanup operation. Our team will proceed with scheduling. Thank you so much for your help with ocean conservation!`;
    isFinished = true;
  } else if (state.outcome === "declined") {
    responseText = `I understand, thank you for letting us know. I'll update our records that the site is currently unavailable. If conditions change, our team may reach out again. Thank you for your time!`;
    isFinished = true;
  } else if (state.turnCount >= 6) {
    responseText = `Thank you for all this information. I'll pass everything along to our operations team and they may follow up if needed. Have a great day!`;
    state.outcome = "inconclusive";
    isFinished = true;
  } else {
    state.messages.push({ role: "user", content: speechText });

    const conversationHistory = state.messages
      .map((m) => `${m.role === "assistant" ? "Agent" : "Person"}: ${m.content}`)
      .join("\n");

    const prompt = `${buildSystemPrompt(state.operationName, state.cityName)}

Conversation so far:
${conversationHistory}

Generate your next spoken response:`;

    try {
      responseText = await snowflakeCortexComplete(prompt, "mistral-large2");
      responseText = responseText.replace(/^(Agent|Assistant|Response|AI):\s*/i, "").trim();
    } catch (err: any) {
      console.error("Snowflake Cortex response failed:", err.message);
      responseText = "I appreciate you sharing that. Could you clarify whether the site would be available for the cleanup operation?";
    }

    state.messages.push({ role: "assistant", content: responseText });
  }

  state.transcript.push({ role: "agent", text: responseText, timestamp: Date.now() });

  notifyListeners(callLogId, {
    type: "transcript",
    role: "agent",
    text: responseText,
    timestamp: Date.now(),
  });

  const audioId = `response-${callLogId}-${state.turnCount}`;
  try {
    const audioBuffer = await textToSpeechBuffer(responseText);
    audioCache.set(audioId, audioBuffer);
  } catch (err: any) {
    console.error("ElevenLabs TTS response failed:", err.message);
    audioCache.set(audioId, Buffer.alloc(0));
  }

  if (isFinished) {
    await finalizeConversation(callLogId);
  }

  return { responseText, audioId, isFinished, outcome: state.outcome };
}

export function getAudioBuffer(audioId: string): Buffer | undefined {
  return audioCache.get(audioId);
}

function analyzeOutcome(state: ConversationState, userText: string) {
  const lower = userText.toLowerCase();
  const positiveSignals = [
    "yes", "available", "ready", "good to go", "confirm", "sure",
    "absolutely", "of course", "that works", "we can do", "sounds good",
    "go ahead", "approved", "affirmative", "no problem", "definitely",
  ];
  const negativeSignals = [
    "no", "not available", "can't", "cannot", "unavailable", "closed",
    "denied", "reject", "impossible", "not possible", "negative", "decline",
    "not ready", "won't work", "forget it",
  ];

  for (const signal of positiveSignals) {
    if (lower.includes(signal)) {
      state.outcome = "accepted";
      return;
    }
  }
  for (const signal of negativeSignals) {
    if (lower.includes(signal)) {
      state.outcome = "declined";
      return;
    }
  }
}

async function finalizeConversation(callLogId: string) {
  const state = conversations.get(callLogId);
  if (!state) return;

  const transcriptText = state.transcript
    .map((t) => `${t.role === "agent" ? "OceanGuard" : "Recipient"}: ${t.text}`)
    .join("\n");

  const outcome = state.outcome || "inconclusive";
  const resultSummary =
    outcome === "accepted"
      ? "Site availability confirmed - cleanup can proceed as planned."
      : outcome === "declined"
      ? "Site not available or conditions unfavorable for cleanup operation."
      : "Call completed but availability status unclear - manual follow-up recommended.";

  try {
    await storage.updateCallLog(state.callLogId, {
      status: "completed",
      transcript: transcriptText || null,
      conversationId: state.callSid,
      result: `${outcome}: ${resultSummary}`,
      duration:
        state.transcript.length > 0
          ? Math.round(
              (state.transcript[state.transcript.length - 1].timestamp -
                state.transcript[0].timestamp) /
                1000
            )
          : 0,
    });

    notifyListeners(callLogId, {
      type: "completed",
      outcome,
      result: resultSummary,
      transcript: state.transcript,
    });

    syncToMongo("call_logs", { id: callLogId }).catch(() => {});
  } catch (err) {
    console.error("Failed to finalize call:", err);
  }

  conversations.delete(callLogId);

  for (const key of audioCache.keys()) {
    if (key.includes(callLogId)) {
      audioCache.delete(key);
    }
  }
}

export function getActiveCallTranscript(callLogId: string): ConversationState | undefined {
  return conversations.get(callLogId);
}

export function setupTwilioBridge(httpServer: Server) {
  console.log("Twilio-Snowflake-ElevenLabs conversation bridge initialized");
}
