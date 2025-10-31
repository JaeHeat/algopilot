import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertBotSchema, insertSubscriptionSchema, insertExchangeConnectionSchema, updateSubscriptionSettingsSchema, insertCreatorPostSchema, insertPostCommentSchema, insertPostReactionSchema, insertCreatorApplicationSchema } from "@shared/schema";
import { z } from "zod";
import Stripe from "stripe";
import { randomBytes } from "crypto";
import { notifyTradeExecuted, notifyDrawdownBreach } from "./services/notifications";

const webhookPayloadSchema = z.object({
  symbol: z.string().min(1).max(20).regex(/^[A-Z0-9.]+$/, "Symbol must be alphanumeric with optional dots"),
  action: z.string().optional(),
  side: z.string().optional(),
  price: z.string().or(z.number()).refine(
    (val) => {
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return !isNaN(num) && num > 0 && num < 10000000;
    },
    { message: "Price must be a valid positive number less than 10M" }
  ),
  time: z.string().optional(),
}).refine(
  (data) => data.action || data.side,
  { message: "Either 'action' or 'side' field is required" }
);

const onboardingProgressSchema = z.object({
  welcomeTourCompleted: z.boolean().optional(),
  marketplaceBrowsed: z.boolean().optional(),
  botSubscribed: z.boolean().optional(),
  settingsConfigured: z.boolean().optional(),
  dashboardExplored: z.boolean().optional(),
});

