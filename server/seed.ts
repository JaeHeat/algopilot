import { db } from "./db";
import { users, bots, botPerformance, botTradeLogs, botPerformanceHistory, subscriptions, exchangeConnections } from "@shared/schema";

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
      strategyDescription: "This bot analyzes momentum indicators across multiple timeframes to identify strong trends. It combines RSI divergence with MACD crossovers to enter positions when momentum is building and exits when momentum fades. The strategy includes dynamic position sizing based on volatility and trailing stops to protect profits.",
      strategy: "Momentum",
      riskLevel: "Medium",
      monthlyPrice: "99.00",
      creatorId: "creator-1",
      isVerified: true,
      isActive: true,
    },
    {
      name: "Grid Trader Pro",
      description: "Sophisticated grid trading bot that profits from market volatility. Places buy and sell orders at predetermined intervals to capture price oscillations.",
      strategyDescription: "The grid strategy places multiple limit orders above and below the current price at regular intervals. As the price moves through the grid, orders are executed automatically. Profits are captured from the spread between buy and sell orders. Best suited for ranging markets with moderate volatility.",
      strategy: "Grid Trading",
      riskLevel: "Low",
      monthlyPrice: "79.00",
      creatorId: "creator-2",
      isVerified: true,
      isActive: true,
    },
    {
      name: "Scalper Elite",
      description: "High-frequency scalping bot designed for quick profits. Executes dozens of trades daily, capturing small price movements with tight stop losses.",
      strategyDescription: "A high-frequency trading bot that capitalizes on minute-to-minute price movements. Uses order flow analysis and market microstructure to identify short-term opportunities. Employs aggressive position management with very tight stops and quick profit-taking. Typically holds positions for less than 5 minutes.",
      strategy: "Scalping",
      riskLevel: "High",
      monthlyPrice: "149.00",
      creatorId: "creator-3",
      isVerified: false,
      isActive: true,
    },
    {
      name: "DCA Master",
      description: "Dollar-cost averaging strategy that systematically accumulates positions over time. Perfect for long-term investors who want to reduce timing risk.",
      strategyDescription: "Implements a systematic dollar-cost averaging approach by making regular purchases at fixed intervals regardless of price. This strategy reduces the impact of volatility and eliminates the need to time the market. Ideal for building long-term positions with minimal emotional decision-making.",
      strategy: "DCA",
      riskLevel: "Low",
      monthlyPrice: "59.00",
      creatorId: "creator-1",
      isVerified: true,
      isActive: true,
    },
    {
      name: "Mean Reversion Pro",
      description: "Identifies overbought and oversold conditions to trade market reversals. Uses Bollinger Bands and statistical analysis to find optimal entries.",
      strategyDescription: "This strategy identifies price extremes using statistical analysis and Bollinger Bands. It enters positions when price moves beyond 2 standard deviations from the mean, betting on a return to average. Risk is managed through position sizing and stop losses placed beyond recent extremes.",
      strategy: "Mean Reversion",
      riskLevel: "Medium",
      monthlyPrice: "89.00",
      creatorId: "creator-2",
      isVerified: false,
      isActive: true,
    },
    {
      name: "Arbitrage Hunter",
      description: "Exploits price differences across multiple exchanges. Lightning-fast execution captures risk-free profits from market inefficiencies.",
      strategyDescription: "Monitors multiple exchanges simultaneously for price discrepancies. When a profitable spread is detected, the bot simultaneously buys on the cheaper exchange and sells on the more expensive one. Requires fast execution and accounts on multiple exchanges. Profits are typically small but consistent.",
      strategy: "Arbitrage",
      riskLevel: "Low",
      monthlyPrice: "199.00",
      creatorId: "creator-3",
      isVerified: true,
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

  // Generate trade logs for each bot
  const tradeLogs = [];
  const symbols = ["BTC/USDT", "ETH/USDT", "BNB/USDT", "SOL/USDT", "ADA/USDT", "DOT/USDT"];
  const sides = ["buy", "sell"] as const;
  
  for (const bot of createdBots) {
    const tradeCount = Math.floor(Math.random() * 30) + 20;
    for (let i = 0; i < tradeCount; i++) {
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const side = sides[Math.floor(Math.random() * sides.length)];
      const entryPrice = Math.random() * 100 + 20;
      const isOpen = Math.random() > 0.7;
      const exitPrice = isOpen ? null : entryPrice * (1 + (Math.random() - 0.45) * 0.1);
      const entryTime = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      const exitTime = isOpen ? null : new Date(entryTime.getTime() + Math.random() * 24 * 60 * 60 * 1000);
      const durationMinutes = exitTime ? Math.floor((exitTime.getTime() - entryTime.getTime()) / (1000 * 60)) : null;
      const pnlPercentage = exitPrice ? ((exitPrice - entryPrice) / entryPrice * 100).toFixed(2) : null;
      const positionSize = (Math.random() * 5000 + 1000).toFixed(2);
      const pnlValue = pnlPercentage ? (parseFloat(positionSize) * parseFloat(pnlPercentage) / 100).toFixed(2) : null;
      
      tradeLogs.push({
        botId: bot.id,
        symbol,
        side,
        entryPrice: entryPrice.toFixed(8),
        exitPrice: exitPrice ? exitPrice.toFixed(8) : null,
        entryTime,
        exitTime,
        durationMinutes,
        positionSize,
        pnlValue,
        pnlPercentage,
        status: isOpen ? "open" : "closed",
        metadata: { exchange: "Binance" },
      });
    }
  }
  
  if (tradeLogs.length > 0) {
    await db.insert(botTradeLogs).values(tradeLogs).onConflictDoNothing();
    console.log(`Created ${tradeLogs.length} trade logs`);
  }

  // Generate performance history for different time buckets
  const generateEquityCurve = (points: number, startValue: number, volatility: number) => {
    const curve = [startValue];
    for (let i = 1; i < points; i++) {
      const change = (Math.random() - 0.45) * volatility;
      curve.push(curve[i - 1] * (1 + change));
    }
    return curve;
  };

  const performanceHistory = [];
  const buckets = ["1D", "1W", "1M", "3M", "1Y", "ALL"];
  const bucketPoints = { "1D": 24, "1W": 168, "1M": 30, "3M": 90, "1Y": 365, "ALL": 500 };
  
  for (const bot of createdBots) {
    const perf = performanceData.find(p => p.botId === bot.id);
    if (!perf) continue;
    
    for (const bucket of buckets) {
      const points = bucketPoints[bucket as keyof typeof bucketPoints];
      const roi = parseFloat(perf.totalRoi);
      const startValue = 10000;
      const endValue = startValue * (1 + roi / 100);
      const volatility = bucket === "1D" ? 0.02 : bucket === "1W" ? 0.05 : 0.08;
      
      const equityCurve = generateEquityCurve(points, startValue, volatility);
      equityCurve[equityCurve.length - 1] = endValue;
      
      performanceHistory.push({
        botId: bot.id,
        bucket,
        equityCurve,
        roiPercentage: perf.totalRoi,
        sharpeRatio: perf.sharpeRatio,
        maxDrawdownPercentage: perf.maxDrawdown,
        totalTrades: perf.totalTrades,
        winRate: perf.winRate,
      });
    }
  }
  
  if (performanceHistory.length > 0) {
    await db.insert(botPerformanceHistory).values(performanceHistory).onConflictDoNothing();
    console.log(`Created ${performanceHistory.length} performance history records`);
  }

  const testUser = { id: "test-user-1", email: "test@example.com", name: "Test User", role: "user" };
  await db.insert(users).values(testUser).onConflictDoNothing();

  const sampleExchangeConnections = [
    {
      userId: "test-user-1",
      exchange: "Binance",
      apiKey: "binance-test-key-123",
      apiSecret: "binance-test-secret-456",
      balance: "25000.00",
      isActive: true,
    },
    {
      userId: "test-user-1",
      exchange: "Coinbase",
      apiKey: "coinbase-test-key-789",
      apiSecret: "coinbase-test-secret-012",
      balance: "15000.00",
      isActive: true,
    },
    {
      userId: "test-user-1",
      exchange: "Bybit",
      apiKey: "bybit-test-key-345",
      apiSecret: "bybit-test-secret-678",
      balance: "5000.00",
      isActive: false,
    },
  ];

  await db.insert(exchangeConnections).values(sampleExchangeConnections).onConflictDoNothing();
  console.log(`Created ${sampleExchangeConnections.length} exchange connections`);

  console.log("Seeding complete!");
}

seed().catch(console.error);
