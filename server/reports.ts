import type { Express, Request, Response } from "express";
import { db } from "./db";
import { droneScans, alerts, cityMonitors, kelpTrashTracks, cleanupOperations } from "@shared/schema";
import { desc, gte } from "drizzle-orm";

const GEMINI_API_KEY = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
const GEMINI_BASE_URL = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;

async function getFullDataContext(): Promise<string> {
  const allScans = await db.select().from(droneScans).orderBy(desc(droneScans.scanDate)).limit(50);
  const allAlerts = await db.select().from(alerts).orderBy(desc(alerts.createdAt)).limit(30);
  const activeAlerts = allAlerts.filter(a => !a.resolved);

  const totalScans = allScans.length;
  const avgAlgae = totalScans > 0 ? allScans.reduce((s, r) => s + r.algaeLevel, 0) / totalScans : 0;
  const avgQuality = totalScans > 0 ? allScans.reduce((s, r) => s + r.waterQuality, 0) / totalScans : 0;
  const avgGreenery = totalScans > 0 ? allScans.reduce((s, r) => s + r.greeneryIndex, 0) / totalScans : 0;

  const zones = [...new Set(allScans.map(s => s.location.split(",")[0].trim()))];
  const zoneData = zones.map(zone => {
    const zoneScans = allScans.filter(s => s.location.split(",")[0].trim() === zone);
    return {
      zone,
      count: zoneScans.length,
      avgAlgae: (zoneScans.reduce((s, sc) => s + sc.algaeLevel, 0) / zoneScans.length).toFixed(1),
      avgQuality: (zoneScans.reduce((s, sc) => s + sc.waterQuality, 0) / zoneScans.length).toFixed(1),
      avgNDVI: (zoneScans.reduce((s, sc) => s + sc.greeneryIndex, 0) / zoneScans.length).toFixed(3),
      avgPh: (zoneScans.filter(s => s.phLevel).reduce((s, sc) => s + (sc.phLevel || 0), 0) / (zoneScans.filter(s => s.phLevel).length || 1)).toFixed(2),
      avgDO: (zoneScans.filter(s => s.dissolvedOxygen).reduce((s, sc) => s + (sc.dissolvedOxygen || 0), 0) / (zoneScans.filter(s => s.dissolvedOxygen).length || 1)).toFixed(1),
      avgTurb: (zoneScans.filter(s => s.turbidity).reduce((s, sc) => s + (sc.turbidity || 0), 0) / (zoneScans.filter(s => s.turbidity).length || 1)).toFixed(1),
      avgTemp: (zoneScans.filter(s => s.temperature).reduce((s, sc) => s + (sc.temperature || 0), 0) / (zoneScans.filter(s => s.temperature).length || 1)).toFixed(1),
    };
  });

  const allCities = await db.select().from(cityMonitors);
  const allCleanups = await db.select().from(cleanupOperations).orderBy(desc(cleanupOperations.startDate)).limit(30);

  const avgKelp = allCities.length > 0 ? (allCities.reduce((s, c) => s + c.kelpDensity, 0) / allCities.length).toFixed(1) : "0";
  const avgTrash = allCities.length > 0 ? (allCities.reduce((s, c) => s + c.trashLevel, 0) / allCities.length).toFixed(1) : "0";
  const avgCityScore = allCities.length > 0 ? (allCities.reduce((s, c) => s + c.overallScore, 0) / allCities.length).toFixed(0) : "0";
  const totalTrashCollected = allCleanups.reduce((s, o) => s + (o.trashCollected || 0), 0);

  return `
OCEAN MONITORING DATA SUMMARY (Data since Feb 14, 2025):
- Total drone scans: ${totalScans}
- Monitoring zones: ${zones.length} (${zones.join(", ")})
- Overall avg algae level: ${avgAlgae.toFixed(1)}%
- Overall avg water quality: ${avgQuality.toFixed(1)}%
- Overall avg greenery index (NDVI): ${avgGreenery.toFixed(3)}
- Active alerts: ${activeAlerts.length}
- Critical alerts: ${activeAlerts.filter(a => a.severity === "critical").length}

GLOBAL CITY MONITORING (${allCities.length} cities):
- Average kelp density: ${avgKelp}%
- Average trash level: ${avgTrash}%
- Average city ocean score: ${avgCityScore}/100
- Total trash collected from cleanup operations: ${totalTrashCollected.toFixed(0)} kg
- Cleanup operations: ${allCleanups.length} total (${allCleanups.filter(o => o.status === "completed").length} completed, ${allCleanups.filter(o => o.status === "in-progress").length} in progress)

CITY-BY-CITY DATA:
${allCities.map(c => `  ${c.cityName}, ${c.country}: Kelp ${c.kelpDensity.toFixed(1)}% (${c.kelpHealthRating}), Trash ${c.trashLevel.toFixed(1)}% (${c.trashRating}), Score ${c.overallScore.toFixed(0)}/100, Temp ${c.waterTemp?.toFixed(1) || "N/A"}C`).join("\n")}

ZONE-BY-ZONE DATA:
${zoneData.map(z => `  ${z.zone}: ${z.count} scans, Algae ${z.avgAlgae}%, Quality ${z.avgQuality}%, NDVI ${z.avgNDVI}, pH ${z.avgPh}, DO ${z.avgDO} mg/L, Turbidity ${z.avgTurb} NTU, Temp ${z.avgTemp}C`).join("\n")}

RECENT SCAN DETAILS (last 10):
${allScans.slice(0, 10).map(s => `  ${s.scanName} @ ${s.location}: Algae ${s.algaeLevel.toFixed(1)}%, Quality ${s.waterQuality.toFixed(1)}%, NDVI ${s.greeneryIndex.toFixed(3)}, pH ${s.phLevel}, DO ${s.dissolvedOxygen} mg/L, Turb ${s.turbidity} NTU, Temp ${s.temperature}C [${s.status}]`).join("\n")}

ACTIVE ALERTS:
${activeAlerts.map(a => `  [${a.severity.toUpperCase()}] ${a.type}: ${a.message}`).join("\n") || "  No active alerts"}

RECENT CLEANUP OPERATIONS:
${allCleanups.slice(0, 10).map(o => `  ${o.operationName}: ${o.status}, ${(o.trashCollected || 0).toFixed(0)} kg collected, ${(o.areaCleanedKm2 || 0).toFixed(1)} km2 cleaned, ${o.dronesDeployed || 0} drones`).join("\n")}
`;
}

