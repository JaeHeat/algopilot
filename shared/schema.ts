import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: text("role").notNull().default("subscriber"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bots = pgTable("bots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  strategyDescription: text("strategy_description").notNull().default(""),
  strategy: text("strategy").notNull(),
  riskLevel: text("risk_level").notNull(),
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }).notNull(),
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  isVerified: boolean("is_verified").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const botPerformance = pgTable("bot_performance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  botId: varchar("bot_id").notNull().references(() => bots.id),
  totalRoi: decimal("total_roi", { precision: 10, scale: 2 }).notNull(),
  winRate: decimal("win_rate", { precision: 5, scale: 2 }).notNull(),
  sharpeRatio: decimal("sharpe_ratio", { precision: 5, scale: 2 }).notNull(),
  maxDrawdown: decimal("max_drawdown", { precision: 10, scale: 2 }).notNull(),
  totalTrades: integer("total_trades").notNull(),
  subscribers: integer("subscribers").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  botId: varchar("bot_id").notNull().references(() => bots.id),
  stripeSubscriptionId: text("stripe_subscription_id"),
  status: text("status").notNull().default("active"),
  capitalAllocated: decimal("capital_allocated", { precision: 10, scale: 2 }),
  capitalAllocatedType: text("capital_allocated_type").notNull().default("amount"),
  riskPercentage: integer("risk_percentage").notNull().default(2),
  maxDrawdown: decimal("max_drawdown", { precision: 5, scale: 2 }).notNull().default("10.00"),
  isPaused: boolean("is_paused").notNull().default(false),
  pauseReason: text("pause_reason"),
  notificationPrefs: jsonb("notification_prefs").notNull().default(sql`'{"newTrade":true,"drawdownBreach":true,"weeklySummary":true,"monthlySummary":true}'::jsonb`),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  cancelledAt: timestamp("cancelled_at"),
});

export const exchangeConnections = pgTable("exchange_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  exchange: text("exchange").notNull(),
  apiKey: text("api_key").notNull(),
  apiSecret: text("api_secret").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const botTradeLogs = pgTable("bot_trade_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  botId: varchar("bot_id").notNull().references(() => bots.id),
  entryPrice: decimal("entry_price", { precision: 15, scale: 8 }).notNull(),
  exitPrice: decimal("exit_price", { precision: 15, scale: 8 }),
  entryTime: timestamp("entry_time").notNull(),
  exitTime: timestamp("exit_time"),
  durationMinutes: integer("duration_minutes"),
  pnlValue: decimal("pnl_value", { precision: 15, scale: 2 }),
  pnlPercentage: decimal("pnl_percentage", { precision: 10, scale: 2 }),
  positionSize: decimal("position_size", { precision: 15, scale: 2 }).notNull(),
  symbol: text("symbol").notNull(),
  side: text("side").notNull(),
  status: text("status").notNull().default("open"),
  metadata: jsonb("metadata"),
});

export const botPerformanceHistory = pgTable("bot_performance_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  botId: varchar("bot_id").notNull().references(() => bots.id),
  bucket: text("bucket").notNull(),
  equityCurve: jsonb("equity_curve").notNull(),
  roiPercentage: decimal("roi_percentage", { precision: 10, scale: 2 }).notNull(),
  sharpeRatio: decimal("sharpe_ratio", { precision: 5, scale: 2 }).notNull(),
  maxDrawdownPercentage: decimal("max_drawdown_percentage", { precision: 10, scale: 2 }).notNull(),
  totalTrades: integer("total_trades").notNull(),
  winRate: decimal("win_rate", { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const subscriptionEvents = pgTable("subscription_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subscriptionId: varchar("subscription_id").notNull().references(() => subscriptions.id),
  eventType: text("event_type").notNull(),
  eventData: jsonb("event_data"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBotSchema = createInsertSchema(bots).omit({ id: true, createdAt: true });
export const insertBotPerformanceSchema = createInsertSchema(botPerformance).omit({ id: true, updatedAt: true });
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, startedAt: true, cancelledAt: true });
export const insertExchangeConnectionSchema = createInsertSchema(exchangeConnections).omit({ id: true, createdAt: true });
export const insertBotTradeLogSchema = createInsertSchema(botTradeLogs).omit({ id: true });
export const insertBotPerformanceHistorySchema = createInsertSchema(botPerformanceHistory).omit({ id: true, createdAt: true });
export const insertSubscriptionEventSchema = createInsertSchema(subscriptionEvents).omit({ id: true, createdAt: true });

export const updateSubscriptionSettingsSchema = z.object({
  capitalAllocated: z.number().positive().optional(),
  capitalAllocatedType: z.enum(["amount", "percent"]).optional(),
  riskPercentage: z.number().int().min(1).max(5).optional(),
  maxDrawdown: z.number().positive().max(100).optional(),
  notificationPrefs: z.object({
    newTrade: z.boolean(),
    drawdownBreach: z.boolean(),
    weeklySummary: z.boolean(),
    monthlySummary: z.boolean(),
  }).optional(),
}).refine(
  (data) => {
    if (data.capitalAllocatedType === "percent" && data.capitalAllocated !== undefined) {
      return data.capitalAllocated <= 100;
    }
    return true;
  },
  {
    message: "Capital allocation percentage must not exceed 100%",
    path: ["capitalAllocated"],
  }
);

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertBot = z.infer<typeof insertBotSchema>;
export type Bot = typeof bots.$inferSelect;
export type InsertBotPerformance = z.infer<typeof insertBotPerformanceSchema>;
export type BotPerformance = typeof botPerformance.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertExchangeConnection = z.infer<typeof insertExchangeConnectionSchema>;
export type ExchangeConnection = typeof exchangeConnections.$inferSelect;
export type InsertBotTradeLog = z.infer<typeof insertBotTradeLogSchema>;
export type BotTradeLog = typeof botTradeLogs.$inferSelect;
export type InsertBotPerformanceHistory = z.infer<typeof insertBotPerformanceHistorySchema>;
export type BotPerformanceHistory = typeof botPerformanceHistory.$inferSelect;
export type InsertSubscriptionEvent = z.infer<typeof insertSubscriptionEventSchema>;
export type SubscriptionEvent = typeof subscriptionEvents.$inferSelect;
export type UpdateSubscriptionSettings = z.infer<typeof updateSubscriptionSettingsSchema>;
