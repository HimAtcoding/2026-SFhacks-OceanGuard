import twilio from "twilio";
import { initConversation, updateCallSid } from "./twilio-bridge";

function getServerDomain(): string {
  if (process.env.REPLIT_DEV_DOMAIN) return process.env.REPLIT_DEV_DOMAIN;
  if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
    return `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
  }
  return "localhost:5000";
}

export async function initiateOutboundCall(
  phoneNumber: string,
  cleanupId: string,
  operationName: string,
  callLogId: string,
  cityName: string = "",
  priority: string = "medium",
  notes: string = "",
  startDate: string = ""
): Promise<{ conversationId: string; status: string }> {
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!twilioSid || !twilioToken || !twilioPhone) {
    console.log("Twilio credentials not configured, using demo mode");
    await initConversation({
      callLogId,
      cleanupId,
      operationName,
      cityName,
      callSid: `demo_${Date.now()}`,
      priority,
      notes,
      startDate,
    });
    return {
      conversationId: `demo_${Date.now()}`,
      status: "demo_mode",
    };
  }

  const formattedTo = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`;
  const formattedFrom = twilioPhone.startsWith("+") ? twilioPhone : `+${twilioPhone}`;
  const serverDomain = getServerDomain();

  await initConversation({
    callLogId,
    cleanupId,
    operationName,
    cityName,
    callSid: "",
    priority,
    notes,
    startDate,
  });

  try {
    const client = twilio(twilioSid, twilioToken);

    const answerUrl = `https://${serverDomain}/api/twilio/answer?callLogId=${encodeURIComponent(callLogId)}`;

    const call = await client.calls.create({
      to: formattedTo,
      from: formattedFrom,
      url: answerUrl,
      method: "POST",
      timeout: 60,
      statusCallback: `https://${serverDomain}/api/twilio/status?callLogId=${encodeURIComponent(callLogId)}`,
      statusCallbackEvent: ["completed", "failed", "no-answer", "busy"],
      statusCallbackMethod: "POST",
    });

    updateCallSid(callLogId, call.sid);

    console.log(
      "Twilio call initiated:",
      call.sid,
      "to:",
      formattedTo,
      "for:",
      operationName,
      "using Snowflake Cortex + ElevenLabs TTS"
    );

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
