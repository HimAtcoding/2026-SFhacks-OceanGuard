import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDroneScanSchema, insertAlertSchema, insertCleanupOperationSchema, insertDonationSchema, insertCallLogSchema, insertSchoolSchema, insertSchoolActionSchema } from "@shared/schema";
import { calculatePoints } from "./globalSeed";
import { textToSpeechBuffer } from "./elevenlabs";
import { initiateOutboundCall, getCallStatus } from "./calling";
import { getMongoStats, syncToMongo } from "./mongodb";
import { setupTwilioBridge, subscribeToTranscript, getActiveCallTranscript, processUserSpeech, getAudioBuffer, hasValidAudio, getGreetingText, getResponseText, cleanupConversation } from "./twilio-bridge";
import twilio from "twilio";
import { analyzeOceanData, isSnowflakeConfigured, snowflakeCortexComplete } from "./snowflake";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupTwilioBridge(httpServer);
  app.get("/api/scans", async (req, res) => {
    const since = req.query.since ? new Date(req.query.since as string) : undefined;
    if (since) {
      const scans = await storage.getScansSince(since);
      return res.json(scans);
    }
    const scans = await storage.getScans();
    res.json(scans);
  });

  app.get("/api/scans/:id", async (req, res) => {
    const scan = await storage.getScan(req.params.id);
    if (!scan) return res.status(404).json({ message: "Scan not found" });
    res.json(scan);
  });

  app.post("/api/scans", async (req, res) => {
    const parsed = insertDroneScanSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.issues });
    const scan = await storage.createScan(parsed.data);
    syncToMongo("drone_scans", scan).catch(() => {});
    res.status(201).json(scan);
  });

  app.get("/api/alerts", async (_req, res) => {
    const allAlerts = await storage.getAlerts();
    res.json(allAlerts);
  });

  app.get("/api/alerts/scan/:scanId", async (req, res) => {
    const scanAlerts = await storage.getAlertsByScan(req.params.scanId);
    res.json(scanAlerts);
  });

  app.post("/api/alerts", async (req, res) => {
    const parsed = insertAlertSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.issues });
    const alert = await storage.createAlert(parsed.data);
    syncToMongo("alerts", alert).catch(() => {});
    res.status(201).json(alert);
  });

  app.patch("/api/alerts/:id/resolve", async (req, res) => {
    const alert = await storage.resolveAlert(req.params.id);
    if (!alert) return res.status(404).json({ message: "Alert not found" });
    syncToMongo("alerts", alert).catch(() => {});
    res.json(alert);
  });

  app.get("/api/cities", async (_req, res) => {
    const cities = await storage.getCities();
    res.json(cities);
  });

  app.get("/api/cities/:id", async (req, res) => {
    const city = await storage.getCity(req.params.id);
    if (!city) return res.status(404).json({ message: "City not found" });
    res.json(city);
  });

  app.get("/api/tracks", async (req, res) => {
    const cityId = req.query.cityId as string | undefined;
    const since = req.query.since ? new Date(req.query.since as string) : undefined;
    if (since) {
      const tracks = await storage.getTracksSince(since, cityId);
      return res.json(tracks);
    }
    const tracks = await storage.getTracks(cityId);
    res.json(tracks);
  });

  app.get("/api/cleanup", async (_req, res) => {
    const ops = await storage.getCleanupOps();
    res.json(ops);
  });

  app.get("/api/cleanup/city/:cityId", async (req, res) => {
    const ops = await storage.getCleanupOpsByCity(req.params.cityId);
    res.json(ops);
  });

  app.post("/api/cleanup", async (req, res) => {
    const parsed = insertCleanupOperationSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.issues });
    const op = await storage.createCleanupOp(parsed.data);
    syncToMongo("cleanup_operations", op).catch(() => {});
    res.status(201).json(op);
  });

  app.patch("/api/cleanup/:id", async (req, res) => {
    const op = await storage.updateCleanupOp(req.params.id, req.body);
    if (!op) return res.status(404).json({ message: "Operation not found" });
    syncToMongo("cleanup_operations", op).catch(() => {});
    res.json(op);
  });

  app.get("/api/donations", async (_req, res) => {
    const allDonations = await storage.getDonations();
    res.json(allDonations);
  });

  app.get("/api/donations/cleanup/:cleanupId", async (req, res) => {
    const d = await storage.getDonationsByCleanup(req.params.cleanupId);
    res.json(d);
  });

  app.post("/api/donations", async (req, res) => {
    const parsed = insertDonationSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.issues });
    const donation = await storage.createDonation(parsed.data);
    syncToMongo("donations", donation).catch(() => {});

    if (parsed.data.cleanupId && parsed.data.amount) {
      const ops = await storage.getCleanupOps();
      const op = ops.find(o => o.id === parsed.data.cleanupId);
      if (op) {
        const updated = await storage.updateCleanupOp(parsed.data.cleanupId, {
          fundingRaised: (op.fundingRaised || 0) + parsed.data.amount,
        });
        if (updated) syncToMongo("cleanup_operations", updated).catch(() => {});
      }
    }

    res.status(201).json(donation);
  });

  app.patch("/api/donations/:id", async (req, res) => {
    const donation = await storage.updateDonation(req.params.id, req.body);
    if (!donation) return res.status(404).json({ message: "Donation not found" });
    syncToMongo("donations", donation).catch(() => {});
    res.json(donation);
  });

  app.post("/api/cleanup/:id/call", async (req, res) => {
    try {
      const cleanup = (await storage.getCleanupOps()).find(o => o.id === req.params.id);
      if (!cleanup) return res.status(404).json({ message: "Cleanup not found" });

      const phoneNumber = req.body.phoneNumber || "19255491150";

      const city = cleanup.cityId
        ? (await storage.getCities()).find(c => c.id === cleanup.cityId)
        : null;
      const cityName = city?.cityName || "";

      const callLog = await storage.createCallLog({
        cleanupId: cleanup.id,
        phoneNumber,
        status: "initiating",
        agentId: "snowflake-cortex",
      });
      syncToMongo("call_logs", callLog).catch(() => {});

      try {
        const result = await initiateOutboundCall(
          phoneNumber,
          cleanup.id,
          cleanup.operationName,
          callLog.id,
          cityName,
          cleanup.priority,
          cleanup.notes || "",
          cleanup.startDate ? cleanup.startDate.toISOString() : ""
        );

        await storage.updateCallLog(callLog.id, {
          status: result.status === "demo_mode" ? "demo_completed" : "ringing",
          conversationId: result.conversationId,
          result: result.status === "demo_mode"
            ? "Demo mode: Twilio credentials not available. Call simulated successfully."
            : "Call initiated - Snowflake Cortex AI + ElevenLabs voice connecting via Twilio",
        });

        res.json({
          success: true,
          callLogId: callLog.id,
          status: result.status,
          conversationId: result.conversationId,
          message: result.status === "demo_mode"
            ? "Call simulated in demo mode. Twilio credentials required for live calls."
            : "Outbound call initiated! Snowflake Cortex AI will conduct the conversation with ElevenLabs voice.",
        });
      } catch (callErr: any) {
        await storage.updateCallLog(callLog.id, {
          status: "failed",
          result: `Call failed: ${callErr.message}`,
        });

        res.status(500).json({
          success: false,
          callLogId: callLog.id,
          status: "failed",
          message: `Call failed: ${callErr.message}`,
        });
      }
    } catch (err: any) {
      console.error("Call initiation error:", err.message);
      res.status(500).json({ message: "Call failed", error: err.message });
    }
  });

  function getTwilioServerDomain(): string {
    if (process.env.REPLIT_DEV_DOMAIN) return process.env.REPLIT_DEV_DOMAIN;
    if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
      return `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
    }
    return "localhost:5000";
  }

  function escapeXml(str: string): string {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  }

  function validateTwilioRequest(req: any): boolean {
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!authToken) return true;
    const signature = req.headers["x-twilio-signature"];
    if (!signature) return false;
    const domain = getTwilioServerDomain();
    const url = `https://${domain}${req.originalUrl}`;
    return twilio.validateRequest(authToken, signature, url, req.body || {});
  }

  app.post("/api/twilio/answer", async (req, res) => {
    if (!validateTwilioRequest(req)) {
      res.status(403).send("Forbidden");
      return;
    }
    const callLogId = req.query.callLogId as string;
    if (!callLogId) {
      res.type("text/xml");
      return res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>System error. Goodbye.</Say><Hangup/></Response>`);
    }

    const serverDomain = getTwilioServerDomain();
    const greetingAudioId = `greeting-${callLogId}`;
    const gatherUrl = `https://${serverDomain}/api/twilio/process-speech?callLogId=${encodeURIComponent(callLogId)}`;

    let playOrSay: string;
    if (hasValidAudio(greetingAudioId)) {
      const audioUrl = `https://${serverDomain}/api/tts/audio/${greetingAudioId}`;
      playOrSay = `<Play>${audioUrl}</Play>`;
    } else {
      const fallbackText = getGreetingText(callLogId) || "Hello, this is OceanGuard verification. Could you tell me about the current conditions at the cleanup site?";
      playOrSay = `<Say voice="Polly.Amy">${escapeXml(fallbackText)}</Say>`;
    }

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${playOrSay}
  <Gather input="speech" timeout="8" speechTimeout="auto" action="${gatherUrl}" method="POST">
  </Gather>
  <Say>I didn't hear a response. Thank you for your time. Goodbye.</Say>
</Response>`;

    res.type("text/xml");
    res.send(twiml);
  });

  app.post("/api/twilio/process-speech", async (req, res) => {
    if (!validateTwilioRequest(req)) {
      res.status(403).send("Forbidden");
      return;
    }
    const callLogId = req.query.callLogId as string;
    const speechResult = req.body.SpeechResult;
    const serverDomain = getTwilioServerDomain();
    const gatherUrl = `https://${serverDomain}/api/twilio/process-speech?callLogId=${encodeURIComponent(callLogId)}`;

    if (!callLogId) {
      res.type("text/xml");
      return res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>System error. Goodbye.</Say><Hangup/></Response>`);
    }

    if (!speechResult) {
      res.type("text/xml");
      return res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>I didn't catch that. Could you please repeat?</Say>
  <Gather input="speech" timeout="8" speechTimeout="auto" action="${gatherUrl}" method="POST">
  </Gather>
  <Say>Thank you for your time. Goodbye.</Say>
</Response>`);
    }

    try {
      console.log(`[Call ${callLogId}] User said: "${speechResult}"`);
      const result = await processUserSpeech(callLogId, speechResult);

      let playOrSay: string;
      if (hasValidAudio(result.audioId)) {
        const audioUrl = `https://${serverDomain}/api/tts/audio/${result.audioId}`;
        playOrSay = `<Play>${audioUrl}</Play>`;
      } else {
        playOrSay = `<Say voice="Polly.Amy">${escapeXml(result.responseText)}</Say>`;
      }

      if (result.isFinished) {
        console.log(`[Call ${callLogId}] Conversation finished. Outcome: ${result.outcome}`);
        res.type("text/xml");
        res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${playOrSay}
  <Pause length="1"/>
  <Hangup/>
</Response>`);
      } else {
        res.type("text/xml");
        res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${playOrSay}
  <Gather input="speech" timeout="8" speechTimeout="auto" action="${gatherUrl}" method="POST">
  </Gather>
  <Say>Thank you for your time. Goodbye.</Say>
</Response>`);
      }
    } catch (err: any) {
      console.error(`[Call ${callLogId}] Speech processing error:`, err.message);
      res.type("text/xml");
      res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>I'm having a technical issue. Let me try again. Could you repeat that?</Say>
  <Gather input="speech" timeout="8" speechTimeout="auto" action="${gatherUrl}" method="POST">
  </Gather>
  <Say>Thank you for your time. Goodbye.</Say>
</Response>`);
    }
  });

  app.post("/api/twilio/status", async (req, res) => {
    if (!validateTwilioRequest(req)) {
      res.status(403).send("Forbidden");
      return;
    }
    const callLogId = req.query.callLogId as string;
    const callStatus = req.body.CallStatus;
    console.log(`[Call ${callLogId}] Status update: ${callStatus}`);

    if (callLogId && (callStatus === "completed" || callStatus === "failed" || callStatus === "no-answer" || callStatus === "busy")) {
      try {
        cleanupConversation(callLogId);

        const logs = await storage.getCallLogs();
        const log = logs.find(l => l.id === callLogId);
        if (log && log.status !== "completed") {
          await storage.updateCallLog(callLogId, {
            status: callStatus === "completed" ? "completed" : "failed",
            result: callStatus === "no-answer" ? "no_response: Recipient did not pick up" :
                    callStatus === "busy" ? "no_response: Line busy - recipient unavailable" :
                    callStatus === "failed" ? "inconclusive: Call failed to connect" : log.result || "Call completed",
          });
        }
      } catch (err) {
        console.error("Status callback error:", err);
      }
    }
    res.sendStatus(200);
  });

  app.get("/api/tts/audio/:id", (req, res) => {
    const audioId = req.params.id;
    const buffer = getAudioBuffer(audioId);
    if (!buffer || buffer.length === 0) {
      res.status(404).send("Audio not found");
      return;
    }
    res.set("Content-Type", "audio/mpeg");
    res.set("Content-Length", buffer.length.toString());
    res.set("Cache-Control", "no-cache");
    res.send(buffer);
  });

  app.get("/api/call-logs/:id/transcript-stream", (req, res) => {
    const callLogId = req.params.id;
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const activeCall = getActiveCallTranscript(callLogId);
    if (activeCall) {
      for (const entry of activeCall.transcript) {
        res.write(`data: ${JSON.stringify({ type: "transcript", role: entry.role, text: entry.text, timestamp: entry.timestamp })}\n\n`);
      }
    }

    const unsubscribe = subscribeToTranscript(callLogId, (data) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    });

    req.on("close", () => {
      unsubscribe();
    });
  });

  app.get("/api/call-logs", async (req, res) => {
    const cleanupId = req.query.cleanupId as string | undefined;
    const logs = await storage.getCallLogs(cleanupId);
    res.json(logs);
  });

  app.get("/api/call-logs/:id/status", async (req, res) => {
    const logs = await storage.getCallLogs();
    const log = logs.find(l => l.id === req.params.id);
    if (!log) return res.status(404).json({ message: "Call log not found" });

    if (log.conversationId && !log.conversationId.startsWith("demo_")) {
      const status = await getCallStatus(log.conversationId);
      return res.json({ ...log, liveStatus: status });
    }
    res.json(log);
  });

  app.get("/api/predictions/:cityId", async (req, res) => {
    const city = await storage.getCity(req.params.cityId);
    if (!city) return res.status(404).json({ message: "City not found" });
    const tracks = await storage.getTracks(req.params.cityId);
    const recentTracks = tracks.slice(0, 20);
    const predictions = recentTracks.map(track => {
      const dir = (track.movementDirection || 0) * (Math.PI / 180);
      const spd = (track.speed || 0.5) * 0.01;
      return [6, 12, 24, 48].map(hours => ({
        trackId: track.id,
        trackType: track.trackType,
        hours,
        latitude: track.latitude + Math.cos(dir) * spd * hours,
        longitude: track.longitude + Math.sin(dir) * spd * hours,
        density: Math.max(0, track.density + (track.trackType === "kelp" ? -0.5 * hours : 0.3 * hours)),
        confidence: Math.max(20, 95 - hours * 1.5),
      }));
    }).flat();
    res.json({
      city,
      currentTracks: recentTracks,
      predictions,
      generatedAt: new Date().toISOString(),
    });
  });

  app.get("/api/snowflake/status", (_req, res) => {
    res.json({ configured: isSnowflakeConfigured() });
  });

  app.post("/api/snowflake/analyze", async (req, res) => {
    try {
      if (!isSnowflakeConfigured()) {
        return res.status(503).json({ message: "Snowflake credentials not configured" });
      }
      const { analysisType } = req.body;
      const cities = await storage.getCities();
      const scans = await storage.getScans();
      const result = await analyzeOceanData(cities, scans, analysisType || "overview");
      res.json({ analysis: result, model: "mistral-large2", provider: "Snowflake Cortex", timestamp: new Date().toISOString() });
    } catch (err: any) {
      console.error("Snowflake analysis error:", err.message);
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/snowflake/query", async (req, res) => {
    try {
      if (!isSnowflakeConfigured()) {
        return res.status(503).json({ message: "Snowflake credentials not configured" });
      }
      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ message: "prompt required" });
      if (typeof prompt !== "string" || prompt.length > 2000) {
        return res.status(400).json({ message: "prompt must be a string under 2000 characters" });
      }

      const cities = await storage.getCities();
      const scans = await storage.getScans();
      const cityContext = cities.slice(0, 10).map(c => `${c.cityName} (${c.country}): kelp=${c.kelpDensity}%, trash=${c.trashLevel}%, score=${c.overallScore}`).join("\n");
      const scanContext = scans.slice(0, 5).map(s => `Zone ${s.zone}: algae=${s.algaeLevel}%, greenery=${s.greeneryLevel}%, waterQuality=${s.waterQuality}%`).join("\n");

      const fullPrompt = `You are OceanGuard's AI data analyst powered by Snowflake Cortex. You have access to live ocean monitoring data.

Current city monitoring data:
${cityContext}

Recent drone scan data:
${scanContext}

User question: ${prompt}

Provide a thorough, data-driven response referencing specific values from the monitoring data. Format with markdown.`;

      const result = await snowflakeCortexComplete(fullPrompt, "mistral-large2");
      res.json({ response: result, model: "mistral-large2", provider: "Snowflake Cortex", timestamp: new Date().toISOString() });
    } catch (err: any) {
      console.error("Snowflake query error:", err.message);
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/settings/:key", async (req, res) => {
    const setting = await storage.getSetting(req.params.key);
    res.json(setting || { key: req.params.key, value: "" });
  });

  app.post("/api/settings", async (req, res) => {
    const { key, value } = req.body;
    if (!key || value === undefined) return res.status(400).json({ message: "key and value required" });
    const setting = await storage.setSetting(key, value);
    res.json(setting);
  });

  app.get("/api/external-data", async (_req, res) => {
    try {
      const setting = await storage.getSetting("external_data_url");
      if (!setting || !setting.value) {
        return res.json({ configured: false, data: null, url: "" });
      }
      const url = setting.value;
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) {
        return res.json({ configured: true, url, error: `HTTP ${response.status}`, data: null });
      }
      const data = await response.json();
      res.json({ configured: true, url, data, fetchedAt: new Date().toISOString() });
    } catch (err: any) {
      res.json({ configured: true, error: err.message, data: null });
    }
  });

  app.get("/api/weather/:cityId", async (req, res) => {
    const city = await storage.getCity(req.params.cityId);
    if (!city) return res.status(404).json({ message: "City not found" });
    const now = new Date();
    const forecast = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      const baseTemp = (city.waterTemp || 18) + Math.sin(city.latitude * 0.017) * 5;
      return {
        date: date.toISOString().split("T")[0],
        airTemp: Math.round(baseTemp + Math.random() * 6 - 3),
        waterTemp: Math.round((city.waterTemp || 18) + Math.random() * 2 - 1),
        windSpeed: Math.round(5 + Math.random() * 20),
        windDir: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.floor(Math.random() * 8)],
        waveHeight: +(0.3 + Math.random() * 2.5).toFixed(1),
        condition: ["Sunny", "Partly Cloudy", "Cloudy", "Light Rain", "Clear"][Math.floor(Math.random() * 5)],
        uvIndex: Math.floor(3 + Math.random() * 8),
        visibility: Math.round(5 + Math.random() * 15),
        expectedKelp: +(city.kelpDensity + Math.random() * 10 - 5).toFixed(1),
        expectedAlgae: +(20 + Math.random() * 30).toFixed(1),
        expectedPlankton: +(15 + Math.random() * 40).toFixed(1),
        cleanupSuitability: Math.random() > 0.3 ? "Good" : Math.random() > 0.5 ? "Fair" : "Poor",
      };
    });
    res.json({ city: city.cityName, forecast });
  });

  app.post("/api/tts", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ message: "text is required" });
      }
      const truncated = text.slice(0, 1000);
      const audioBuffer = await textToSpeechBuffer(truncated);
      res.set({
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
      });
      res.send(audioBuffer);
    } catch (err: any) {
      console.error("TTS error:", err.message);
      res.status(500).json({ message: "Voice generation failed", error: err.message });
    }
  });

  app.post("/api/solana/transfer", async (req, res) => {
    try {
      const { fromSecretKey, toAddress, amountSol } = req.body;
      if (!fromSecretKey || !toAddress || !amountSol) {
        return res.status(400).json({ message: "fromSecretKey, toAddress, amountSol required" });
      }

      const { Connection, PublicKey, Keypair, SystemProgram, Transaction, LAMPORTS_PER_SOL, sendAndConfirmTransaction } = await import("@solana/web3.js");

      const connection = new Connection("https://api.devnet.solana.com", "confirmed");
      const secretKeyArray = Uint8Array.from(JSON.parse(fromSecretKey));
      const fromKeypair = Keypair.fromSecretKey(secretKeyArray);
      const toPublicKey = new PublicKey(toAddress);
      const lamports = Math.round(amountSol * LAMPORTS_PER_SOL);

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: fromKeypair.publicKey,
          toPubkey: toPublicKey,
          lamports,
        })
      );

      const signature = await sendAndConfirmTransaction(connection, transaction, [fromKeypair]);

      res.json({
        success: true,
        signature,
        fromAddress: fromKeypair.publicKey.toBase58(),
        toAddress: toPublicKey.toBase58(),
        amountSol,
        explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
      });
    } catch (err: any) {
      console.error("Solana transfer error:", err.message);
      res.status(500).json({ message: "Transaction failed", error: err.message });
    }
  });

  app.post("/api/solana/airdrop", async (req, res) => {
    try {
      const { address } = req.body;
      if (!address) return res.status(400).json({ message: "address required" });

      const { Connection, PublicKey, LAMPORTS_PER_SOL } = await import("@solana/web3.js");
      const connection = new Connection("https://api.devnet.solana.com", "confirmed");
      const pubKey = new PublicKey(address);
      const sig = await connection.requestAirdrop(pubKey, 1 * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig, "confirmed");

      res.json({ success: true, signature: sig, amount: 1 });
    } catch (err: any) {
      console.error("Airdrop error:", err.message);
      res.status(500).json({ message: "Airdrop failed", error: err.message });
    }
  });

  app.get("/api/solana/balance/:address", async (req, res) => {
    try {
      const { Connection, PublicKey, LAMPORTS_PER_SOL } = await import("@solana/web3.js");
      const connection = new Connection("https://api.devnet.solana.com", "confirmed");
      const pubKey = new PublicKey(req.params.address);
      const balance = await connection.getBalance(pubKey);
      res.json({ address: req.params.address, balance: balance / LAMPORTS_PER_SOL });
    } catch (err: any) {
      res.status(500).json({ message: "Balance check failed", error: err.message });
    }
  });

  app.get("/api/mongodb/stats", async (_req, res) => {
    const stats = await getMongoStats();
    res.json(stats);
  });

  app.get("/api/scoreboard/leaderboard", async (req, res) => {
    try {
      const period = (req.query.period as "weekly" | "alltime") || "alltime";
      const cityId = req.query.city_id as string | undefined;
      const schoolType = req.query.type as string | undefined;
      const leaderboard = await storage.getLeaderboard(period, cityId, schoolType);

      const MILESTONES = [
        { id: "first_action", label: "First Action", check: (total: number, actions: any[]) => actions.length >= 1 },
        { id: "500_points", label: "500 Points", check: (total: number) => total >= 500 },
        { id: "1000_points", label: "1,000 Points", check: (total: number) => total >= 1000 },
        { id: "100_raised", label: "$100 Raised", check: (_t: number, actions: any[]) => actions.filter((a: any) => a.actionType === "DONATION_RAISED" && a.status === "APPROVED").reduce((s: number, a: any) => s + (a.donationUsd || 0), 0) >= 100 },
        { id: "100kg_removed", label: "100kg Removed", check: (_t: number, actions: any[]) => actions.filter((a: any) => a.actionType === "CLEANUP_EVENT" && a.status === "APPROVED").reduce((s: number, a: any) => s + (a.kgTrashRemoved || 0), 0) >= 100 },
      ];

      const allActions = await storage.getSchoolActions();
      const enriched = leaderboard.map((entry) => {
        const schoolActs = allActions.filter(a => a.schoolId === entry.school.id);
        const badges = MILESTONES.filter(m => m.check(entry.totalPoints, schoolActs)).map(m => ({ id: m.id, label: m.label }));
        return { ...entry, badges };
      });

      res.json(enriched);
    } catch (err: any) {
      res.status(500).json({ message: "Leaderboard failed", error: err.message });
    }
  });

  app.get("/api/scoreboard/schools/:id", async (req, res) => {
    try {
      const school = await storage.getSchool(req.params.id);
      if (!school) return res.status(404).json({ message: "School not found" });
      const actions = await storage.getSchoolActions(req.params.id);
      const approvedActions = actions.filter(a => a.status === "APPROVED");
      const totalPoints = approvedActions.reduce((s, a) => s + (a.pointsAwarded || 0), 0);
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const weeklyPoints = approvedActions.filter(a => new Date(a.createdAt) >= oneWeekAgo).reduce((s, a) => s + (a.pointsAwarded || 0), 0);
      const kgRemoved = approvedActions.reduce((s, a) => s + (a.kgTrashRemoved || 0), 0);
      const fundsRaised = approvedActions.reduce((s, a) => s + (a.donationUsd || 0), 0);
      const co2Equivalent = Math.round(kgRemoved * 0.3 * 10) / 10;

      let adoptedCity = null;
      if (school.adoptedCityId) {
        adoptedCity = await storage.getCity(school.adoptedCityId);
      }

      const pointsByCategory: Record<string, number> = {};
      for (const a of approvedActions) {
        pointsByCategory[a.actionType] = (pointsByCategory[a.actionType] || 0) + (a.pointsAwarded || 0);
      }

      res.json({
        school,
        adoptedCity,
        totalPoints,
        weeklyPoints,
        actionCount: approvedActions.length,
        kgRemoved,
        fundsRaised,
        co2Equivalent,
        volunteerEstimate: approvedActions.filter(a => a.actionType === "CLEANUP_EVENT").length * 8,
        pointsByCategory,
        recentActions: actions.slice(0, 20),
      });
    } catch (err: any) {
      res.status(500).json({ message: "School profile failed", error: err.message });
    }
  });

  app.post("/api/scoreboard/schools", async (req, res) => {
    try {
      const parsed = insertSchoolSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid school data", errors: parsed.error.issues });
      const school = await storage.createSchool(parsed.data);
      res.status(201).json(school);
    } catch (err: any) {
      res.status(500).json({ message: "Failed to create school", error: err.message });
    }
  });

  app.post("/api/scoreboard/actions", async (req, res) => {
    try {
      const { actionType, schoolId, cityId, description, evidenceUrl, solanaTxSig, kgTrashRemoved, donationUsd } = req.body;
      if (!actionType || !schoolId || !description) {
        return res.status(400).json({ message: "actionType, schoolId, and description are required" });
      }
      const validTypes = ["CLASSROOM_MISSION", "CLEANUP_EVENT", "DONATION_RAISED", "AWARENESS_ACTIVITY"];
      if (!validTypes.includes(actionType)) {
        return res.status(400).json({ message: `actionType must be one of: ${validTypes.join(", ")}` });
      }
      const points = calculatePoints(actionType, kgTrashRemoved, donationUsd);
      const action = await storage.createSchoolAction({
        schoolId,
        actionType,
        cityId: cityId || null,
        description,
        evidenceUrl: evidenceUrl || null,
        solanaTxSig: solanaTxSig || null,
        kgTrashRemoved: kgTrashRemoved || null,
        donationUsd: donationUsd || null,
        status: "PENDING",
        pointsAwarded: 0,
      });
      res.status(201).json({ ...action, calculatedPoints: points });
    } catch (err: any) {
      res.status(500).json({ message: "Failed to submit action", error: err.message });
    }
  });

  app.get("/api/scoreboard/actions", async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const schoolId = req.query.school_id as string | undefined;
      const actions = await storage.getSchoolActions(schoolId, status);

      if (status === "PENDING" || !status) {
        const allSchools = await storage.getSchools();
        const schoolMap = new Map(allSchools.map(s => [s.id, s]));
        const enriched = actions.map(a => ({ ...a, schoolName: schoolMap.get(a.schoolId)?.name || "Unknown" }));
        return res.json(enriched);
      }

      res.json(actions);
    } catch (err: any) {
      res.status(500).json({ message: "Failed to fetch actions", error: err.message });
    }
  });

  app.post("/api/scoreboard/actions/:id/review", async (req, res) => {
    try {
      const { status } = req.body;
      if (!status || !["APPROVED", "REJECTED"].includes(status)) {
        return res.status(400).json({ message: "status must be APPROVED or REJECTED" });
      }

      const actions = await storage.getSchoolActions();
      const action = actions.find(a => a.id === req.params.id);
      if (!action) return res.status(404).json({ message: "Action not found" });

      if (status === "APPROVED") {
        const points = calculatePoints(action.actionType, action.kgTrashRemoved, action.donationUsd);
        await storage.reviewSchoolAction(req.params.id, "APPROVED");
        const { db: dbInst } = await import("./db");
        const { schoolActions: saTable } = await import("@shared/schema");
        const { eq } = await import("drizzle-orm");
        await dbInst.update(saTable).set({ pointsAwarded: points } as any).where(eq(saTable.id, req.params.id));
        const updated = (await storage.getSchoolActions()).find(a => a.id === req.params.id);
        return res.json(updated);
      }

      const updated = await storage.reviewSchoolAction(req.params.id, "REJECTED");
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: "Review failed", error: err.message });
    }
  });

  app.get("/api/cleanup-jobs", async (req, res) => {
    try {
      const cleanupId = req.query.cleanupId as string | undefined;
      const jobs = await storage.getCleanupJobs(cleanupId);
      res.json(jobs);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/cleanup-jobs/:id", async (req, res) => {
    try {
      const job = await storage.getCleanupJob(req.params.id);
      if (!job) return res.status(404).json({ message: "Job not found" });
      res.json(job);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/cleanup-jobs", async (req, res) => {
    try {
      const job = await storage.createCleanupJob(req.body);
      res.json(job);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/cleanup-jobs/generate/:cleanupId", async (req, res) => {
    try {
      const { cleanupId } = req.params;

      const operations = await storage.getCleanupOps();
      const operation = operations.find((o: any) => o.id === cleanupId);
      if (!operation) return res.status(404).json({ message: "Cleanup operation not found" });

      const existingJobs = await storage.getCleanupJobs(cleanupId);
      if (existingJobs.length > 0) {
        return res.json(existingJobs);
      }

      const cities = await storage.getCities();
      const city = cities.find((c: any) => c.id === operation.cityId);

      const prompt = `You are generating realistic paid job listings for a marine debris cleanup operation. Generate exactly 4 job positions as a JSON array.

OPERATION DETAILS:
- Name: ${operation.operationName}
- Location: ${city?.cityName || "Coastal area"}, ${city?.country || ""}
- Status: ${operation.status}
- Priority: ${operation.priority}
- Estimated Trash: ${operation.trashCollected || 0} kg
- Area: ${operation.areaCleaned || 0} km2
- Drones Needed: ${operation.dronesDeployed || 0}
- Type: Marine debris cleanup and ocean restoration

Generate 4 diverse positions that make sense for this specific operation. Consider the location, scale, and priority.

ROLE TYPES (use exactly one per job): safety, organizer, technical, scientific, logistics, outreach

Return ONLY a valid JSON array with exactly 4 objects. Each object must have these fields:
{
  "title": "Job Title",
  "roleType": "one of the role types above",
  "description": "2-3 sentence description of the role and responsibilities specific to this operation",
  "hourlyRate": number between 18 and 35,
  "hoursPerShift": number between 4 and 8,
  "shiftsAvailable": number between 2 and 8,
  "certifications": ["relevant cert 1", "relevant cert 2"] or empty array,
  "requirements": ["requirement 1", "requirement 2"]
}

Make the jobs realistic: include relevant certifications like PADI, FAA Part 107, OSHA 30, First Aid/CPR, HAZWOPER where appropriate. Vary the hourly rates based on skill level. Make descriptions specific to "${operation.operationName}" in ${city?.cityName || "the area"}.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_completion_tokens: 2000,
        temperature: 0.8,
      });

      const content = response.choices[0]?.message?.content || "[]";
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return res.status(500).json({ message: "AI failed to generate valid job listings" });
      }

      const generatedJobs = JSON.parse(jsonMatch[0]);
      const createdJobs = [];

      for (const job of generatedJobs) {
        const created = await storage.createCleanupJob({
          cleanupId,
          title: job.title,
          roleType: job.roleType || "organizer",
          description: job.description,
          hourlyRate: job.hourlyRate || 20,
          hoursPerShift: job.hoursPerShift || 4,
          shiftsAvailable: job.shiftsAvailable || 3,
          shiftsFilled: 0,
          certifications: Array.isArray(job.certifications) ? job.certifications : [],
          requirements: Array.isArray(job.requirements) ? job.requirements : [],
          status: "open",
        });
        createdJobs.push(created);
      }

      res.json(createdJobs);
    } catch (err: any) {
      console.error("AI job generation failed:", err.message);
      res.status(500).json({ message: "Failed to generate job listings", error: err.message });
    }
  });

  app.get("/api/job-applications", async (req, res) => {
    try {
      const jobId = req.query.jobId as string | undefined;
      const apps = await storage.getJobApplications(jobId);
      res.json(apps);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/job-applications", async (req, res) => {
    try {
      const application = await storage.createJobApplication(req.body);
      res.json(application);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/job-applications/:id", async (req, res) => {
    try {
      const updated = await storage.updateJobApplication(req.params.id, req.body);
      if (!updated) return res.status(404).json({ message: "Application not found" });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  return httpServer;
}
