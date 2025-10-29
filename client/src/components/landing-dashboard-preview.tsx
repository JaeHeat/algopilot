import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Line } from "react-chartjs-2";

export function LandingDashboardPreview() {
  const miniChartData = {
    labels: Array(12).fill(""),
    datasets: [
      {
        data: [10, 12, 11, 14, 13, 15, 14, 16, 18, 17, 19, 21],
        borderColor: "hsl(142 76% 36%)",
        backgroundColor: "hsl(142 76% 36% / 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };

  const miniChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: {
      x: { display: false },
      y: { display: false },
    },
  };

  return (
    <div className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">
            Real-Time Performance Monitoring
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Track every trade with professional-grade analytics and insights
          </p>
        </div>

        <Card className="p-8 max-w-5xl mx-auto">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Momentum Master</h3>
                  <p className="text-sm text-muted-foreground">by CryptoQuant</p>
                </div>
              </div>
              <Badge className="bg-success text-white">Active</Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-2xl font-bold tabular-nums text-success">+124.5%</div>
                <div className="text-xs text-muted-foreground mt-1">Total ROI</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-2xl font-bold tabular-nums">68%</div>
                <div className="text-xs text-muted-foreground mt-1">Win Rate</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-2xl font-bold tabular-nums">2.4</div>
                <div className="text-xs text-muted-foreground mt-1">Sharpe Ratio</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-2xl font-bold tabular-nums">1,245</div>
                <div className="text-xs text-muted-foreground mt-1">Total Trades</div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold">Equity Curve (30 Days)</h4>
                <span className="text-xs text-success font-medium">+18.2% This Month</span>
              </div>
              <div style={{ height: 180 }}>
                <Line data={miniChartData} options={miniChartOptions} />
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold mb-3">Recent Trades</h4>
              {[
                { pair: "BTC/USDT", type: "BUY", profit: 245.50, time: "2m ago" },
                { pair: "ETH/USDT", type: "SELL", profit: 89.20, time: "5m ago" },
                { pair: "SOL/USDT", type: "BUY", profit: -32.10, time: "12m ago" },
              ].map((trade, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 text-sm">
                  <div className="flex items-center gap-3">
                    <Badge variant={trade.type === "BUY" ? "default" : "secondary"} className="text-xs">
                      {trade.type}
                    </Badge>
                    <span className="font-medium">{trade.pair}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-semibold tabular-nums ${trade.profit >= 0 ? "text-success" : "text-danger"}`}>
                      {trade.profit >= 0 ? "+" : ""}${Math.abs(trade.profit).toFixed(2)}
                    </span>
                    <span className="text-muted-foreground text-xs">{trade.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
