import { db } from "./db";
import { users, bots, botPerformance, subscriptions, exchangeConnections, botTradeLogs, botPerformanceHistory, subscriptionEvents, creatorPosts, postComments, postReactions } from "@shared/schema";
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
  PostReaction, InsertPostReaction
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
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
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
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
    return result[0];
  }

  async getAllBots(): Promise<Array<Bot & { performance: BotPerformance | null }>> {
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
    return result[0];
  }

  async updateBot(id: string, bot: Partial<InsertBot>): Promise<Bot | undefined> {
    const result = await db.update(bots).set(bot).where(eq(bots.id, id)).returning();
    return result[0];
  }

  async getBotPerformance(botId: string): Promise<BotPerformance | undefined> {
    const result = await db.select().from(botPerformance).where(eq(botPerformance.botId, botId)).limit(1);
    return result[0];
  }

  async upsertBotPerformance(performance: InsertBotPerformance): Promise<BotPerformance> {
    const existing = await this.getBotPerformance(performance.botId);
    
    if (existing) {
      const result = await db
        .update(botPerformance)
        .set({ ...performance, updatedAt: new Date() })
        .where(eq(botPerformance.botId, performance.botId))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(botPerformance).values(performance).returning();
      return result[0];
    }
  }

  async getUserSubscriptions(userId: string): Promise<Array<Subscription & { bot: Bot; performance: BotPerformance | null }>> {
    const result = await db
      .select()
      .from(subscriptions)
      .innerJoin(bots, eq(subscriptions.botId, bots.id))
      .leftJoin(botPerformance, eq(bots.id, botPerformance.botId))
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active")))
      .orderBy(desc(subscriptions.startedAt));
    
    return result.map(row => ({
      ...row.subscriptions,
      bot: row.bots,
      performance: row.bot_performance,
    }));
  }

  async getSubscription(userId: string, botId: string): Promise<Subscription | undefined> {
    const result = await db
      .select()
      .from(subscriptions)
      .where(and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.botId, botId),
        eq(subscriptions.status, "active")
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
    return result[0];
  }

  async pauseSubscription(id: string, reason: string): Promise<Subscription | undefined> {
    const result = await db
      .update(subscriptions)
      .set({ isPaused: true, pauseReason: reason })
      .where(eq(subscriptions.id, id))
      .returning();
    return result[0];
  }

  async resumeSubscription(id: string): Promise<Subscription | undefined> {
    const result = await db
      .update(subscriptions)
      .set({ isPaused: false, pauseReason: null })
      .where(eq(subscriptions.id, id))
      .returning();
    return result[0];
  }

  async cancelSubscription(id: string): Promise<Subscription | undefined> {
    const result = await db
      .update(subscriptions)
      .set({ status: "cancelled", cancelledAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
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
}

export const storage = new DbStorage();
