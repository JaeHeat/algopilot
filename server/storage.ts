import { db } from "./db";
import { users, bots, botPerformance, subscriptions, exchangeConnections } from "@shared/schema";
import type { 
  User, UpsertUser, 
  Bot, InsertBot,
  BotPerformance, InsertBotPerformance,
  Subscription, InsertSubscription,
  ExchangeConnection, InsertExchangeConnection
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  getAllBots(): Promise<Array<Bot & { performance: BotPerformance | null }>>;
  getBotById(id: string): Promise<Bot | undefined>;
  createBot(bot: InsertBot): Promise<Bot>;
  updateBot(id: string, bot: Partial<InsertBot>): Promise<Bot | undefined>;
  
  getBotPerformance(botId: string): Promise<BotPerformance | undefined>;
  upsertBotPerformance(performance: InsertBotPerformance): Promise<BotPerformance>;
  
  getUserSubscriptions(userId: string): Promise<Array<Subscription & { bot: Bot; performance: BotPerformance | null }>>;
  getSubscription(userId: string, botId: string): Promise<Subscription | undefined>;
  getSubscriptionById(id: string): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  cancelSubscription(id: string): Promise<Subscription | undefined>;
  
  getUserExchangeConnections(userId: string): Promise<ExchangeConnection[]>;
  getExchangeConnectionById(id: string): Promise<ExchangeConnection | undefined>;
  createExchangeConnection(connection: InsertExchangeConnection): Promise<ExchangeConnection>;
  deleteExchangeConnection(id: string): Promise<void>;
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

  async getBotById(id: string): Promise<Bot | undefined> {
    const result = await db.select().from(bots).where(eq(bots.id, id)).limit(1);
    return result[0];
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

  async cancelSubscription(id: string): Promise<Subscription | undefined> {
    const result = await db
      .update(subscriptions)
      .set({ status: "cancelled", cancelledAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
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
}

export const storage = new DbStorage();
