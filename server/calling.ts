import { getElevenLabsApiKey } from "./elevenlabs";

const CLEANUP_VERIFICATION_PROMPT = `You are an AI assistant from OceanGuard, an ocean health monitoring platform. You are calling to verify the availability and conditions at a marine cleanup site. 

Your goals:
1. Introduce yourself as calling from OceanGuard's automated cleanup verification system
2. Ask about current site conditions and accessibility
3. Confirm if the location is available for a cleanup operation
4. Ask about any hazards or special equipment needs
5. Thank them and confirm the information will be logged

Be professional, friendly, and concise. Keep the call under 2 minutes.`;

let cachedPhoneNumberId: string | null = null;

async function importTwilioPhoneNumber(): Promise<string> {
  const apiKey = await getElevenLabsApiKey();
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!twilioSid || !twilioToken || !twilioPhone) {
    throw new Error("Twilio credentials not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)");
  }

  const formattedPhone = twilioPhone.startsWith("+") ? twilioPhone : `+${twilioPhone}`;

  const listRes = await fetch("https://api.elevenlabs.io/v1/convai/phone-numbers", {
    headers: { "xi-api-key": apiKey },
  });

  if (listRes.ok) {
    const listData = await listRes.json();
    const numbers = listData?.phone_numbers || listData || [];
    const existing = Array.isArray(numbers)
      ? numbers.find((p: any) => p.phone_number === formattedPhone)
      : null;
    if (existing?.phone_number_id) {
      console.log("Found existing ElevenLabs phone number:", existing.phone_number_id);
      return existing.phone_number_id;
    }
  }

  const response = await fetch("https://api.elevenlabs.io/v1/convai/phone-numbers", {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      label: "OceanGuard Cleanup Verifier",
      phone_number: formattedPhone,
      twilio_account_sid: twilioSid,
      twilio_auth_token: twilioToken,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to import phone number: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  console.log("Imported Twilio phone number into ElevenLabs:", data.phone_number_id);
  return data.phone_number_id;
}

async function getPhoneNumberId(): Promise<string> {
  if (cachedPhoneNumberId) return cachedPhoneNumberId;
  cachedPhoneNumberId = await importTwilioPhoneNumber();
  return cachedPhoneNumberId;
}

export async function createCleanupVerificationAgent(): Promise<string> {
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
  return data.agent_id;
}

export async function initiateOutboundCall(
  agentId: string,
  phoneNumber: string,
  cleanupId: string,
  operationName: string
): Promise<{ conversationId: string; status: string }> {
  const apiKey = await getElevenLabsApiKey();

  const hasTwilio = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER;

  if (!hasTwilio) {
    return {
      conversationId: `demo_${Date.now()}`,
      status: "demo_mode",
    };
  }

  let phoneNumberId: string;
  try {
    phoneNumberId = await getPhoneNumberId();
  } catch (err: any) {
    console.error("Failed to get phone number ID:", err.message);
    return {
      conversationId: `demo_${Date.now()}`,
      status: "demo_mode",
    };
  }

  const formattedTo = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`;

  const callResponse = await fetch("https://api.elevenlabs.io/v1/convai/twilio/outbound-call", {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      agent_id: agentId,
      agent_phone_number_id: phoneNumberId,
      to_number: formattedTo,
      conversation_initiation_client_data: {
        cleanup_id: cleanupId,
        operation_name: operationName,
      },
    }),
  });

  if (!callResponse.ok) {
    const errText = await callResponse.text();
    console.error("ElevenLabs outbound call error:", callResponse.status, errText);
    if (callResponse.status === 422 || callResponse.status === 400) {
      console.log("Falling back to demo mode due to validation error");
      return {
        conversationId: `demo_${Date.now()}`,
        status: "demo_mode",
      };
    }
    throw new Error(`Outbound call failed: ${callResponse.status} - ${errText}`);
  }

  const data = await callResponse.json();
  return {
    conversationId: data.conversation_id || `call_${Date.now()}`,
    status: "initiated",
  };
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
  try {
    const apiKey = await getElevenLabsApiKey();
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`, {
      headers: { "xi-api-key": apiKey },
    });
    if (!response.ok) return { status: "unknown" };
    return await response.json();
  } catch {
    return { status: "unknown" };
  }
}
