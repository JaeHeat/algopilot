import { db } from "./db";
import { users, bots, botPerformance, subscriptions, exchangeConnections, botTradeLogs, botPerformanceHistory, subscriptionEvents, creatorPosts, postComments, postReactions, botWebhooks, webhookUrlHistory, botSettings, discountCodes, webhookEventLogs, trades, positions, userOnboarding, creatorApplications, featuredPlacements, botEvaluations, botEvaluationRuns, botEvaluationTrades, botEvaluationPositions, payouts, passwordResetTokens } from "@shared/schema";
import { encryptCredential, decryptCredential } from "./encryption";
import { randomBytes, createHash } from "crypto";
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
  WebhookUrlHistory, InsertWebhookUrlHistory,
  BotSettings, InsertBotSettings,
  DiscountCode, InsertDiscountCode,
  WebhookEventLog, InsertWebhookEventLog,
  Trade, InsertTrade,
  Position, InsertPosition,
  UserOnboarding, InsertUserOnboarding,
  CreatorApplication, InsertCreatorApplication,
  FeaturedPlacement, InsertFeaturedPlacement,
  BotEvaluation, InsertBotEvaluation,
  BotEvaluationRun, InsertBotEvaluationRun,
  BotEvaluationTrade, InsertBotEvaluationTrade,
  BotEvaluationPosition, InsertBotEvaluationPosition,
  Payout, InsertPayout
} from "@shared/schema";
import { eq, and, desc, or, isNull, gt, sql, count } from "drizzle-orm";
import memoizee from "memoizee";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByStripeConnectAccountId(accountId: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeCustomerId(userId: string, stripeCustomerId: string): Promise<User | undefined>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<User | undefined>;
  createUser(email: string, hashedPassword: string, firstName?: string, lastName?: string): Promise<User>;
  createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void>;
  getPasswordResetToken(token: string): Promise<{ userId: string; expiresAt: Date } | undefined>;
  deletePasswordResetToken(token: string): Promise<void>;
  deleteExpiredPasswordResetTokens(): Promise<void>;
  
  getAllBots(): Promise<Array<Bot & { performance: BotPerformance | null }>>;
  getBotsByCreatorId(creatorId: string): Promise<Bot[]>;
  getBotById(id: string): Promise<(Bot & { creator: User }) | undefined>;
  createBot(bot: InsertBot): Promise<Bot>;
  updateBot(id: string, bot: Partial<InsertBot>): Promise<Bot | undefined>;
  
  getBotPerformance(botId: string): Promise<BotPerformance | undefined>;
  upsertBotPerformance(performance: InsertBotPerformance): Promise<BotPerformance>;
  
  getUserSubscriptions(userId: string): Promise<Array<Subscription & { bot: Bot; performance: BotPerformance | null }>>;
  getSubscription(userId: string, botId: string): Promise<Subscription | undefined>;
  getSubscriptionById(id: string): Promise<Subscription | undefined>;
  getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscriptionSettings(id: string, settings: UpdateSubscriptionSettings): Promise<Subscription | undefined>;
  updateSubscriptionStatus(id: string, status: string): Promise<Subscription | undefined>;
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
  regenerateWebhookSecret(botId: string, newSecret: string, newAuthToken?: string, userId?: string): Promise<BotWebhook | undefined>;
  populateWebhookAuthTokens(): Promise<number>;
  updateWebhookLastReceived(botId: string): Promise<void>;
  incrementWebhookFailureCount(botId: string): Promise<void>;
  resetWebhookFailureCount(botId: string): Promise<void>;
  
  saveWebhookUrlHistory(history: InsertWebhookUrlHistory): Promise<WebhookUrlHistory>;
  getWebhookUrlHistory(botId: string, limit?: number): Promise<WebhookUrlHistory[]>;
  restoreWebhookUrl(botId: string, historyId: string, userId: string): Promise<BotWebhook | undefined>;
  
  createDiscountCode(discountCode: InsertDiscountCode): Promise<DiscountCode>;
  getDiscountCodesByBotId(botId: string): Promise<DiscountCode[]>;
  getDiscountCodeByCode(code: string): Promise<DiscountCode | undefined>;
  updateDiscountCode(id: string, updates: Partial<Omit<InsertDiscountCode, 'code' | 'botId' | 'creatorId'>>): Promise<DiscountCode | undefined>;
  incrementDiscountCodeUses(id: string): Promise<DiscountCode | undefined>;
  deactivateDiscountCode(id: string): Promise<DiscountCode | undefined>;
  
  logWebhookEvent(log: InsertWebhookEventLog): Promise<WebhookEventLog>;
  getRecentWebhookEvents(botId: string, limit?: number): Promise<WebhookEventLog[]>;
  
  getBotSettings(botId: string): Promise<BotSettings | undefined>;
  createBotSettings(settings: InsertBotSettings): Promise<BotSettings>;
  updateBotSettings(botId: string, settings: Partial<BotSettings>): Promise<BotSettings | undefined>;
  
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
  updateEvaluationFromTrade(botId: string, pnl: number, newBalance: number, initialCapital: number): Promise<void>;
  checkAndUpdateEvaluationStatus(botId: string): Promise<{ status: string; passed: boolean; reason?: string }>;
  restartBotEvaluation(botId: string): Promise<void>;
  
  getActiveEvaluationRun(botId: string): Promise<BotEvaluationRun | undefined>;
  createEvaluationRun(botId: string, startingBalance?: string): Promise<BotEvaluationRun>;
  updateEvaluationRunMetrics(runId: string, metrics: Partial<BotEvaluationRun>): Promise<BotEvaluationRun | undefined>;
  closeEvaluationRun(runId: string, status: string, failureReason?: string): Promise<BotEvaluationRun | undefined>;
  
  createEvaluationTrade(trade: InsertBotEvaluationTrade): Promise<BotEvaluationTrade>;
  getEvaluationTrades(evaluationRunId: string, limit?: number): Promise<BotEvaluationTrade[]>;
  
  getEvaluationPosition(evaluationRunId: string, symbol: string): Promise<BotEvaluationPosition | undefined>;
  getEvaluationPositionById(id: string): Promise<BotEvaluationPosition | undefined>;
  getEvaluationPositionsByRunId(evaluationRunId: string, limit?: number): Promise<BotEvaluationPosition[]>;
  createEvaluationPosition(position: InsertBotEvaluationPosition): Promise<BotEvaluationPosition>;
  updateEvaluationPosition(id: string, updates: Partial<BotEvaluationPosition>): Promise<BotEvaluationPosition | undefined>;
  closeEvaluationPosition(id: string, realizedPnl: string): Promise<BotEvaluationPosition | undefined>;
  
  getAdminStats(): Promise<{
    totalUsers: number;
    activeBots: number;
    platformRevenue: string;
    pendingApprovals: number;
  }>;
  getRecentUsers(limit?: number): Promise<Array<User & { subscriptionCount: number }>>;
  getPendingCreatorApplications(): Promise<Array<CreatorApplication & { user: User }>>;
  
  getCreatorEarnings(creatorId: string): Promise<{
    totalEarnings: string;
    totalPayouts: string;
    pendingBalance: string;
  }>;
  createPayoutRequest(payout: InsertPayout): Promise<Payout>;
  getCreatorPayouts(creatorId: string): Promise<Payout[]>;
  getPendingPayouts(): Promise<Array<Payout & { creator: User }>>;
  approvePayoutRequest(payoutId: string, adminId: string): Promise<Payout | undefined>;
  rejectPayoutRequest(payoutId: string, adminId: string, reason: string): Promise<Payout | undefined>;
  completePayoutRequest(payoutId: string, transferId: string): Promise<Payout | undefined>;
  updateUserStripeConnect(userId: string, data: { stripeConnectAccountId?: string; stripeConnectOnboardingComplete?: boolean }): Promise<User | undefined>;
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

  async getUserByStripeConnectAccountId(accountId: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.stripeConnectAccountId, accountId)).limit(1);
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Check if user already exists by email or id
    const userId = userData.id;
    const existingUserById = userId ? await this.getUser(userId) : undefined;
    const existingUserByEmail = userData.email ? await this.getUserByEmail(userData.email) : undefined;
    const existingUser = existingUserById || existingUserByEmail;
    const isNewUser = !existingUser;
    
    // If there's an existing user by email but with a different ID, use the existing user's ID
    const finalUserId = existingUser?.id || userId;
    const finalUserData = { ...userData, id: finalUserId };
    
    const result = await db
      .insert(users)
      .values(finalUserData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: finalUserData.email,
          firstName: finalUserData.firstName,
          lastName: finalUserData.lastName,
          profileImageUrl: finalUserData.profileImageUrl,
          role: finalUserData.role,
          updatedAt: new Date(),
        },
      })
      .returning();
    
    // Create default exchange connection for new users (paper trading)
    if (isNewUser && finalUserId) {
      const mockApiSecret = `secret_${finalUserId.substring(0, 8)}`;
      await db.insert(exchangeConnections).values({
        userId: finalUserId,
        exchange: "Mock Exchange",
        apiKey: `mock_${finalUserId.substring(0, 8)}`,
        apiSecret: encryptCredential(mockApiSecret), // Encrypt the mock secret
        balance: "10000.00", // $10,000 starting balance for paper trading
        connectionType: "paper", // Paper trading mode
        accountType: "spot",
        isTestnet: false,
        isActive: true,
        connectionStatus: "valid",
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

  async updateUserStripeConnect(userId: string, data: { 
    stripeConnectAccountId?: string; 
    stripeConnectOnboardingComplete?: boolean;
  }): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async createUser(email: string, hashedPassword: string, firstName?: string, lastName?: string): Promise<User> {
    const result = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: "subscriber",
      })
      .returning();

    const user = result[0];

    // Create default exchange connection for new users (paper trading)
    const mockApiSecret = `secret_${user.id.substring(0, 8)}`;
    await db.insert(exchangeConnections).values({
      userId: user.id,
      exchange: "Mock Exchange",
      apiKey: `mock_${user.id.substring(0, 8)}`,
      apiSecret: encryptCredential(mockApiSecret),
      balance: "10000.00",
      connectionType: "paper",
      accountType: "spot",
      isTestnet: false,
      isActive: true,
      connectionStatus: "valid",
    });

    return user;
  }

  async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    const hashedToken = createHash('sha256').update(token).digest('hex');
    await db.insert(passwordResetTokens).values({
      userId,
      token: hashedToken,
      expiresAt,
    });
  }

  async getPasswordResetToken(token: string): Promise<{ userId: string; expiresAt: Date } | undefined> {
    const hashedToken = createHash('sha256').update(token).digest('hex');
    const result = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, hashedToken))
      .limit(1);
    
    if (!result[0]) return undefined;
    
    return {
      userId: result[0].userId,
      expiresAt: result[0].expiresAt,
    };
  }

  async deletePasswordResetToken(token: string): Promise<void> {
    const hashedToken = createHash('sha256').update(token).digest('hex');
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.token, hashedToken));
  }

  async deleteExpiredPasswordResetTokens(): Promise<void> {
    await db
      .delete(passwordResetTokens)
      .where(sql`${passwordResetTokens.expiresAt} < NOW()`);
  }

  async getBotsByCreatorId(creatorId: string): Promise<Bot[]> {
    return db
      .select()
      .from(bots)
      .where(eq(bots.creatorId, creatorId));
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

  async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | undefined> {
    const result = await db.select().from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
      .limit(1);
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

  async updateSubscriptionStatus(id: string, status: string): Promise<Subscription | undefined> {
    const result = await db.update(subscriptions)
      .set({ status })
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
    const encryptedConnection = {
      ...connection,
      apiSecret: encryptCredential(connection.apiSecret),
      passphrase: connection.passphrase ? encryptCredential(connection.passphrase) : null,
    };
    const result = await db.insert(exchangeConnections).values(encryptedConnection).returning();
    return result[0];
  }

  async updateExchangeConnection(id: string, updates: Partial<InsertExchangeConnection>): Promise<ExchangeConnection | undefined> {
    const encryptedUpdates = { ...updates };
    
    if (updates.apiSecret) {
      encryptedUpdates.apiSecret = encryptCredential(updates.apiSecret);
    }
    
    if (updates.passphrase) {
      encryptedUpdates.passphrase = encryptCredential(updates.passphrase);
    }
    
    const result = await db
      .update(exchangeConnections)
      .set(encryptedUpdates)
      .where(eq(exchangeConnections.id, id))
      .returning();
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

  async regenerateWebhookSecret(botId: string, newSecret: string, newAuthToken?: string, userId?: string): Promise<BotWebhook | undefined> {
    return await db.transaction(async (tx) => {
      const currentWebhook = await tx
        .select()
        .from(botWebhooks)
        .where(eq(botWebhooks.botId, botId))
        .limit(1)
        .then(r => r[0]);
      
      if (currentWebhook) {
        await tx.insert(webhookUrlHistory).values({
          botId,
          secret: currentWebhook.secret,
          authToken: currentWebhook.authToken || undefined,
          replacedBy: userId,
        });
      }
      
      const updateData: any = { secret: newSecret };
      if (newAuthToken) {
        updateData.authToken = newAuthToken;
      }
      const result = await tx
        .update(botWebhooks)
        .set(updateData)
        .where(eq(botWebhooks.botId, botId))
        .returning();
      return result[0];
    });
  }
  
  async saveWebhookUrlHistory(history: InsertWebhookUrlHistory): Promise<WebhookUrlHistory> {
    const result = await db
      .insert(webhookUrlHistory)
      .values(history)
      .returning();
    return result[0];
  }
  
  async getWebhookUrlHistory(botId: string, limit: number = 10): Promise<WebhookUrlHistory[]> {
    const result = await db
      .select()
      .from(webhookUrlHistory)
      .where(eq(webhookUrlHistory.botId, botId))
      .orderBy(desc(webhookUrlHistory.replacedAt))
      .limit(limit);
    return result;
  }
  
  async restoreWebhookUrl(botId: string, historyId: string, userId: string): Promise<BotWebhook | undefined> {
    return await db.transaction(async (tx) => {
      const historyRecord = await tx
        .select()
        .from(webhookUrlHistory)
        .where(eq(webhookUrlHistory.id, historyId))
        .limit(1)
        .then(r => r[0]);
      
      if (!historyRecord || historyRecord.botId !== botId) {
        return undefined;
      }
      
      const currentWebhook = await tx
        .select()
        .from(botWebhooks)
        .where(eq(botWebhooks.botId, botId))
        .limit(1)
        .then(r => r[0]);
      
      if (currentWebhook) {
        await tx.insert(webhookUrlHistory).values({
          botId,
          secret: currentWebhook.secret,
          authToken: currentWebhook.authToken || undefined,
          replacedBy: userId,
        });
      }
      
      const result = await tx
        .update(botWebhooks)
        .set({
          secret: historyRecord.secret,
          authToken: historyRecord.authToken,
        })
        .where(eq(botWebhooks.botId, botId))
        .returning();
      
      return result[0];
    });
  }
  
  async populateWebhookAuthTokens(): Promise<number> {
    const webhooksWithoutToken = await db
      .select()
      .from(botWebhooks)
      .where(isNull(botWebhooks.authToken));
    
    let updated = 0;
    for (const webhook of webhooksWithoutToken) {
      const authToken = randomBytes(32).toString('hex');
      await db
        .update(botWebhooks)
        .set({ authToken })
        .where(eq(botWebhooks.id, webhook.id));
      updated++;
    }
    return updated;
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

  async createDiscountCode(discountCode: InsertDiscountCode): Promise<DiscountCode> {
    const result = await db.insert(discountCodes).values(discountCode).returning();
    return result[0];
  }
  
  async getDiscountCodesByBotId(botId: string): Promise<DiscountCode[]> {
    const result = await db
      .select()
      .from(discountCodes)
      .where(eq(discountCodes.botId, botId))
      .orderBy(desc(discountCodes.createdAt));
    return result;
  }
  
  async getDiscountCodeByCode(code: string): Promise<DiscountCode | undefined> {
    const result = await db
      .select()
      .from(discountCodes)
      .where(eq(discountCodes.code, code.toUpperCase()))
      .limit(1);
    return result[0];
  }
  
  async updateDiscountCode(id: string, updates: Partial<Omit<InsertDiscountCode, 'code' | 'botId' | 'creatorId'>>): Promise<DiscountCode | undefined> {
    const result = await db
      .update(discountCodes)
      .set(updates)
      .where(eq(discountCodes.id, id))
      .returning();
    return result[0];
  }
  
  async incrementDiscountCodeUses(id: string): Promise<DiscountCode | undefined> {
    const result = await db
      .update(discountCodes)
      .set({
        currentUses: sql`${discountCodes.currentUses} + 1`,
      })
      .where(eq(discountCodes.id, id))
      .returning();
    return result[0];
  }
  
  async deactivateDiscountCode(id: string): Promise<DiscountCode | undefined> {
    const result = await db
      .update(discountCodes)
      .set({ isActive: false })
      .where(eq(discountCodes.id, id))
      .returning();
    return result[0];
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

  async getBotSettings(botId: string): Promise<BotSettings | undefined> {
    const result = await db
      .select()
      .from(botSettings)
      .where(eq(botSettings.botId, botId))
      .limit(1);
    return result[0];
  }

  async createBotSettings(settings: InsertBotSettings): Promise<BotSettings> {
    const result = await db.insert(botSettings).values(settings).returning();
    return result[0];
  }

  async updateBotSettings(botId: string, updates: Partial<BotSettings>): Promise<BotSettings | undefined> {
    const result = await db
      .update(botSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(botSettings.botId, botId))
      .returning();
    return result[0];
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

  async updateEvaluationFromTrade(botId: string, pnl: number, newBalance: number, initialCapital: number): Promise<void> {
    const evaluation = await this.getBotEvaluation(botId);
    
    // Only update if bot is currently in evaluation
    if (!evaluation || evaluation.status !== 'in_progress') {
      return;
    }

    // Increment trade count
    const newTradeCount = evaluation.currentTrades + 1;
    
    // Update total P&L
    const currentPnl = parseFloat(evaluation.currentPnl.toString());
    const newPnl = currentPnl + pnl;
    const newPnlPercent = (newPnl / initialCapital) * 100;
    
    // Calculate drawdown
    const drawdown = ((initialCapital - newBalance) / initialCapital) * 100;
    const currentMaxDrawdown = parseFloat(evaluation.currentDrawdownPercent.toString());
    const newMaxDrawdown = Math.max(currentMaxDrawdown, drawdown);

    // Update evaluation metrics
    await this.updateBotEvaluation(botId, {
      currentTrades: newTradeCount,
      currentPnl: newPnl.toFixed(2),
      currentPnlPercent: newPnlPercent.toFixed(2),
      currentDrawdownPercent: newMaxDrawdown.toFixed(2),
    });

    console.log(`[Evaluation] Bot ${botId} progress: ${newTradeCount} trades, ${newPnlPercent.toFixed(2)}% P&L, ${newMaxDrawdown.toFixed(2)}% max drawdown`);

    // Check if evaluation passed or failed
    await this.checkAndUpdateEvaluationStatus(botId);
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

    // Check if failed drawdown rule (instant fail)
    if (currentDrawdown > maxDrawdown) {
      const failureReason = `Maximum drawdown exceeded: ${currentDrawdown.toFixed(2)}% (limit: ${maxDrawdown}%)`;
      
      await this.updateBotEvaluation(botId, {
        status: 'failed',
        completedAt: new Date(),
        evaluationNotes: `Failed: ${failureReason}`
      });
      
      // Update bot evaluation status and failure reason
      await db
        .update(bots)
        .set({ 
          evaluationStatus: 'failed',
          failureReason 
        })
        .where(eq(bots.id, botId));

      console.log(`[Evaluation] Bot ${botId} FAILED: ${failureReason}`);
      
      return {
        status: 'failed',
        passed: false,
        reason: failureReason
      };
    }
    
    // Check if failed due to too many trades without meeting requirements
    // If bot has completed 50 trades but still hasn't met profit requirement, mark as failed
    if (currentTrades >= 50 && currentPnlPercent < requiredProfit) {
      const failureReason = `Insufficient profit after 50 trades: ${currentPnlPercent.toFixed(2)}% (required: ${requiredProfit}%)`;
      
      await this.updateBotEvaluation(botId, {
        status: 'failed',
        completedAt: new Date(),
        evaluationNotes: `Failed: ${failureReason}`
      });
      
      // Update bot evaluation status and failure reason
      await db
        .update(bots)
        .set({ 
          evaluationStatus: 'failed',
          failureReason 
        })
        .where(eq(bots.id, botId));

      console.log(`[Evaluation] Bot ${botId} FAILED: ${failureReason}`);
      
      return {
        status: 'failed',
        passed: false,
        reason: failureReason
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

  async restartBotEvaluation(botId: string): Promise<void> {
    // Get active evaluation run to delete associated trades/positions
    const activeRun = await this.getActiveEvaluationRun(botId);
    
    if (activeRun) {
      // Delete all evaluation positions for this run
      await db
        .delete(botEvaluationPositions)
        .where(eq(botEvaluationPositions.evaluationRunId, activeRun.id));
      
      // Delete all evaluation trades for this run
      await db
        .delete(botEvaluationTrades)
        .where(eq(botEvaluationTrades.evaluationRunId, activeRun.id));
      
      // Close the old evaluation run
      await db
        .update(botEvaluationRuns)
        .set({ status: 'cancelled', completedAt: new Date() })
        .where(eq(botEvaluationRuns.id, activeRun.id));
    }
    
    console.log(`[Evaluation] Deleted all evaluation trades and positions for bot ${botId}`);
    
    // Reset bot evaluation record
    await this.updateBotEvaluation(botId, {
      status: 'in_progress',
      currentTrades: 0,
      currentPnl: '0.00',
      currentPnlPercent: '0.00',
      currentDrawdownPercent: '0.00',
      completedAt: null,
      evaluationNotes: '',
    });
    
    // Reset bot status and clear failure reason
    await db
      .update(bots)
      .set({ 
        evaluationStatus: 'in_evaluation',
        failureReason: null 
      })
      .where(eq(bots.id, botId));
    
    // Invalidate cache
    this.getAllBots.clear();
    
    // Create a new evaluation run for a fresh start
    await this.createEvaluationRun(botId);
    
    console.log(`[Evaluation] Bot ${botId} evaluation restarted - all trades cleared, new run created, status reset to in_evaluation`);
  }

  async getActiveEvaluationRun(botId: string): Promise<BotEvaluationRun | undefined> {
    const result = await db
      .select()
      .from(botEvaluationRuns)
      .where(
        and(
          eq(botEvaluationRuns.botId, botId),
          eq(botEvaluationRuns.status, 'active')
        )
      )
      .limit(1);
    return result[0];
  }

  async createEvaluationRun(botId: string, startingBalance: string = "10000.00"): Promise<BotEvaluationRun> {
    const result = await db
      .insert(botEvaluationRuns)
      .values({
        botId,
        startingBalance,
        currentBalance: startingBalance,
        peakEquity: startingBalance,
      })
      .returning();
    
    const newRun = result[0];
    
    await db
      .update(botEvaluations)
      .set({ activeRunId: newRun.id })
      .where(eq(botEvaluations.botId, botId));
    
    console.log(`[Evaluation] Created new evaluation run ${newRun.id} for bot ${botId}`);
    return newRun;
  }

  async updateEvaluationRunMetrics(runId: string, metrics: Partial<BotEvaluationRun>): Promise<BotEvaluationRun | undefined> {
    const result = await db
      .update(botEvaluationRuns)
      .set(metrics)
      .where(eq(botEvaluationRuns.id, runId))
      .returning();
    return result[0];
  }

  async closeEvaluationRun(runId: string, status: string, failureReason?: string): Promise<BotEvaluationRun | undefined> {
    const result = await db
      .update(botEvaluationRuns)
      .set({
        status,
        failureReason,
        completedAt: new Date(),
      })
      .where(eq(botEvaluationRuns.id, runId))
      .returning();
    
    console.log(`[Evaluation] Closed evaluation run ${runId} with status ${status}`);
    return result[0];
  }

  async createEvaluationTrade(trade: InsertBotEvaluationTrade): Promise<BotEvaluationTrade> {
    const result = await db
      .insert(botEvaluationTrades)
      .values(trade)
      .returning();
    return result[0];
  }

  async getEvaluationTrades(evaluationRunId: string, limit: number = 100): Promise<BotEvaluationTrade[]> {
    const result = await db
      .select()
      .from(botEvaluationTrades)
      .where(eq(botEvaluationTrades.evaluationRunId, evaluationRunId))
      .orderBy(desc(botEvaluationTrades.executedAt))
      .limit(limit);
    return result;
  }

  async getEvaluationPosition(evaluationRunId: string, symbol: string): Promise<BotEvaluationPosition | undefined> {
    const result = await db
      .select()
      .from(botEvaluationPositions)
      .where(
        and(
          eq(botEvaluationPositions.evaluationRunId, evaluationRunId),
          eq(botEvaluationPositions.symbol, symbol),
          eq(botEvaluationPositions.status, 'open')
        )
      )
      .limit(1);
    return result[0];
  }

  async getEvaluationPositionById(id: string): Promise<BotEvaluationPosition | undefined> {
    const result = await db
      .select()
      .from(botEvaluationPositions)
      .where(eq(botEvaluationPositions.id, id))
      .limit(1);
    return result[0];
  }

  async getEvaluationPositionsByRunId(evaluationRunId: string, limit: number = 100): Promise<BotEvaluationPosition[]> {
    const result = await db
      .select()
      .from(botEvaluationPositions)
      .where(eq(botEvaluationPositions.evaluationRunId, evaluationRunId))
      .orderBy(desc(botEvaluationPositions.openedAt))
      .limit(limit);
    return result;
  }

  async createEvaluationPosition(position: InsertBotEvaluationPosition): Promise<BotEvaluationPosition> {
    const result = await db
      .insert(botEvaluationPositions)
      .values(position)
      .returning();
    return result[0];
  }

  async updateEvaluationPosition(id: string, updates: Partial<BotEvaluationPosition>): Promise<BotEvaluationPosition | undefined> {
    const result = await db
      .update(botEvaluationPositions)
      .set(updates)
      .where(eq(botEvaluationPositions.id, id))
      .returning();
    return result[0];
  }

  async closeEvaluationPosition(id: string, realizedPnl: string): Promise<BotEvaluationPosition | undefined> {
    const result = await db
      .update(botEvaluationPositions)
      .set({
        status: 'closed',
        realizedPnl,
        closedAt: new Date(),
      })
      .where(eq(botEvaluationPositions.id, id))
      .returning();
    return result[0];
  }

  async getAdminStats(): Promise<{
    totalUsers: number;
    activeBots: number;
    platformRevenue: string;
    pendingApprovals: number;
  }> {
    // Count total users
    const userCountResult = await db
      .select({ count: count() })
      .from(users);
    const totalUsers = userCountResult[0]?.count || 0;

    // Count active bots
    const botCountResult = await db
      .select({ count: count() })
      .from(bots)
      .where(eq(bots.isActive, true));
    const activeBots = botCountResult[0]?.count || 0;

    // Calculate platform revenue (25% of all subscription monthly prices)
    const revenueResult = await db
      .select({
        total: sql<string>`COALESCE(SUM(${bots.monthlyPrice} * 0.25), 0)`,
      })
      .from(subscriptions)
      .innerJoin(bots, eq(subscriptions.botId, bots.id))
      .where(eq(subscriptions.status, 'active'));
    const platformRevenue = parseFloat(revenueResult[0]?.total || '0').toFixed(2);

    // Count pending creator applications
    const pendingAppResult = await db
      .select({ count: count() })
      .from(creatorApplications)
      .where(eq(creatorApplications.status, 'pending'));
    const pendingApprovals = pendingAppResult[0]?.count || 0;

    return {
      totalUsers,
      activeBots,
      platformRevenue,
      pendingApprovals,
    };
  }

  async getRecentUsers(limit: number = 10): Promise<Array<User & { subscriptionCount: number }>> {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        role: users.role,
        stripeCustomerId: users.stripeCustomerId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        subscriptionCount: sql<number>`COUNT(DISTINCT ${subscriptions.id})`,
      })
      .from(users)
      .leftJoin(subscriptions, eq(users.id, subscriptions.userId))
      .groupBy(users.id)
      .orderBy(desc(users.createdAt))
      .limit(limit);

    return result.map(row => ({
      id: row.id,
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      profileImageUrl: row.profileImageUrl,
      role: row.role,
      stripeCustomerId: row.stripeCustomerId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      subscriptionCount: row.subscriptionCount,
    }));
  }

  async getPendingCreatorApplications(): Promise<Array<CreatorApplication & { user: User }>> {
    const result = await db
      .select()
      .from(creatorApplications)
      .innerJoin(users, eq(creatorApplications.userId, users.id))
      .where(eq(creatorApplications.status, 'pending'))
      .orderBy(desc(creatorApplications.createdAt));

    return result.map(row => ({
      ...row.creator_applications,
      user: row.users,
    }));
  }

  async getCreatorEarnings(creatorId: string): Promise<{
    totalEarnings: string;
    totalPayouts: string;
    pendingBalance: string;
  }> {
    // Calculate total earnings (75% of all active subscriptions to creator's bots)
    const earningsResult = await db
      .select({
        total: sql<string>`COALESCE(SUM(${bots.monthlyPrice} * 0.75), 0)`,
      })
      .from(subscriptions)
      .innerJoin(bots, eq(subscriptions.botId, bots.id))
      .where(and(
        eq(bots.creatorId, creatorId),
        eq(subscriptions.status, 'active')
      ));
    const totalEarnings = parseFloat(earningsResult[0]?.total || '0').toFixed(2);

    // Calculate total payouts (sum of all completed/processing payouts)
    const payoutsResult = await db
      .select({
        total: sql<string>`COALESCE(SUM(${payouts.amount}), 0)`,
      })
      .from(payouts)
      .where(and(
        eq(payouts.creatorId, creatorId),
        or(
          eq(payouts.status, 'completed'),
          eq(payouts.status, 'processing')
        )
      ));
    const totalPayouts = parseFloat(payoutsResult[0]?.total || '0').toFixed(2);

    // Calculate pending balance
    const pendingBalance = (parseFloat(totalEarnings) - parseFloat(totalPayouts)).toFixed(2);

    return {
      totalEarnings,
      totalPayouts,
      pendingBalance,
    };
  }

  async createPayoutRequest(payout: InsertPayout): Promise<Payout> {
    const result = await db
      .insert(payouts)
      .values(payout)
      .returning();
    return result[0];
  }

  async getCreatorPayouts(creatorId: string): Promise<Payout[]> {
    return await db
      .select()
      .from(payouts)
      .where(eq(payouts.creatorId, creatorId))
      .orderBy(desc(payouts.requestedAt));
  }

  async getPendingPayouts(): Promise<Array<Payout & { creator: User }>> {
    const result = await db
      .select()
      .from(payouts)
      .innerJoin(users, eq(payouts.creatorId, users.id))
      .where(eq(payouts.status, 'pending'))
      .orderBy(desc(payouts.requestedAt));

    return result.map(row => ({
      ...row.payouts,
      creator: row.users,
    }));
  }

  async approvePayoutRequest(payoutId: string, adminId: string): Promise<Payout | undefined> {
    const result = await db
      .update(payouts)
      .set({
        status: 'processing',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payouts.id, payoutId))
      .returning();
    return result[0];
  }

  async rejectPayoutRequest(payoutId: string, adminId: string, reason: string): Promise<Payout | undefined> {
    const result = await db
      .update(payouts)
      .set({
        status: 'rejected',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectionReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(payouts.id, payoutId))
      .returning();
    return result[0];
  }

  async completePayoutRequest(payoutId: string, transferId: string): Promise<Payout | undefined> {
    const result = await db
      .update(payouts)
      .set({
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date(),
        paymentDetails: { transferId },
      })
      .where(eq(payouts.id, payoutId))
      .returning();
    return result[0];
  }
}

export const storage = new DbStorage();
