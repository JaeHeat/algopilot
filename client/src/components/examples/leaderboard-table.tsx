import { LeaderboardTable } from "../leaderboard-table";

export default function LeaderboardTableExample() {
  const mockBots = [
    { rank: 1, name: "Momentum Master", creator: "CryptoQuant", roi: 124.5, winRate: 68, subscribers: 342, sharpeRatio: 2.4, totalTrades: 1245 },
    { rank: 2, name: "Arbitrage Pro", creator: "AlgoTrader", roi: 98.3, winRate: 72, subscribers: 289, sharpeRatio: 2.1, totalTrades: 2341 },
    { rank: 3, name: "Grid Trader Elite", creator: "QuantLabs", roi: 87.2, winRate: 65, subscribers: 421, sharpeRatio: 1.9, totalTrades: 987 },
    { rank: 4, name: "Trend Follower", creator: "BotMaker", roi: 76.8, winRate: 61, subscribers: 198, sharpeRatio: 1.7, totalTrades: 1456 },
    { rank: 5, name: "Mean Reversion", creator: "StrategyX", roi: 65.4, winRate: 58, subscribers: 156, sharpeRatio: 1.5, totalTrades: 823 },
  ];
  
  return (
    <div className="p-6">
      <LeaderboardTable bots={mockBots} />
    </div>
  );
}
