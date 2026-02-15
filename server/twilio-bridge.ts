import type { Server } from "http";
import { textToSpeechBuffer } from "./elevenlabs";
import { snowflakeCortexComplete } from "./snowflake";
import { storage } from "./storage";
import { syncToMongo } from "./mongodb";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

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

function buildConversationSystemPrompt(operationName: string, cityName: string): string {
  return `You are a phone agent for OceanGuard, an AI-powered ocean health monitoring platform. You are on a live phone call verifying conditions at a marine cleanup site.

CONTEXT:
- Operation: ${operationName}
- Location: ${cityName || "a monitored coastal area"}
- Purpose: Verify site readiness for a scheduled marine debris cleanup

YOUR BEHAVIOR:
- Be professional, warm, and conversational like a real person on the phone
- Keep responses concise (1-3 sentences max) since this is a phone call
- Ask follow-up questions naturally based on what the person says
- LISTEN CAREFULLY to what the person actually says - if they say conditions are good, acknowledge that positively
- If they mention the site is in good condition or ready, confirm that and ask if there are any concerns before wrapping up
- If they mention problems, ask what kind and whether it affects the cleanup timeline
- If they seem hesitant, reassure them about the cleanup process
- Work toward getting a clear picture of site conditions - don't assume negative when information is positive
- If they ask about OceanGuard, briefly explain it monitors ocean health using drones and AI
- Never jump to negative conclusions - if someone says things are "good" or "pretty good", that is a POSITIVE signal

IMPORTANT: Generate ONLY your spoken response. No prefixes, labels, or formatting. Just natural speech.`;
}

async function analyzeOutcomeWithAI(state: ConversationState, userText: string): Promise<void> {
  if (state.outcome) return;

  const conversationHistory = state.transcript
    .map((t) => `${t.role === "agent" ? "OceanGuard Agent" : "Site Contact"}: ${t.text}`)
    .join("\n");

  const analysisPrompt = `You are analyzing a phone conversation between an OceanGuard verification agent and a site contact for the "${state.operationName}" cleanup operation${state.cityName ? ` in ${state.cityName}` : ""}.

The agent is trying to verify whether the cleanup site is available and conditions are suitable for a marine debris cleanup.

FULL CONVERSATION SO FAR:
${conversationHistory}

LATEST MESSAGE FROM SITE CONTACT: "${userText}"

Based on the FULL conversation context and especially the latest message, determine the site contact's overall sentiment about site availability:

RULES FOR ANALYSIS:
- If the person says conditions are "good", "pretty good", "fine", "okay", "not bad", "looking good" etc - that is POSITIVE even if they mention minor issues
- "A little bit messy" alongside "pretty good" means the site IS available but has minor debris - this is POSITIVE (cleanup sites are expected to have some mess)
- Only classify as NEGATIVE if the person clearly says the site is closed, unavailable, dangerous, or explicitly refuses
- If the person hasn't given enough information yet, classify as CONTINUE
- Do NOT confuse "the site has some trash/mess" with "the site is unavailable" - trash at a cleanup site is EXPECTED and is the reason for the cleanup

Respond with EXACTLY one word:
- ACCEPTED (site is available / conditions are suitable / person is positive about availability)
- DECLINED (site is clearly unavailable / person explicitly refuses / dangerous conditions)
- CONTINUE (not enough information yet / ambiguous / need to ask more questions)`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: analysisPrompt }],
      max_completion_tokens: 10,
      temperature: 0,
    });

    const result = response.choices[0]?.message?.content?.trim().toUpperCase() || "CONTINUE";

    if (result.includes("ACCEPTED")) {
      state.outcome = "accepted";
    } else if (result.includes("DECLINED")) {
      state.outcome = "declined";
    }
  } catch (err: any) {
    console.error("AI outcome analysis failed, using fallback:", err.message);
    analyzeOutcomeFallback(state, userText);
  }
}

function analyzeOutcomeFallback(state: ConversationState, userText: string) {
  const lower = userText.toLowerCase();

  const strongPositive = [
    "available", "ready", "good to go", "confirm", "absolutely",
    "of course", "sounds good", "go ahead", "approved", "definitely",
    "it's good", "it's great", "looking good", "all clear", "yes we can",
    "pretty good", "quite good", "doing well", "in good shape",
  ];
  const strongNegative = [
    "not available", "can't do", "cannot", "unavailable", "closed",
    "impossible", "not possible", "not ready", "won't work", "shut down",
    "too dangerous", "absolutely not", "no way",
  ];

  for (const signal of strongNegative) {
    if (lower.includes(signal)) {
      state.outcome = "declined";
      return;
    }
  }
  for (const signal of strongPositive) {
    if (lower.includes(signal)) {
      state.outcome = "accepted";
      return;
    }
  }
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

  await analyzeOutcomeWithAI(state, speechText);

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

    try {
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: buildConversationSystemPrompt(state.operationName, state.cityName) },
          ...state.messages.map((m) => ({
            role: m.role as "assistant" | "user",
            content: m.content,
          })),
        ],
        max_completion_tokens: 150,
        temperature: 0.7,
      });

      responseText = aiResponse.choices[0]?.message?.content?.trim() || "";
      responseText = responseText.replace(/^(Agent|Assistant|Response|AI):\s*/i, "").trim();

      if (!responseText) {
        responseText = "I appreciate you sharing that. Could you tell me a bit more about the current conditions at the site?";
      }
    } catch (err: any) {
      console.error("OpenAI conversation response failed, trying Snowflake:", err.message);

      const prompt = `${buildConversationSystemPrompt(state.operationName, state.cityName)}

Conversation so far:
${conversationHistory}

Generate your next spoken response:`;

      try {
        responseText = await snowflakeCortexComplete(prompt, "mistral-large2");
        responseText = responseText.replace(/^(Agent|Assistant|Response|AI):\s*/i, "").trim();
      } catch (cortexErr: any) {
        console.error("Snowflake Cortex also failed:", cortexErr.message);
        responseText = "I appreciate you sharing that. Could you clarify whether the site would be available for the cleanup operation?";
      }
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

export function hasValidAudio(audioId: string): boolean {
  const buf = audioCache.get(audioId);
  return !!buf && buf.length > 0;
}

export function getGreetingText(callLogId: string): string | undefined {
  const state = conversations.get(callLogId);
  if (state && state.transcript.length > 0) {
    return state.transcript[0].text;
  }
  return undefined;
}

export function getResponseText(callLogId: string, audioId: string): string | undefined {
  const state = conversations.get(callLogId);
  if (!state) return undefined;
  const turnMatch = audioId.match(/response-.*-(\d+)$/);
  if (turnMatch) {
    const agentEntries = state.transcript.filter(t => t.role === "agent");
    const idx = parseInt(turnMatch[1]);
    if (agentEntries[idx]) return agentEntries[idx].text;
  }
  return state.transcript[state.transcript.length - 1]?.text;
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
  console.log("Twilio-OpenAI-ElevenLabs conversation bridge initialized");
}
