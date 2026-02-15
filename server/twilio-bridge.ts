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
  priority: string;
  notes: string;
  startDate: string;
  messages: Array<{ role: "assistant" | "user"; content: string }>;
  transcript: Array<{ role: "agent" | "user"; text: string; timestamp: number }>;
  outcome: string | null;
  callSid: string;
  turnCount: number;
  topicsCovered: Set<string>;
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

function buildConversationSystemPrompt(operationName: string, cityName: string, priority: string, notes: string, startDate: string): string {
  return `You are a phone agent for OceanGuard, an AI-powered ocean health monitoring platform. You are making an INITIAL OUTREACH call to propose a marine debris cleanup operation at a coastal site. This is NOT a follow-up to an existing conversation - you are reaching out for the FIRST TIME to ask if this cleanup can happen.

CONTEXT:
- Proposed Operation: "${operationName}"
- Location: ${cityName || "a monitored coastal area"}
- Priority Level: ${priority}
- Target Date: ${startDate}
- Details: ${notes || "Marine debris cleanup using drone-guided teams"}

YOUR GOAL:
You need to find out whether this cleanup operation can proceed at this location. You are essentially REQUESTING PERMISSION and gathering information. You need to learn:
1. Is the site accessible for a cleanup crew?
2. Are there any permits, restrictions, or scheduling conflicts?
3. What is the condition of the area - how bad is the debris situation?
4. Is there a good time window for the operation?
5. Are there any safety concerns or hazards the team should know about?

YOUR BEHAVIOR:
- Be professional, warm, and conversational like a real person on the phone
- Keep responses concise (1-3 sentences max) since this is a phone call
- You are ASKING QUESTIONS to gather information - do NOT jump to conclusions after one answer
- Ask ONE follow-up question at a time based on what the person tells you
- If they give a short or vague answer, ask for more specifics
- If they say the area is accessible, follow up by asking about permits or timing
- If they mention debris or pollution, ask about the scale and what types of waste
- If they seem unsure, explain that OceanGuard uses AI drones to monitor ocean health and coordinates volunteer cleanup crews
- Do NOT conclude the call quickly - you need to gather enough information to plan the operation
- Even if someone sounds positive about one aspect, keep asking about OTHER aspects (access, timing, safety, permits)
- Only wrap up after you've covered at least access, timing, and conditions

IMPORTANT: Generate ONLY your spoken response. No prefixes, labels, or formatting. Just natural speech.`;
}

function trackTopicsCovered(state: ConversationState, userText: string) {
  const lower = userText.toLowerCase();
  if (/access|enter|get to|open|closed|gate|road|path|reach/.test(lower)) state.topicsCovered.add("access");
  if (/permit|license|approval|permission|city|council|authority|regulation/.test(lower)) state.topicsCovered.add("permits");
  if (/time|date|schedule|when|morning|afternoon|weekend|weekday|month|week/.test(lower)) state.topicsCovered.add("timing");
  if (/trash|debris|waste|plastic|garbage|pollution|dirty|mess|litter|junk/.test(lower)) state.topicsCovered.add("conditions");
  if (/safe|danger|hazard|risk|tide|current|wave|weather|storm/.test(lower)) state.topicsCovered.add("safety");
}

