import { getElevenLabsApiKey } from "./elevenlabs";

const CLEANUP_VERIFICATION_PROMPT = `You are an AI assistant from OceanGuard, an ocean health monitoring platform. You are calling to verify the availability and conditions at a marine cleanup site. 

Your goals:
1. Introduce yourself as calling from OceanGuard's automated cleanup verification system
2. Ask about current site conditions and accessibility
3. Confirm if the location is available for a cleanup operation
4. Ask about any hazards or special equipment needs
5. Thank them and confirm the information will be logged

Be professional, friendly, and concise. Keep the call under 2 minutes.`;

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

  const response = await fetch("https://api.elevenlabs.io/v1/convai/conversation/get_signed_url", {
    method: "GET",
    headers: {
      "xi-api-key": apiKey,
    },
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("ElevenLabs signed URL error:", err);
  }

  const callResponse = await fetch("https://api.elevenlabs.io/v1/convai/twilio/outbound-call", {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      agent_id: agentId,
      to_number: phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`,
      conversation_initiation_client_data: {
        cleanup_id: cleanupId,
        operation_name: operationName,
      },
    }),
  });

  if (!callResponse.ok) {
    const errText = await callResponse.text();
    let parsed: any = {};
    try { parsed = JSON.parse(errText); } catch {}
    
    if (parsed?.detail?.includes("phone") || parsed?.detail?.includes("twilio") || callResponse.status === 422) {
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
