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
  stripeCustomerId: text("stripe_customer_id"),
  stripeConnectAccountId: text("stripe_connect_account_id"),
  stripeConnectOnboardingComplete: boolean("stripe_connect_onboarding_complete").notNull().default(false),
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
  iconUrl: text("icon_url"),
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  isVerified: boolean("is_verified").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  evaluationStatus: text("evaluation_status").notNull().default("not_started"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_bots_creator_id").on(table.creatorId),
  index("idx_bots_is_active").on(table.isActive),
  index("idx_bots_evaluation_status").on(table.evaluationStatus),
]);

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
}, (table) => [
  index("idx_bot_performance_bot_id").on(table.botId),
]);

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  botId: varchar("bot_id").notNull().references(() => bots.id),
  stripeSubscriptionId: text("stripe_subscription_id"),
  exchangeConnectionId: varchar("exchange_connection_id").references(() => exchangeConnections.id),
  status: text("status").notNull().default("active"),
  capitalAllocated: decimal("capital_allocated", { precision: 10, scale: 2 }),
  capitalAllocatedType: text("capital_allocated_type").notNull().default("amount"),
  riskPercentage: integer("risk_percentage").notNull().default(2),
  maxDrawdown: decimal("max_drawdown", { precision: 5, scale: 2 }).notNull().default("10.00"),
  maxPositionsPerSymbol: integer("max_positions_per_symbol").notNull().default(1),
  isPaused: boolean("is_paused").notNull().default(false),
  pauseReason: text("pause_reason"),
  notificationPrefs: jsonb("notification_prefs").notNull().default(sql`'{"newTrade":true,"drawdownBreach":true,"weeklySummary":true,"monthlySummary":true}'::jsonb`),
  currentBalance: decimal("current_balance", { precision: 15, scale: 2 }).notNull().default("0.00"),
  totalPnl: decimal("total_pnl", { precision: 15, scale: 2 }).notNull().default("0.00"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  cancelledAt: timestamp("cancelled_at"),
  subscriptionEndsAt: timestamp("subscription_ends_at"),
}, (table) => [
  index("idx_subscriptions_user_status_started").on(table.userId, table.status, table.startedAt.desc()),
  index("idx_subscriptions_bot_id").on(table.botId),
  index("idx_subscriptions_exchange_connection").on(table.exchangeConnectionId),
]);

