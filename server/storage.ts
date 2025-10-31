import { db } from "./db";
import { users, bots, botPerformance, subscriptions, exchangeConnections, botTradeLogs, botPerformanceHistory, subscriptionEvents, creatorPosts, postComments, postReactions, botWebhooks, webhookEventLogs, trades, positions, userOnboarding, creatorApplications, featuredPlacements, botEvaluations } from "@shared/schema";
import type { 
  User, UpsertUser, 
  Bot, InsertBot,
  BotPerformance, InsertBotPerformance,
  Subscription, InsertSubscription,
  ExchangeConnection, InsertExchangeConnection,
  BotTradeLog, InsertBotTradeLog,
  BotPerformanceHistory, InsertBotPerformanceHistory,
  SubscriptionEvent, InsertSubscriptionEvent,
  UpdateSubscriptionSettings,
  CreatorPost, InsertCreatorPost,
  PostComment, InsertPostComment,
  PostReaction, InsertPostReaction,
  BotWebhook, InsertBotWebhook,
  WebhookEventLog, InsertWebhookEventLog,
  Trade, InsertTrade,
  Position, InsertPosition,
  UserOnboarding, InsertUserOnboarding,
  CreatorApplication, InsertCreatorApplication,
  FeaturedPlacement, InsertFeaturedPlacement,
  BotEvaluation, InsertBotEvaluation
} from "@shared/schema";
import { eq, and, desc, or, isNull, gt } from "drizzle-orm";
import memoizee from "memoizee";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeCustomerId(userId: string, stripeCustomerId: string): Promise<User | undefined>;
  
  getAllBots(): Promise<Array<Bot & { performance: BotPerformance | null }>>;
  getBotById(id: string): Promise<(Bot & { creator: User }) | undefined>;
  createBot(bot: InsertBot): Promise<Bot>;
  updateBot(id: string, bot: Partial<InsertBot>): Promise<Bot | undefined>;
  
  getBotPerformance(botId: string): Promise<BotPerformance | undefined>;
  upsertBotPerformance(performance: InsertBotPerformance): Promise<BotPerformance>;
  
  getUserSubscriptions(userId: string): Promise<Array<Subscription & { bot: Bot; performance: BotPerformance | null }>>;
  getSubscription(userId: string, botId: string): Promise<Subscription | undefined>;
  getSubscriptionById(id: string): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscriptionSettings(id: string, settings: UpdateSubscriptionSettings): Promise<Subscription | undefined>;
  pauseSubscription(id: string, reason: string): Promise<Subscription | undefined>;
  resumeSubscription(id: string): Promise<Subscription | undefined>;
  cancelSubscription(id: string): Promise<Subscription | undefined>;
  reactivateSubscription(id: string): Promise<Subscription | undefined>;
  
  getBotTradeLogs(botId: string, limit?: number): Promise<BotTradeLog[]>;
  createBotTradeLog(tradeLog: InsertBotTradeLog): Promise<BotTradeLog>;
  
  getBotPerformanceHistory(botId: string, bucket?: string): Promise<BotPerformanceHistory[]>;
  upsertBotPerformanceHistory(history: InsertBotPerformanceHistory): Promise<BotPerformanceHistory>;
  
  createSubscriptionEvent(event: InsertSubscriptionEvent): Promise<SubscriptionEvent>;
  
  getUserExchangeConnections(userId: string): Promise<ExchangeConnection[]>;
  getExchangeConnectionById(id: string): Promise<ExchangeConnection | undefined>;
  createExchangeConnection(connection: InsertExchangeConnection): Promise<ExchangeConnection>;
  deleteExchangeConnection(id: string): Promise<void>;
  getUserTotalAvailableBalance(userId: string): Promise<number>;
  
  getBotPosts(botId: string): Promise<Array<CreatorPost & { creator: User }>>;
  getPostById(id: string): Promise<CreatorPost | undefined>;
  createPost(post: InsertCreatorPost): Promise<CreatorPost>;
  deletePost(id: string): Promise<void>;
  
  getPostComments(postId: string): Promise<Array<PostComment & { user: User }>>;
  getCommentById(id: string): Promise<PostComment | undefined>;
  createComment(comment: InsertPostComment): Promise<PostComment>;
  deleteComment(id: string): Promise<void>;
  
  getPostReactions(postId: string): Promise<PostReaction[]>;
  toggleReaction(reaction: InsertPostReaction): Promise<{ added: boolean }>;
  deleteReaction(postId: string, userId: string, reactionType: string): Promise<void>;
  
  createBotWebhook(webhook: InsertBotWebhook): Promise<BotWebhook>;
  getWebhookByBotId(botId: string): Promise<BotWebhook | undefined>;
  getWebhookByBotAndSecret(botId: string, secret: string): Promise<BotWebhook | undefined>;
  regenerateWebhookSecret(botId: string, newSecret: string): Promise<BotWebhook | undefined>;
  updateWebhookLastReceived(botId: string): Promise<void>;
  incrementWebhookFailureCount(botId: string): Promise<void>;
  resetWebhookFailureCount(botId: string): Promise<void>;
  
  logWebhookEvent(log: InsertWebhookEventLog): Promise<WebhookEventLog>;
  getRecentWebhookEvents(botId: string, limit?: number): Promise<WebhookEventLog[]>;
  
  createTrade(trade: InsertTrade): Promise<Trade>;
  getSubscriptionTrades(subscriptionId: string, limit?: number): Promise<Trade[]>;
  getAllUserTrades(userId: string, limit?: number): Promise<Array<Trade & { bot: Bot }>>;
  
  createPosition(position: InsertPosition): Promise<Position>;
  getOpenPositions(subscriptionId: string): Promise<Position[]>;
  getAllSubscriptionPositions(subscriptionId: string): Promise<Position[]>;
  getAllUserPositions(userId: string): Promise<Array<Position & { bot: Bot }>>;
  getPositionById(positionId: string): Promise<Position | undefined>;
  getPositionBySubscriptionAndSymbol(subscriptionId: string, symbol: string): Promise<Position | undefined>;
  updatePosition(id: string, updates: Partial<Position>): Promise<Position | undefined>;
  closePosition(id: string, closePrice: string, pnl: string): Promise<Position | undefined>;
  
  updateSubscriptionBalance(id: string, balance: string, pnl: string): Promise<Subscription | undefined>;
  getActiveSubscriptionsByBot(botId: string): Promise<Subscription[]>;
  
  getUserOnboarding(userId: string): Promise<UserOnboarding | undefined>;
  createUserOnboarding(userId: string): Promise<UserOnboarding>;
  updateOnboardingProgress(userId: string, updates: Partial<InsertUserOnboarding>): Promise<UserOnboarding | undefined>;
  completeOnboarding(userId: string): Promise<UserOnboarding | undefined>;
  
  createCreatorApplication(application: InsertCreatorApplication): Promise<CreatorApplication>;
  getCreatorApplication(userId: string): Promise<CreatorApplication | undefined>;
  updateCreatorApplicationStatus(userId: string, status: string, rejectionReason?: string, reviewedBy?: string): Promise<CreatorApplication | undefined>;
  
  createFeaturedPlacement(placement: InsertFeaturedPlacement): Promise<FeaturedPlacement>;
  getCurrentFeaturedPlacement(): Promise<(FeaturedPlacement & { bot: Bot & { performance: BotPerformance | null } }) | undefined>;
  getTopPerformersLast7Days(limit?: number): Promise<Array<Bot & { performance: BotPerformance | null; sevenDayRoi: number }>>;
  
  getBotEvaluation(botId: string): Promise<BotEvaluation | undefined>;
  createBotEvaluation(evaluation: InsertBotEvaluation): Promise<BotEvaluation>;
  updateBotEvaluation(botId: string, updates: Partial<BotEvaluation>): Promise<BotEvaluation | undefined>;
  checkAndUpdateEvaluationStatus(botId: string): Promise<{ status: string; passed: boolean; reason?: string }>;
}

