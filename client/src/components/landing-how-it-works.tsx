import { ArrowRight, Link2, TrendingUp, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";

const steps = [
  {
    icon: Link2,
    title: "Connect Your Exchange",
    description: "Link your Alpaca, Binance, or Bybit account securely using API keys. Your funds stay in your broker—we never have access.",
    step: "01",
  },
  {
    icon: TrendingUp,
    title: "Choose a Bot",
    description: "Browse our marketplace of verified trading algorithms. Filter by strategy, risk level, and historical performance.",
    step: "02",
  },
  {
    icon: Zap,
    title: "Activate & Earn",
    description: "Subscribe to your chosen bot and let it trade automatically. Monitor performance in real-time from your dashboard.",
    step: "03",
  },
];

export function LandingHowItWorks() {
  return (
    <div className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start automated trading in three simple steps
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <Card key={i} className="p-8 relative overflow-visible">
                <div className="absolute -top-4 -left-4 h-12 w-12 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                  {step.step}
                </div>
                <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center mb-6 mt-4">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                {i < steps.length - 1 && (
                  <ArrowRight className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground/30" />
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
