import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Trophy } from "lucide-react";

interface Bot {
  rank: number;
  name: string;
  creator: string;
  roi: number;
  winRate: number;
  subscribers: number;
  sharpeRatio: number;
  totalTrades: number;
}

interface LeaderboardTableProps {
  bots: Bot[];
}

export function LeaderboardTable({ bots }: LeaderboardTableProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Top Performing Bots</h2>
        <Trophy className="h-6 w-6 text-primary" />
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-sm text-muted-foreground">
              <th className="text-left py-3 font-medium">Rank</th>
              <th className="text-left py-3 font-medium">Bot Name</th>
              <th className="text-left py-3 font-medium">Creator</th>
              <th className="text-right py-3 font-medium">ROI</th>
              <th className="text-right py-3 font-medium">Win Rate</th>
              <th className="text-right py-3 font-medium">Sharpe</th>
              <th className="text-right py-3 font-medium">Trades</th>
              <th className="text-right py-3 font-medium">Subscribers</th>
              <th className="text-right py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {bots.map((bot) => (
              <tr 
                key={bot.rank} 
                className="border-b border-border hover-elevate"
                data-testid={`row-bot-${bot.rank}`}
              >
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    {bot.rank <= 3 && (
                      <Trophy className={`h-4 w-4 ${
                        bot.rank === 1 ? "text-yellow-500" :
                        bot.rank === 2 ? "text-gray-400" :
                        "text-orange-500"
                      }`} />
                    )}
                    <span className="font-medium">#{bot.rank}</span>
                  </div>
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">{bot.name}</span>
                  </div>
                </td>
                <td className="py-4 text-muted-foreground">{bot.creator}</td>
                <td className="py-4 text-right">
                  <span className={`font-semibold tabular-nums ${
                    bot.roi > 0 ? "text-success" : "text-danger"
                  }`}>
                    {bot.roi > 0 ? "+" : ""}{bot.roi}%
                  </span>
                </td>
                <td className="py-4 text-right tabular-nums">{bot.winRate}%</td>
                <td className="py-4 text-right tabular-nums">{bot.sharpeRatio}</td>
                <td className="py-4 text-right tabular-nums">{bot.totalTrades.toLocaleString()}</td>
                <td className="py-4 text-right">
                  <Badge variant="secondary">{bot.subscribers}</Badge>
                </td>
                <td className="py-4 text-right">
                  <Button size="sm" data-testid={`button-view-${bot.rank}`}>View</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
