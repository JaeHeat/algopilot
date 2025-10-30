import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertBotSchema, insertSubscriptionSchema, insertExchangeConnectionSchema, updateSubscriptionSettingsSchema, insertCreatorPostSchema, insertPostCommentSchema, insertPostReactionSchema } from "@shared/schema";
import { z } from "zod";

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

  app.get("/api/bots/:botId/posts", async (req, res) => {
    try {
      const posts = await storage.getBotPosts(req.params.botId);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.post("/api/bots/:botId/posts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bot = await storage.getBotById(req.params.botId);
      
      if (!bot) {
        return res.status(404).json({ message: "Bot not found" });
      }
      
      if (bot.creatorId !== userId) {
        return res.status(403).json({ message: "Forbidden: Only bot creators can post updates" });
      }
      
      const validatedPost = insertCreatorPostSchema.parse({
        ...req.body,
        botId: req.params.botId,
        creatorId: userId,
      });
      
      const post = await storage.createPost(validatedPost);
      res.json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(400).json({ message: "Failed to create post" });
    }
  });

  app.delete("/api/posts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const post = await storage.getPostById(req.params.id);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      if (post.creatorId !== userId) {
        return res.status(403).json({ message: "Forbidden: You can only delete your own posts" });
      }
      
      await storage.deletePost(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  app.get("/api/posts/:postId/comments", async (req, res) => {
    try {
      const comments = await storage.getPostComments(req.params.postId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/posts/:postId/comments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedComment = insertPostCommentSchema.parse({
        ...req.body,
        postId: req.params.postId,
        userId,
      });
      
      const comment = await storage.createComment(validatedComment);
      res.json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(400).json({ message: "Failed to create comment" });
    }
  });

  app.delete("/api/comments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const comment = await storage.getCommentById(req.params.id);
      
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      if (comment.userId !== userId) {
        return res.status(403).json({ message: "Forbidden: You can only delete your own comments" });
      }
      
      await storage.deleteComment(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  app.get("/api/posts/:postId/reactions", async (req, res) => {
    try {
      const reactions = await storage.getPostReactions(req.params.postId);
      res.json(reactions);
    } catch (error) {
      console.error("Error fetching reactions:", error);
      res.status(500).json({ message: "Failed to fetch reactions" });
    }
  });

  app.post("/api/posts/:postId/reactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedReaction = insertPostReactionSchema.parse({
        postId: req.params.postId,
        userId,
        reactionType: req.body.reactionType,
      });
      
      const result = await storage.toggleReaction(validatedReaction);
      res.json(result);
    } catch (error) {
      console.error("Error toggling reaction:", error);
      res.status(400).json({ message: "Failed to toggle reaction" });
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
      const validatedSubscription = insertSubscriptionSchema.parse({ 
        ...req.body, 
        userId,
        isPaused: true,
        pauseReason: "Setup required - Configure your subscription settings before going live",
        riskPercentage: 1,
        capitalAllocated: "1000",
        capitalAllocatedType: "amount",
        maxDrawdown: "10",
        notificationPrefs: {
          newTrade: true,
          drawdownBreach: true,
          weeklySummary: true,
          monthlySummary: true,
        }
      });
      const subscription = await storage.createSubscription(validatedSubscription);
      res.json(subscription);
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(400).json({ message: "Failed to create subscription" });
    }
  });

  app.patch("/api/subscriptions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscription = await storage.getSubscriptionById(req.params.id);
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      if (subscription.userId !== userId) {
        return res.status(403).json({ message: "Forbidden: You can only modify your own subscriptions" });
      }
      
      const validatedSettings = updateSubscriptionSettingsSchema.parse(req.body);
      const updated = await storage.updateSubscriptionSettings(req.params.id, validatedSettings);
      
      await storage.createSubscriptionEvent({
        subscriptionId: req.params.id,
        eventType: "settings_updated",
        eventData: validatedSettings,
      });
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating subscription settings:", error);
      res.status(400).json({ message: "Failed to update subscription settings" });
    }
  });

  app.post("/api/subscriptions/:id/pause", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscription = await storage.getSubscriptionById(req.params.id);
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      if (subscription.userId !== userId) {
        return res.status(403).json({ message: "Forbidden: You can only pause your own subscriptions" });
      }
      
      const { reason } = z.object({ reason: z.string().optional() }).parse(req.body);
      const paused = await storage.pauseSubscription(req.params.id, reason || "User paused");
      
      await storage.createSubscriptionEvent({
        subscriptionId: req.params.id,
        eventType: "paused",
        eventData: { reason: reason || "User paused" },
      });
      
      res.json(paused);
    } catch (error) {
      console.error("Error pausing subscription:", error);
      res.status(500).json({ message: "Failed to pause subscription" });
    }
  });

  app.post("/api/subscriptions/:id/resume", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscription = await storage.getSubscriptionById(req.params.id);
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      if (subscription.userId !== userId) {
        return res.status(403).json({ message: "Forbidden: You can only resume your own subscriptions" });
      }

      // Validate capital allocation is configured
      if (!subscription.capitalAllocated || parseFloat(subscription.capitalAllocated) === 0) {
        return res.status(400).json({ 
          message: "Settings Required",
          error: "Please configure your capital allocation before activating this bot" 
        });
      }

      // Validate sufficient capital is available
      const availableBalance = await storage.getUserTotalAvailableBalance(userId);
      const allSubscriptions = await storage.getUserSubscriptions(userId);
      const otherActiveSubscriptions = allSubscriptions.filter(
        sub => sub.id !== subscription.id && !sub.isPaused
      );

      let totalAllocated = 0;
      for (const sub of otherActiveSubscriptions) {
        if (sub.capitalAllocatedType === 'amount') {
          totalAllocated += parseFloat(sub.capitalAllocated || '0');
        } else {
          totalAllocated += availableBalance * (parseFloat(sub.capitalAllocated || '0') / 100);
        }
      }

      let requiredCapital = 0;
      if (subscription.capitalAllocatedType === 'amount') {
        requiredCapital = parseFloat(subscription.capitalAllocated || '0');
      } else {
        requiredCapital = availableBalance * (parseFloat(subscription.capitalAllocated || '0') / 100);
      }

      const remainingCapital = availableBalance - totalAllocated;

      if (requiredCapital > remainingCapital) {
        return res.status(400).json({ 
          message: "Insufficient Capital",
          error: `You need $${requiredCapital.toFixed(2)} but only have $${remainingCapital.toFixed(2)} available. Please adjust your allocation or add more funds.`,
          availableBalance: remainingCapital,
          requiredCapital
        });
      }
      
      const resumed = await storage.resumeSubscription(req.params.id);
      
      await storage.createSubscriptionEvent({
        subscriptionId: req.params.id,
        eventType: "resumed",
        eventData: {},
      });
      
      res.json(resumed);
    } catch (error) {
      console.error("Error resuming subscription:", error);
      res.status(500).json({ message: "Failed to resume subscription" });
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
      
      await storage.createSubscriptionEvent({
        subscriptionId: req.params.id,
        eventType: "cancelled",
        eventData: {},
      });
      
      res.json(cancelled);
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });

  app.get("/api/bots/:id/trades", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const trades = await storage.getBotTradeLogs(req.params.id, limit);
      res.json(trades);
    } catch (error) {
      console.error("Error fetching bot trades:", error);
      res.status(500).json({ message: "Failed to fetch bot trades" });
    }
  });

  app.get("/api/bots/:id/performance-history", async (req, res) => {
    try {
      const bucket = req.query.bucket as string | undefined;
      const history = await storage.getBotPerformanceHistory(req.params.id, bucket);
      res.json(history);
    } catch (error) {
      console.error("Error fetching bot performance history:", error);
      res.status(500).json({ message: "Failed to fetch bot performance history" });
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
      console.log("Creating exchange connection with data:", { ...req.body, userId });
      const validatedConnection = insertExchangeConnectionSchema.parse({ ...req.body, userId });
      const connection = await storage.createExchangeConnection(validatedConnection);
      const sanitized = {
        id: connection.id,
        exchange: connection.exchange,
        isActive: connection.isActive,
        createdAt: connection.createdAt,
      };
      res.json(sanitized);
    } catch (error) {
      console.error("Error creating exchange connection:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      res.status(400).json({ message: "Failed to create connection", error: error instanceof Error ? error.message : String(error) });
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

  app.get("/api/user/available-balance", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const totalBalance = await storage.getUserTotalAvailableBalance(userId);
      res.json({ totalBalance });
    } catch (error) {
      console.error("Error fetching available balance:", error);
      res.status(500).json({ message: "Failed to fetch available balance" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