const REPORT_PROMPTS: Record<string, string> = {
  "environmental-impact": `You are an expert marine environmental scientist. Generate a comprehensive Environmental Impact Assessment report based on the provided ocean monitoring data.

Structure your report with:
1. **Executive Summary** - Key findings in 2-3 sentences
2. **Current Environmental Status** - Overall health assessment
3. **Key Metrics Analysis** - Break down water quality, algae levels, vegetation indices
4. **Zone-by-Zone Assessment** - Compare different monitoring zones
5. **Risk Factors** - Identify concerning trends or readings
6. **Recommendations** - Specific actionable steps for conservation
7. **Outlook** - Short-term and long-term environmental projections

Use specific numbers from the data. Be scientifically rigorous but accessible.`,

  "water-quality": `You are a water quality scientist specializing in marine and coastal systems. Generate a detailed Water Quality Report.

Structure your report with:
1. **Summary** - Overall water quality status
2. **pH Analysis** - Current levels, trends, and implications for marine life
3. **Dissolved Oxygen Assessment** - Levels across zones, hypoxia risk
4. **Turbidity Report** - Water clarity measurements and sediment analysis
5. **Temperature Profile** - Thermal patterns and anomalies
6. **Compliance Status** - How readings compare to EPA/WHO water quality standards
7. **Action Items** - Specific interventions recommended

Reference standard water quality benchmarks (EPA guidelines, WHO standards).`,

  "algae-risk": `You are a harmful algal bloom (HAB) specialist. Generate an Algae Bloom Risk Analysis report.

Structure your report with:
1. **Risk Summary** - Current bloom risk level (Low/Moderate/High/Critical)
2. **Current Algae Levels** - Detailed breakdown by zone
3. **Contributing Factors** - Temperature, nutrients, dissolved oxygen that affect bloom probability
4. **Bloom Probability Forecast** - 72-hour prediction based on current conditions
5. **Historical Comparison** - How current levels compare to baseline
6. **Species Risk Assessment** - Which marine species are most at risk
7. **Mitigation Strategies** - Immediate and long-term actions

Include scientific context about HAB causes and ecosystem impacts.`,

  "vegetation-health": `You are a marine vegetation ecologist specializing in NDVI analysis. Generate a Vegetation Health Report.

Structure your report with:
1. **Overview** - Overall vegetation health status
2. **NDVI Analysis** - Detailed normalized difference vegetation index breakdown by zone
3. **Coastal Vegetation Status** - Health of mangroves, seagrass, and coastal plants
4. **Marine Plant Health** - Kelp forests, algae balance, phytoplankton productivity
5. **Seasonal Trends** - Expected changes and current deviations
6. **Biodiversity Impact** - How vegetation health affects marine ecosystem
7. **Conservation Recommendations** - Priority actions for vegetation protection

Use NDVI scale interpretation (0-0.2 barren, 0.2-0.4 sparse, 0.4-0.6 moderate, 0.6-0.8 dense, 0.8-1.0 very dense).`,

  "kelp-trash-analysis": `You are a marine ecosystem analyst specializing in kelp forest health and ocean debris tracking. Generate a comprehensive Global Kelp & Trash Analysis report.

Structure your report with:
1. **Global Overview** - Summary of kelp and trash conditions across all monitored cities
2. **City Rankings** - Top performing and worst performing cities for kelp health and trash management
3. **Kelp Forest Health** - Detailed kelp density analysis by region with health ratings
4. **Marine Debris Assessment** - Trash level patterns, hotspots, and trends since Feb 2025
5. **Cleanup Impact** - How cleanup operations have affected trash levels in key cities
6. **Correlation Analysis** - Relationship between kelp health and trash levels
7. **Priority Recommendations** - Cities needing immediate attention and suggested interventions

Use specific city-by-city data. Compare regions (Pacific, Atlantic, Indian Ocean, etc.).`,

  "custom": `You are an expert environmental data analyst. Analyze the provided ocean monitoring data according to the user's specific request.

Provide a well-structured, detailed analysis with:
- Clear section headers
- Specific data citations from the provided monitoring data
- Scientific context and benchmarks
- Actionable recommendations
- Data-driven conclusions

Be thorough and use the actual numbers from the dataset.`,
};

