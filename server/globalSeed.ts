import { db } from "./db";
import { cityMonitors, kelpTrashTracks, cleanupOperations, schools, schoolActions } from "@shared/schema";
import { sql } from "drizzle-orm";

const GLOBAL_CITIES = [
  { cityName: "San Francisco", country: "USA", lat: 37.7749, lng: -122.4194, kelpBase: 72, trashBase: 25 },
  { cityName: "Los Angeles", country: "USA", lat: 33.9425, lng: -118.4081, kelpBase: 45, trashBase: 55 },
  { cityName: "Miami", country: "USA", lat: 25.7617, lng: -80.1918, kelpBase: 38, trashBase: 42 },
  { cityName: "New York", country: "USA", lat: 40.6892, lng: -74.0445, kelpBase: 30, trashBase: 60 },
  { cityName: "Seattle", country: "USA", lat: 47.6062, lng: -122.3321, kelpBase: 68, trashBase: 20 },
  { cityName: "Honolulu", country: "USA", lat: 21.3069, lng: -157.8583, kelpBase: 80, trashBase: 15 },
  { cityName: "Vancouver", country: "Canada", lat: 49.2827, lng: -123.1207, kelpBase: 75, trashBase: 18 },
  { cityName: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503, kelpBase: 55, trashBase: 35 },
  { cityName: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093, kelpBase: 70, trashBase: 22 },
  { cityName: "Mumbai", country: "India", lat: 19.0760, lng: 72.8777, kelpBase: 20, trashBase: 78 },
  { cityName: "Cape Town", country: "South Africa", lat: -33.9249, lng: 18.4241, kelpBase: 65, trashBase: 30 },
  { cityName: "Rio de Janeiro", country: "Brazil", lat: -22.9068, lng: -43.1729, kelpBase: 40, trashBase: 50 },
  { cityName: "Barcelona", country: "Spain", lat: 41.3851, lng: 2.1734, kelpBase: 50, trashBase: 32 },
  { cityName: "Lagos", country: "Nigeria", lat: 6.5244, lng: 3.3792, kelpBase: 15, trashBase: 82 },
  { cityName: "Shanghai", country: "China", lat: 31.2304, lng: 121.4737, kelpBase: 25, trashBase: 65 },
  { cityName: "Dubai", country: "UAE", lat: 25.2048, lng: 55.2708, kelpBase: 10, trashBase: 28 },
  { cityName: "Lisbon", country: "Portugal", lat: 38.7223, lng: -9.1393, kelpBase: 55, trashBase: 25 },
  { cityName: "Reykjavik", country: "Iceland", lat: 64.1466, lng: -21.9426, kelpBase: 85, trashBase: 8 },
  { cityName: "Oslo", country: "Norway", lat: 59.9139, lng: 10.7522, kelpBase: 78, trashBase: 12 },
  { cityName: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198, kelpBase: 35, trashBase: 22 },
];

