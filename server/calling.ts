import twilio from "twilio";
import { getElevenLabsApiKey } from "./elevenlabs";

let cachedAgentId: string | null = null;

export async function createCleanupVerificationAgent(): Promise<string> {
  if (cachedAgentId) return cachedAgentId;

  const apiKey = await getElevenLabsApiKey();

  const response = await fetch("https://api.elevenlabs.io/v1/convai/agents/create", {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      conversation_config: {
        agent: {
          prompt: {
            prompt: "You are a verification agent for OceanGuard ocean cleanup operations. Follow the conversation config override for specific details.",
          },
          first_message: "Hello, this is OceanGuard's automated verification system.",
          language: "en",
        },
        tts: {
          voice_id: "pFZP5JQG7iQjIQuC4Bku",
        },
      },
      name: "OceanGuard Cleanup Verifier",
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to create agent: ${response.status} - ${err}`);
  }

  const data = await response.json();
  cachedAgentId = data.agent_id;
  return data.agent_id;
}

export async function initiateOutboundCall(
  agentId: string,
  phoneNumber: string,
  cleanupId: string,
  operationName: string,
  callLogId: string,
  cityName: string = ""
): Promise<{ conversationId: string; status: string }> {
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!twilioSid || !twilioToken || !twilioPhone) {
    console.log("Twilio credentials not configured, using demo mode");
    return {
      conversationId: `demo_${Date.now()}`,
      status: "demo_mode",
    };
  }

  const formattedTo = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`;
  const formattedFrom = twilioPhone.startsWith("+") ? twilioPhone : `+${twilioPhone}`;

  const serverDomain = process.env.REPLIT_DEV_DOMAIN
    ? process.env.REPLIT_DEV_DOMAIN
    : process.env.REPL_SLUG
    ? `${process.env.REPL_SLUG}.repl.co`
    : "localhost:5000";

  try {
    const client = twilio(twilioSid, twilioToken);

    const wsUrl = `wss://${serverDomain}/ws/twilio-stream`;

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${wsUrl}">
      <Parameter name="cleanupId" value="${cleanupId}" />
      <Parameter name="operationName" value="${operationName}" />
      <Parameter name="agentId" value="${agentId}" />
      <Parameter name="callLogId" value="${callLogId}" />
      <Parameter name="cityName" value="${cityName}" />
    </Stream>
  </Connect>
</Response>`;

    const call = await client.calls.create({
      to: formattedTo,
      from: formattedFrom,
      twiml: twiml,
      timeout: 60,
    });

    console.log("Twilio call initiated:", call.sid, "to:", formattedTo, "for:", operationName);

    return {
      conversationId: call.sid,
      status: "initiated",
    };
  } catch (err: any) {
    console.error("Twilio call failed:", err.message);
    if (err.code === 21215 || err.code === 21614 || err.code === 21211) {
      return {
        conversationId: `demo_${Date.now()}`,
        status: "demo_mode",
      };
    }
    throw new Error(`Call failed: ${err.message}`);
  }
}

export async function getOrCreateAgent(): Promise<string> {
  try {
    const agentId = await createCleanupVerificationAgent();
    return agentId;
  } catch (err: any) {
    console.error("Failed to create ElevenLabs agent:", err.message);
    return `agent_demo_${Date.now()}`;
  }
}

export async function getCallStatus(conversationId: string): Promise<any> {
  if (conversationId.startsWith("demo_")) {
    return { status: "demo_completed" };
  }

  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;

  if (!twilioSid || !twilioToken) {
    return { status: "unknown" };
  }

  try {
    const client = twilio(twilioSid, twilioToken);
    const call = await client.calls(conversationId).fetch();
    return {
      status: call.status,
      duration: call.duration,
      startTime: call.startTime,
      endTime: call.endTime,
    };
  } catch {
    return { status: "unknown" };
  }
}
