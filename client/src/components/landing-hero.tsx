import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

export function LandingHero() {
  return (
    <div className="relative pt-24 pb-16 px-6 text-center">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
          Open Marketplace for<br />Trading Strategies
        </h1>

        <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Follow crypto trading bots in real-time. Automate trades by connecting your exchange. Split capital across multiple strategies.
        </p>

        <div className="flex flex-wrap gap-3 justify-center pt-2">
          <Button asChild size="lg" className="gap-2" data-testid="button-get-started">
            <Link href="/auth/register">
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" data-testid="button-sign-in-hero">
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>

        <div className="flex items-center justify-center gap-8 pt-2 text-sm text-muted-foreground">
          <span>No coding required</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground" />
          <span>Connect Binance or Bybit</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground" />
          <span>Performance-verified bots</span>
        </div>
      </div>
    </div>
  );
}
