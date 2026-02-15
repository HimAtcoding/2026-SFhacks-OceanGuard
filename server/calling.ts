import twilio from "twilio";
import { getElevenLabsApiKey } from "./elevenlabs";

const CLEANUP_VERIFICATION_PROMPT = `You are an AI assistant from OceanGuard, an ocean health monitoring platform. You are calling to verify the availability and conditions at a marine cleanup site. 

Your goals:
1. Introduce yourself as calling from OceanGuard's automated cleanup verification system
2. Ask about current site conditions and accessibility
3. Confirm if the location is available for a cleanup operation
4. Ask about any hazards or special equipment needs
5. Thank them and confirm the information will be logged

Be professional, friendly, and concise. Keep the call under 2 minutes.`;

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
            prompt: CLEANUP_VERIFICATION_PROMPT,
          },
          first_message: "Hello, this is OceanGuard's automated cleanup verification system. I'm calling to verify the conditions and availability at your marine cleanup location. Could you tell me about the current site conditions?",
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
  operationName: string
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

  let elevenLabsApiKey: string;
  try {
    elevenLabsApiKey = await getElevenLabsApiKey();
  } catch (err: any) {
    console.error("ElevenLabs API key not available:", err.message);
    return {
      conversationId: `demo_${Date.now()}`,
      status: "demo_mode",
    };
  }

  try {
    const client = twilio(twilioSid, twilioToken);

    const twiml = `<Response><Connect><Stream url="wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}"><Parameter name="xi_api_key" value="${elevenLabsApiKey}" /></Stream></Connect></Response>`;

    const call = await client.calls.create({
      to: formattedTo,
      from: formattedFrom,
      twiml: twiml,
      statusCallback: undefined,
      timeout: 60,
    });

    console.log("Twilio call initiated:", call.sid, "to:", formattedTo);

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
