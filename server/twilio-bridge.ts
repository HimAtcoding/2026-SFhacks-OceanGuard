import WebSocket, { WebSocketServer } from "ws";
import type { Server } from "http";
import { getElevenLabsApiKey } from "./elevenlabs";
import { storage } from "./storage";
import { syncToMongo } from "./mongodb";

interface ActiveCall {
  callSid: string;
  streamSid: string;
  cleanupId: string;
  operationName: string;
  agentId: string;
  callLogId: string;
  transcript: Array<{ role: "agent" | "user"; text: string; timestamp: number }>;
  outcome: string | null;
  elevenLabsWs: WebSocket | null;
  conversationId: string | null;
}

const activeCalls = new Map<string, ActiveCall>();
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

async function getSignedUrl(agentId: string): Promise<string> {
  const apiKey = await getElevenLabsApiKey();
  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
    {
      headers: { "xi-api-key": apiKey },
    }
  );
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to get signed URL: ${response.status} - ${err}`);
  }
  const data = await response.json();
  return data.signed_url;
}

export function setupTwilioBridge(httpServer: Server) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url || "", `http://${request.headers.host}`);
    if (url.pathname === "/ws/twilio-stream") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });

  wss.on("connection", async (twilioWs, request) => {
    console.log("Twilio WebSocket connected");

    let callData: ActiveCall | null = null;

    twilioWs.on("message", async (rawMessage) => {
      try {
        const msg = JSON.parse(rawMessage.toString());

        switch (msg.event) {
          case "start": {
            const streamSid = msg.start.streamSid;
            const callSid = msg.start.callSid;
            const params = msg.start.customParameters || {};
            const cleanupId = params.cleanupId || "";
            const operationName = params.operationName || "";
            const agentId = params.agentId || "";
            const callLogId = params.callLogId || "";
            const cityName = params.cityName || "";

            console.log(`Stream started: ${streamSid}, call: ${callSid}, cleanup: ${operationName} (${cityName})`);

            callData = {
              callSid,
              streamSid,
              cleanupId,
              operationName,
              agentId,
              callLogId,
              transcript: [],
              outcome: null,
              elevenLabsWs: null,
              conversationId: null,
            };

            activeCalls.set(callSid, callData);

            try {
              const signedUrl = await getSignedUrl(agentId);
              const elevenLabsWs = new WebSocket(signedUrl);
              callData.elevenLabsWs = elevenLabsWs;

              elevenLabsWs.on("open", () => {
                console.log("Connected to ElevenLabs Conversational AI");

                const initConfig = {
                  type: "conversation_initiation_client_data",
                  conversation_config_override: {
                    agent: {
                      prompt: {
                        prompt: buildCleanupPrompt(operationName, cityName),
                      },
                      first_message: `Hello! This is OceanGuard's automated verification system calling about the ${operationName} cleanup operation in ${cityName || "your area"}. We're reaching out to verify site conditions and availability. Can you tell me about the current status at the cleanup location?`,
                      language: "en",
                    },
                    tts: {
                      voice_id: "pFZP5JQG7iQjIQuC4Bku",
                    },
                  },
                };
                elevenLabsWs.send(JSON.stringify(initConfig));
              });

              elevenLabsWs.on("message", (data) => {
                try {
                  const message = JSON.parse(data.toString());
                  handleElevenLabsMessage(message, twilioWs, callData!);
                } catch (e) {
                  console.error("Error parsing ElevenLabs message:", e);
                }
              });

              elevenLabsWs.on("close", () => {
                console.log("ElevenLabs WebSocket closed");
                finalizeCall(callData!);
              });

              elevenLabsWs.on("error", (err) => {
                console.error("ElevenLabs WebSocket error:", err.message);
              });
            } catch (err: any) {
              console.error("Failed to connect to ElevenLabs:", err.message);
              finalizeCall(callData);
            }
            break;
          }

          case "media": {
            if (callData?.elevenLabsWs?.readyState === WebSocket.OPEN) {
              const audioMessage = {
                user_audio_chunk: msg.media.payload,
              };
              callData.elevenLabsWs.send(JSON.stringify(audioMessage));
            }
            break;
          }

          case "stop": {
            console.log("Twilio stream stopped");
            if (callData?.elevenLabsWs) {
              callData.elevenLabsWs.close();
            }
            break;
          }
        }
      } catch (e) {
        console.error("Error handling Twilio message:", e);
      }
    });

    twilioWs.on("close", () => {
      console.log("Twilio WebSocket closed");
      if (callData?.elevenLabsWs) {
        callData.elevenLabsWs.close();
      }
    });

    twilioWs.on("error", (err) => {
      console.error("Twilio WebSocket error:", err.message);
    });
  });
}

