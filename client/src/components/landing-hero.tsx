import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp } from "lucide-react";

export function LandingHero() {
  return (
    <div className="relative min-h-screen flex items-center">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Trusted by 12,000+ traders</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Automate Your Crypto Trading
            </h1>
            
            <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
              Connect your exchange, follow top-performing trading bots, and let algorithms manage your portfolio 24/7. No coding required.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="gap-2" data-testid="button-get-started">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" data-testid="button-view-bots">
                View Top Bots
              </Button>
            </div>
            
            <div className="flex items-center gap-8 pt-4">
              <div>
                <div className="text-4xl font-bold tabular-nums">847%</div>
                <div className="text-sm text-muted-foreground">Average ROI</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <div className="text-4xl font-bold tabular-nums">$2.4M</div>
                <div className="text-sm text-muted-foreground">Total Volume</div>
              </div>
            </div>
          </div>
          
          <div className="lg:pl-12">
            <div className="rounded-xl bg-card border border-card-border p-6 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Top Performers Today</h3>
                <span className="text-xs text-muted-foreground">Live</span>
              </div>
              {[
                { name: "Momentum Master", roi: "+24.3%", trades: 45, color: "text-success" },
                { name: "Arbitrage Pro", roi: "+18.7%", trades: 132, color: "text-success" },
                { name: "Grid Trader Elite", roi: "+15.2%", trades: 89, color: "text-success" },
              ].map((bot, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-background hover-elevate">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{bot.name}</div>
                      <div className="text-xs text-muted-foreground">{bot.trades} trades</div>
                    </div>
                  </div>
                  <div className={`font-semibold ${bot.color}`}>{bot.roi}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
