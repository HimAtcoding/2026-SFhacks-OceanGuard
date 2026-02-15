import {
  type User, type InsertUser,
  type DroneScan, type InsertDroneScan,
  type Alert, type InsertAlert,
  type CityMonitor, type InsertCityMonitor,
  type KelpTrashTrack, type InsertKelpTrashTrack,
  type CleanupOperation, type InsertCleanupOperation,
  users, droneScans, alerts, cityMonitors, kelpTrashTracks, cleanupOperations,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, gte, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getScans(): Promise<DroneScan[]>;
  getScansSince(since: Date): Promise<DroneScan[]>;
  getScan(id: string): Promise<DroneScan | undefined>;
  createScan(scan: InsertDroneScan): Promise<DroneScan>;
  getAlerts(): Promise<Alert[]>;
  getAlertsByScan(scanId: string): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  resolveAlert(id: string): Promise<Alert | undefined>;
  getCities(): Promise<CityMonitor[]>;
  getCity(id: string): Promise<CityMonitor | undefined>;
  createCity(city: InsertCityMonitor): Promise<CityMonitor>;
  updateCity(id: string, data: Partial<InsertCityMonitor>): Promise<CityMonitor | undefined>;
  getTracks(cityId?: string): Promise<KelpTrashTrack[]>;
  getTracksSince(since: Date, cityId?: string): Promise<KelpTrashTrack[]>;
  createTrack(track: InsertKelpTrashTrack): Promise<KelpTrashTrack>;
  getCleanupOps(): Promise<CleanupOperation[]>;
  getCleanupOpsByCity(cityId: string): Promise<CleanupOperation[]>;
  createCleanupOp(op: InsertCleanupOperation): Promise<CleanupOperation>;
  updateCleanupOp(id: string, data: Partial<InsertCleanupOperation>): Promise<CleanupOperation | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getScans(): Promise<DroneScan[]> {
    return db.select().from(droneScans).orderBy(desc(droneScans.scanDate));
  }

  async getScansSince(since: Date): Promise<DroneScan[]> {
    return db.select().from(droneScans).where(gte(droneScans.scanDate, since)).orderBy(desc(droneScans.scanDate));
  }

  async getScan(id: string): Promise<DroneScan | undefined> {
    const [scan] = await db.select().from(droneScans).where(eq(droneScans.id, id));
    return scan;
  }

  async createScan(scan: InsertDroneScan): Promise<DroneScan> {
    const [newScan] = await db.insert(droneScans).values(scan).returning();
    return newScan;
  }

  async getAlerts(): Promise<Alert[]> {
    return db.select().from(alerts).orderBy(desc(alerts.createdAt));
  }

  async getAlertsByScan(scanId: string): Promise<Alert[]> {
    return db.select().from(alerts).where(eq(alerts.scanId, scanId));
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const [newAlert] = await db.insert(alerts).values(alert).returning();
    return newAlert;
  }

  async resolveAlert(id: string): Promise<Alert | undefined> {
    const [updated] = await db.update(alerts).set({ resolved: true }).where(eq(alerts.id, id)).returning();
    return updated;
  }

  async getCities(): Promise<CityMonitor[]> {
    return db.select().from(cityMonitors).orderBy(desc(cityMonitors.overallScore));
  }

  async getCity(id: string): Promise<CityMonitor | undefined> {
    const [city] = await db.select().from(cityMonitors).where(eq(cityMonitors.id, id));
    return city;
  }

  async createCity(city: InsertCityMonitor): Promise<CityMonitor> {
    const [newCity] = await db.insert(cityMonitors).values(city).returning();
    return newCity;
  }

  async updateCity(id: string, data: Partial<InsertCityMonitor>): Promise<CityMonitor | undefined> {
    const [updated] = await db.update(cityMonitors).set({ ...data, lastUpdated: new Date() } as any).where(eq(cityMonitors.id, id)).returning();
    return updated;
  }

  async getTracks(cityId?: string): Promise<KelpTrashTrack[]> {
    if (cityId) {
      return db.select().from(kelpTrashTracks).where(eq(kelpTrashTracks.cityId, cityId)).orderBy(desc(kelpTrashTracks.timestamp));
    }
    return db.select().from(kelpTrashTracks).orderBy(desc(kelpTrashTracks.timestamp)).limit(500);
  }

  async getTracksSince(since: Date, cityId?: string): Promise<KelpTrashTrack[]> {
    if (cityId) {
      return db.select().from(kelpTrashTracks).where(and(gte(kelpTrashTracks.timestamp, since), eq(kelpTrashTracks.cityId, cityId))).orderBy(desc(kelpTrashTracks.timestamp));
    }
    return db.select().from(kelpTrashTracks).where(gte(kelpTrashTracks.timestamp, since)).orderBy(desc(kelpTrashTracks.timestamp)).limit(1000);
  }

  async createTrack(track: InsertKelpTrashTrack): Promise<KelpTrashTrack> {
    const [newTrack] = await db.insert(kelpTrashTracks).values(track).returning();
    return newTrack;
  }

  async getCleanupOps(): Promise<CleanupOperation[]> {
    return db.select().from(cleanupOperations).orderBy(desc(cleanupOperations.startDate));
  }

  async getCleanupOpsByCity(cityId: string): Promise<CleanupOperation[]> {
    return db.select().from(cleanupOperations).where(eq(cleanupOperations.cityId, cityId)).orderBy(desc(cleanupOperations.startDate));
  }

  async createCleanupOp(op: InsertCleanupOperation): Promise<CleanupOperation> {
    const [newOp] = await db.insert(cleanupOperations).values(op).returning();
    return newOp;
  }

  async updateCleanupOp(id: string, data: Partial<InsertCleanupOperation>): Promise<CleanupOperation | undefined> {
    const [updated] = await db.update(cleanupOperations).set(data as any).where(eq(cleanupOperations.id, id)).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
