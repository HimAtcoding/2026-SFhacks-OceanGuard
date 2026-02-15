import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDroneScanSchema, insertAlertSchema, insertCleanupOperationSchema, insertDonationSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
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
    res.status(201).json(alert);
  });

  app.patch("/api/alerts/:id/resolve", async (req, res) => {
    const alert = await storage.resolveAlert(req.params.id);
    if (!alert) return res.status(404).json({ message: "Alert not found" });
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
    res.status(201).json(op);
  });

  app.patch("/api/cleanup/:id", async (req, res) => {
    const op = await storage.updateCleanupOp(req.params.id, req.body);
    if (!op) return res.status(404).json({ message: "Operation not found" });
    res.json(op);
  });

  app.get("/api/donations", async (_req, res) => {
    const allDonations = await storage.getDonations();
    res.json(allDonations);
  });

  app.post("/api/donations", async (req, res) => {
    const parsed = insertDonationSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.issues });
    const donation = await storage.createDonation(parsed.data);
    res.status(201).json(donation);
  });

  app.patch("/api/donations/:id", async (req, res) => {
    const donation = await storage.updateDonation(req.params.id, req.body);
    if (!donation) return res.status(404).json({ message: "Donation not found" });
    res.json(donation);
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

  return httpServer;
}
