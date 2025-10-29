import { useState } from "react";
import { BotCard } from "@/components/bot-card";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";

export default function DashboardMarketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("roi");
  
  const mockBots = [
    { id: "1", name: "Momentum Master", creator: "CryptoQuant", roi: 124.5, winRate: 68, subscribers: 342, totalTrades: 1245, price: 29, strategy: "Momentum" },
    { id: "2", name: "Arbitrage Pro", creator: "AlgoTrader", roi: 98.3, winRate: 72, subscribers: 289, totalTrades: 2341, price: 39, strategy: "Arbitrage" },
    { id: "3", name: "Grid Trader Elite", creator: "QuantLabs", roi: 87.2, winRate: 65, subscribers: 421, totalTrades: 987, price: 24, strategy: "Grid" },
    { id: "4", name: "Trend Follower", creator: "BotMaker", roi: 76.8, winRate: 61, subscribers: 198, totalTrades: 1456, price: 19, strategy: "Trend" },
    { id: "5", name: "Mean Reversion", creator: "StrategyX", roi: 65.4, winRate: 58, subscribers: 156, totalTrades: 823, price: 34, strategy: "Mean Reversion" },
    { id: "6", name: "Scalper 3000", creator: "FastTrades", roi: 54.2, winRate: 63, subscribers: 267, totalTrades: 3421, price: 29, strategy: "Scalping" },
  ];
  
  const leaderboardBots = [
    { rank: 1, name: "Momentum Master", creator: "CryptoQuant", roi: 124.5, winRate: 68, subscribers: 342, sharpeRatio: 2.4, totalTrades: 1245 },
    { rank: 2, name: "Arbitrage Pro", creator: "AlgoTrader", roi: 98.3, winRate: 72, subscribers: 289, sharpeRatio: 2.1, totalTrades: 2341 },
    { rank: 3, name: "Grid Trader Elite", creator: "QuantLabs", roi: 87.2, winRate: 65, subscribers: 421, sharpeRatio: 1.9, totalTrades: 987 },
    { rank: 4, name: "Trend Follower", creator: "BotMaker", roi: 76.8, winRate: 61, subscribers: 198, sharpeRatio: 1.7, totalTrades: 1456 },
    { rank: 5, name: "Mean Reversion", creator: "StrategyX", roi: 65.4, winRate: 58, subscribers: 156, sharpeRatio: 1.5, totalTrades: 823 },
  ];
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Bot Marketplace</h1>
        <p className="text-muted-foreground">Discover and subscribe to top-performing trading bots</p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bots..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-bots"
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-sort">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="roi">Highest ROI</SelectItem>
            <SelectItem value="winrate">Win Rate</SelectItem>
            <SelectItem value="subscribers">Most Popular</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockBots.map((bot) => (
          <BotCard key={bot.id} {...bot} />
        ))}
      </div>
      
      <div className="pt-8">
        <LeaderboardTable bots={leaderboardBots} />
      </div>
    </div>
  );
}