export class DbStorage implements IStorage {
  private _getAllBotsUncached = async (): Promise<Array<Bot & { performance: BotPerformance | null }>> => {
    const result = await db
      .select()
      .from(bots)
      .leftJoin(botPerformance, eq(bots.id, botPerformance.botId))
      .where(eq(bots.isActive, true))
      .orderBy(desc(bots.createdAt));
    
    return result.map(row => ({
      ...row.bots,
      performance: row.bot_performance,
    }));
  };

  getAllBots = memoizee(this._getAllBotsUncached, {
    promise: true,
    maxAge: 60000,
    preFetch: 0.8,
  });

  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Check if user already exists
    const userId = userData.id;
    const existingUser = userId ? await this.getUser(userId) : undefined;
    const isNewUser = !existingUser;
    
    const result = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    
    // Create default exchange connection for new users
    if (isNewUser && userId) {
      await db.insert(exchangeConnections).values({
        userId: userId,
        exchange: "Mock Exchange",
        apiKey: `mock_${userId.substring(0, 8)}`,
        apiSecret: `secret_${userId.substring(0, 8)}`,
        balance: "10000.00", // $10,000 starting balance for testing
        isActive: true,
      });
    }
    
    return result[0];
  }

  async updateUserStripeCustomerId(userId: string, stripeCustomerId: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ stripeCustomerId, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async getBotById(id: string): Promise<(Bot & { creator: User }) | undefined> {
    const result = await db
      .select()
      .from(bots)
      .innerJoin(users, eq(bots.creatorId, users.id))
      .where(eq(bots.id, id))
      .limit(1);
    
    if (!result[0]) return undefined;
    
    return {
      ...result[0].bots,
      creator: result[0].users,
    };
  }

  async createBot(bot: InsertBot): Promise<Bot> {
    const result = await db.insert(bots).values(bot).returning();
    this.getAllBots.clear();
    return result[0];
  }

  async updateBot(id: string, bot: Partial<InsertBot>): Promise<Bot | undefined> {
    const result = await db.update(bots).set(bot).where(eq(bots.id, id)).returning();
    this.getAllBots.clear();
    return result[0];
  }

  private _getBotPerformanceUncached = async (botId: string): Promise<BotPerformance | undefined> => {
    const result = await db.select().from(botPerformance).where(eq(botPerformance.botId, botId)).limit(1);
    return result[0];
  };

  getBotPerformance = memoizee(this._getBotPerformanceUncached, {
    promise: true,
    maxAge: 45000,
    preFetch: 0.8,
  });

  async upsertBotPerformance(performance: InsertBotPerformance): Promise<BotPerformance> {
    const result = await db.select().from(botPerformance).where(eq(botPerformance.botId, performance.botId)).limit(1);
    const existing = result[0];
    
    let updated: BotPerformance;
    if (existing) {
      const updateResult = await db
        .update(botPerformance)
        .set({ ...performance, updatedAt: new Date() })
        .where(eq(botPerformance.botId, performance.botId))
        .returning();
      updated = updateResult[0];
    } else {
      const insertResult = await db.insert(botPerformance).values(performance).returning();
      updated = insertResult[0];
    }
    
    this.getBotPerformance.delete(performance.botId);
    this.getAllBots.clear();
    return updated;
  }

  private _getUserSubscriptionsUncached = async (userId: string): Promise<Array<Subscription & { bot: Bot; performance: BotPerformance | null }>> => {
    const now = new Date();
    const result = await db
      .select()
      .from(subscriptions)
      .innerJoin(bots, eq(subscriptions.botId, bots.id))
      .leftJoin(botPerformance, eq(bots.id, botPerformance.botId))
      .where(and(
        eq(subscriptions.userId, userId),
        or(
          isNull(subscriptions.subscriptionEndsAt),
          gt(subscriptions.subscriptionEndsAt, now)
        )
      ))
      .orderBy(desc(subscriptions.startedAt));
    
    return result.map(row => ({
      ...row.subscriptions,
      bot: row.bots,
      performance: row.bot_performance,
    }));
  };

  getUserSubscriptions = memoizee(this._getUserSubscriptionsUncached, {
    promise: true,
    maxAge: 30000,
    preFetch: 0.8,
  });

  async getSubscription(userId: string, botId: string): Promise<Subscription | undefined> {
    const now = new Date();
    const result = await db
      .select()
      .from(subscriptions)
      .where(and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.botId, botId),
        or(
          isNull(subscriptions.subscriptionEndsAt),
          gt(subscriptions.subscriptionEndsAt, now)
        )
      ))
      .limit(1);
    return result[0];
  }

  async getSubscriptionById(id: string): Promise<Subscription | undefined> {
    const result = await db.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1);
    return result[0];
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const result = await db.insert(subscriptions).values(subscription).returning();
    this.getUserSubscriptions.delete(subscription.userId);
    return result[0];
  }

  async updateSubscriptionSettings(id: string, settings: UpdateSubscriptionSettings): Promise<Subscription | undefined> {
    const updateData: any = { ...settings };
    if (settings.capitalAllocated !== undefined) {
      updateData.capitalAllocated = settings.capitalAllocated.toString();
    }
    if (settings.maxDrawdown !== undefined) {
      updateData.maxDrawdown = settings.maxDrawdown.toString();
    }
    
    const result = await db
      .update(subscriptions)
      .set(updateData)
      .where(eq(subscriptions.id, id))
      .returning();
    
    if (result[0]) {
      this.getUserSubscriptions.delete(result[0].userId);
    }
    return result[0];
  }

  async pauseSubscription(id: string, reason: string): Promise<Subscription | undefined> {
    const result = await db
      .update(subscriptions)
      .set({ isPaused: true, pauseReason: reason })
      .where(eq(subscriptions.id, id))
      .returning();
    
    if (result[0]) {
      this.getUserSubscriptions.delete(result[0].userId);
    }
    return result[0];
  }

  async resumeSubscription(id: string): Promise<Subscription | undefined> {
    const result = await db
      .update(subscriptions)
      .set({ isPaused: false, pauseReason: null })
      .where(eq(subscriptions.id, id))
      .returning();
    
    if (result[0]) {
      this.getUserSubscriptions.delete(result[0].userId);
    }
    return result[0];
  }

  async reactivateSubscription(id: string): Promise<Subscription | undefined> {
    const result = await db
      .update(subscriptions)
      .set({ 
        cancelledAt: null,
        subscriptionEndsAt: null
      })
      .where(eq(subscriptions.id, id))
      .returning();
    
    if (result[0]) {
      this.getUserSubscriptions.delete(result[0].userId);
    }
    return result[0];
  }

  async cancelSubscription(id: string): Promise<Subscription | undefined> {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const result = await db
      .update(subscriptions)
      .set({ 
        cancelledAt: now,
        subscriptionEndsAt: endOfMonth
      })
      .where(eq(subscriptions.id, id))
      .returning();
    
    if (result[0]) {
      this.getUserSubscriptions.delete(result[0].userId);
    }
    return result[0];
  }

  async getBotTradeLogs(botId: string, limit: number = 100): Promise<BotTradeLog[]> {
    return await db
      .select()
      .from(botTradeLogs)
      .where(eq(botTradeLogs.botId, botId))
      .orderBy(desc(botTradeLogs.entryTime))
      .limit(limit);
  }

  async createBotTradeLog(tradeLog: InsertBotTradeLog): Promise<BotTradeLog> {
    const result = await db.insert(botTradeLogs).values(tradeLog).returning();
    return result[0];
  }

  async getBotPerformanceHistory(botId: string, bucket?: string): Promise<BotPerformanceHistory[]> {
    const whereClause = bucket
      ? and(
          eq(botPerformanceHistory.botId, botId),
          eq(botPerformanceHistory.bucket, bucket)
        )
      : eq(botPerformanceHistory.botId, botId);

    return await db
      .select()
      .from(botPerformanceHistory)
      .where(whereClause)
      .orderBy(desc(botPerformanceHistory.createdAt));
  }

  async upsertBotPerformanceHistory(history: InsertBotPerformanceHistory): Promise<BotPerformanceHistory> {
    const existing = await db
      .select()
      .from(botPerformanceHistory)
      .where(and(
        eq(botPerformanceHistory.botId, history.botId),
        eq(botPerformanceHistory.bucket, history.bucket)
      ))
      .limit(1);

    if (existing[0]) {
      const result = await db
        .update(botPerformanceHistory)
        .set({ ...history, createdAt: new Date() })
        .where(and(
          eq(botPerformanceHistory.botId, history.botId),
          eq(botPerformanceHistory.bucket, history.bucket)
        ))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(botPerformanceHistory).values(history).returning();
      return result[0];
    }
  }

  async createSubscriptionEvent(event: InsertSubscriptionEvent): Promise<SubscriptionEvent> {
    const result = await db.insert(subscriptionEvents).values(event).returning();
    return result[0];
  }

  async getUserExchangeConnections(userId: string): Promise<ExchangeConnection[]> {
    return await db
      .select()
      .from(exchangeConnections)
      .where(and(eq(exchangeConnections.userId, userId), eq(exchangeConnections.isActive, true)))
      .orderBy(desc(exchangeConnections.createdAt));
  }

  async getExchangeConnectionById(id: string): Promise<ExchangeConnection | undefined> {
    const result = await db.select().from(exchangeConnections).where(eq(exchangeConnections.id, id)).limit(1);
    return result[0];
  }

  async createExchangeConnection(connection: InsertExchangeConnection): Promise<ExchangeConnection> {
    const result = await db.insert(exchangeConnections).values(connection).returning();
    return result[0];
  }

  async deleteExchangeConnection(id: string): Promise<void> {
    await db.update(exchangeConnections).set({ isActive: false }).where(eq(exchangeConnections.id, id));
  }

  async getUserTotalAvailableBalance(userId: string): Promise<number> {
    const connections = await db
      .select()
      .from(exchangeConnections)
      .where(and(eq(exchangeConnections.userId, userId), eq(exchangeConnections.isActive, true)));
    
    const totalBalance = connections.reduce((sum, conn) => {
      return sum + parseFloat(conn.balance);
    }, 0);
    
    return totalBalance;
  }

  async getBotPosts(botId: string): Promise<Array<CreatorPost & { creator: User }>> {
    const result = await db
      .select()
      .from(creatorPosts)
      .leftJoin(users, eq(creatorPosts.creatorId, users.id))
      .where(eq(creatorPosts.botId, botId))
      .orderBy(desc(creatorPosts.createdAt));
    
    return result.map(row => ({
      ...row.creator_posts,
      creator: row.users!,
    }));
  }

  async getPostById(id: string): Promise<CreatorPost | undefined> {
    const result = await db
      .select()
      .from(creatorPosts)
      .where(eq(creatorPosts.id, id))
      .limit(1);
    return result[0];
  }

  async createPost(post: InsertCreatorPost): Promise<CreatorPost> {
    const result = await db.insert(creatorPosts).values(post).returning();
    return result[0];
  }

  async deletePost(id: string): Promise<void> {
    await db.delete(creatorPosts).where(eq(creatorPosts.id, id));
  }

  async getPostComments(postId: string): Promise<Array<PostComment & { user: User }>> {
    const result = await db
      .select()
      .from(postComments)
      .leftJoin(users, eq(postComments.userId, users.id))
      .where(eq(postComments.postId, postId))
      .orderBy(postComments.createdAt);
    
    return result.map(row => ({
      ...row.post_comments,
      user: row.users!,
    }));
  }

  async getCommentById(id: string): Promise<PostComment | undefined> {
    const result = await db
      .select()
      .from(postComments)
      .where(eq(postComments.id, id))
      .limit(1);
    return result[0];
  }

  async createComment(comment: InsertPostComment): Promise<PostComment> {
    const result = await db.insert(postComments).values(comment).returning();
    return result[0];
  }

  async deleteComment(id: string): Promise<void> {
    await db.delete(postComments).where(eq(postComments.id, id));
  }

  async getPostReactions(postId: string): Promise<PostReaction[]> {
    const result = await db
      .select()
      .from(postReactions)
      .where(eq(postReactions.postId, postId));
    return result;
  }

  async toggleReaction(reaction: InsertPostReaction): Promise<{ added: boolean }> {
    const existing = await db
      .select()
      .from(postReactions)
      .where(
        and(
          eq(postReactions.postId, reaction.postId),
          eq(postReactions.userId, reaction.userId),
          eq(postReactions.reactionType, reaction.reactionType)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db.delete(postReactions).where(eq(postReactions.id, existing[0].id));
      return { added: false };
    } else {
      await db.insert(postReactions).values(reaction);
      return { added: true };
    }
  }

  async deleteReaction(postId: string, userId: string, reactionType: string): Promise<void> {
    await db.delete(postReactions).where(
      and(
        eq(postReactions.postId, postId),
        eq(postReactions.userId, userId),
        eq(postReactions.reactionType, reactionType)
      )
    );
  }

  async createBotWebhook(webhook: InsertBotWebhook): Promise<BotWebhook> {
    const result = await db.insert(botWebhooks).values(webhook).returning();
    return result[0];
  }

  async getWebhookByBotId(botId: string): Promise<BotWebhook | undefined> {
    const result = await db
      .select()
      .from(botWebhooks)
      .where(eq(botWebhooks.botId, botId))
      .limit(1);
    return result[0];
  }

  async getWebhookByBotAndSecret(botId: string, secret: string): Promise<BotWebhook | undefined> {
    const result = await db
      .select()
      .from(botWebhooks)
      .where(
        and(
          eq(botWebhooks.botId, botId),
          eq(botWebhooks.secret, secret),
          eq(botWebhooks.status, 'active')
        )
      )
      .limit(1);
    return result[0];
  }

  async regenerateWebhookSecret(botId: string, newSecret: string): Promise<BotWebhook | undefined> {
    const result = await db
      .update(botWebhooks)
      .set({ secret: newSecret })
      .where(eq(botWebhooks.botId, botId))
      .returning();
    return result[0];
  }

  async updateWebhookLastReceived(botId: string): Promise<void> {
    await db
      .update(botWebhooks)
      .set({ lastReceivedAt: new Date() })
      .where(eq(botWebhooks.botId, botId));
  }

  async incrementWebhookFailureCount(botId: string): Promise<void> {
    const webhook = await this.getWebhookByBotId(botId);
    if (webhook) {
      await db
        .update(botWebhooks)
        .set({ failureCount: (webhook.failureCount || 0) + 1 })
        .where(eq(botWebhooks.botId, botId));
    }
  }

  async resetWebhookFailureCount(botId: string): Promise<void> {
    await db
      .update(botWebhooks)
      .set({ failureCount: 0 })
      .where(eq(botWebhooks.botId, botId));
  }

  async logWebhookEvent(log: InsertWebhookEventLog): Promise<WebhookEventLog> {
    const result = await db.insert(webhookEventLogs).values(log).returning();
    return result[0];
  }

  async getRecentWebhookEvents(botId: string, limit: number = 50): Promise<WebhookEventLog[]> {
    const result = await db
      .select()
      .from(webhookEventLogs)
      .where(eq(webhookEventLogs.botId, botId))
      .orderBy(desc(webhookEventLogs.processedAt))
      .limit(limit);
    return result;
  }

  async createTrade(trade: InsertTrade): Promise<Trade> {
    const result = await db.insert(trades).values(trade).returning();
    return result[0];
  }

  async getSubscriptionTrades(subscriptionId: string, limit: number = 100): Promise<Trade[]> {
    const result = await db
      .select()
      .from(trades)
      .where(eq(trades.subscriptionId, subscriptionId))
      .orderBy(desc(trades.executedAt))
      .limit(limit);
    return result;
  }

  async getAllUserTrades(userId: string, limit: number = 200): Promise<Array<Trade & { bot: Bot }>> {
    const result = await db
      .select()
      .from(trades)
      .innerJoin(subscriptions, eq(trades.subscriptionId, subscriptions.id))
      .innerJoin(bots, eq(trades.botId, bots.id))
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(trades.executedAt))
      .limit(limit);
    
    return result.map(row => ({
      ...row.trades,
      bot: row.bots,
    }));
  }

  async createPosition(position: InsertPosition): Promise<Position> {
    const result = await db.insert(positions).values(position).returning();
    return result[0];
  }

  async getOpenPositions(subscriptionId: string): Promise<Position[]> {
    const result = await db
      .select()
      .from(positions)
      .where(
        and(
          eq(positions.subscriptionId, subscriptionId),
          eq(positions.status, 'open')
        )
      )
      .orderBy(desc(positions.openedAt));
    return result;
  }

  async getAllSubscriptionPositions(subscriptionId: string): Promise<Position[]> {
    const result = await db
      .select()
      .from(positions)
      .where(eq(positions.subscriptionId, subscriptionId))
      .orderBy(desc(positions.openedAt));
    return result;
  }

  async getAllUserPositions(userId: string): Promise<Array<Position & { bot: Bot }>> {
    const result = await db
      .select()
      .from(positions)
      .innerJoin(subscriptions, eq(positions.subscriptionId, subscriptions.id))
      .innerJoin(bots, eq(positions.botId, bots.id))
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(positions.openedAt));
    
    return result.map(row => ({
      ...row.positions,
      bot: row.bots,
    }));
  }

  async getPositionById(positionId: string): Promise<Position | undefined> {
    const result = await db
      .select()
      .from(positions)
      .where(eq(positions.id, positionId))
      .limit(1);
    return result[0];
  }

  async getPositionBySubscriptionAndSymbol(subscriptionId: string, symbol: string): Promise<Position | undefined> {
    const result = await db
      .select()
      .from(positions)
      .where(
        and(
          eq(positions.subscriptionId, subscriptionId),
          eq(positions.symbol, symbol),
          eq(positions.status, 'open')
        )
      )
      .limit(1);
    return result[0];
  }

  async updatePosition(id: string, updates: Partial<Position>): Promise<Position | undefined> {
    const result = await db
      .update(positions)
      .set(updates)
      .where(eq(positions.id, id))
      .returning();
    return result[0];
  }

  async closePosition(id: string, closePrice: string, pnl: string): Promise<Position | undefined> {
    const result = await db
      .update(positions)
      .set({
        status: 'closed',
        currentPrice: closePrice,
        unrealizedPnl: pnl,
        closedAt: new Date()
      })
      .where(eq(positions.id, id))
      .returning();
    return result[0];
  }

  async updateSubscriptionBalance(id: string, balance: string, pnl: string): Promise<Subscription | undefined> {
    const result = await db
      .update(subscriptions)
      .set({
        currentBalance: balance,
        totalPnl: pnl
      })
      .where(eq(subscriptions.id, id))
      .returning();
    
    if (result[0]) {
      this.getUserSubscriptions.delete(result[0].userId);
    }
    return result[0];
  }

  async getActiveSubscriptionsByBot(botId: string): Promise<Subscription[]> {
    const result = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.botId, botId),
          eq(subscriptions.status, 'active'),
          eq(subscriptions.isPaused, false)
        )
      );
    return result;
  }

  async getUserOnboarding(userId: string): Promise<UserOnboarding | undefined> {
    const result = await db
      .select()
      .from(userOnboarding)
      .where(eq(userOnboarding.userId, userId))
      .limit(1);
    return result[0];
  }

  async createUserOnboarding(userId: string): Promise<UserOnboarding> {
    const result = await db
      .insert(userOnboarding)
      .values({ userId })
      .returning();
    return result[0];
  }

  async updateOnboardingProgress(userId: string, updates: Partial<InsertUserOnboarding>): Promise<UserOnboarding | undefined> {
    const result = await db
      .update(userOnboarding)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userOnboarding.userId, userId))
      .returning();
    return result[0];
  }

  async completeOnboarding(userId: string): Promise<UserOnboarding | undefined> {
    const result = await db
      .update(userOnboarding)
      .set({ 
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(userOnboarding.userId, userId))
      .returning();
    return result[0];
  }

  async createCreatorApplication(application: InsertCreatorApplication): Promise<CreatorApplication> {
    const result = await db
      .insert(creatorApplications)
      .values(application)
      .returning();
    return result[0];
  }

  async getCreatorApplication(userId: string): Promise<CreatorApplication | undefined> {
    const result = await db
      .select()
      .from(creatorApplications)
      .where(eq(creatorApplications.userId, userId))
      .limit(1);
    return result[0];
  }

  async updateCreatorApplicationStatus(
    userId: string,
    status: string,
    rejectionReason?: string,
    reviewedBy?: string
  ): Promise<CreatorApplication | undefined> {
    const result = await db
      .update(creatorApplications)
      .set({
        status,
        rejectionReason,
        reviewedBy,
        reviewedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(creatorApplications.userId, userId))
      .returning();
    return result[0];
  }

  async createFeaturedPlacement(placement: InsertFeaturedPlacement): Promise<FeaturedPlacement> {
    const result = await db
      .insert(featuredPlacements)
      .values(placement)
      .returning();
    return result[0];
  }

  async getCurrentFeaturedPlacement(): Promise<(FeaturedPlacement & { bot: Bot & { performance: BotPerformance | null } }) | undefined> {
    const now = new Date();
    const result = await db
      .select()
      .from(featuredPlacements)
      .leftJoin(bots, eq(featuredPlacements.botId, bots.id))
      .leftJoin(botPerformance, eq(bots.id, botPerformance.botId))
      .where(
        and(
          eq(featuredPlacements.status, 'active'),
          gt(featuredPlacements.endDate, now)
        )
      )
      .orderBy(desc(featuredPlacements.startDate))
      .limit(1);

    if (!result[0] || !result[0].bots) return undefined;

    return {
      ...result[0].featured_placements,
      bot: {
        ...result[0].bots,
        performance: result[0].bot_performance,
      },
    };
  }

  async getTopPerformersLast7Days(limit: number = 5): Promise<Array<Bot & { performance: BotPerformance | null; sevenDayRoi: number }>> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await db
      .select()
      .from(bots)
      .leftJoin(botPerformance, eq(bots.id, botPerformance.botId))
      .where(eq(bots.isActive, true))
      .orderBy(desc(botPerformance.totalRoi))
      .limit(limit);

    return result.map((row, index) => ({
      ...row.bots,
      performance: row.bot_performance,
      sevenDayRoi: row.bot_performance?.totalRoi ? parseFloat(row.bot_performance.totalRoi.toString()) : 0,
    }));
  }

  async getBotEvaluation(botId: string): Promise<BotEvaluation | undefined> {
    const result = await db
      .select()
      .from(botEvaluations)
      .where(eq(botEvaluations.botId, botId))
      .limit(1);
    return result[0];
  }

  async createBotEvaluation(evaluation: InsertBotEvaluation): Promise<BotEvaluation> {
    const result = await db
      .insert(botEvaluations)
      .values(evaluation)
      .returning();
    return result[0];
  }

  async updateBotEvaluation(botId: string, updates: Partial<BotEvaluation>): Promise<BotEvaluation | undefined> {
    const result = await db
      .update(botEvaluations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(botEvaluations.botId, botId))
      .returning();
    return result[0];
  }

  async checkAndUpdateEvaluationStatus(botId: string): Promise<{ status: string; passed: boolean; reason?: string }> {
    const evaluation = await this.getBotEvaluation(botId);
    
    if (!evaluation || evaluation.status !== 'in_progress') {
      return { status: evaluation?.status || 'not_found', passed: false, reason: 'Evaluation not in progress' };
    }

    const currentTrades = evaluation.currentTrades;
    const currentPnlPercent = parseFloat(evaluation.currentPnlPercent.toString());
    const currentDrawdown = parseFloat(evaluation.currentDrawdownPercent.toString());
    
    const requiredTrades = evaluation.requiredTrades;
    const requiredProfit = parseFloat(evaluation.requiredProfitPercent.toString());
    const maxDrawdown = parseFloat(evaluation.requiredMaxDrawdownPercent.toString());

    // Check if failed drawdown rule
    if (currentDrawdown > maxDrawdown) {
      await this.updateBotEvaluation(botId, {
        status: 'failed',
        completedAt: new Date(),
        evaluationNotes: `Failed: Exceeded maximum drawdown of ${maxDrawdown}% (current: ${currentDrawdown.toFixed(2)}%)`
      });
      
      // Update bot evaluation status
      await db
        .update(bots)
        .set({ evaluationStatus: 'failed' })
        .where(eq(bots.id, botId));

      return {
        status: 'failed',
        passed: false,
        reason: `Exceeded maximum drawdown of ${maxDrawdown}% (current: ${currentDrawdown.toFixed(2)}%)`
      };
    }

    // Check if passed evaluation
    if (currentTrades >= requiredTrades && currentPnlPercent >= requiredProfit) {
      await this.updateBotEvaluation(botId, {
        status: 'passed',
        completedAt: new Date(),
        evaluationNotes: `Passed: ${currentTrades} trades, ${currentPnlPercent.toFixed(2)}% profit, ${currentDrawdown.toFixed(2)}% max drawdown`
      });
      
      // Update bot evaluation status and activate bot
      await db
        .update(bots)
        .set({ 
          evaluationStatus: 'passed',
          isActive: true
        })
        .where(eq(bots.id, botId));

      // Invalidate cache
      this.getAllBots.clear();

      return {
        status: 'passed',
        passed: true,
        reason: `Passed with ${currentTrades} trades and ${currentPnlPercent.toFixed(2)}% profit`
      };
    }

    // Still in progress
    return {
      status: 'in_progress',
      passed: false,
      reason: `Progress: ${currentTrades}/${requiredTrades} trades, ${currentPnlPercent.toFixed(2)}%/${requiredProfit}% profit`
    };
  }
}

export const storage = new DbStorage();
