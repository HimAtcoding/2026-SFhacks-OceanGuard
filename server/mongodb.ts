import { MongoClient, type Db, type Collection } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectMongo(): Promise<Db | null> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log("MongoDB: No MONGODB_URI set, skipping MongoDB sync");
    return null;
  }

  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db("oceanguard");
    console.log("MongoDB: Connected successfully to Atlas");
    return db;
  } catch (err: any) {
    console.error("MongoDB connection failed:", err.message);
    return null;
  }
}

export function getMongoDb(): Db | null {
  return db;
}

function getCollection(name: string): Collection | null {
  if (!db) return null;
  return db.collection(name);
}

export async function syncToMongo(collectionName: string, doc: any): Promise<void> {
  try {
    const col = getCollection(collectionName);
    if (!col) return;
    const { id, ...rest } = doc;
    await col.updateOne(
      { _pgId: id },
      { $set: { ...rest, _pgId: id, _syncedAt: new Date() } },
      { upsert: true }
    );
  } catch (err: any) {
    console.error(`MongoDB sync error (${collectionName}):`, err.message);
  }
}

export async function syncBatchToMongo(collectionName: string, docs: any[]): Promise<void> {
  try {
    const col = getCollection(collectionName);
    if (!col || docs.length === 0) return;
    const operations = docs.map(doc => {
      const { id, ...rest } = doc;
      return {
        updateOne: {
          filter: { _pgId: id },
          update: { $set: { ...rest, _pgId: id, _syncedAt: new Date() } },
          upsert: true,
        },
      };
    });
    await col.bulkWrite(operations);
  } catch (err: any) {
    console.error(`MongoDB batch sync error (${collectionName}):`, err.message);
  }
}

export async function getMongoStats(): Promise<any> {
  if (!db) return { connected: false };
  try {
    const collections = await db.listCollections().toArray();
    const stats: any = { connected: true, collections: {} };
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      stats.collections[col.name] = count;
    }
    return stats;
  } catch (err: any) {
    return { connected: false, error: err.message };
  }
}

export async function runInitialSync(storage: any): Promise<void> {
  if (!db) return;
  console.log("MongoDB: Running initial data sync...");
  try {
    const [scans, cities, tracks, cleanups, donations, alerts] = await Promise.all([
      storage.getScans(),
      storage.getCities(),
      storage.getTracks(),
      storage.getCleanupOps(),
      storage.getDonations(),
      storage.getAlerts(),
    ]);
    await Promise.all([
      syncBatchToMongo("drone_scans", scans),
      syncBatchToMongo("city_monitors", cities),
      syncBatchToMongo("kelp_trash_tracks", tracks),
      syncBatchToMongo("cleanup_operations", cleanups),
      syncBatchToMongo("donations", donations),
      syncBatchToMongo("alerts", alerts),
    ]);
    console.log(`MongoDB: Synced ${scans.length} scans, ${cities.length} cities, ${tracks.length} tracks, ${cleanups.length} cleanups, ${donations.length} donations, ${alerts.length} alerts`);
  } catch (err: any) {
    console.error("MongoDB initial sync error:", err.message);
  }
}