function generateWebhookSecret(): string {
  return randomBytes(32).toString('hex');
}

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

  app.get("/api/onboarding", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let onboarding = await storage.getUserOnboarding(userId);
      
      if (!onboarding) {
        onboarding = await storage.createUserOnboarding(userId);
      }
      
      res.json(onboarding);
    } catch (error) {
      console.error("Error fetching onboarding:", error);
      res.status(500).json({ message: "Failed to fetch onboarding status" });
    }
  });

  app.post("/api/onboarding/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validationResult = onboardingProgressSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid onboarding progress data",
          errors: validationResult.error.errors 
        });
      }
      
      let onboarding = await storage.getUserOnboarding(userId);
      if (!onboarding) {
        onboarding = await storage.createUserOnboarding(userId);
      }
      
      const updated = await storage.updateOnboardingProgress(userId, validationResult.data);
      res.json(updated);
    } catch (error) {
      console.error("Error updating onboarding progress:", error);
      res.status(500).json({ message: "Failed to update onboarding progress" });
    }
  });

  app.post("/api/onboarding/complete", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const completed = await storage.completeOnboarding(userId);
      res.json(completed);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ message: "Failed to complete onboarding" });
    }
  });

  app.get("/api/marketplace/featured", async (req, res) => {
    try {
      const featuredPlacement = await storage.getCurrentFeaturedPlacement();
      res.json(featuredPlacement || null);
    } catch (error) {
      console.error("Error fetching featured placement:", error);
      res.status(500).json({ message: "Failed to fetch featured placement" });
    }
  });

  app.get("/api/marketplace/top-performers", async (req, res) => {
    try {
      const topPerformers = await storage.getTopPerformersLast7Days(5);
      res.json(topPerformers);
    } catch (error) {
      console.error("Error fetching top performers:", error);
      res.status(500).json({ message: "Failed to fetch top performers" });
    }
  });

  app.post("/api/creator-applications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const existingApplication = await storage.getCreatorApplication(userId);
      if (existingApplication) {
        return res.status(400).json({ message: "You have already submitted a creator application" });
      }
      
      const validationResult = insertCreatorApplicationSchema.safeParse({
        ...req.body,
        userId,
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid application data",
          errors: validationResult.error.errors 
        });
      }
      
      const application = await storage.createCreatorApplication(validationResult.data);
      res.json(application);
    } catch (error) {
      console.error("Error creating creator application:", error);
      res.status(500).json({ message: "Failed to create creator application" });
    }
  });

  app.get("/api/creator-applications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const application = await storage.getCreatorApplication(userId);
      res.json(application || null);
    } catch (error) {
      console.error("Error fetching creator application:", error);
      res.status(500).json({ message: "Failed to fetch creator application" });
    }
  });

  app.patch("/api/creator-applications/:userId/status", isAuthenticated, async (req: any, res) => {
    try {
      const adminUserId = req.user.claims.sub;
      
      const adminUser = await storage.getUser(adminUserId);
      if (!adminUser || adminUser.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }
      
      const { userId } = req.params;
      const { status, rejectionReason } = req.body;
      
      if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
      }
      
      if (status === 'rejected' && !rejectionReason) {
        return res.status(400).json({ message: "Rejection reason is required when rejecting an application" });
      }
      
      const sanitizedReason = rejectionReason ? rejectionReason.substring(0, 500).trim() : undefined;
      
      const updatedApplication = await storage.updateCreatorApplicationStatus(
        userId,
        status,
        sanitizedReason,
        adminUserId
      );
      
      if (!updatedApplication) {
        return res.status(404).json({ message: "Creator application not found" });
      }
      
      res.json(updatedApplication);
    } catch (error) {
      console.error("Error updating creator application status:", error);
      res.status(500).json({ message: "Failed to update creator application status" });
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

  app.get("/api/creator/bots", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const allBots = await storage.getAllBots();
      const creatorBots = allBots.filter(bot => bot.creatorId === userId);
      
      const botsWithWebhooks = await Promise.all(
        creatorBots.map(async (bot) => {
          const webhook = await storage.getWebhookByBotId(bot.id);
          const recentEvents = webhook ? await storage.getRecentWebhookEvents(bot.id, 10) : [];
          
          return {
            ...bot,
            webhook: webhook ? {
              id: webhook.id,
              secret: webhook.secret,
              status: webhook.status,
              lastReceivedAt: webhook.lastReceivedAt,
              failureCount: webhook.failureCount,
              webhookUrl: `${req.protocol}://${req.get('host')}/api/webhooks/${bot.id}/${webhook.secret}`,
            } : null,
            recentEvents,
          };
        })
      );
      
      res.json(botsWithWebhooks);
    } catch (error) {
      console.error("Error fetching creator bots:", error);
      res.status(500).json({ message: "Failed to fetch creator bots" });
    }
  });

  app.post("/api/creator/bots", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedBot = insertBotSchema.parse({ ...req.body, creatorId: userId });
      const bot = await storage.createBot(validatedBot);
      
      const secret = generateWebhookSecret();
      const webhook = await storage.createBotWebhook({
        botId: bot.id,
        secret,
        status: 'active',
      });
      
      const webhookUrl = `${req.protocol}://${req.get('host')}/api/webhooks/${bot.id}/${webhook.secret}`;
      
      res.json({
        ...bot,
        webhook: {
          id: webhook.id,
          secret: webhook.secret,
          status: webhook.status,
          webhookUrl,
        },
      });
    } catch (error) {
      console.error("Error creating bot:", error);
      res.status(400).json({ message: "Failed to create bot" });
    }
  });

  app.patch("/api/creator/bots/:id/regenerate-webhook", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bot = await storage.getBotById(req.params.id);
      
      if (!bot) {
        return res.status(404).json({ message: "Bot not found" });
      }
      
      if (bot.creatorId !== userId) {
        return res.status(403).json({ message: "Forbidden: Only bot creators can regenerate webhooks" });
      }
      
      const newSecret = generateWebhookSecret();
      const webhook = await storage.regenerateWebhookSecret(req.params.id, newSecret);
      
      if (!webhook) {
        return res.status(404).json({ message: "Webhook not found for this bot" });
      }
      
      const webhookUrl = `${req.protocol}://${req.get('host')}/api/webhooks/${req.params.id}/${webhook.secret}`;
      
      res.json({
        secret: webhook.secret,
        webhookUrl,
      });
    } catch (error) {
      console.error("Error regenerating webhook:", error);
      res.status(500).json({ message: "Failed to regenerate webhook" });
    }
  });

  app.get("/api/marketplace/featured", async (req, res) => {
    try {
      const featured = await storage.getCurrentFeaturedPlacement();
      res.json(featured || null);
    } catch (error) {
      console.error("Error fetching featured placement:", error);
      res.status(500).json({ message: "Failed to fetch featured placement" });
    }
  });

  app.get("/api/marketplace/top-performers", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
      const topPerformers = await storage.getTopPerformersLast7Days(limit);
      res.json(topPerformers);
    } catch (error) {
      console.error("Error fetching top performers:", error);
      res.status(500).json({ message: "Failed to fetch top performers" });
    }
  });

  app.post("/api/creator/apply", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const existingApplication = await storage.getCreatorApplication(userId);
      if (existingApplication) {
        return res.status(400).json({ 
          message: "You have already submitted a creator application",
          application: existingApplication
        });
      }
      
      const validatedApplication = insertCreatorApplicationSchema.parse({
        ...req.body,
        userId,
      });
      
      const application = await storage.createCreatorApplication(validatedApplication);
      res.json(application);
    } catch (error) {
      console.error("Error creating creator application:", error);
      res.status(400).json({ message: "Failed to create creator application" });
    }
  });

  app.get("/api/creator/application/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const application = await storage.getCreatorApplication(userId);
      res.json(application || null);
    } catch (error) {
      console.error("Error fetching application status:", error);
      res.status(500).json({ message: "Failed to fetch application status" });
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

  app.post("/api/create-subscription-payment", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { botId } = z.object({ botId: z.string() }).parse(req.body);
      
      const bot = await storage.getBotById(botId);
      if (!bot) {
        return res.status(404).json({ message: "Bot not found" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      let stripeCustomerId = user.stripeCustomerId;
      
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          metadata: {
            userId: user.id,
          },
        });
        stripeCustomerId = customer.id;
        await storage.updateUserStripeCustomerId(userId, stripeCustomerId);
      }
      
      const priceAmount = Math.round(parseFloat(bot.monthlyPrice) * 100);
      
      // Handle free bots (no payment required)
      if (priceAmount === 0) {
        // Create subscription directly without payment
        const newSubscription = await storage.createSubscription({
          userId,
          botId: bot.id,
          status: 'active',
          stripeSubscriptionId: null,
          riskPercentage: 1,
          capitalAllocated: "1000",
          capitalAllocatedType: "amount",
          currentBalance: "1000",
          totalPnl: "0",
          maxDrawdown: "10",
          maxPositionsPerSymbol: 1,
          notificationPrefs: {
            newTrade: true,
            drawdownBreach: true,
            weeklySummary: true,
            monthlySummary: true,
          },
        });
        
        return res.json({
          subscriptionId: newSubscription.id,
          isFree: true,
          amount: "0",
        });
      }
      
      // Create or get a product for this bot
      const product = await stripe.products.create({
        name: `${bot.name} Trading Bot Subscription`,
        description: bot.description,
        metadata: {
          botId: bot.id,
        },
      });
      
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{
          price_data: {
            currency: 'usd',
            product: product.id,
            recurring: {
              interval: 'month',
            },
            unit_amount: priceAmount,
          },
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: { 
          save_default_payment_method: 'on_subscription'
        },
        metadata: {
          botId: bot.id,
          userId: user.id,
        },
      });
      
      // Retrieve the invoice with payment intent expanded
      const invoiceId = typeof subscription.latest_invoice === 'string' 
        ? subscription.latest_invoice 
        : subscription.latest_invoice?.id;
      
      if (!invoiceId) {
        return res.status(500).json({ 
          message: "Failed to create invoice. Please try again." 
        });
      }
      
      // Retrieve the invoice
      const invoice = await stripe.invoices.retrieve(invoiceId);
      
      // Create a payment intent for the invoice amount
      const paymentIntent = await stripe.paymentIntents.create({
        amount: invoice.amount_due,
        currency: invoice.currency,
        customer: stripeCustomerId,
        metadata: {
          invoiceId: invoice.id,
          subscriptionId: subscription.id,
          botId: bot.id,
          userId: user.id,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });
      
      if (!paymentIntent.client_secret) {
        return res.status(500).json({ 
          message: "Failed to create payment intent. Please try again." 
        });
      }
      
      res.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret,
        amount: bot.monthlyPrice,
      });
    } catch (error: any) {
      console.error("Error creating subscription payment:", error);
      res.status(500).json({ message: "Error creating subscription payment: " + error.message });
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
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { stripeSubscriptionId, botId, testMode } = req.body;
      
      // Check if this is a test mode subscription (creator testing their own bot)
      if (testMode || !stripeSubscriptionId) {
        const bot = await storage.getBotById(botId);
        if (!bot) {
          return res.status(404).json({ message: "Bot not found" });
        }
        
        // Only allow test mode if user is the bot creator
        if (bot.creatorId !== userId) {
          return res.status(400).json({ message: "Stripe subscription ID is required for non-creator subscriptions" });
        }
        
        // Create test mode subscription (no Stripe payment required)
        const validatedSubscription = insertSubscriptionSchema.parse({ 
          ...req.body, 
          userId,
          stripeSubscriptionId: `test_${Date.now()}_${botId.substring(0, 8)}`,
          isPaused: true,
          pauseReason: "Test Mode - Configure settings before going live",
          riskPercentage: 1,
          capitalAllocated: "1000",
          capitalAllocatedType: "amount",
          maxDrawdown: "10",
          notificationPrefs: {
            newTrade: true,
            drawdownBreach: true,
            weeklySummary: true,
            monthlySummary: true,
          },
          status: 'active',
        });
        
        const subscription = await storage.createSubscription(validatedSubscription);
        return res.json({ ...subscription, testMode: true });
      }
      
      // Regular Stripe subscription flow
      const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId, {
        expand: ['latest_invoice'],
      });
      
      if (stripeSubscription.customer !== user.stripeCustomerId) {
        return res.status(403).json({ message: "This subscription does not belong to you" });
      }
      
      if (stripeSubscription.metadata.botId !== botId) {
        return res.status(400).json({ message: "Subscription bot ID mismatch" });
      }
      
      // Allow incomplete status if payment has been processed
      const validStatuses = ['active', 'trialing', 'incomplete'];
      if (!validStatuses.includes(stripeSubscription.status)) {
        return res.status(400).json({ message: "Invalid subscription status: " + stripeSubscription.status });
      }
      
      // If subscription is incomplete, we need to check if payment was successful
      // and then complete the subscription
      if (stripeSubscription.status === 'incomplete') {
        const latestInvoice = stripeSubscription.latest_invoice as any;
        const invoiceId = typeof latestInvoice === 'string' ? latestInvoice : latestInvoice?.id;
        
        if (invoiceId) {
          // Get the payment intent from metadata (it was created separately)
          // We'll look for any successful payment intent for this customer with this invoice in metadata
          const paymentIntents = await stripe.paymentIntents.list({
            customer: user.stripeCustomerId,
            limit: 10,
          });
          
          const relevantPI = paymentIntents.data.find(pi => 
            pi.metadata.subscriptionId === stripeSubscriptionId && 
            pi.status === 'succeeded'
          );
          
          if (relevantPI) {
            // Payment was successful, now pay the invoice with the payment method
            try {
              const invoice = await stripe.invoices.retrieve(invoiceId);
              if (invoice.status === 'open') {
                await stripe.invoices.pay(invoiceId, {
                  paid_out_of_band: true, // Mark as paid since we collected payment separately
                });
              }
            } catch (err) {
              console.error("Error marking invoice as paid:", err);
            }
          } else {
            return res.status(400).json({ message: "Payment not completed yet. Please try again in a moment." });
          }
        }
      }
      
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
        },
        status: stripeSubscription.status === 'active' ? 'active' : 'pending',
      });
      
      const subscription = await storage.createSubscription(validatedSubscription);
      res.json(subscription);
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      if (error.type === 'StripeInvalidRequestError') {
        return res.status(400).json({ message: "Invalid Stripe subscription ID" });
      }
      res.status(400).json({ message: error.message || "Failed to create subscription" });
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

  app.post("/api/subscriptions/:id/reactivate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscription = await storage.getSubscriptionById(req.params.id);
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      if (subscription.userId !== userId) {
        return res.status(403).json({ message: "Forbidden: You can only reactivate your own subscriptions" });
      }
      
      const reactivated = await storage.reactivateSubscription(req.params.id);
      
      await storage.createSubscriptionEvent({
        subscriptionId: req.params.id,
        eventType: "reactivated",
        eventData: {},
      });
      
      res.json(reactivated);
    } catch (error) {
      console.error("Error reactivating subscription:", error);
      res.status(500).json({ message: "Failed to reactivate subscription" });
    }
  });

  app.get("/api/subscriptions/:id/trades", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscription = await storage.getSubscriptionById(req.params.id);
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      if (subscription.userId !== userId) {
        return res.status(403).json({ message: "Forbidden: You can only view your own subscription trades" });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const trades = await storage.getSubscriptionTrades(req.params.id, limit);
      res.json(trades);
    } catch (error) {
      console.error("Error fetching subscription trades:", error);
      res.status(500).json({ message: "Failed to fetch subscription trades" });
    }
  });

  app.get("/api/subscriptions/:id/positions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscription = await storage.getSubscriptionById(req.params.id);
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      if (subscription.userId !== userId) {
        return res.status(403).json({ message: "Forbidden: You can only view your own subscription positions" });
      }
      
      const positions = await storage.getOpenPositions(req.params.id);
      res.json(positions);
    } catch (error) {
      console.error("Error fetching subscription positions:", error);
      res.status(500).json({ message: "Failed to fetch subscription positions" });
    }
  });

  app.get("/api/subscriptions/:id/pnl", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscription = await storage.getSubscriptionById(req.params.id);
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      if (subscription.userId !== userId) {
        return res.status(403).json({ message: "Forbidden: You can only view your own subscription PnL" });
      }
      
      // Get all positions (both open and closed) for this subscription
      const allPositions = await storage.getAllSubscriptionPositions(req.params.id);
      const closedPositions = allPositions.filter(p => p.status === 'closed');
      const openPositions = allPositions.filter(p => p.status === 'open');
      
      const realizedPnl = parseFloat(subscription.totalPnl);
      const unrealizedPnl = openPositions.reduce((sum, pos) => sum + parseFloat(pos.unrealizedPnl), 0);
      const totalPnl = realizedPnl + unrealizedPnl;
      
      // Count positions as trades: 1 position = 1 trade
      const winningTrades = closedPositions.filter(p => parseFloat(p.unrealizedPnl) > 0).length;
      const losingTrades = closedPositions.filter(p => parseFloat(p.unrealizedPnl) < 0).length;
      const totalClosedTrades = closedPositions.length;
      const winRate = totalClosedTrades > 0 ? (winningTrades / totalClosedTrades) * 100 : 0;
      
      res.json({
        currentBalance: subscription.currentBalance,
        initialBalance: subscription.capitalAllocated || "0.00",
        realizedPnl: realizedPnl.toFixed(2),
        unrealizedPnl: unrealizedPnl.toFixed(2),
        totalPnl: totalPnl.toFixed(2),
        totalTrades: allPositions.length,
        winningTrades,
        losingTrades,
        winRate: winRate.toFixed(2),
        openPositions: openPositions.length,
      });
    } catch (error) {
      console.error("Error fetching subscription PnL:", error);
      res.status(500).json({ message: "Failed to fetch subscription PnL" });
    }
  });

  app.get("/api/user/trades", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 200;
      const trades = await storage.getAllUserTrades(userId, limit);
      res.json(trades);
    } catch (error) {
      console.error("Error fetching user trades:", error);
      res.status(500).json({ message: "Failed to fetch user trades" });
    }
  });

  app.get("/api/user/positions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const positions = await storage.getAllUserPositions(userId);
      res.json(positions);
    } catch (error) {
      console.error("Error fetching user positions:", error);
      res.status(500).json({ message: "Failed to fetch user positions" });
    }
  });

  app.get("/api/user/analytics", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const positions = await storage.getAllUserPositions(userId);
      
      // Count positions as trades: 1 position (open or closed) = 1 trade
      const closedPositions = positions.filter(p => p.status === 'closed');
      const openPositions = positions.filter(p => p.status === 'open');
      
      // For closed positions, unrealizedPnl contains the final realized P&L
      const winningTrades = closedPositions.filter(p => parseFloat(p.unrealizedPnl) > 0);
      const losingTrades = closedPositions.filter(p => parseFloat(p.unrealizedPnl) < 0);
      
      const totalPnl = closedPositions.reduce((sum, p) => sum + parseFloat(p.unrealizedPnl), 0);
      const unrealizedPnl = openPositions.reduce((sum, p) => sum + parseFloat(p.unrealizedPnl), 0);
      
      const winRate = closedPositions.length > 0 ? (winningTrades.length / closedPositions.length) * 100 : 0;
      
      const bestTrade = closedPositions.length > 0 
        ? closedPositions.reduce((best, p) => parseFloat(p.unrealizedPnl) > parseFloat(best.unrealizedPnl) ? p : best)
        : null;
      
      const worstTrade = closedPositions.length > 0
        ? closedPositions.reduce((worst, p) => parseFloat(p.unrealizedPnl) < parseFloat(worst.unrealizedPnl) ? p : worst)
        : null;
      
      const profitFactor = losingTrades.length > 0
        ? Math.abs(winningTrades.reduce((sum, p) => sum + parseFloat(p.unrealizedPnl), 0) / losingTrades.reduce((sum, p) => sum + parseFloat(p.unrealizedPnl), 0))
        : winningTrades.length > 0 ? 999 : 0;
      
      res.json({
        totalTrades: positions.length,
        closedTrades: closedPositions.length,
        openPositions: openPositions.length,
        totalPnl: totalPnl.toFixed(2),
        unrealizedPnl: unrealizedPnl.toFixed(2),
        combinedPnl: (totalPnl + unrealizedPnl).toFixed(2),
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        winRate: winRate.toFixed(2),
        profitFactor: profitFactor.toFixed(2),
        bestTrade: bestTrade ? {
          symbol: bestTrade.symbol,
          pnl: parseFloat(bestTrade.unrealizedPnl).toFixed(2),
          date: bestTrade.closedAt || bestTrade.openedAt,
        } : null,
        worstTrade: worstTrade ? {
          symbol: worstTrade.symbol,
          pnl: parseFloat(worstTrade.unrealizedPnl).toFixed(2),
          date: worstTrade.closedAt || worstTrade.openedAt,
        } : null,
      });
    } catch (error) {
      console.error("Error fetching user analytics:", error);
      res.status(500).json({ message: "Failed to fetch user analytics" });
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

  // Helper function to fetch price from multiple sources with cascading fallback
  async function fetchCryptoPrice(symbol: string): Promise<{ price: number; source: string } | null> {
    // Normalize TradingView symbols: Strip .P suffix (perpetual futures) and convert to standard pairs
    let cleanSymbol = symbol.toUpperCase()
      .replace('.P', '')  // Remove perpetual futures suffix
      .replace(/[^A-Z0-9]/g, '');
    
    // Convert USD pairs to USDT (most APIs use USDT)
    if (cleanSymbol.endsWith('USD') && !cleanSymbol.endsWith('USDT')) {
      cleanSymbol = cleanSymbol.replace('USD', 'USDT');
    }
    
    const normalizedSymbol = cleanSymbol;
    console.log(`Normalizing symbol: ${symbol} → ${normalizedSymbol}`);
    
    // 1. Try Binance (fastest, most accurate)
    try {
      const binanceResponse = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${normalizedSymbol}`);
      if (binanceResponse.ok) {
        const data = await binanceResponse.json() as { symbol: string; price: string };
        console.log(`✓ Price fetched from Binance: $${data.price}`);
        return { price: parseFloat(data.price), source: 'binance' };
      }
      console.log(`Binance failed (${binanceResponse.status}), trying next source...`);
    } catch (error) {
      console.log(`Binance error, trying next source...`);
    }

    // 2. Try Kraken (no geo-restrictions)
    try {
      const krakenMap: Record<string, string> = {
        'BTCUSDT': 'XXBTZUSD',
        'ETHUSDT': 'XETHZUSD',
        'SOLUSDT': 'SOLUSD',
        'ADAUSDT': 'ADAUSD',
        'XRPUSDT': 'XXRPZUSD',
        'DOTUSDT': 'DOTUSD',
        'MATICUSDT': 'MATICUSD',
        'AVAXUSDT': 'AVAXUSD',
      };
      
      const krakenPair = krakenMap[normalizedSymbol];
      if (krakenPair) {
        const krakenResponse = await fetch(`https://api.kraken.com/0/public/Ticker?pair=${krakenPair}`);
        if (krakenResponse.ok) {
          const krakenData = await krakenResponse.json() as { result: Record<string, { c: [string] }> };
          const pairData = krakenData.result?.[Object.keys(krakenData.result)[0]];
          if (pairData?.c?.[0]) {
            const price = parseFloat(pairData.c[0]);
            console.log(`✓ Price fetched from Kraken: $${price}`);
            return { price, source: 'kraken' };
          }
        }
      }
      console.log(`Kraken failed, trying next source...`);
    } catch (error) {
      console.log(`Kraken error, trying next source...`);
    }

    // 3. Try Coinbase (very reliable)
    try {
      const coinbaseMap: Record<string, string> = {
        'BTCUSDT': 'BTC-USD',
        'ETHUSDT': 'ETH-USD',
        'SOLUSDT': 'SOL-USD',
        'ADAUSDT': 'ADA-USD',
        'DOGEUSDT': 'DOGE-USD',
        'AVAXUSDT': 'AVAX-USD',
        'MATICUSDT': 'MATIC-USD',
      };
      
      const coinbasePair = coinbaseMap[normalizedSymbol];
      if (coinbasePair) {
        const coinbaseResponse = await fetch(`https://api.coinbase.com/v2/prices/${coinbasePair}/spot`);
        if (coinbaseResponse.ok) {
          const coinbaseData = await coinbaseResponse.json() as { data: { amount: string } };
          if (coinbaseData.data?.amount) {
            const price = parseFloat(coinbaseData.data.amount);
            console.log(`✓ Price fetched from Coinbase: $${price}`);
            return { price, source: 'coinbase' };
          }
        }
      }
      console.log(`Coinbase failed, trying next source...`);
    } catch (error) {
      console.log(`Coinbase error, trying next source...`);
    }

    // 4. Try CoinGecko (comprehensive coverage)
    try {
      const coinGeckoMap: Record<string, string> = {
        'BTCUSDT': 'bitcoin',
        'ETHUSDT': 'ethereum',
        'BNBUSDT': 'binancecoin',
        'ADAUSDT': 'cardano',
        'SOLUSDT': 'solana',
        'XRPUSDT': 'ripple',
        'DOTUSDT': 'polkadot',
        'DOGEUSDT': 'dogecoin',
        'AVAXUSDT': 'avalanche-2',
        'MATICUSDT': 'matic-network',
      };
      
      const coinGeckoId = coinGeckoMap[normalizedSymbol];
      if (coinGeckoId) {
        const coinGeckoResponse = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoId}&vs_currencies=usd`
        );
        if (coinGeckoResponse.ok) {
          const coinGeckoData = await coinGeckoResponse.json() as Record<string, { usd: number }>;
          const price = coinGeckoData[coinGeckoId]?.usd;
          if (price) {
            console.log(`✓ Price fetched from CoinGecko: $${price}`);
            return { price, source: 'coingecko' };
          }
        }
      }
      console.log(`CoinGecko failed, trying next source...`);
    } catch (error) {
      console.log(`CoinGecko error, trying next source...`);
    }

    // 5. Try CryptoCompare (last resort)
    try {
      const cryptoCompareSymbol = normalizedSymbol.replace('USDT', '');
      const cryptoCompareResponse = await fetch(
        `https://min-api.cryptocompare.com/data/price?fsym=${cryptoCompareSymbol}&tsyms=USD`
      );
      if (cryptoCompareResponse.ok) {
        const cryptoCompareData = await cryptoCompareResponse.json() as { USD?: number };
        if (cryptoCompareData.USD) {
          console.log(`✓ Price fetched from CryptoCompare: $${cryptoCompareData.USD}`);
          return { price: cryptoCompareData.USD, source: 'cryptocompare' };
        }
      }
      console.log(`CryptoCompare failed`);
    } catch (error) {
      console.log(`CryptoCompare error`);
    }

    return null;
  }

  app.get("/api/crypto/price/:symbol", async (req, res) => {
    const { symbol } = req.params;
    
    try {
      const result = await fetchCryptoPrice(symbol);
      
      if (result) {
        return res.json({ 
          symbol: symbol.toUpperCase(),
          price: result.price.toFixed(2),
          source: result.source,
          timestamp: new Date().toISOString()
        });
      }
      
      console.error(`❌ All price sources failed for ${symbol}`);
      return res.status(503).json({ 
        message: "Unable to fetch price from any source. Please try again in a moment.",
        symbol: symbol.toUpperCase()
      });
    } catch (error) {
      console.error("Error in price endpoint:", error);
      res.status(500).json({ 
        message: "Failed to fetch price.",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/positions/:positionId/close", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const { positionId } = req.params;
    const { closePrice } = req.body;

    if (!closePrice || isNaN(parseFloat(closePrice))) {
      return res.status(400).json({ message: "Valid close price is required" });
    }

    try {
      const position = await storage.getPositionById(positionId);
      
      if (!position) {
        return res.status(404).json({ message: "Position not found" });
      }

      const subscription = await storage.getSubscriptionById(position.subscriptionId);
      if (!subscription || subscription.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized to close this position" });
      }

      if (position.status !== 'open') {
        return res.status(400).json({ message: "Position is already closed" });
      }

      // Server-side price validation: Verify the close price against real-time market data
      const priceResult = await fetchCryptoPrice(position.symbol);
      
      if (priceResult) {
        const submittedPrice = parseFloat(closePrice);
        const currentMarketPrice = priceResult.price;
        const priceDeviation = Math.abs((submittedPrice - currentMarketPrice) / currentMarketPrice);
        
        if (priceDeviation > 0.05) {
          console.warn(`⚠️ Price validation failed: Submitted $${submittedPrice}, Market $${currentMarketPrice} (${priceResult.source}), Deviation ${(priceDeviation * 100).toFixed(2)}%`);
          return res.status(400).json({ 
            message: "Submitted price deviates too much from current market price. Please refresh and try again.",
            currentMarketPrice: currentMarketPrice.toFixed(2),
            source: priceResult.source
          });
        }
        
        console.log(`✓ Price validated: Submitted $${submittedPrice}, Market $${currentMarketPrice} (${priceResult.source}), Deviation ${(priceDeviation * 100).toFixed(2)}%`);
      } else {
        console.warn(`⚠️ Could not validate price for ${position.symbol} - all sources failed, proceeding without validation`);
      }

      const price = parseFloat(closePrice);
      const positionQty = parseFloat(position.quantity);
      const entryPrice = parseFloat(position.entryPrice);
      const fees = (price * positionQty * 0.001);

      let pnl: number;
      if (position.positionType === 'long') {
        pnl = ((price - entryPrice) * positionQty) - fees;
      } else {
        pnl = ((entryPrice - price) * positionQty) - fees;
      }

      const positionValue = price * positionQty;

      const trade = await storage.createTrade({
        subscriptionId: subscription.id,
        botId: position.botId,
        symbol: position.symbol,
        side: position.positionType === 'long' ? 'sell' : 'buy',
        quantity: positionQty.toFixed(8),
        price: price.toFixed(2),
        exchange: 'mock',
        status: 'filled',
        fees: fees.toFixed(2),
        pnl: pnl.toFixed(2),
      });

      await storage.closePosition(
        position.id,
        price.toFixed(2),
        pnl.toFixed(2)
      );

      const currentBalance = parseFloat(subscription.currentBalance);
      const currentPnl = parseFloat(subscription.totalPnl);
      const newBalance = (currentBalance + positionValue - fees).toFixed(2);
      const newPnl = (currentPnl + pnl).toFixed(2);

      await storage.updateSubscriptionBalance(
        subscription.id,
        newBalance,
        newPnl
      );

      console.log(`[Manual Close] Position ${positionId} closed manually at $${price}, PnL: $${pnl.toFixed(2)}`);

      res.json({ 
        success: true, 
        message: "Position closed successfully",
        trade,
        pnl: pnl.toFixed(2)
      });
    } catch (error) {
      console.error("Error closing position:", error);
      res.status(500).json({ message: "Failed to close position" });
    }
  });

  app.post("/api/webhooks/:botId/:secret", async (req, res) => {
    const { botId, secret } = req.params;
    const payload = req.body;
    const headers = req.headers;
    
    try {
      const webhook = await storage.getWebhookByBotAndSecret(botId, secret);
      
      if (!webhook) {
        await storage.logWebhookEvent({
          botId,
          payload,
          headers: headers as any,
          status: 'rejected',
          error: 'Invalid bot ID or webhook secret',
        });
        return res.status(401).json({ message: "Unauthorized: Invalid webhook credentials" });
      }
      
      await storage.updateWebhookLastReceived(botId);
      await storage.resetWebhookFailureCount(botId);
      
      const validationResult = webhookPayloadSchema.safeParse(payload);
      
      if (!validationResult.success) {
        await storage.logWebhookEvent({
          botId,
          payload,
          headers: headers as any,
          status: 'rejected',
          error: `Invalid payload: ${validationResult.error.message}`,
        });
        return res.status(400).json({ 
          message: "Invalid webhook payload",
          errors: validationResult.error.errors 
        });
      }
      
      await storage.logWebhookEvent({
        botId,
        payload,
        headers: headers as any,
        status: 'success',
      });
      
      const validatedPayload = validationResult.data;
      const symbol = validatedPayload.symbol.toUpperCase();
      const action = (validatedPayload.action || validatedPayload.side)!.toLowerCase();
      const price = typeof validatedPayload.price === 'string' 
        ? parseFloat(validatedPayload.price) 
        : validatedPayload.price;
      
      console.log(`[Webhook] Received trade signal for bot ${botId}:`, {
        symbol,
        action,
        price,
        time: validatedPayload.time || new Date().toISOString(),
      });
      
      const activeSubscriptions = await storage.getActiveSubscriptionsByBot(botId);
      let executedTrades = 0;
      
      for (const subscription of activeSubscriptions) {
        try {
          const capitalAllocated = parseFloat(subscription.capitalAllocated || "0");
          if (capitalAllocated <= 0) {
            console.log(`[Trade] Skipping subscription ${subscription.id} - no capital allocated`);
            continue;
          }
          
          const riskPercent = subscription.riskPercentage || 2;
          const positionSize = (capitalAllocated * riskPercent) / 100;
          const quantity = positionSize / price;
          
          if (quantity <= 0) {
            console.log(`[Trade] Skipping subscription ${subscription.id} - invalid quantity`);
            continue;
          }
          
          const normalizedAction = action.toLowerCase();
          const exchange = 'mock';
          const fees = (positionSize * 0.001);
          
          if (normalizedAction === 'buy' || normalizedAction === 'long') {
            const existingPosition = await storage.getPositionBySubscriptionAndSymbol(subscription.id, symbol);
            const maxPositions = subscription.maxPositionsPerSymbol || 1;
            
            if (existingPosition && existingPosition.positionType === 'long' && maxPositions === 1) {
              console.log(`[Trade] LONG position already exists for ${subscription.id} - ${symbol}, skipping duplicate BUY signal (maxPositionsPerSymbol=1)`);
              continue;
            } else if (existingPosition && existingPosition.positionType === 'short') {
              const positionQty = parseFloat(existingPosition.quantity);
              const entryPrice = parseFloat(existingPosition.entryPrice);
              const pnl = ((entryPrice - price) * positionQty) - fees;
              const positionValue = price * positionQty;
              
              const trade = await storage.createTrade({
                subscriptionId: subscription.id,
                botId,
                symbol,
                side: 'buy',
                quantity: positionQty.toFixed(8),
                price: price.toFixed(2),
                exchange,
                status: 'filled',
                fees: fees.toFixed(2),
                pnl: pnl.toFixed(2),
              });
              
              await storage.closePosition(
                existingPosition.id,
                price.toFixed(2),
                pnl.toFixed(2)
              );
              
              const currentBalance = parseFloat(subscription.currentBalance);
              const currentPnl = parseFloat(subscription.totalPnl);
              const newBalance = (currentBalance + positionValue - fees).toFixed(2);
              const newPnl = (currentPnl + pnl).toFixed(2);
              
              await storage.updateSubscriptionBalance(
                subscription.id,
                newBalance,
                newPnl
              );
              
              console.log(`[Trade] BUY to close SHORT for subscription ${subscription.id}: ${positionQty.toFixed(8)} ${symbol} @ $${price}, PnL: $${pnl.toFixed(2)}`);
              executedTrades++;
              
              // Send trade notification
              const user = await storage.getUser(subscription.userId);
              const bot = await storage.getBotById(botId);
              if (user && bot && user.email) {
                notifyTradeExecuted({
                  userEmail: user.email,
                  userName: user.name || 'User',
                  botName: bot.name,
                  symbol,
                  action: 'closed',
                  positionType: 'short',
                  quantity: positionQty.toFixed(8),
                  price: price.toFixed(2),
                  pnl: pnl.toFixed(2),
                }).catch(err => console.error('[Webhook] Notification error:', err));
              }
              
              // Check for drawdown breach
              const initialCapital = parseFloat(subscription.capitalAllocated);
              const maxDrawdownPercent = parseFloat(subscription.maxDrawdown);
              const currentDrawdown = ((initialCapital - parseFloat(newBalance)) / initialCapital) * 100;
              
              if (currentDrawdown > maxDrawdownPercent && subscription.status === 'active') {
                await storage.pauseSubscription(subscription.id, `Drawdown limit exceeded: ${currentDrawdown.toFixed(2)}%`);
                console.log(`[Trade] Subscription ${subscription.id} auto-paused due to drawdown breach: ${currentDrawdown.toFixed(2)}% > ${maxDrawdownPercent}%`);
                
                if (user && bot && user.email) {
                  notifyDrawdownBreach({
                    userEmail: user.email,
                    userName: user.name || 'User',
                    botName: bot.name,
                    currentDrawdown: currentDrawdown.toFixed(2),
                    maxDrawdown: maxDrawdownPercent.toFixed(2),
                    currentBalance: newBalance,
                  }).catch(err => console.error('[Webhook] Drawdown notification error:', err));
                }
              }
              
            } else if (!existingPosition) {
              const trade = await storage.createTrade({
                subscriptionId: subscription.id,
                botId,
                symbol,
                side: 'buy',
                quantity: quantity.toFixed(8),
                price: price.toFixed(2),
                exchange,
                status: 'filled',
                fees: fees.toFixed(2),
              });
              
              await storage.createPosition({
                subscriptionId: subscription.id,
                botId,
                symbol,
                positionType: 'long',
                quantity: quantity.toFixed(8),
                entryPrice: price.toFixed(2),
                currentPrice: price.toFixed(2),
                unrealizedPnl: "0.00",
                status: 'open',
              });
              
              const newBalance = (parseFloat(subscription.currentBalance) - positionSize - fees).toFixed(2);
              await storage.updateSubscriptionBalance(
                subscription.id,
                newBalance,
                subscription.totalPnl
              );
              
              console.log(`[Trade] BUY to open LONG for subscription ${subscription.id}: ${quantity.toFixed(8)} ${symbol} @ $${price}`);
              executedTrades++;
              
              // Send trade notification
              const user = await storage.getUser(subscription.userId);
              const bot = await storage.getBotById(botId);
              if (user && bot && user.email) {
                notifyTradeExecuted({
                  userEmail: user.email,
                  userName: user.name || 'User',
                  botName: bot.name,
                  symbol,
                  action: 'opened',
                  positionType: 'long',
                  quantity: quantity.toFixed(8),
                  price: price.toFixed(2),
                }).catch(err => console.error('[Webhook] Notification error:', err));
              }
            } else {
              console.log(`[Trade] LONG position already exists for ${subscription.id} - ${symbol}, skipping buy`);
            }
            
          } else if (normalizedAction === 'sell' || normalizedAction === 'short' || normalizedAction === 'close') {
            const existingPosition = await storage.getPositionBySubscriptionAndSymbol(subscription.id, symbol);
            const maxPositions = subscription.maxPositionsPerSymbol || 1;
            
            const isCloseAction = normalizedAction === 'close';
            if (existingPosition && existingPosition.positionType === 'short' && maxPositions === 1 && !isCloseAction) {
              console.log(`[Trade] SHORT position already exists for ${subscription.id} - ${symbol}, skipping duplicate SELL signal (maxPositionsPerSymbol=1)`);
              continue;
            } else if (existingPosition && existingPosition.positionType === 'long') {
              const positionQty = parseFloat(existingPosition.quantity);
              const entryPrice = parseFloat(existingPosition.entryPrice);
              const pnl = ((price - entryPrice) * positionQty) - fees;
              const positionValue = price * positionQty;
              
              const trade = await storage.createTrade({
                subscriptionId: subscription.id,
                botId,
                symbol,
                side: 'sell',
                quantity: positionQty.toFixed(8),
                price: price.toFixed(2),
                exchange,
                status: 'filled',
                fees: fees.toFixed(2),
                pnl: pnl.toFixed(2),
              });
              
              await storage.closePosition(
                existingPosition.id,
                price.toFixed(2),
                pnl.toFixed(2)
              );
              
              const currentBalance = parseFloat(subscription.currentBalance);
              const currentPnl = parseFloat(subscription.totalPnl);
              const newBalance = (currentBalance + positionValue - fees).toFixed(2);
              const newPnl = (currentPnl + pnl).toFixed(2);
              
              await storage.updateSubscriptionBalance(
                subscription.id,
                newBalance,
                newPnl
              );
              
              console.log(`[Trade] SELL to close LONG for subscription ${subscription.id}: ${positionQty.toFixed(8)} ${symbol} @ $${price}, PnL: $${pnl.toFixed(2)}`);
              executedTrades++;
              
              // Send trade notification
              const user = await storage.getUser(subscription.userId);
              const bot = await storage.getBotById(botId);
              if (user && bot && user.email) {
                notifyTradeExecuted({
                  userEmail: user.email,
                  userName: user.name || 'User',
                  botName: bot.name,
                  symbol,
                  action: 'closed',
                  positionType: 'long',
                  quantity: positionQty.toFixed(8),
                  price: price.toFixed(2),
                  pnl: pnl.toFixed(2),
                }).catch(err => console.error('[Webhook] Notification error:', err));
              }
              
              // Check for drawdown breach
              const initialCapital = parseFloat(subscription.capitalAllocated);
              const maxDrawdownPercent = parseFloat(subscription.maxDrawdown);
              const currentDrawdown = ((initialCapital - parseFloat(newBalance)) / initialCapital) * 100;
              
              if (currentDrawdown > maxDrawdownPercent && subscription.status === 'active') {
                await storage.pauseSubscription(subscription.id, `Drawdown limit exceeded: ${currentDrawdown.toFixed(2)}%`);
                console.log(`[Trade] Subscription ${subscription.id} auto-paused due to drawdown breach: ${currentDrawdown.toFixed(2)}% > ${maxDrawdownPercent}%`);
                
                if (user && bot && user.email) {
                  notifyDrawdownBreach({
                    userEmail: user.email,
                    userName: user.name || 'User',
                    botName: bot.name,
                    currentDrawdown: currentDrawdown.toFixed(2),
                    maxDrawdown: maxDrawdownPercent.toFixed(2),
                    currentBalance: newBalance,
                  }).catch(err => console.error('[Webhook] Drawdown notification error:', err));
                }
              }
              
            } else if (!existingPosition) {
              const trade = await storage.createTrade({
                subscriptionId: subscription.id,
                botId,
                symbol,
                side: 'sell',
                quantity: quantity.toFixed(8),
                price: price.toFixed(2),
                exchange,
                status: 'filled',
                fees: fees.toFixed(2),
              });
              
              await storage.createPosition({
                subscriptionId: subscription.id,
                botId,
                symbol,
                positionType: 'short',
                quantity: quantity.toFixed(8),
                entryPrice: price.toFixed(2),
                currentPrice: price.toFixed(2),
                unrealizedPnl: "0.00",
                status: 'open',
              });
              
              const newBalance = (parseFloat(subscription.currentBalance) - positionSize - fees).toFixed(2);
              await storage.updateSubscriptionBalance(
                subscription.id,
                newBalance,
                subscription.totalPnl
              );
              
              console.log(`[Trade] SELL to open SHORT for subscription ${subscription.id}: ${quantity.toFixed(8)} ${symbol} @ $${price}`);
              executedTrades++;
              
              // Send trade notification
              const user = await storage.getUser(subscription.userId);
              const bot = await storage.getBotById(botId);
              if (user && bot && user.email) {
                notifyTradeExecuted({
                  userEmail: user.email,
                  userName: user.name || 'User',
                  botName: bot.name,
                  symbol,
                  action: 'opened',
                  positionType: 'short',
                  quantity: quantity.toFixed(8),
                  price: price.toFixed(2),
                }).catch(err => console.error('[Webhook] Notification error:', err));
              }
            } else {
              console.log(`[Trade] SHORT position already exists for ${subscription.id} - ${symbol}, skipping sell`);
            }
          }
        } catch (tradeError) {
          console.error(`[Trade] Error executing trade for subscription ${subscription.id}:`, tradeError);
        }
      }
      
      res.json({ 
        success: true, 
        message: "Webhook received and processed successfully",
        executed: executedTrades,
        subscriptions: activeSubscriptions.length
      });
    } catch (error) {
      console.error("Error processing webhook:", error);
      
      await storage.incrementWebhookFailureCount(botId);
      await storage.logWebhookEvent({
        botId,
        payload,
        headers: headers as any,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      res.status(500).json({ message: "Failed to process webhook" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
