import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertBotSchema, insertSubscriptionSchema, insertExchangeConnectionSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/bots", async (req, res) => {
    try {
      const bots = await storage.getAllBots();
      res.json(bots);
    } catch (error) {
      console.error("Error fetching bots:", error);
      res.status(500).json({ message: "Failed to fetch bots" });
    }
  });

  app.get("/api/bots/:id", async (req, res) => {
    try {
      const bot = await storage.getBotById(req.params.id);
      if (!bot) {
        return res.status(404).json({ message: "Bot not found" });
      }
      const performance = await storage.getBotPerformance(req.params.id);
      res.json({ ...bot, performance });
    } catch (error) {
      console.error("Error fetching bot:", error);
      res.status(500).json({ message: "Failed to fetch bot" });
    }
  });

  app.post("/api/bots", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedBot = insertBotSchema.parse({ ...req.body, creatorId: userId });
      const bot = await storage.createBot(validatedBot);
      res.json(bot);
    } catch (error) {
      console.error("Error creating bot:", error);
      res.status(400).json({ message: "Failed to create bot" });
    }
  });

  app.get("/api/subscriptions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscriptions = await storage.getUserSubscriptions(userId);
      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  app.post("/api/subscriptions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedSubscription = insertSubscriptionSchema.parse({ ...req.body, userId });
      const subscription = await storage.createSubscription(validatedSubscription);
      res.json(subscription);
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(400).json({ message: "Failed to create subscription" });
    }
  });

  app.delete("/api/subscriptions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscription = await storage.getSubscriptionById(req.params.id);
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      if (subscription.userId !== userId) {
        return res.status(403).json({ message: "Forbidden: You can only cancel your own subscriptions" });
      }
      
      const cancelled = await storage.cancelSubscription(req.params.id);
      res.json(cancelled);
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });

  app.get("/api/exchanges", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const connections = await storage.getUserExchangeConnections(userId);
      const sanitized = connections.map(c => ({
        id: c.id,
        exchange: c.exchange,
        isActive: c.isActive,
        createdAt: c.createdAt,
      }));
      res.json(sanitized);
    } catch (error) {
      console.error("Error fetching exchange connections:", error);
      res.status(500).json({ message: "Failed to fetch connections" });
    }
  });

  app.post("/api/exchanges", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedConnection = insertExchangeConnectionSchema.parse({ ...req.body, userId });
      const connection = await storage.createExchangeConnection(validatedConnection);
      res.json(connection);
    } catch (error) {
      console.error("Error creating exchange connection:", error);
      res.status(400).json({ message: "Failed to create connection" });
    }
  });

  app.delete("/api/exchanges/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const connection = await storage.getExchangeConnectionById(req.params.id);
      
      if (!connection) {
        return res.status(404).json({ message: "Exchange connection not found" });
      }
      
      if (connection.userId !== userId) {
        return res.status(403).json({ message: "Forbidden: You can only delete your own exchange connections" });
      }
      
      await storage.deleteExchangeConnection(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting exchange connection:", error);
      res.status(500).json({ message: "Failed to delete connection" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