function rand(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function getRating(score: number, isKelp: boolean): string {
  if (isKelp) {
    if (score >= 70) return "Excellent";
    if (score >= 50) return "Good";
    if (score >= 30) return "Fair";
    return "Poor";
  }
  if (score <= 15) return "Excellent";
  if (score <= 30) return "Good";
  if (score <= 50) return "Fair";
  return "Poor";
}

const CLEANUP_NAMES = [
  "Coastal Sweep Alpha", "Deep Clean Beta", "Harbor Patrol Gamma",
  "Drone Cleanup Delta", "Reef Restoration Epsilon", "Shore Brigade Zeta",
  "Marine Recovery Eta", "Tide Patrol Theta", "Bay Cleanup Iota",
  "Ocean Guard Kappa",
];

const CLEANUP_STATUSES = ["planned", "in-progress", "completed", "on-hold"];
const PRIORITIES = ["low", "medium", "high", "critical"];

export async function seedGlobalData() {
  const existing = await db.select({ id: cityMonitors.id }).from(cityMonitors).limit(1);
  if (existing.length > 0) return;

  console.log("Seeding global city monitoring data...");

  const cityIds: string[] = [];

  for (const city of GLOBAL_CITIES) {
    const kelpDensity = city.kelpBase + rand(-10, 10);
    const trashLevel = city.trashBase + rand(-10, 10);
    const overallScore = Math.max(0, Math.min(100, (kelpDensity * 0.6 + (100 - trashLevel) * 0.4)));

    const [created] = await db.insert(cityMonitors).values({
      cityName: city.cityName,
      country: city.country,
      latitude: city.lat,
      longitude: city.lng,
      kelpDensity,
      kelpHealthRating: getRating(kelpDensity, true),
      trashLevel,
      trashRating: getRating(trashLevel, false),
      overallScore,
      waterTemp: rand(8, 28),
      currentSpeed: rand(0.1, 3.5),
    }).returning();

    cityIds.push(created.id);

    const trackCount = Math.floor(rand(8, 20));
    const startDate = new Date("2025-02-14T00:00:00Z");
    const now = new Date();
    const totalMs = now.getTime() - startDate.getTime();

    for (let i = 0; i < trackCount; i++) {
      const trackDate = new Date(startDate.getTime() + Math.random() * totalMs);
      const isKelp = Math.random() > 0.4;

      await db.insert(kelpTrashTracks).values({
        cityId: created.id,
        trackType: isKelp ? "kelp" : "trash",
        latitude: city.lat + rand(-0.15, 0.15),
        longitude: city.lng + rand(-0.15, 0.15),
        density: isKelp ? rand(5, 95) : rand(2, 80),
        movementDirection: rand(0, 360),
        speed: rand(0.05, 2.0),
      });

      await db.execute(sql`UPDATE kelp_trash_tracks SET timestamp = ${trackDate} WHERE id = (SELECT id FROM kelp_trash_tracks ORDER BY timestamp DESC LIMIT 1)`);
    }
  }

  for (let i = 0; i < 15; i++) {
    const cityId = cityIds[Math.floor(Math.random() * cityIds.length)];
    const status = CLEANUP_STATUSES[Math.floor(Math.random() * CLEANUP_STATUSES.length)];
    const priority = PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)];

    const fundingGoal = rand(500, 5000);
    const fundingRaised = status === "completed" ? fundingGoal : rand(0, fundingGoal * 0.8);
    await db.insert(cleanupOperations).values({
      cityId,
      operationName: CLEANUP_NAMES[i % CLEANUP_NAMES.length],
      status,
      priority,
      trashCollected: status === "completed" ? rand(50, 500) : rand(0, 200),
      areaCleanedKm2: status === "completed" ? rand(2, 25) : rand(0, 10),
      dronesDeployed: Math.floor(rand(2, 12)),
      notes: `Automated cleanup operation targeting marine debris and kelp monitoring.`,
      fundingGoal,
      fundingRaised,
    });
  }

  console.log(`Seeded ${GLOBAL_CITIES.length} cities with tracking data and cleanup operations`);

  await seedSchoolScoreboard(cityIds);
}

const SCORING = {
  CLASSROOM_MISSION: 50,
  CLEANUP_EVENT: 200,
  CLEANUP_PER_KG: 2,
  DONATION_PER_DOLLAR: 1,
  DONATION_CAP: 500,
  AWARENESS_ACTIVITY: 75,
};

function calculatePoints(actionType: string, kgTrash?: number | null, donationUsd?: number | null): number {
  switch (actionType) {
    case "CLASSROOM_MISSION": return SCORING.CLASSROOM_MISSION;
    case "CLEANUP_EVENT": return SCORING.CLEANUP_EVENT + (kgTrash ? kgTrash * SCORING.CLEANUP_PER_KG : 0);
    case "DONATION_RAISED": return Math.min(donationUsd ? donationUsd * SCORING.DONATION_PER_DOLLAR : 0, SCORING.DONATION_CAP);
    case "AWARENESS_ACTIVITY": return SCORING.AWARENESS_ACTIVITY;
    default: return 0;
  }
}

const SCHOOL_SEED_DATA = [
  { name: "Pacific Heights Academy", type: "K12", location: "San Francisco, CA" },
  { name: "Harbor View High School", type: "K12", location: "Los Angeles, CA" },
  { name: "Coral Springs Middle School", type: "K12", location: "Miami, FL" },
  { name: "MIT Ocean Engineering Lab", type: "COLLEGE", location: "Cambridge, MA" },
  { name: "UC San Diego Marine Sciences", type: "COLLEGE", location: "San Diego, CA" },
  { name: "Yokohama International School", type: "K12", location: "Yokohama, Japan" },
  { name: "University of Sydney ENV201", type: "COLLEGE", location: "Sydney, Australia" },
  { name: "Nordic Green Academy", type: "K12", location: "Oslo, Norway" },
];