async function analyzeOutcomeWithAI(state: ConversationState, userText: string): Promise<void> {
  if (state.outcome) return;

  trackTopicsCovered(state, userText);

  const minTurnsForConclusion = 3;
  const minTopicsForAcceptance = 2;

  if (state.turnCount < minTurnsForConclusion) return;

  if (state.topicsCovered.size < minTopicsForAcceptance) return;

  const conversationHistory = state.transcript
    .map((t) => `${t.role === "agent" ? "OceanGuard Agent" : "Site Contact"}: ${t.text}`)
    .join("\n");

  const analysisPrompt = `You are analyzing a phone conversation where an OceanGuard agent is making an INITIAL OUTREACH call to propose the "${state.operationName}" cleanup operation${state.cityName ? ` in ${state.cityName}` : ""}.

The agent is asking whether this cleanup CAN HAPPEN at this location. This is a first-time inquiry, not a follow-up.

FULL CONVERSATION (${state.turnCount} exchanges so far):
${conversationHistory}

LATEST MESSAGE FROM SITE CONTACT: "${userText}"

Topics covered so far: ${Array.from(state.topicsCovered).join(", ") || "none"}

Based on the FULL conversation, determine whether the agent has gathered enough information to reach a conclusion:

RULES:
- ACCEPTED means: The contact has confirmed that the cleanup CAN proceed - site is accessible, there are no blocking restrictions, and they've given enough info about timing/conditions. Multiple aspects must be confirmed, not just one.
- DECLINED means: The contact has clearly said the cleanup CANNOT happen - site is closed, access denied, impossible conditions, or they explicitly refuse to allow it.
- CONTINUE means: The agent still needs to ask more questions. If only one topic has been addressed, there's more to learn. If the person gave a vague answer, the agent should probe deeper.

IMPORTANT: Do NOT rush to ACCEPTED just because someone sounds friendly or says "sure" to one question. The agent needs a comprehensive picture covering access, timing, and conditions at minimum.

Respond with EXACTLY one word: ACCEPTED, DECLINED, or CONTINUE`;

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
  priority?: string;
  notes?: string;
  startDate?: string;
}): Promise<string> {
  const formattedDate = params.startDate
    ? new Date(params.startDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "the coming weeks";

  const locationPhrase = params.cityName ? ` near ${params.cityName}` : "";
  const greeting = `Hello! My name is Alex, and I'm calling from OceanGuard, an ocean health monitoring organization. We've been using our AI drone fleet to survey coastal areas${locationPhrase}, and our data shows there's a significant amount of marine debris that needs attention. We're looking into organizing a cleanup operation called ${params.operationName}, tentatively planned for around ${formattedDate}. I wanted to reach out to ask whether something like that would be feasible at your location. Would you be able to help me with a few questions about the site?`;

  const state: ConversationState = {
    callLogId: params.callLogId,
    cleanupId: params.cleanupId,
    operationName: params.operationName,
    cityName: params.cityName,
    priority: params.priority || "medium",
    notes: params.notes || "",
    startDate: params.startDate || formattedDate,
    callSid: params.callSid,
    messages: [{ role: "assistant", content: greeting }],
    transcript: [{ role: "agent", text: greeting, timestamp: Date.now() }],
    outcome: null,
    turnCount: 0,
    topicsCovered: new Set(),
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
    const topicsStr = Array.from(state.topicsCovered).join(", ");
    responseText = `This is really helpful, thank you so much for all that information. Based on everything you've shared about the ${topicsStr}, it sounds like the ${state.operationName} operation${state.cityName ? ` in ${state.cityName}` : ""} can move forward. Our operations team will be in touch with the specific logistics and timeline. We really appreciate your willingness to support ocean conservation. Have a wonderful day!`;
    isFinished = true;
  } else if (state.outcome === "declined") {
    responseText = `I completely understand, and I appreciate you taking the time to explain that. I'll make a note that this location isn't suitable for the operation right now. If circumstances change in the future, would it be alright if we reached out again? Either way, thank you for your time today.`;
    isFinished = true;
  } else if (state.turnCount >= 6) {
    responseText = `Thank you so much for all this information, it's been really valuable. I have a good picture of the site now. I'll compile everything and pass it along to our operations team, and someone will follow up with you about the next steps for ${state.operationName}. Thanks again for your time, and have a great day!`;
    state.outcome = state.topicsCovered.size >= 2 ? "accepted" : "inconclusive";
    isFinished = true;
  } else {
    state.messages.push({ role: "user", content: speechText });

    const conversationHistory = state.messages
      .map((m) => `${m.role === "assistant" ? "Agent" : "Person"}: ${m.content}`)
      .join("\n");

    const systemPrompt = buildConversationSystemPrompt(
      state.operationName, state.cityName, state.priority, state.notes, state.startDate
    );

    const topicsNeeded = ["access", "timing", "conditions", "safety", "permits"];
    const uncovered = topicsNeeded.filter(t => !state.topicsCovered.has(t));
    const topicHint = uncovered.length > 0
      ? `\n\nTOPICS STILL TO ASK ABOUT: ${uncovered.join(", ")}. Naturally work one of these into your next question.`
      : "";

    try {
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt + topicHint },
          ...state.messages.map((m) => ({
            role: m.role as "assistant" | "user",
            content: m.content,
          })),
        ],
        max_completion_tokens: 150,
        temperature: 0.7,
      });

      responseText = aiResponse.choices[0]?.message?.content?.trim() || "";
      responseText = responseText.replace(/^(Agent|Assistant|Response|AI|Alex):\s*/i, "").trim();

      if (!responseText) {
        responseText = "That's good to know. And in terms of the timing, would your site be accessible for a cleanup crew in the coming weeks?";
      }
    } catch (err: any) {
      console.error("OpenAI conversation response failed, trying Snowflake:", err.message);

      const prompt = `${systemPrompt}${topicHint}

Conversation so far:
${conversationHistory}

Generate your next spoken response:`;

      try {
        responseText = await snowflakeCortexComplete(prompt, "mistral-large2");
        responseText = responseText.replace(/^(Agent|Assistant|Response|AI|Alex):\s*/i, "").trim();
      } catch (cortexErr: any) {
        console.error("Snowflake Cortex also failed:", cortexErr.message);
        responseText = "Thank you for sharing that. Could you also tell me about the best timing for a cleanup crew to work at the site?";
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
  const topicsList = Array.from(state.topicsCovered).join(", ") || "general inquiry";
  const resultSummary =
    outcome === "accepted"
      ? `Cleanup operation approved - site contact confirmed feasibility. Topics discussed: ${topicsList}. Ready for operations team to proceed with planning.`
      : outcome === "declined"
      ? `Cleanup operation not feasible at this time - site contact indicated the location is unavailable or conditions prevent the operation. Topics discussed: ${topicsList}.`
      : `Initial outreach completed but outcome inconclusive. Topics discussed: ${topicsList}. Manual follow-up recommended to gather remaining information.`;

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