export function registerReportRoutes(app: Express): void {
  app.post("/api/reports/generate", async (req: Request, res: Response) => {
    try {
      const { type, customPrompt } = req.body;

      if (!type) {
        return res.status(400).json({ error: "Report type is required" });
      }

      if (!GEMINI_API_KEY || !GEMINI_BASE_URL) {
        return res.status(500).json({ error: "Gemini AI integration is not configured" });
      }

      const systemPrompt = REPORT_PROMPTS[type] || REPORT_PROMPTS["custom"];
      const dataContext = await getFullDataContext();

      const userPrompt = type === "custom" && customPrompt
        ? `${customPrompt}\n\nHere is the monitoring data to analyze:\n${dataContext}`
        : `Generate the report based on this monitoring data:\n${dataContext}`;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const apiUrl = `${GEMINI_BASE_URL}/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

      const geminiResponse = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
          ],
          generationConfig: {
            maxOutputTokens: 8192,
            temperature: 0.7,
          },
        }),
      });

      if (!geminiResponse.ok) {
        const errText = await geminiResponse.text();
        console.error("Gemini API error:", errText);
        res.write(`data: ${JSON.stringify({ content: "Failed to generate report. Please try again." })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
        return;
      }

      const reader = geminiResponse.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr || jsonStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
            }
          } catch {}
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Report generation error:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ content: "\n\nReport generation encountered an error." })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to generate report" });
      }
    }
  });
}