const ACTION_TEMPLATES = [
  { type: "CLASSROOM_MISSION", desc: "Ocean pollution awareness workshop with 30 students" },
  { type: "CLASSROOM_MISSION", desc: "Marine biology lab analyzing local water samples" },
  { type: "CLEANUP_EVENT", desc: "Beach cleanup organized by student volunteers", kg: 45 },
  { type: "CLEANUP_EVENT", desc: "Harbor debris removal with diving team", kg: 120 },
  { type: "CLEANUP_EVENT", desc: "Coastal sweep removing fishing nets and plastics", kg: 78 },
  { type: "DONATION_RAISED", desc: "Fundraiser for cleanup supplies and trash bags", usd: 250 },
  { type: "DONATION_RAISED", desc: "Bake sale proceeds donated to drone maintenance fund", usd: 85 },
  { type: "AWARENESS_ACTIVITY", desc: "Student-made documentary screened at school assembly" },
  { type: "AWARENESS_ACTIVITY", desc: "Social media campaign reaching 2,000 local residents" },
  { type: "CLASSROOM_MISSION", desc: "Data analysis project using OceanGuard API" },
  { type: "CLEANUP_EVENT", desc: "Microplastics collection and sorting exercise", kg: 12 },
  { type: "DONATION_RAISED", desc: "Online crowdfunding for research equipment", usd: 450 },
  { type: "AWARENESS_ACTIVITY", desc: "Poster campaign distributed to 15 local businesses" },
  { type: "CLASSROOM_MISSION", desc: "Virtual field trip studying kelp forest ecosystems" },
  { type: "CLEANUP_EVENT", desc: "Reef debris removal with local dive shops", kg: 95 },
];

async function seedSchoolScoreboard(cityIds: string[]) {
  const existingSchools = await db.select({ id: schools.id }).from(schools).limit(1);
  if (existingSchools.length > 0) return;

  console.log("Seeding School Scoreboard data...");

  const schoolIds: string[] = [];
  for (let i = 0; i < SCHOOL_SEED_DATA.length; i++) {
    const s = SCHOOL_SEED_DATA[i];
    const adoptedCityId = cityIds[i % cityIds.length];
    const [created] = await db.insert(schools).values({
      name: s.name,
      type: s.type,
      location: s.location,
      adoptedCityId,
    }).returning();
    schoolIds.push(created.id);
  }

  const statuses: Array<"APPROVED" | "PENDING" | "REJECTED"> = ["APPROVED", "APPROVED", "APPROVED", "APPROVED", "PENDING", "PENDING", "REJECTED"];

  for (let i = 0; i < 25; i++) {
    const schoolId = schoolIds[i % schoolIds.length];
    const template = ACTION_TEMPLATES[i % ACTION_TEMPLATES.length];
    const cityId = cityIds[Math.floor(Math.random() * cityIds.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const points = calculatePoints(template.type, template.kg, template.usd);

    const daysAgo = Math.floor(Math.random() * 14);
    const actionDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    await db.insert(schoolActions).values({
      schoolId,
      actionType: template.type,
      cityId,
      description: template.desc,
      kgTrashRemoved: template.kg || null,
      donationUsd: template.usd || null,
      status,
      pointsAwarded: status === "APPROVED" ? points : 0,
    });

    await db.execute(sql`UPDATE school_actions SET created_at = ${actionDate} WHERE id = (SELECT id FROM school_actions ORDER BY created_at DESC LIMIT 1)`);
    if (status !== "PENDING") {
      await db.execute(sql`UPDATE school_actions SET reviewed_at = ${new Date(actionDate.getTime() + 3600000)} WHERE id = (SELECT id FROM school_actions ORDER BY created_at DESC LIMIT 1)`);
    }
  }

  console.log(`Seeded ${SCHOOL_SEED_DATA.length} schools with 25 actions for School Scoreboard`);
}

export { calculatePoints, SCORING };

export async function updateGlobalTracking() {
  const cities = await db.select().from(cityMonitors);

  for (const city of cities) {
    const kelpDrift = rand(-3, 3);
    const trashDrift = rand(-2, 2);
    const newKelp = Math.max(0, Math.min(100, city.kelpDensity + kelpDrift));
    const newTrash = Math.max(0, Math.min(100, city.trashLevel + trashDrift));
    const overallScore = Math.max(0, Math.min(100, (newKelp * 0.6 + (100 - newTrash) * 0.4)));

    await db.update(cityMonitors).set({
      kelpDensity: newKelp,
      kelpHealthRating: getRating(newKelp, true),
      trashLevel: newTrash,
      trashRating: getRating(newTrash, false),
      overallScore,
      lastUpdated: new Date(),
    }).where(sql`id = ${city.id}`);

    if (Math.random() > 0.5) {
      const isKelp = Math.random() > 0.4;
      await db.insert(kelpTrashTracks).values({
        cityId: city.id,
        trackType: isKelp ? "kelp" : "trash",
        latitude: city.latitude + rand(-0.12, 0.12),
        longitude: city.longitude + rand(-0.12, 0.12),
        density: isKelp ? rand(5, 95) : rand(2, 80),
        movementDirection: rand(0, 360),
        speed: rand(0.05, 2.0),
      });
    }
  }
}
