import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDroneScanSchema, insertAlertSchema, insertCleanupOperationSchema } from "@shared/schema";

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

  return httpServer;
}
