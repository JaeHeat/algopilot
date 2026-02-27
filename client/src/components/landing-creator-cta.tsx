import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Code, DollarSign, Users, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export function LandingCreatorCTA() {
  return (
    <div className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Code className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">For Algorithm Creators</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold">
              Earn Passive Income with Your Trading Bot
            </h2>
            
            <p className="text-xl text-muted-foreground leading-relaxed">
              Turn your trading algorithms into a revenue stream. Upload your bot, set your subscription price, and earn monthly income from traders who subscribe.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">75% Revenue Share</h3>
                  <p className="text-sm text-muted-foreground">Keep the majority of subscription fees. We handle billing and payments.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Built-in Audience</h3>
                  <p className="text-sm text-muted-foreground">Access thousands of traders looking for proven strategies.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Performance Tracking</h3>
                  <p className="text-sm text-muted-foreground">Transparent metrics build trust and attract more subscribers.</p>
                </div>
              </div>
            </div>
            
            <Link href="/auth/register">
              <Button size="lg" className="gap-2" data-testid="button-become-creator">
                Become a Creator
                <Code className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Creator Earnings</h3>
                <span className="text-xs text-muted-foreground">Last 30 days</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background rounded-lg p-4">
                  <div className="text-3xl font-bold tabular-nums text-success">$12,450</div>
                  <div className="text-sm text-muted-foreground mt-1">Total Earned</div>
                </div>
                <div className="bg-background rounded-lg p-4">
                  <div className="text-3xl font-bold tabular-nums">342</div>
                  <div className="text-sm text-muted-foreground mt-1">Subscribers</div>
                </div>
              </div>
              
              <div className="bg-background rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Momentum Master</span>
                  <span className="font-semibold">$8,280</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Grid Trader Pro</span>
                  <span className="font-semibold">$2,940</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Scalper Elite</span>
                  <span className="font-semibold">$1,230</span>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground italic">
                Top creators earn $10K+ monthly from their algorithms
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
