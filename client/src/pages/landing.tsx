import { useQuery, useMutation } from "@tanstack/react-query";
import { LandingHero } from "@/components/landing-hero";
import { Footer } from "@/components/footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EquitySparkline } from "@/components/equity-sparkline";
import { LandingHowItWorks } from "@/components/landing-how-it-works";
import { LandingDashboardPreview } from "@/components/landing-dashboard-preview";
import { LandingFeatures } from "@/components/landing-features";
import { LandingExchanges } from "@/components/landing-exchanges";
import { TrendingUp, Star, Bot as BotIcon, ArrowRight, ShieldCheck, Lock, BarChart3 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import type { Bot, BotPerformance, UserOnboarding } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";

type BotWithPerformance = Bot & { performance: BotPerformance | null };

const categoryLabels: Record<string, string> = {
  scalping: "Scalping",
  day_trading: "Day Trading",
  swing_trading: "Swing Trading",
  trend_following: "Trend Following",
  mean_reversion: "Mean Reversion",
  arbitrage: "Arbitrage",
  market_making: "Market Making",
  grid_trading: "Grid Trading",
};

const riskTierClass: Record<string, string> = {
  low: "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400",
  moderate: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  high: "border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-400",
  extreme: "border-red-500/40 bg-red-500/10 text-red-600",
};

const algoScoreColor = (s: number) =>
  s >= 60 ? "text-emerald-500" : s >= 30 ? "text-primary" : "text-foreground";

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const { data: bots, isLoading } = useQuery<BotWithPerformance[]>({
    queryKey: ["/api/bots"],
  });

  const { data: onboarding } = useQuery<UserOnboarding>({
    queryKey: ["/api/onboarding"],
    enabled: isAuthenticated,
  });

  const updateOnboardingMutation = useMutation({
    mutationFn: async (updates: Partial<UserOnboarding>) => {
      return await apiRequest("POST", "/api/onboarding/progress", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding"] });
    },
  });

  useEffect(() => {
    if (isAuthenticated && onboarding && !onboarding.hasViewedMarketplace) {
      updateOnboardingMutation.mutate({ hasViewedMarketplace: true });
    }
  }, [isAuthenticated, onboarding]);

  // Teaser: only the top RATED strategies, ranked by AlgoScore.
  const ratedBots = (bots ?? [])
    .filter((b) => (b as any).metrics?.rated)
    .sort((a, b) => (b as any).metrics.algoScore - (a as any).metrics.algoScore);
  const topBots = ratedBots.slice(0, 6);
  const totalCount = bots?.length ?? 0;

  return (
    <div className="min-h-screen">
      {/* Minimal nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover-elevate rounded-lg px-2 -ml-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg">AlgoPilot</span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" data-testid="button-sign-in">
              <Link href="/auth/login">Login</Link>
            </Button>
            <Button asChild data-testid="button-get-started">
              <Link href="/auth/register">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <LandingHero />

        {/* Trust strip — the moat */}
        <div className="border-y bg-muted/30">
          <div className="max-w-7xl mx-auto px-6 py-10 grid sm:grid-cols-3 gap-8">
            {[
              { icon: ShieldCheck, title: "Independently verified", body: "Every signal is hashed and timestamped the instant it fires. Track records can't be backfilled, cherry-picked, or faked." },
              { icon: Lock, title: "Non-custodial by design", body: "Connect your own exchange with API keys. Your funds never leave your account — we can't touch them." },
              { icon: BarChart3, title: "Ranked by AlgoScore", body: "Risk-adjusted return, weighted by how much data backs it up. No vanity win-rates, no survivorship mirages." },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold mb-0.5">{item.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top strategies teaser */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-2">
            <div>
              <span className="inline-block rounded-full bg-primary/10 text-primary text-xs font-semibold px-3 py-1 mb-3">
                Strategy Marketplace
              </span>
              <h2 className="text-2xl md:text-3xl font-bold">Top performing strategies</h2>
              <p className="text-muted-foreground mt-1 max-w-2xl">
                Ranked by <span className="font-semibold text-foreground">AlgoScore</span> — risk-adjusted
                return, weighted by how much live data backs it up. Every track record is independently verified.
              </p>
            </div>
            <Link to="/marketplace">
              <Button variant="ghost" className="gap-1" data-testid="link-view-all-top">
                View all {totalCount} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-72 bg-muted/40 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : topBots.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground border rounded-xl mt-6">
              No rated strategies yet — they appear here once they clear evaluation.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
              {topBots.map((bot, i) => {
                const m = (bot as any).metrics;
                return (
                  <Link to={`/bot/${bot.id}`} key={bot.id} data-testid={`card-bot-${i + 1}`}>
                    <div className="group rounded-xl border bg-card p-5 hover-elevate active-elevate-2 transition-all h-full flex flex-col">
                      {/* Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                          {bot.iconUrl ? (
                            <img src={bot.iconUrl} alt={bot.name} className="w-full h-full object-cover" />
                          ) : (
                            <BotIcon className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold truncate" data-testid={`text-bot-name-${i + 1}`}>{bot.name}</h3>
                            {bot.isVerified && <Star className="h-3.5 w-3.5 text-primary shrink-0" />}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {categoryLabels[bot.category] || bot.category} · {((bot as any).assetClass ?? "crypto") === "stocks" ? "Stocks" : "Crypto"}
                          </p>
                        </div>
                        <Badge variant="outline" className={`text-xs shrink-0 ${riskTierClass[m.riskTier] ?? ""}`}>
                          {m.riskTier.charAt(0).toUpperCase() + m.riskTier.slice(1)} risk
                        </Badge>
                      </div>

                      {/* Equity curve */}
                      <EquitySparkline data={m.equityCurve} height={64} className="mb-4" />

                      {/* AlgoScore hero + return */}
                      <div className="flex items-end justify-between mb-4">
                        <div>
                          <div
                            className="text-xs font-extrabold uppercase tracking-wider text-primary flex items-center gap-1"
                            title="AlgoScore — our risk-adjusted, confidence-weighted ranking. Higher = stronger edge backed by more data."
                          >
                            <ShieldCheck className="h-3.5 w-3.5" /> AlgoScore
                          </div>
                          <div className={`text-5xl font-extrabold leading-none ${algoScoreColor(m.algoScore)}`} data-testid={`text-algoscore-${i + 1}`}>
                            {m.algoScore}
                            <span className="text-base font-medium text-muted-foreground">/100</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Return</div>
                          <div className={`text-2xl font-bold ${m.totalReturnPct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                            {m.totalReturnPct >= 0 ? "+" : ""}{m.totalReturnPct.toFixed(1)}%
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2 py-3 border-t border-b text-center mb-4">
                        <div>
                          <div className="text-[11px] text-muted-foreground">Sortino</div>
                          <div className="font-semibold tabular-nums">{m.sortino.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-muted-foreground">Max DD</div>
                          <div className="font-semibold tabular-nums">{m.maxDrawdownPct.toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-muted-foreground">Trades</div>
                          <div className="font-semibold tabular-nums">{m.trades}</div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-auto">
                        <span className="font-bold">
                          ${parseFloat(bot.monthlyPrice).toFixed(0)}
                          <span className="text-xs text-muted-foreground font-normal">/mo</span>
                        </span>
                        <span className="text-sm font-medium text-primary group-hover:underline flex items-center gap-1">
                          View strategy <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Bottom CTA */}
          <div className="text-center mt-12">
            <Link to="/marketplace">
              <Button size="lg" variant="outline" data-testid="button-browse-all" onClick={() => { if (!isAuthenticated) setLocation("/marketplace"); }}>
                Browse all {totalCount} strategies
              </Button>
            </Link>
          </div>
        </div>

        <LandingHowItWorks />
        <LandingDashboardPreview />
        <LandingFeatures />
        <LandingExchanges />

        {/* Final CTA */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="rounded-2xl border bg-card px-8 py-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Trade strategies you can actually trust</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Provable track records, risk-adjusted rankings, and one-click automation to your own exchange.
              Start free — connect when you're ready.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" data-testid="button-cta-signup">
                <Link href="/auth/register">Get started free <ArrowRight className="h-4 w-4 ml-1" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/marketplace">Explore strategies</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
