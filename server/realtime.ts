import { db } from "./db";
import { droneScans, alerts } from "@shared/schema";
import { log } from "./index";
import { syncToMongo } from "./mongodb";

const SF_BAY_LOCATIONS = [
  { name: "Golden Gate Strait", location: "Golden Gate, SF", lat: 37.8199, lng: -122.4783 },
  { name: "Alcatraz Perimeter", location: "Alcatraz Island, SF", lat: 37.8270, lng: -122.4230 },
  { name: "Angel Island Survey", location: "Angel Island, CA", lat: 37.8610, lng: -122.4326 },
  { name: "Point Reyes Coastal", location: "Point Reyes, CA", lat: 38.0686, lng: -122.8803 },
  { name: "Pillar Point Harbor", location: "Half Moon Bay, CA", lat: 37.4950, lng: -122.4930 },
  { name: "Muir Beach Scan", location: "Muir Beach, CA", lat: 37.8590, lng: -122.5760 },
  { name: "Baker Beach Monitor", location: "Baker Beach, SF", lat: 37.7933, lng: -122.4833 },
  { name: "Crissy Field Tidal", location: "Crissy Field, SF", lat: 37.8040, lng: -122.4650 },
  { name: "Sausalito Waterfront", location: "Sausalito, CA", lat: 37.8590, lng: -122.4852 },
  { name: "Yerba Buena Sweep", location: "Yerba Buena Island, SF", lat: 37.8100, lng: -122.3600 },
  { name: "Richmond Bridge Zone", location: "Richmond, CA", lat: 37.9363, lng: -122.4530 },
  { name: "Tiburon Peninsula", location: "Tiburon, CA", lat: 37.8735, lng: -122.4568 },
  { name: "Daly City Shore", location: "Daly City, CA", lat: 37.6879, lng: -122.4702 },
  { name: "Ocean Beach Scan", location: "Ocean Beach, SF", lat: 37.7594, lng: -122.5107 },
  { name: "Emeryville Marsh", location: "Emeryville, CA", lat: 37.8316, lng: -122.2915 },
];

function rand(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const ALERT_TYPES = [
  { type: "Harmful Algal Bloom", severity: "critical", condition: (s: any) => s.algaeLevel > 60 },
  { type: "Low Dissolved Oxygen", severity: "critical", condition: (s: any) => s.dissolvedOxygen < 4.5 },
  { type: "High Turbidity", severity: "warning", condition: (s: any) => s.turbidity > 35 },
  { type: "Rising Algae Trend", severity: "warning", condition: (s: any) => s.algaeLevel > 40 && s.algaeLevel <= 60 },
  { type: "pH Anomaly", severity: "warning", condition: (s: any) => s.phLevel < 7.2 || s.phLevel > 8.6 },
  { type: "Temperature Spike", severity: "info", condition: (s: any) => s.temperature > 18 },
  { type: "Routine Scan Complete", severity: "info", condition: () => Math.random() > 0.7 },
];

const ALERT_MESSAGES: Record<string, string[]> = {
  "Harmful Algal Bloom": [
    "Dangerous algae concentration detected. Cyanobacteria signatures present. Immediate response recommended.",
    "Algal bloom exceeding safe thresholds. Marine life at risk. Deploy containment protocols.",
    "Critical bloom event detected. Water samples needed for toxin analysis.",
  ],
  "Low Dissolved Oxygen": [
    "Dissolved oxygen levels dangerously low. Hypoxic zone forming. Marine organisms at risk.",
    "Oxygen depletion detected. Dead zone potential. Urgent monitoring required.",
  ],
  "High Turbidity": [
    "Sediment levels elevated. Visibility reduced. Possible runoff event upstream.",
    "Turbidity spike detected. May indicate storm runoff or construction activity nearby.",
  ],
  "Rising Algae Trend": [
    "Algae levels trending upward. May develop into bloom event within 48-72 hours.",
    "Moderate algae increase observed. Recommend increased monitoring frequency.",
  ],
  "pH Anomaly": [
    "Water pH outside normal range. Ocean acidification indicator. Further analysis needed.",
    "pH levels abnormal. Potential chemical discharge or natural volcanic activity.",
  ],
  "Temperature Spike": [
    "Water temperature above seasonal average. May accelerate algae growth.",
    "Thermal anomaly detected. Warmer waters could stress local marine species.",
  ],
  "Routine Scan Complete": [
    "Scan completed successfully. All parameters within acceptable ranges.",
    "Routine monitoring complete. No immediate concerns detected.",
  ],
};

export async function generateRealtimeScan() {
  const loc = pickRandom(SF_BAY_LOCATIONS);
  const algaeLevel = rand(3, 85);
  const greeneryIndex = algaeLevel > 50 ? rand(0.15, 0.45) : rand(0.5, 0.95);
  const waterQuality = Math.max(10, Math.min(100, 100 - algaeLevel * 0.8 + rand(-10, 10)));
  const temperature = rand(11, 20);
  const phLevel = rand(7.0, 8.8);
  const dissolvedOxygen = algaeLevel > 50 ? rand(2.5, 5.5) : rand(6, 10);
  const turbidity = rand(2, 50);

  const scanData = {
    scanName: `${loc.name} - Live`,
    location: loc.location,
    latitude: loc.lat + rand(-0.01, 0.01),
    longitude: loc.lng + rand(-0.01, 0.01),
    algaeLevel,
    greeneryIndex,
    waterQuality,
    temperature,
    phLevel,
    dissolvedOxygen,
    turbidity,
    status: "completed" as const,
    imageUrl: "/images/algae-map.png",
    notes: `Automated drone scan at ${loc.location}. Real-time environmental data captured.`,
  };

  const [scan] = await db.insert(droneScans).values(scanData).returning();
  syncToMongo("drone_scans", scan).catch(() => {});

  const triggeredAlerts = ALERT_TYPES.filter(a => a.condition(scanData));
  const alertsToCreate = triggeredAlerts.slice(0, 2);

  for (const alertType of alertsToCreate) {
    const msgs = ALERT_MESSAGES[alertType.type] || ["Alert triggered for this scan."];
    const [alert] = await db.insert(alerts).values({
      scanId: scan.id,
      type: alertType.type,
      severity: alertType.severity,
      message: pickRandom(msgs),
      resolved: alertType.severity === "info",
    }).returning();
    syncToMongo("alerts", alert).catch(() => {});
  }

  return scan;
}

let intervalId: NodeJS.Timeout | null = null;
let globalIntervalId: NodeJS.Timeout | null = null;

export function startRealtimeEngine() {
  if (intervalId) return;

  generateRealtimeScan().catch(err => console.error("Initial scan generation error:", err));

  intervalId = setInterval(async () => {
    try {
      await generateRealtimeScan();
    } catch (err) {
      console.error("Realtime scan generation error:", err);
    }
  }, 30000);

  log("Real-time scan engine started (every 30s)");
}

export function startGlobalTrackingEngine() {
  if (globalIntervalId) return;

  globalIntervalId = setInterval(async () => {
    try {
      const { updateGlobalTracking } = await import("./globalSeed");
      await updateGlobalTracking();
    } catch (err) {
      console.error("Global tracking update error:", err);
    }
  }, 60000);

  log("Global tracking engine started (every 60s)");
}

export function stopRealtimeEngine() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  if (globalIntervalId) {
    clearInterval(globalIntervalId);
    globalIntervalId = null;
  }
}