export const exchangeConnections = pgTable("exchange_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  exchange: text("exchange").notNull(),
  apiKey: text("api_key").notNull(),
  apiSecret: text("api_secret").notNull(),
  passphrase: text("passphrase"),
  balance: decimal("balance", { precision: 15, scale: 2 }).notNull().default("10000.00"),
  connectionType: text("connection_type").notNull().default("paper"),
  accountType: text("account_type").notNull().default("spot"),
  isTestnet: boolean("is_testnet").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  connectionStatus: text("connection_status").notNull().default("unchecked"),
  lastSyncedAt: timestamp("last_synced_at"),
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

export const creatorPosts = pgTable("creator_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  botId: varchar("bot_id").notNull().references(() => bots.id),
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  postType: text("post_type").notNull().default("text"),
  chartData: jsonb("chart_data"),
  tradeLogId: varchar("trade_log_id").references(() => botTradeLogs.id),
  isAutoGenerated: boolean("is_auto_generated").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const postComments = pgTable("post_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => creatorPosts.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  parentCommentId: varchar("parent_comment_id").references(() => postComments.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const postReactions = pgTable("post_reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => creatorPosts.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  reactionType: text("reaction_type").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const botWebhooks = pgTable("bot_webhooks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  botId: varchar("bot_id").notNull().unique().references(() => bots.id),
  secret: text("secret").notNull(),
  status: text("status").notNull().default("active"),
  lastReceivedAt: timestamp("last_received_at"),
  failureCount: integer("failure_count").notNull().default(0),
  disabledAt: timestamp("disabled_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const webhookEventLogs = pgTable("webhook_event_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  botId: varchar("bot_id").notNull().references(() => bots.id),
  payload: jsonb("payload").notNull(),
  headers: jsonb("headers"),
  status: text("status").notNull(),
  error: text("error"),
  processedAt: timestamp("processed_at").notNull().defaultNow(),
}, (table) => [
  index("idx_webhook_event_logs_bot_id").on(table.botId),
  index("idx_webhook_event_logs_processed_at").on(table.processedAt),
]);

export const trades = pgTable("trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subscriptionId: varchar("subscription_id").notNull().references(() => subscriptions.id),
  botId: varchar("bot_id").notNull().references(() => bots.id),
  symbol: text("symbol").notNull(),
  side: text("side").notNull(),
  quantity: decimal("quantity", { precision: 15, scale: 8 }).notNull(),
  price: decimal("price", { precision: 15, scale: 2 }).notNull(),
  exchange: text("exchange").notNull(),
  status: text("status").notNull().default("filled"),
  fees: decimal("fees", { precision: 10, scale: 2 }).notNull().default("0.00"),
  pnl: decimal("pnl", { precision: 15, scale: 2 }),
  executedAt: timestamp("executed_at").notNull().defaultNow(),
}, (table) => [
  index("idx_trades_subscription_executed").on(table.subscriptionId, table.executedAt.desc()),
  index("idx_trades_bot_executed").on(table.botId, table.executedAt.desc()),
]);

export const positions = pgTable("positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subscriptionId: varchar("subscription_id").notNull().references(() => subscriptions.id),
  botId: varchar("bot_id").notNull().references(() => bots.id),
  symbol: text("symbol").notNull(),
  positionType: text("position_type").notNull().default("long"),
  quantity: decimal("quantity", { precision: 15, scale: 8 }).notNull(),
  entryPrice: decimal("entry_price", { precision: 15, scale: 2 }).notNull(),
  currentPrice: decimal("current_price", { precision: 15, scale: 2 }).notNull(),
  unrealizedPnl: decimal("unrealized_pnl", { precision: 15, scale: 2 }).notNull().default("0.00"),
  status: text("status").notNull().default("open"),
  openedAt: timestamp("opened_at").notNull().defaultNow(),
  closedAt: timestamp("closed_at"),
}, (table) => [
  index("idx_positions_subscription_status_opened").on(table.subscriptionId, table.status, table.openedAt.desc()),
]);

export const userOnboarding = pgTable("user_onboarding", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id),
  hasCompletedWelcome: boolean("has_completed_welcome").notNull().default(false),
  hasViewedMarketplace: boolean("has_viewed_marketplace").notNull().default(false),
  hasSubscribedToBot: boolean("has_subscribed_to_bot").notNull().default(false),
  hasConfiguredSettings: boolean("has_configured_settings").notNull().default(false),
  hasViewedDashboard: boolean("has_viewed_dashboard").notNull().default(false),
  hasDismissedChecklist: boolean("has_dismissed_checklist").notNull().default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const creatorApplications = pgTable("creator_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id),
  status: text("status").notNull().default("pending"),
  tradingExperience: text("trading_experience").notNull(),
  strategyDescription: text("strategy_description").notNull(),
  performanceProof: text("performance_proof"),
  rejectionReason: text("rejection_reason"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_creator_applications_status").on(table.status),
  index("idx_creator_applications_user_id").on(table.userId),
]);

export const featuredPlacements = pgTable("featured_placements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  botId: varchar("bot_id").notNull().references(() => bots.id),
  placementType: text("placement_type").notNull().default("hero"),
  paymentAmount: decimal("payment_amount", { precision: 10, scale: 2 }).notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").notNull().default("scheduled"),
  impressions: integer("impressions").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_featured_placements_dates").on(table.startDate, table.endDate),
  index("idx_featured_placements_bot_id").on(table.botId),
  index("idx_featured_placements_status").on(table.status),
]);

export const botEvaluations = pgTable("bot_evaluations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  botId: varchar("bot_id").notNull().unique().references(() => bots.id),
  status: text("status").notNull().default("in_progress"),
  requiredTrades: integer("required_trades").notNull().default(15),
  requiredProfitPercent: decimal("required_profit_percent", { precision: 10, scale: 2 }).notNull().default("8.00"),
  requiredMaxDrawdownPercent: decimal("required_max_drawdown_percent", { precision: 10, scale: 2 }).notNull().default("12.00"),
  currentTrades: integer("current_trades").notNull().default(0),
  currentPnl: decimal("current_pnl", { precision: 15, scale: 2 }).notNull().default("0.00"),
  currentPnlPercent: decimal("current_pnl_percent", { precision: 10, scale: 2 }).notNull().default("0.00"),
  currentDrawdownPercent: decimal("current_drawdown_percent", { precision: 10, scale: 2 }).notNull().default("0.00"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  evaluationNotes: text("evaluation_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_bot_evaluations_status").on(table.status),
  index("idx_bot_evaluations_bot_id").on(table.botId),
]);

export const payouts = pgTable("payouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  paymentMethod: text("payment_method"),
  paymentDetails: jsonb("payment_details"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  completedAt: timestamp("completed_at"),
  rejectionReason: text("rejection_reason"),
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_payouts_creator_id").on(table.creatorId),
  index("idx_payouts_status").on(table.status),
]);

