import { db } from "./db";
import { users, bots, botPerformance } from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

  const creators = [
    { id: "creator-1", email: "cryptoquant@example.com", name: "CryptoQuant", role: "creator" },
    { id: "creator-2", email: "traderpro@example.com", name: "TraderPro", role: "creator" },
    { id: "creator-3", email: "algomaster@example.com", name: "AlgoMaster", role: "creator" },
  ];

  await db.insert(users).values(creators).onConflictDoNothing();
  console.log(`Created ${creators.length} creator accounts`);

  const sampleBots = [
    {
      name: "Momentum Master",
      description: "Advanced momentum-based strategy that capitalizes on strong trending markets. Uses RSI and MACD indicators to identify optimal entry and exit points.",
      strategy: "Momentum",
      riskLevel: "Medium",
      monthlyPrice: "99.00",
      creatorId: "creator-1",
      isActive: true,
    },
    {
      name: "Grid Trader Pro",
      description: "Sophisticated grid trading bot that profits from market volatility. Places buy and sell orders at predetermined intervals to capture price oscillations.",
      strategy: "Grid Trading",
      riskLevel: "Low",
      monthlyPrice: "79.00",
      creatorId: "creator-2",
      isActive: true,
    },
    {
      name: "Scalper Elite",
      description: "High-frequency scalping bot designed for quick profits. Executes dozens of trades daily, capturing small price movements with tight stop losses.",
      strategy: "Scalping",
      riskLevel: "High",
      monthlyPrice: "149.00",
      creatorId: "creator-3",
      isActive: true,
    },
    {
      name: "DCA Master",
      description: "Dollar-cost averaging strategy that systematically accumulates positions over time. Perfect for long-term investors who want to reduce timing risk.",
      strategy: "DCA",
      riskLevel: "Low",
      monthlyPrice: "59.00",
      creatorId: "creator-1",
      isActive: true,
    },
    {
      name: "Mean Reversion Pro",
      description: "Identifies overbought and oversold conditions to trade market reversals. Uses Bollinger Bands and statistical analysis to find optimal entries.",
      strategy: "Mean Reversion",
      riskLevel: "Medium",
      monthlyPrice: "89.00",
      creatorId: "creator-2",
      isActive: true,
    },
    {
      name: "Arbitrage Hunter",
      description: "Exploits price differences across multiple exchanges. Lightning-fast execution captures risk-free profits from market inefficiencies.",
      strategy: "Arbitrage",
      riskLevel: "Low",
      monthlyPrice: "199.00",
      creatorId: "creator-3",
      isActive: true,
    },
  ];

  const createdBots = await db.insert(bots).values(sampleBots).onConflictDoNothing().returning();
  console.log(`Created ${createdBots.length} bots`);

  const performanceData = createdBots.map((bot, index) => {
    const performances = [
      { totalRoi: "124.50", winRate: "68.00", sharpeRatio: "2.40", maxDrawdown: "12.30", totalTrades: 1245, subscribers: 342 },
      { totalRoi: "87.20", winRate: "72.50", sharpeRatio: "2.10", maxDrawdown: "8.50", totalTrades: 892, subscribers: 278 },
      { totalRoi: "156.80", winRate: "61.20", sharpeRatio: "1.90", maxDrawdown: "18.40", totalTrades: 2341, subscribers: 198 },
      { totalRoi: "45.30", winRate: "78.90", sharpeRatio: "2.80", maxDrawdown: "5.20", totalTrades: 412, subscribers: 456 },
      { totalRoi: "98.70", winRate: "65.40", sharpeRatio: "2.20", maxDrawdown: "11.80", totalTrades: 1087, subscribers: 312 },
      { totalRoi: "189.20", winRate: "82.10", sharpeRatio: "3.10", maxDrawdown: "4.60", totalTrades: 3421, subscribers: 523 },
    ];
    return {
      botId: bot.id,
      ...performances[index],
    };
  });

  if (performanceData.length > 0) {
    await db.insert(botPerformance).values(performanceData).onConflictDoNothing();
    console.log(`Created performance data for ${performanceData.length} bots`);
  }

  console.log("Seeding complete!");
}

seed().catch(console.error);
