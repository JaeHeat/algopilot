import { Activity, Bot, DollarSign, LineChart, Shield, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Activity,
    title: "Real-time Analytics",
    description: "Monitor your portfolio with live performance metrics, equity curves, and trade logs updated every second.",
  },
  {
    icon: Bot,
    title: "Crypto + Stocks",
    description: "Connect Alpaca for US stocks and Binance or Bybit for crypto — all with secure, non-custodial API keys.",
  },
  {
    icon: Zap,
    title: "Automated Trading",
    description: "Let proven algorithms execute trades 24/7 while you sleep. No manual intervention required.",
  },
  {
    icon: Shield,
    title: "Risk Management",
    description: "Built-in stop-loss, position sizing, and drawdown protection keep your capital safe.",
  },
  {
    icon: LineChart,
    title: "AlgoScore Ranking",
    description: "Strategies ranked by risk-adjusted return, weighted by how much live data backs them — not vanity win-rates.",
  },
  {
    icon: DollarSign,
    title: "Revenue Sharing",
    description: "Create your own bots and earn monthly income from subscribers. We handle payments.",
  },
];

export function LandingFeatures() {
  return (
    <div className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">Everything You Need to Trade Smarter</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Professional-grade tools designed for both novice traders and experienced algorithm developers
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <Card key={i} className="p-6 hover-elevate">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