function handleElevenLabsMessage(message: any, twilioWs: WebSocket, callData: ActiveCall) {
  switch (message.type) {
    case "conversation_initiation_metadata": {
      callData.conversationId = message.conversation_initiation_metadata_event?.conversation_id || null;
      console.log("ElevenLabs conversation started:", callData.conversationId);

      notifyListeners(callData.callLogId, {
        type: "status",
        status: "connected",
        conversationId: callData.conversationId,
      });
      break;
    }

    case "audio": {
      if (twilioWs.readyState === WebSocket.OPEN && callData.streamSid) {
        const audioPayload = {
          event: "media",
          streamSid: callData.streamSid,
          media: {
            payload: message.audio_event?.audio_base_64,
          },
        };
        twilioWs.send(JSON.stringify(audioPayload));
      }
      break;
    }

    case "agent_response": {
      const text = message.agent_response_event?.agent_response;
      if (text) {
        callData.transcript.push({
          role: "agent",
          text,
          timestamp: Date.now(),
        });

        notifyListeners(callData.callLogId, {
          type: "transcript",
          role: "agent",
          text,
          timestamp: Date.now(),
        });

        console.log(`Agent: ${text}`);
      }
      break;
    }

    case "user_transcript": {
      const text = message.user_transcription_event?.user_transcript;
      if (text) {
        callData.transcript.push({
          role: "user",
          text,
          timestamp: Date.now(),
        });

        notifyListeners(callData.callLogId, {
          type: "transcript",
          role: "user",
          text,
          timestamp: Date.now(),
        });

        console.log(`User: ${text}`);
        analyzeOutcome(callData, text);
      }
      break;
    }

    case "interruption": {
      if (twilioWs.readyState === WebSocket.OPEN && callData.streamSid) {
        twilioWs.send(JSON.stringify({
          event: "clear",
          streamSid: callData.streamSid,
        }));
      }
      break;
    }

    case "ping": {
      if (callData.elevenLabsWs?.readyState === WebSocket.OPEN) {
        callData.elevenLabsWs.send(JSON.stringify({
          type: "pong",
          event_id: message.ping_event?.event_id,
        }));
      }
      break;
    }
  }
}

function analyzeOutcome(callData: ActiveCall, userText: string) {
  const lower = userText.toLowerCase();
  const positiveSignals = ["yes", "available", "ready", "good to go", "confirm", "sure", "absolutely", "of course", "that works", "we can do", "sounds good", "go ahead", "approved"];
  const negativeSignals = ["no", "not available", "can't", "cannot", "unavailable", "closed", "denied", "reject", "impossible", "not possible", "negative", "decline"];

  for (const signal of positiveSignals) {
    if (lower.includes(signal)) {
      callData.outcome = "accepted";
      return;
    }
  }
  for (const signal of negativeSignals) {
    if (lower.includes(signal)) {
      callData.outcome = "declined";
      return;
    }
  }
}

async function finalizeCall(callData: ActiveCall) {
  if (!callData.callLogId) return;

  const transcriptText = callData.transcript
    .map((t) => `${t.role === "agent" ? "OceanGuard" : "Recipient"}: ${t.text}`)
    .join("\n");

  const outcome = callData.outcome || (callData.transcript.length > 2 ? "inconclusive" : "no_response");

  const resultSummary = outcome === "accepted"
    ? "Site availability confirmed - cleanup can proceed as planned."
    : outcome === "declined"
    ? "Site not available or conditions unfavorable for cleanup operation."
    : outcome === "inconclusive"
    ? "Call completed but availability status unclear - manual follow-up recommended."
    : "No meaningful response received - recommend retry or manual contact.";

  try {
    await storage.updateCallLog(callData.callLogId, {
      status: "completed",
      transcript: transcriptText || null,
      conversationId: callData.conversationId || callData.callSid,
      result: `${outcome}: ${resultSummary}`,
      duration: callData.transcript.length > 0
        ? Math.round((callData.transcript[callData.transcript.length - 1].timestamp - callData.transcript[0].timestamp) / 1000)
        : 0,
    });

    notifyListeners(callData.callLogId, {
      type: "completed",
      outcome,
      result: resultSummary,
      transcript: callData.transcript,
      duration: callData.transcript.length > 0
        ? Math.round((callData.transcript[callData.transcript.length - 1].timestamp - callData.transcript[0].timestamp) / 1000)
        : 0,
    });

    syncToMongo("call_logs", { id: callData.callLogId }).catch(() => {});
  } catch (err) {
    console.error("Failed to finalize call:", err);
  }

  activeCalls.delete(callData.callSid);
}

function buildCleanupPrompt(operationName: string, cityName: string): string {
  return `You are an AI calling agent for OceanGuard, an ocean health monitoring platform. You are making an outbound phone call to verify the availability and conditions at a marine cleanup site.

CONTEXT:
- Operation name: ${operationName}
- Location: ${cityName || "a monitored coastal area"}
- Purpose: Verify site readiness for a scheduled marine debris cleanup operation

YOUR OBJECTIVES:
1. Clearly identify yourself as calling from OceanGuard's automated verification system about "${operationName}" in ${cityName || "the area"}
2. Ask if the site is currently accessible and available for cleanup operations
3. Inquire about current conditions: weather, water state, debris levels, any hazards
4. Ask about any special equipment or permission requirements
5. If they express concerns, address them helpfully with information about standard cleanup procedures
6. Determine whether they confirm availability (accepted) or deny it (declined)
7. Thank them and confirm the information will be logged in the OceanGuard system

CONVERSATION GUIDELINES:
- Be professional, warm, and concise
- If they ask questions about OceanGuard, explain it's an AI-powered ocean health monitoring platform that coordinates marine cleanup operations using drone technology and real-time data
- If they're unsure about conditions, suggest they can provide a tentative confirmation and note any concerns
- If they ask about timing, explain the operation is being planned and this call is to verify site readiness
- Keep the conversation under 2-3 minutes
- Always end by thanking them for their time and confirming next steps

IMPORTANT: You must naturally determine if the site is available (accepted) or not (declined) and communicate that clearly.`;
}

export function getActiveCallTranscript(callLogId: string): ActiveCall | undefined {
  for (const call of activeCalls.values()) {
    if (call.callLogId === callLogId) return call;
  }
  return undefined;
}
