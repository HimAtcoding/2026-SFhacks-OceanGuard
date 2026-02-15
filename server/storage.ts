import {
  type User, type InsertUser,
  type DroneScan, type InsertDroneScan,
  type Alert, type InsertAlert,
  type CityMonitor, type InsertCityMonitor,
  type KelpTrashTrack, type InsertKelpTrashTrack,
  type CleanupOperation, type InsertCleanupOperation,
  type Donation, type InsertDonation,
  type CallLog, type InsertCallLog,
  type AppSetting,
  type School, type InsertSchool,
  type SchoolAction, type InsertSchoolAction,
  users, droneScans, alerts, cityMonitors, kelpTrashTracks, cleanupOperations, donations, callLogs, appSettings,
  schools, schoolActions,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, gte, and, sum, sql } from "drizzle-orm";
import { syncToMongo } from "./mongodb";

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
  getDonations(): Promise<Donation[]>;
  getDonationsByCleanup(cleanupId: string): Promise<Donation[]>;
  createDonation(donation: InsertDonation): Promise<Donation>;
  updateDonation(id: string, data: Partial<InsertDonation>): Promise<Donation | undefined>;
  getCallLogs(cleanupId?: string): Promise<CallLog[]>;
  createCallLog(log: InsertCallLog): Promise<CallLog>;
  updateCallLog(id: string, data: Partial<InsertCallLog>): Promise<CallLog | undefined>;
  getSetting(key: string): Promise<AppSetting | undefined>;
  setSetting(key: string, value: string): Promise<AppSetting>;
  getSchools(): Promise<School[]>;
  getSchool(id: string): Promise<School | undefined>;
  createSchool(school: InsertSchool): Promise<School>;
  getSchoolActions(schoolId?: string, status?: string): Promise<SchoolAction[]>;
  createSchoolAction(action: InsertSchoolAction): Promise<SchoolAction>;
  reviewSchoolAction(id: string, status: "APPROVED" | "REJECTED"): Promise<SchoolAction | undefined>;
  getLeaderboard(period?: "weekly" | "alltime", cityId?: string, schoolType?: string): Promise<Array<{ school: School; totalPoints: number; weeklyPoints: number; actionCount: number }>>;
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
    syncToMongo("drone_scans", newScan);
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
    syncToMongo("alerts", newAlert);
    return newAlert;
  }

  async resolveAlert(id: string): Promise<Alert | undefined> {
    const [updated] = await db.update(alerts).set({ resolved: true }).where(eq(alerts.id, id)).returning();
    if (updated) syncToMongo("alerts", updated);
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
    syncToMongo("city_monitors", newCity);
    return newCity;
  }

  async updateCity(id: string, data: Partial<InsertCityMonitor>): Promise<CityMonitor | undefined> {
    const [updated] = await db.update(cityMonitors).set({ ...data, lastUpdated: new Date() } as any).where(eq(cityMonitors.id, id)).returning();
    if (updated) syncToMongo("city_monitors", updated);
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
    syncToMongo("kelp_trash_tracks", newTrack);
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
    syncToMongo("cleanup_operations", newOp);
    return newOp;
  }

  async updateCleanupOp(id: string, data: Partial<InsertCleanupOperation>): Promise<CleanupOperation | undefined> {
    const [updated] = await db.update(cleanupOperations).set(data as any).where(eq(cleanupOperations.id, id)).returning();
    if (updated) syncToMongo("cleanup_operations", updated);
    return updated;
  }

  async getDonations(): Promise<Donation[]> {
    return db.select().from(donations).orderBy(desc(donations.createdAt));
  }

  async getDonationsByCleanup(cleanupId: string): Promise<Donation[]> {
    return db.select().from(donations).where(eq(donations.cleanupId, cleanupId)).orderBy(desc(donations.createdAt));
  }

  async createDonation(donation: InsertDonation): Promise<Donation> {
    const [newDonation] = await db.insert(donations).values(donation).returning();
    syncToMongo("donations", newDonation);
    if (donation.cleanupId && donation.status === "completed") {
      const ops = await db.select().from(cleanupOperations).where(eq(cleanupOperations.id, donation.cleanupId));
      if (ops[0]) {
        const newRaised = (ops[0].fundingRaised || 0) + donation.amount;
        await db.update(cleanupOperations).set({ fundingRaised: newRaised } as any).where(eq(cleanupOperations.id, donation.cleanupId));
      }
    }
    return newDonation;
  }

  async updateDonation(id: string, data: Partial<InsertDonation>): Promise<Donation | undefined> {
    const [updated] = await db.update(donations).set(data as any).where(eq(donations.id, id)).returning();
    if (updated) syncToMongo("donations", updated);
    return updated;
  }

  async getCallLogs(cleanupId?: string): Promise<CallLog[]> {
    if (cleanupId) {
      return db.select().from(callLogs).where(eq(callLogs.cleanupId, cleanupId)).orderBy(desc(callLogs.createdAt));
    }
    return db.select().from(callLogs).orderBy(desc(callLogs.createdAt));
  }

  async createCallLog(log: InsertCallLog): Promise<CallLog> {
    const [newLog] = await db.insert(callLogs).values(log).returning();
    syncToMongo("call_logs", newLog);
    return newLog;
  }

  async updateCallLog(id: string, data: Partial<InsertCallLog>): Promise<CallLog | undefined> {
    const [updated] = await db.update(callLogs).set(data as any).where(eq(callLogs.id, id)).returning();
    if (updated) syncToMongo("call_logs", updated);
    return updated;
  }

  async getSetting(key: string): Promise<AppSetting | undefined> {
    const [setting] = await db.select().from(appSettings).where(eq(appSettings.key, key));
    return setting;
  }

  async setSetting(key: string, value: string): Promise<AppSetting> {
    const existing = await this.getSetting(key);
    if (existing) {
      const [updated] = await db.update(appSettings).set({ value }).where(eq(appSettings.key, key)).returning();
      return updated;
    }
    const [created] = await db.insert(appSettings).values({ key, value }).returning();
    return created;
  }

  async getSchools(): Promise<School[]> {
    return db.select().from(schools).orderBy(desc(schools.createdAt));
  }

  async getSchool(id: string): Promise<School | undefined> {
    const [school] = await db.select().from(schools).where(eq(schools.id, id));
    return school;
  }

  async createSchool(school: InsertSchool): Promise<School> {
    const [newSchool] = await db.insert(schools).values(school).returning();
    return newSchool;
  }

  async getSchoolActions(schoolId?: string, status?: string): Promise<SchoolAction[]> {
    if (schoolId && status) {
      return db.select().from(schoolActions)
        .where(and(eq(schoolActions.schoolId, schoolId), eq(schoolActions.status, status)))
        .orderBy(desc(schoolActions.createdAt));
    }
    if (schoolId) {
      return db.select().from(schoolActions)
        .where(eq(schoolActions.schoolId, schoolId))
        .orderBy(desc(schoolActions.createdAt));
    }
    if (status) {
      return db.select().from(schoolActions)
        .where(eq(schoolActions.status, status))
        .orderBy(desc(schoolActions.createdAt));
    }
    return db.select().from(schoolActions).orderBy(desc(schoolActions.createdAt));
  }

  async createSchoolAction(action: InsertSchoolAction): Promise<SchoolAction> {
    const [newAction] = await db.insert(schoolActions).values(action).returning();
    return newAction;
  }

  async reviewSchoolAction(id: string, status: "APPROVED" | "REJECTED"): Promise<SchoolAction | undefined> {
    const [updated] = await db.update(schoolActions)
      .set({ status, reviewedAt: new Date() } as any)
      .where(eq(schoolActions.id, id))
      .returning();
    return updated;
  }

  async getLeaderboard(
    period: "weekly" | "alltime" = "alltime",
    cityId?: string,
    schoolType?: string
  ): Promise<Array<{ school: School; totalPoints: number; weeklyPoints: number; actionCount: number }>> {
    const allSchools = await this.getSchools();
    const approvedActions = await this.getSchoolActions(undefined, "APPROVED");
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const leaderboard = allSchools
      .filter(s => {
        if (cityId && s.adoptedCityId !== cityId) return false;
        if (schoolType && s.type !== schoolType) return false;
        return true;
      })
      .map(school => {
        const schoolApproved = approvedActions.filter(a => a.schoolId === school.id);
        const totalPoints = schoolApproved.reduce((sum, a) => sum + (a.pointsAwarded || 0), 0);
        const weeklyPoints = schoolApproved
          .filter(a => new Date(a.createdAt) >= oneWeekAgo)
          .reduce((sum, a) => sum + (a.pointsAwarded || 0), 0);
        return { school, totalPoints, weeklyPoints, actionCount: schoolApproved.length };
      });

    leaderboard.sort((a, b) => {
      if (period === "weekly") return b.weeklyPoints - a.weeklyPoints;
      return b.totalPoints - a.totalPoints;
    });

    return leaderboard;
  }
}

export const storage = new DatabaseStorage();
