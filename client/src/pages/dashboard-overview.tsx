import { MetricCard } from "@/components/metric-card";
import { PerformanceChart } from "@/components/performance-chart";
import { TradeTable } from "@/components/trade-table";
import { BotCard } from "@/components/bot-card";
import { DollarSign, TrendingUp, Bot, Target } from "lucide-react";

export default function DashboardOverview() {
  const mockData = [10000, 10500, 10200, 11000, 11500, 11200, 12000, 12800, 12500, 13200, 13800, 14500];
  const mockLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const mockTrades = [
    { id: "1", pair: "BTC/USDT", type: "BUY" as const, amount: 0.0523, price: 43250, profit: 245.50, timestamp: "2 mins ago" },
    { id: "2", pair: "ETH/USDT", type: "SELL" as const, amount: 1.2341, price: 2250, profit: 89.20, timestamp: "5 mins ago" },
    { id: "3", pair: "BTC/USDT", type: "SELL" as const, amount: 0.0312, price: 43180, profit: -32.10, timestamp: "12 mins ago" },
    { id: "4", pair: "SOL/USDT", type: "BUY" as const, amount: 12.5000, price: 98, profit: 156.75, timestamp: "18 mins ago" },
    { id: "5", pair: "AVAX/USDT", type: "BUY" as const, amount: 25.4200, price: 35, profit: 78.30, timestamp: "25 mins ago" },
  ];
  
  const activeBots = [
    { id: "1", name: "Momentum Master", creator: "CryptoQuant", roi: 124.5, winRate: 68, subscribers: 342, totalTrades: 1245, price: 29, strategy: "Momentum" },
    { id: "2", name: "Arbitrage Pro", creator: "AlgoTrader", roi: 98.3, winRate: 72, subscribers: 289, totalTrades: 2341, price: 39, strategy: "Arbitrage" },
  ];
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Portfolio Overview</h1>
        <p className="text-muted-foreground">Track your trading performance and active bots</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Portfolio Value"
          value="$45,231"
          change="+12.5% this month"
          icon={DollarSign}
          trend="up"
        />
        <MetricCard
          title="24h P&L"
          value="+$1,234"
          change="+2.7% today"
          icon={TrendingUp}
          trend="up"
        />
        <MetricCard
          title="Active Bots"
          value="2"
          change="1 new this week"
          icon={Bot}
        />
        <MetricCard
          title="Win Rate"
          value="68%"
          change="+3% this month"
          icon={Target}
          trend="up"
        />
      </div>
      
      <PerformanceChart
        title="Portfolio Equity Curve"
        data={mockData}
        labels={mockLabels}
      />
      
      <div>
        <h2 className="text-2xl font-bold mb-4">Active Bots</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          {activeBots.map((bot) => (
            <BotCard key={bot.id} {...bot} />
          ))}
        </div>
      </div>
      
      <TradeTable trades={mockTrades} />
    </div>
  );
}
