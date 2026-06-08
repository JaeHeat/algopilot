import { useQuery, useMutation } from "@tanstack/react-query";
import { SubscribeDialog } from "@/components/subscribe-dialog";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EquitySparkline } from "@/components/equity-sparkline";
import { Search, TrendingUp, ArrowLeft, Trophy, Medal, Award, Star, Bot as BotIcon, LogIn } from "lucide-react";
import type { Bot, BotPerformance, UserOnboarding } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";

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

export default function Marketplace() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [strategyFilter, setStrategyFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [assetClassFilter, setAssetClassFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [sortBy, setSortBy] = useState("algoScore");
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

  const subscribedBotIds = new Set(
    subscriptions?.filter(s => s.status === 'active').map(s => s.botId) ?? []
  );

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

  const filteredAndSortedBots = bots
    ?.filter((bot) => {
      const matchesSearch = bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bot.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStrategy = strategyFilter === "all" || bot.strategy === strategyFilter;
      const matchesCategory = categoryFilter === "all" || bot.category === categoryFilter;
      const matchesAssetClass = assetClassFilter === "all" || (bot.assetClass ?? "crypto") === assetClassFilter;
      const matchesRisk = riskFilter === "all" || bot.riskLevel === riskFilter;
      return matchesSearch && matchesStrategy && matchesCategory && matchesAssetClass && matchesRisk;
    })
    .sort((a, b) => {
      const am = (a as any).metrics, bm = (b as any).metrics;
      const num = (x: any) => (typeof x === "number" ? x : -Infinity);
      switch (sortBy) {
        case "algoScore":
          return num(bm?.algoScore) - num(am?.algoScore);
        case "sortino":
          return num(bm?.sortino) - num(am?.sortino);
        case "calmar":
          return num(bm?.calmar) - num(am?.calmar);
        case "expectancy":
          return num(bm?.expectancyPct) - num(am?.expectancyPct);
        case "maxdd": // lower drawdown is better
          return num(am?.maxDrawdownPct) - num(bm?.maxDrawdownPct);
        case "roi":
          return parseFloat(b.performance?.totalRoi ?? "0") - parseFloat(a.performance?.totalRoi ?? "0");
        case "winRate":
          return parseFloat(b.performance?.winRate ?? "0") - parseFloat(a.performance?.winRate ?? "0");
        case "subscribers":
          return (b.performance?.subscribers ?? 0) - (a.performance?.subscribers ?? 0);
        default:
          return num(bm?.algoScore) - num(am?.algoScore);
      }
    }) ?? [];

  const strategies = Array.from(new Set(bots?.map((bot) => bot.strategy) ?? []));
  const allCategories = Object.keys(categoryLabels);
  const riskLevels = ["Low", "Medium", "High"];

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" data-testid="icon-rank-1" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" data-testid="icon-rank-2" />;
      case 2:
        return <Award className="h-5 w-5 text-amber-600" data-testid="icon-rank-3" />;
      default:
        return <span className="text-sm font-semibold text-muted-foreground w-6 text-center">{index + 1}</span>;
    }
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "low":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20";
      case "high":
        return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
      default:
        return "";
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-20 bg-muted/50 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {!isAuthenticated && (
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 hover-elevate rounded-lg px-2 -ml-2" data-testid="link-home">
              <TrendingUp className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">AlgoPilot</span>
            </Link>
            <Button asChild data-testid="button-sign-in">
              <a href="/auth/login">Sign In</a>
            </Button>
          </div>
        </header>
      )}
      
      <div className={!isAuthenticated ? "pt-24 px-8 pb-8" : "p-8"}>
        <div className="mb-6">
          {!isAuthenticated && (
            <Link href="/">
              <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-to-home">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          )}
          <h1 className="text-3xl font-bold mb-2">Trading Bot Marketplace</h1>
          <p className="text-muted-foreground">
            {filteredAndSortedBots.length} {filteredAndSortedBots.length === 1 ? 'bot' : 'bots'} available
          </p>
        </div>

        <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-4 -mx-8 px-8 mb-6 border-b">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bots..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-bots"
              />
            </div>

            <Select value={strategyFilter} onValueChange={setStrategyFilter}>
              <SelectTrigger data-testid="select-strategy-filter">
                <SelectValue placeholder="Strategy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Strategies</SelectItem>
                {strategies.map((strategy) => (
                  <SelectItem key={strategy} value={strategy}>
                    {strategy}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger data-testid="select-category-filter">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {allCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {categoryLabels[category]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={assetClassFilter} onValueChange={setAssetClassFilter}>
              <SelectTrigger data-testid="select-asset-class-filter">
                <SelectValue placeholder="Market" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Markets</SelectItem>
                <SelectItem value="crypto">Crypto</SelectItem>
                <SelectItem value="stocks">Stocks</SelectItem>
              </SelectContent>
            </Select>

            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger data-testid="select-risk-filter">
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                {riskLevels.map((risk) => (
                  <SelectItem key={risk} value={risk}>
                    {risk}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger data-testid="select-sort-by">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="algoScore">AlgoScore (best overall)</SelectItem>
                <SelectItem value="sortino">Sortino (risk-adj.)</SelectItem>
                <SelectItem value="calmar">Calmar (return/drawdown)</SelectItem>
                <SelectItem value="expectancy">Expectancy / trade</SelectItem>
                <SelectItem value="maxdd">Lowest Drawdown</SelectItem>
                <SelectItem value="roi">Highest ROI</SelectItem>
                <SelectItem value="winRate">Win Rate</SelectItem>
                <SelectItem value="subscribers">Most Popular</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredAndSortedBots.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No bots found matching your criteria</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="hidden md:grid grid-cols-[60px_80px_1fr_120px_120px_120px_120px_140px] gap-4 px-4 py-3 text-sm font-medium text-muted-foreground border-b">
              <div>RANK</div>
              <div></div>
              <div>BOT</div>
              <div className="text-right">ROI</div>
              <div className="text-right">WIN RATE</div>
              <div className="text-right">ALGOSCORE</div>
              <div className="text-right">SUBS</div>
              <div className="text-right">PRICE</div>
            </div>

            {filteredAndSortedBots.map((bot, index) => (
              <Link to={`/bot/${bot.id}`} key={bot.id}>
                <div
                  className="grid md:grid-cols-[60px_80px_1fr_120px_120px_120px_120px_140px] gap-4 items-center px-4 py-4 rounded-lg border border-border/50 hover-elevate active-elevate-2 cursor-pointer transition-all"
                  data-testid={`row-bot-${index + 1}`}
                >
                <div className="flex items-center justify-center">
                  {getRankIcon(index)}
                </div>

                <div className="flex items-center justify-center">
                  {(bot as any).metrics?.rated ? (
                    <div className="w-16 h-12 rounded-md border bg-muted/30 px-1 flex items-center" title="Standardized equity curve" data-testid={`spark-bot-${index + 1}`}>
                      <EquitySparkline data={(bot as any).metrics.equityCurve} height={38} />
                    </div>
                  ) : bot.iconUrl ? (
                    <img
                      src={bot.iconUrl}
                      alt={bot.name}
                      className="w-16 h-16 rounded object-cover"
                      data-testid={`img-bot-icon-${index + 1}`}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded bg-primary/10 flex items-center justify-center">
                      <BotIcon className="h-8 w-8 text-primary" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg truncate" data-testid={`text-bot-name-${index + 1}`}>
                      {bot.name}
                    </h3>
                    {bot.isVerified && (
                      <Badge variant="secondary" className="gap-1 shrink-0">
                        <Star className="h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                    {bot.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      {bot.strategy}
                    </Badge>
                    {bot.category && (
                      <Badge variant="outline" className="text-xs bg-primary/5 border-primary/20">
                        {categoryLabels[bot.category] || bot.category}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs bg-muted">
                      {(bot.assetClass ?? "crypto") === "stocks" ? "Stocks" : "Crypto"}
                    </Badge>
                    {(() => {
                      const tier = (bot as any).metrics?.riskTier as string | undefined;
                      if (!tier) return null;
                      const cls: Record<string, string> = {
                        low: "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400",
                        moderate: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
                        high: "border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-400",
                        extreme: "border-red-500/40 bg-red-500/10 text-red-600",
                      };
                      return (
                        <Badge variant="outline" className={`text-xs border ${cls[tier] ?? ""}`} data-testid={`badge-risk-tier-${index + 1}`}>
                          {tier.charAt(0).toUpperCase() + tier.slice(1)} risk
                        </Badge>
                      );
                    })()}
                  </div>
                </div>

                <div className="text-right">
                  {(() => {
                    const m = (bot as any).metrics;
                    const roi = m?.rated ? m.totalReturnPct : (bot.performance ? parseFloat(bot.performance.totalRoi) : null);
                    if (roi === null) return <span className="text-muted-foreground">—</span>;
                    return (
                      <div className={`text-lg font-bold ${roi >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                      </div>
                    );
                  })()}
                </div>

                <div className="text-right">
                  {(() => {
                    const m = (bot as any).metrics;
                    const wr = m?.rated ? Math.round(m.winRate * 100) : (bot.performance ? parseFloat(bot.performance.winRate) : null);
                    if (wr === null) return <span className="text-muted-foreground">—</span>;
                    return <div className="text-base font-semibold">{wr}%</div>;
                  })()}
                </div>

                <div className="text-right">
                  {(bot as any).metrics?.rated ? (
                    <div>
                      <div className="text-base font-bold" data-testid={`text-algoscore-${index + 1}`}>
                        {(bot as any).metrics.algoScore}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        n={(bot as any).metrics.trades}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground" title="Not enough evaluation data to rate yet">—</span>
                  )}
                </div>

                <div className="text-right">
                  {bot.performance ? (
                    <div className="text-base font-semibold">
                      {bot.performance.subscribers.toLocaleString()}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>

                <div className="text-right flex items-center justify-end gap-2">
                  <div>
                    <div className="text-lg font-bold">
                      ${parseFloat(bot.monthlyPrice).toFixed(0)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      /month
                    </div>
                  </div>
                  {subscribedBotIds.has(bot.id) ? (
                    <Badge variant="secondary" className="gap-1 shrink-0" data-testid={`badge-subscribed-${index + 1}`}>
                      <Star className="h-3 w-3" />
                      Subscribed
                    </Badge>
                  ) : !isAuthenticated ? (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setLocation("/auth/register");
                      }}
                      data-testid={`button-subscribe-${index + 1}`}
                    >
                      <LogIn className="h-3.5 w-3.5 mr-1" />
                      Sign Up
                    </Button>
                  ) : (
                    <Button 
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedBot(bot);
                        setSubscribeDialogOpen(true);
                      }}
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
