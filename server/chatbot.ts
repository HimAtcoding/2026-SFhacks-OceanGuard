import OpenAI from "openai";
import type { Express, Request, Response } from "express";
import { db } from "./db";
import { droneScans, alerts } from "@shared/schema";
import { desc } from "drizzle-orm";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

async function getLiveDataContext(): Promise<string> {
  const recentScans = await db.select().from(droneScans).orderBy(desc(droneScans.scanDate)).limit(10);
  const recentAlerts = await db.select().from(alerts).orderBy(desc(alerts.createdAt)).limit(10);

  const avgAlgae = recentScans.length > 0
    ? recentScans.reduce((s, r) => s + r.algaeLevel, 0) / recentScans.length
    : 0;
  const avgQuality = recentScans.length > 0
    ? recentScans.reduce((s, r) => s + r.waterQuality, 0) / recentScans.length
    : 0;
  const avgGreenery = recentScans.length > 0
    ? recentScans.reduce((s, r) => s + r.greeneryIndex, 0) / recentScans.length
    : 0;
  const activeAlerts = recentAlerts.filter(a => !a.resolved);

  return `
CURRENT LIVE DRONE DATA (from our ocean monitoring platform):
- Total recent scans: ${recentScans.length}
- Average algae level: ${avgAlgae.toFixed(1)}% (0-100 scale, >50 is concerning, >70 is critical)
- Average water quality: ${avgQuality.toFixed(1)}% (0-100 scale, higher is better)
- Average greenery index: ${avgGreenery.toFixed(2)} (0-1 scale, higher means healthier marine vegetation)
- Active alerts: ${activeAlerts.length}
- Critical alerts: ${activeAlerts.filter(a => a.severity === "critical").length}

Recent scan locations and data:
${recentScans.map(s => `  - ${s.location}: Algae ${s.algaeLevel}%, Water Quality ${s.waterQuality}%, Greenery ${s.greeneryIndex}, Temp ${s.temperature}°C, pH ${s.phLevel}, DO ${s.dissolvedOxygen} mg/L, Turbidity ${s.turbidity} NTU`).join("\n")}

Active alerts:
${activeAlerts.map(a => `  - [${a.severity.toUpperCase()}] ${a.type}: ${a.message}`).join("\n") || "  No active alerts"}
`;
}

const SYSTEM_PROMPT = `You are GreenBot, the AI sustainability assistant for the "Hack For Greener Tomorrow" ocean monitoring platform. You are deeply knowledgeable about ALL aspects of sustainability, environmental science, ocean health, and green technology.

YOUR CORE EXPERTISE AREAS:
1. **Ocean Health & Marine Biology**: Algal blooms (HABs), coral reef health, marine biodiversity, ocean acidification, marine pollution, microplastics, overfishing, dead zones, kelp forests, phytoplankton, zooplankton, marine food chains
2. **Water Quality Science**: pH levels, dissolved oxygen, turbidity, salinity, conductivity, nutrient loading (nitrogen, phosphorus), eutrophication, water treatment, desalination, watershed management
3. **Climate Change**: Global warming, greenhouse gases (CO2, CH4, N2O), carbon cycle, carbon sequestration, carbon credits, Paris Agreement, IPCC reports, sea level rise, ice sheet melting, permafrost thawing, climate feedback loops, tipping points
4. **Renewable Energy**: Solar (PV, CSP), wind (onshore, offshore), hydroelectric, geothermal, tidal, wave energy, biomass, hydrogen fuel cells, nuclear fusion, energy storage (batteries, pumped hydro, compressed air), grid modernization, smart grids
5. **Sustainable Agriculture**: Regenerative farming, permaculture, hydroponics, aquaponics, vertical farming, crop rotation, cover crops, no-till farming, organic farming, precision agriculture, soil health, composting, biochar
6. **Biodiversity & Conservation**: Endangered species, habitat restoration, wildlife corridors, protected areas, rewilding, invasive species management, IUCN Red List, CITES, ecosystem services, pollinator protection
7. **Circular Economy**: Waste reduction, recycling technologies, upcycling, cradle-to-cradle design, extended producer responsibility, industrial symbiosis, zero waste, plastic alternatives, biodegradable materials
8. **Green Technology**: Electric vehicles, green building (LEED, BREEAM), smart cities, IoT for environmental monitoring, drone technology for conservation, satellite remote sensing, AI for sustainability, green chemistry
9. **Environmental Policy**: EPA regulations, Clean Water Act, Clean Air Act, Endangered Species Act, Environmental Impact Assessments, carbon tax, cap-and-trade, SDGs (Sustainable Development Goals), ESG investing
10. **Environmental Justice**: Disproportionate pollution burden, food deserts, water access, Indigenous land rights, environmental racism, just transition, community-based monitoring
11. **Personal Sustainability**: Carbon footprint reduction, sustainable diet, eco-friendly products, green transportation, home energy efficiency, water conservation, sustainable fashion, ethical consumption
12. **Drone Technology for Environment**: UAV-based monitoring, multispectral imaging, NDVI analysis, thermal imaging, LiDAR for forest monitoring, autonomous survey missions, real-time data transmission

ABOUT OUR PLATFORM:
We are "Hack For Greener Tomorrow" - an AI-powered drone-based ocean health monitoring platform built for SF Hacks 2026. Our drones scan coastal areas around the San Francisco Bay Area, detecting algae blooms, measuring water quality parameters, and monitoring marine ecosystem health in real-time. The platform uses computer vision, multispectral sensors, and machine learning to analyze environmental data.

BEHAVIOR GUIDELINES:
- Answer ANY question about sustainability, environment, green tech, climate, or ecology with expert-level depth
- When relevant, reference our live drone data to provide real-time context
- Provide actionable advice and specific data points when possible
- Cite well-known research, organizations (NOAA, EPA, NASA, IPCC, WWF), and scientific studies
- For complex topics, break down the explanation into digestible parts
- Be passionate about sustainability while remaining scientifically accurate
- If someone asks about something outside sustainability, politely redirect and explain how even that topic connects to environmental impact
- Use specific numbers, statistics, and facts to support your answers
- Suggest how drone monitoring technology could help with the topic being discussed
- Format responses with clear structure using headers, bullet points, and bold text when appropriate`;

