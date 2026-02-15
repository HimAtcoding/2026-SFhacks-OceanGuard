import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, boolean, jsonb, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const droneScans = pgTable("drone_scans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scanName: text("scan_name").notNull(),
  location: text("location").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  scanDate: timestamp("scan_date").defaultNow().notNull(),
  algaeLevel: real("algae_level").notNull(),
  greeneryIndex: real("greenery_index").notNull(),
  waterQuality: real("water_quality").notNull(),
  temperature: real("temperature"),
  phLevel: real("ph_level"),
  dissolvedOxygen: real("dissolved_oxygen"),
  turbidity: real("turbidity"),
  status: text("status").notNull().default("completed"),
  imageUrl: text("image_url"),
  notes: text("notes"),
});

export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scanId: varchar("scan_id").references(() => droneScans.id),
  type: text("type").notNull(),
  severity: text("severity").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolved: boolean("resolved").default(false),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const cityMonitors = pgTable("city_monitors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cityName: text("city_name").notNull(),
  country: text("country").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  kelpDensity: real("kelp_density").notNull(),
  kelpHealthRating: text("kelp_health_rating").notNull(),
  trashLevel: real("trash_level").notNull(),
  trashRating: text("trash_rating").notNull(),
  overallScore: real("overall_score").notNull(),
  waterTemp: real("water_temp"),
  currentSpeed: real("current_speed"),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const kelpTrashTracks = pgTable("kelp_trash_tracks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cityId: varchar("city_id").references(() => cityMonitors.id),
  trackType: text("track_type").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  density: real("density").notNull(),
  movementDirection: real("movement_direction"),
  speed: real("speed"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const cleanupOperations = pgTable("cleanup_operations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cityId: varchar("city_id").references(() => cityMonitors.id),
  operationName: text("operation_name").notNull(),
  status: text("status").notNull().default("planned"),
  priority: text("priority").notNull().default("medium"),
  trashCollected: real("trash_collected").default(0),
  areaCleanedKm2: real("area_cleaned_km2").default(0),
  dronesDeployed: integer("drones_deployed").default(0),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date"),
  notes: text("notes"),
  fundingGoal: real("funding_goal").default(0),
  fundingRaised: real("funding_raised").default(0),
});

export const donations = pgTable("donations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  amount: real("amount").notNull(),
  purpose: text("purpose").notNull(),
  walletAddress: text("wallet_address"),
  txSignature: text("tx_signature"),
  status: text("status").notNull().default("pending"),
  donorName: text("donor_name"),
  cleanupId: varchar("cleanup_id").references(() => cleanupOperations.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const callLogs = pgTable("call_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cleanupId: varchar("cleanup_id").references(() => cleanupOperations.id),
  phoneNumber: text("phone_number").notNull(),
  status: text("status").notNull().default("initiated"),
  duration: integer("duration"),
  transcript: text("transcript"),
  agentId: text("agent_id"),
  conversationId: text("conversation_id"),
  result: text("result"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const schools = pgTable("schools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(),
  location: text("location"),
  adoptedCityId: varchar("adopted_city_id").references(() => cityMonitors.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const schoolActions = pgTable("school_actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").references(() => schools.id).notNull(),
  actionType: text("action_type").notNull(),
  cityId: varchar("city_id").references(() => cityMonitors.id),
  description: text("description").notNull(),
  evidenceUrl: text("evidence_url"),
  solanaTxSig: text("solana_tx_sig"),
  kgTrashRemoved: real("kg_trash_removed"),
  donationUsd: real("donation_usd"),
  status: text("status").notNull().default("PENDING"),
  pointsAwarded: real("points_awarded").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertDroneScanSchema = createInsertSchema(droneScans).omit({
  id: true,
  scanDate: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertCityMonitorSchema = createInsertSchema(cityMonitors).omit({
  id: true,
  lastUpdated: true,
});

export const insertKelpTrashTrackSchema = createInsertSchema(kelpTrashTracks).omit({
  id: true,
  timestamp: true,
});

export const insertCleanupOperationSchema = createInsertSchema(cleanupOperations).omit({
  id: true,
  startDate: true,
});

export const insertDonationSchema = createInsertSchema(donations).omit({
  id: true,
  createdAt: true,
});

export const insertCallLogSchema = createInsertSchema(callLogs).omit({
  id: true,
  createdAt: true,
});

export const cleanupJobs = pgTable("cleanup_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cleanupId: varchar("cleanup_id").references(() => cleanupOperations.id).notNull(),
  title: text("title").notNull(),
  roleType: text("role_type").notNull(),
  description: text("description").notNull(),
  hourlyRate: real("hourly_rate").notNull(),
  hoursPerShift: real("hours_per_shift").notNull().default(4),
  shiftsAvailable: integer("shifts_available").notNull().default(1),
  shiftsFilled: integer("shifts_filled").notNull().default(0),
  certifications: text("certifications").array().notNull().default(sql`'{}'::text[]`),
  requirements: text("requirements").array().notNull().default(sql`'{}'::text[]`),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const jobApplications = pgTable("job_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").references(() => cleanupJobs.id).notNull(),
  applicantName: text("applicant_name").notNull(),
  applicantEmail: text("applicant_email").notNull(),
  applicantPhone: text("applicant_phone"),
  experience: text("experience"),
  certifications: text("certifications").array().default(sql`'{}'::text[]`),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCleanupJobSchema = createInsertSchema(cleanupJobs).omit({
  id: true,
  createdAt: true,
});

export const insertJobApplicationSchema = createInsertSchema(jobApplications).omit({
  id: true,
  createdAt: true,
});

export const insertSchoolSchema = createInsertSchema(schools).omit({
  id: true,
  createdAt: true,
});

export const insertSchoolActionSchema = createInsertSchema(schoolActions).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertDroneScan = z.infer<typeof insertDroneScanSchema>;
export type DroneScan = typeof droneScans.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alerts.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type CityMonitor = typeof cityMonitors.$inferSelect;
export type InsertCityMonitor = z.infer<typeof insertCityMonitorSchema>;
export type KelpTrashTrack = typeof kelpTrashTracks.$inferSelect;
export type InsertKelpTrashTrack = z.infer<typeof insertKelpTrashTrackSchema>;
export type CleanupOperation = typeof cleanupOperations.$inferSelect;
export type InsertCleanupOperation = z.infer<typeof insertCleanupOperationSchema>;
export type Donation = typeof donations.$inferSelect;
export type InsertDonation = z.infer<typeof insertDonationSchema>;
export type CallLog = typeof callLogs.$inferSelect;
export type InsertCallLog = z.infer<typeof insertCallLogSchema>;
export type AppSetting = typeof appSettings.$inferSelect;
export type School = typeof schools.$inferSelect;
export type InsertSchool = z.infer<typeof insertSchoolSchema>;
export type SchoolAction = typeof schoolActions.$inferSelect;
export type InsertSchoolAction = z.infer<typeof insertSchoolActionSchema>;
export type CleanupJob = typeof cleanupJobs.$inferSelect;
export type InsertCleanupJob = z.infer<typeof insertCleanupJobSchema>;
export type JobApplication = typeof jobApplications.$inferSelect;
export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;