export const insertBotSchema = createInsertSchema(bots).omit({ id: true, createdAt: true });
export const insertBotPerformanceSchema = createInsertSchema(botPerformance).omit({ id: true, updatedAt: true });
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, startedAt: true, cancelledAt: true }).extend({
  stripeSubscriptionId: z.string().min(1, "Stripe subscription ID is required"),
});
export const insertExchangeConnectionSchema = createInsertSchema(exchangeConnections).omit({ id: true, createdAt: true });
export const insertBotTradeLogSchema = createInsertSchema(botTradeLogs).omit({ id: true });
export const insertBotPerformanceHistorySchema = createInsertSchema(botPerformanceHistory).omit({ id: true, createdAt: true });
export const insertSubscriptionEventSchema = createInsertSchema(subscriptionEvents).omit({ id: true, createdAt: true });
export const insertCreatorPostSchema = createInsertSchema(creatorPosts).omit({ id: true, createdAt: true });
export const insertPostCommentSchema = createInsertSchema(postComments).omit({ id: true, createdAt: true });
export const insertPostReactionSchema = createInsertSchema(postReactions).omit({ id: true, createdAt: true });
export const insertBotWebhookSchema = createInsertSchema(botWebhooks).omit({ id: true, createdAt: true });
export const insertWebhookEventLogSchema = createInsertSchema(webhookEventLogs).omit({ id: true, processedAt: true });
export const insertTradeSchema = createInsertSchema(trades).omit({ id: true, executedAt: true });
export const insertPositionSchema = createInsertSchema(positions).omit({ id: true, openedAt: true, closedAt: true });
export const insertUserOnboardingSchema = createInsertSchema(userOnboarding).omit({ id: true, createdAt: true, updatedAt: true, completedAt: true });
export const insertCreatorApplicationSchema = createInsertSchema(creatorApplications).omit({ id: true, createdAt: true, updatedAt: true, reviewedAt: true });
export const insertFeaturedPlacementSchema = createInsertSchema(featuredPlacements).omit({ id: true, createdAt: true });
export const insertBotEvaluationSchema = createInsertSchema(botEvaluations).omit({ id: true, createdAt: true, updatedAt: true, startedAt: true, completedAt: true });
export const insertPayoutSchema = createInsertSchema(payouts).omit({ id: true, createdAt: true, updatedAt: true, requestedAt: true, reviewedAt: true, completedAt: true });

export const updateBotEvaluationProgressSchema = z.object({
  currentTrades: z.number().int().nonnegative().optional(),
  currentPnl: z.string().optional(),
  currentPnlPercent: z.string().optional(),
  currentDrawdownPercent: z.string().optional(),
});

export const updateSubscriptionSettingsSchema = z.object({
  capitalAllocated: z.number().positive().optional(),
  capitalAllocatedType: z.enum(["amount", "percent"]).optional(),
  riskPercentage: z.number().int().min(1).max(5).optional(),
  maxDrawdown: z.number().positive().max(100).optional(),
  maxPositionsPerSymbol: z.number().int().min(1).max(5).optional(),
  exchangeConnectionId: z.string().nullable().optional(),
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
export type InsertCreatorPost = z.infer<typeof insertCreatorPostSchema>;
export type CreatorPost = typeof creatorPosts.$inferSelect;
export type InsertPostComment = z.infer<typeof insertPostCommentSchema>;
export type PostComment = typeof postComments.$inferSelect;
export type InsertPostReaction = z.infer<typeof insertPostReactionSchema>;
export type PostReaction = typeof postReactions.$inferSelect;
export type InsertBotWebhook = z.infer<typeof insertBotWebhookSchema>;
export type BotWebhook = typeof botWebhooks.$inferSelect;
export type InsertWebhookEventLog = z.infer<typeof insertWebhookEventLogSchema>;
export type WebhookEventLog = typeof webhookEventLogs.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof trades.$inferSelect;
export type InsertPosition = z.infer<typeof insertPositionSchema>;
export type Position = typeof positions.$inferSelect;
export type InsertUserOnboarding = z.infer<typeof insertUserOnboardingSchema>;
export type UserOnboarding = typeof userOnboarding.$inferSelect;
export type InsertCreatorApplication = z.infer<typeof insertCreatorApplicationSchema>;
export type CreatorApplication = typeof creatorApplications.$inferSelect;
export type InsertFeaturedPlacement = z.infer<typeof insertFeaturedPlacementSchema>;
export type FeaturedPlacement = typeof featuredPlacements.$inferSelect;
export type InsertBotEvaluation = z.infer<typeof insertBotEvaluationSchema>;
export type BotEvaluation = typeof botEvaluations.$inferSelect;
export type InsertPayout = z.infer<typeof insertPayoutSchema>;
export type Payout = typeof payouts.$inferSelect;