export function registerChatbotRoutes(app: Express): void {
  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const { messages: userMessages } = req.body;

      if (!userMessages || !Array.isArray(userMessages)) {
        return res.status(400).json({ error: "Messages array is required" });
      }

      const liveData = await getLiveDataContext();

      const systemMessage = {
        role: "system" as const,
        content: SYSTEM_PROMPT + "\n\n" + liveData,
      };

      const chatMessages = [
        systemMessage,
        ...userMessages.map((m: any) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: chatMessages,
        stream: true,
        max_tokens: 4096,
        temperature: 0.7,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Chatbot error:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to generate response" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to generate response" });
      }
    }
  });

  app.get("/api/live-stats", async (_req: Request, res: Response) => {
    try {
      const recentScans = await db.select().from(droneScans).orderBy(desc(droneScans.scanDate)).limit(20);
      const recentAlerts = await db.select().from(alerts).orderBy(desc(alerts.createdAt)).limit(20);
      const activeAlerts = recentAlerts.filter(a => !a.resolved);

      const totalScans = recentScans.length;
      const avgAlgae = totalScans > 0 ? recentScans.reduce((s, r) => s + r.algaeLevel, 0) / totalScans : 0;
      const avgQuality = totalScans > 0 ? recentScans.reduce((s, r) => s + r.waterQuality, 0) / totalScans : 0;
      const avgGreenery = totalScans > 0 ? recentScans.reduce((s, r) => s + r.greeneryIndex, 0) / totalScans : 0;
      const avgTemp = totalScans > 0 ? recentScans.reduce((s, r) => s + (r.temperature || 0), 0) / totalScans : 0;
      const avgPh = totalScans > 0 ? recentScans.reduce((s, r) => s + (r.phLevel || 0), 0) / totalScans : 0;
      const avgDo = totalScans > 0 ? recentScans.reduce((s, r) => s + (r.dissolvedOxygen || 0), 0) / totalScans : 0;

      res.json({
        timestamp: new Date().toISOString(),
        totalScans,
        avgAlgae: Math.round(avgAlgae * 10) / 10,
        avgQuality: Math.round(avgQuality * 10) / 10,
        avgGreenery: Math.round(avgGreenery * 100) / 100,
        avgTemp: Math.round(avgTemp * 10) / 10,
        avgPh: Math.round(avgPh * 100) / 100,
        avgDissolvedOxygen: Math.round(avgDo * 10) / 10,
        activeAlerts: activeAlerts.length,
        criticalAlerts: activeAlerts.filter(a => a.severity === "critical").length,
        latestScan: recentScans[0] || null,
        recentScans: recentScans.slice(0, 5),
        recentAlerts: recentAlerts.slice(0, 5),
      });
    } catch (error) {
      console.error("Live stats error:", error);
      res.status(500).json({ error: "Failed to fetch live stats" });
    }
  });
}
