import { useQuery, useMutation } from "@tanstack/react-query";
import { LandingHero } from "@/components/landing-hero";
import { Footer } from "@/components/footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SubscribeDialog } from "@/components/subscribe-dialog";
import { TrendingUp, Search, Star, Bot as BotIcon, Trophy, Medal, Award, LogIn, ArrowUpDown } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import type { Bot, BotPerformance, UserOnboarding } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type BotWithPerformance = Bot & { performance: BotPerformance | null };

const categoryChips = [
  { value: "all", label: "All Strategies" },
  { value: "scalping", label: "Scalping" },
  { value: "day_trading", label: "Day Trading" },
  { value: "swing_trading", label: "Swing Trading" },
  { value: "trend_following", label: "Trend Following" },
  { value: "mean_reversion", label: "Mean Reversion" },
  { value: "arbitrage", label: "Arbitrage" },
  { value: "market_making", label: "Market Making" },
  { value: "grid_trading", label: "Grid Trading" },
];

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

const getRiskBadgeColor = (risk: string) => {
  switch (risk.toLowerCase()) {
    case "low": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    case "medium": return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20";
    case "high": return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
    default: return "";
  }
};

const getRankIcon = (index: number) => {
  switch (index) {
    case 0: return <Trophy className="h-4 w-4 text-yellow-500" />;
    case 1: return <Medal className="h-4 w-4 text-gray-400" />;
    case 2: return <Award className="h-4 w-4 text-amber-600" />;
    default: return <span className="text-sm font-medium text-muted-foreground w-5 text-center tabular-nums">{index + 1}</span>;
  }
};

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("roi");
  const [selectedBot, setSelectedBot] = useState<BotWithPerformance | null>(null);
  const [subscribeDialogOpen, setSubscribeDialogOpen] = useState(false);

  const { data: bots, isLoading } = useQuery<BotWithPerformance[]>({
    queryKey: ["/api/bots"],
  });

  const { data: subscriptions } = useQuery<any[]>({
    queryKey: ["/api/subscriptions"],
    enabled: isAuthenticated,
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

  const subscribedBotIds = new Set(
    subscriptions?.filter(s => s.status === 'active').map(s => s.botId) ?? []
  );

  const filteredBots = bots
    ?.filter((bot) => {
      const matchesSearch = bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bot.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || bot.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (!a.performance || !b.performance) return 0;
      switch (sortBy) {
        case "roi": return parseFloat(b.performance.totalRoi) - parseFloat(a.performance.totalRoi);
        case "winRate": return parseFloat(b.performance.winRate) - parseFloat(a.performance.winRate);
        case "subscribers": return b.performance.subscribers - a.performance.subscribers;
        case "sharpe": return parseFloat(b.performance.sharpeRatio) - parseFloat(a.performance.sharpeRatio);
        default: return 0;
      }
    }) ?? [];

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

        {/* Marketplace section */}
        <div className="max-w-7xl mx-auto px-6 pb-20">
          {/* Section header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <h2 className="text-xl font-semibold">Strategies</h2>
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-36 h-8 text-sm" data-testid="select-sort-by">
                  <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="roi">Top ROI</SelectItem>
                  <SelectItem value="winRate">Win Rate</SelectItem>
                  <SelectItem value="subscribers">Most Popular</SelectItem>
                  <SelectItem value="sharpe">Sharpe Ratio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search strategies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-bots"
            />
          </div>

          {/* Category chips */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categoryChips.map((chip) => (
              <button
                key={chip.value}
                onClick={() => setCategoryFilter(chip.value)}
                data-testid={`chip-category-${chip.value}`}
                className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                  categoryFilter === chip.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border hover-elevate"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Table header */}
          {!isLoading && filteredBots.length > 0 && (
            <div className="hidden md:grid grid-cols-[40px_56px_1fr_110px_110px_110px_130px] gap-4 px-4 py-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase border-b mb-1">
              <div>#</div>
              <div></div>
              <div>Strategy</div>
              <div className="text-right">ROI</div>
              <div className="text-right">Win Rate</div>
              <div className="text-right">Sharpe</div>
              <div className="text-right">Price / mo</div>
            </div>
          )}

          {/* Rows */}
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-16 bg-muted/40 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredBots.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              No strategies found matching your criteria.
            </div>
          ) : (
            <div className="space-y-1">
              {filteredBots.map((bot, index) => (
                <Link to={`/bot/${bot.id}`} key={bot.id}>
                  <div
                    className="grid md:grid-cols-[40px_56px_1fr_110px_110px_110px_130px] gap-4 items-center px-4 py-3.5 rounded-lg hover-elevate active-elevate-2 cursor-pointer transition-all"
                    data-testid={`row-bot-${index + 1}`}
                  >
                    {/* Rank */}
                    <div className="flex items-center justify-center">
                      {getRankIcon(index)}
                    </div>

                    {/* Icon */}
                    <div className="flex items-center justify-center">
                      {bot.iconUrl ? (
                        <img
                          src={bot.iconUrl}
                          alt={bot.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <BotIcon className="h-5 w-5 text-primary" />
                        </div>
                      )}
                    </div>

                    {/* Name + badges */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold truncate" data-testid={`text-bot-name-${index + 1}`}>
                          {bot.name}
                        </span>
                        {bot.isVerified && (
                          <Badge variant="secondary" className="gap-1 shrink-0 text-xs">
                            <Star className="h-2.5 w-2.5" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {bot.category && (
                          <span className="text-xs text-muted-foreground">
                            {categoryLabels[bot.category] || bot.category}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">·</span>
                        <Badge variant="outline" className={`text-xs border ${getRiskBadgeColor(bot.riskLevel)}`}>
                          {bot.riskLevel} Risk
                        </Badge>
                        {bot.performance && (
                          <>
                            <span className="text-xs text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground">
                              {bot.performance.subscribers.toLocaleString()} subscribers
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* ROI */}
                    <div className="text-right">
                      {bot.performance ? (
                        <span className={`text-base font-bold ${parseFloat(bot.performance.totalRoi) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                          {parseFloat(bot.performance.totalRoi) >= 0 ? '+' : ''}
                          {parseFloat(bot.performance.totalRoi).toFixed(1)}%
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </div>

                    {/* Win rate */}
                    <div className="text-right">
                      {bot.performance ? (
                        <span className="text-sm font-semibold">
                          {parseFloat(bot.performance.winRate).toFixed(1)}%
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </div>

                    {/* Sharpe */}
                    <div className="text-right">
                      {bot.performance ? (
                        <span className="text-sm font-semibold">
                          {parseFloat(bot.performance.sharpeRatio).toFixed(2)}
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </div>

                    {/* Price + subscribe */}
                    <div className="text-right flex items-center justify-end gap-2">
                      <span className="font-semibold text-sm">
                        ${parseFloat(bot.monthlyPrice).toFixed(0)}<span className="text-xs text-muted-foreground font-normal">/mo</span>
                      </span>
                      {subscribedBotIds.has(bot.id) ? (
                        <Badge variant="secondary" className="shrink-0 text-xs" data-testid={`badge-subscribed-${index + 1}`}>
                          Subscribed
                        </Badge>
                      ) : !isAuthenticated ? (
                        <Button
                          size="sm"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLocation("/auth/register"); }}
                          data-testid={`button-subscribe-${index + 1}`}
                        >
                          <LogIn className="h-3.5 w-3.5 mr-1" />
                          Sign Up
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedBot(bot); setSubscribeDialogOpen(true); }}
                          data-testid={`button-subscribe-${index + 1}`}
                        >
                          Subscribe
                        </Button>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {selectedBot && (
        <SubscribeDialog
          bot={selectedBot}
          open={subscribeDialogOpen}
          onOpenChange={setSubscribeDialogOpen}
        />
      )}
    </div>
  );
}
