import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertDroneScan = z.infer<typeof insertDroneScanSchema>;
export type DroneScan = typeof droneScans.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alerts.$inferSelect;
