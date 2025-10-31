import { useQuery, useMutation } from "@tanstack/react-query";
import { BotCard } from "@/components/bot-card";
import { SubscribeDialog } from "@/components/subscribe-dialog";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, ArrowLeft, Trophy, Medal, Award, Star } from "lucide-react";
import type { Bot, BotPerformance, UserOnboarding, FeaturedPlacement } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";

type BotWithPerformance = Bot & { performance: BotPerformance | null };
type TopPerformer = BotWithPerformance & { sevenDayRoi: number };
type FeaturedBot = FeaturedPlacement & { bot: BotWithPerformance };

export default function Marketplace() {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [strategyFilter, setStrategyFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [sortBy, setSortBy] = useState("roi");
  const [selectedBot, setSelectedBot] = useState<BotWithPerformance | null>(null);
  const [subscribeDialogOpen, setSubscribeDialogOpen] = useState(false);

  const { data: bots, isLoading } = useQuery<BotWithPerformance[]>({
    queryKey: ["/api/bots"],
  });

  const { data: featuredPlacement } = useQuery<FeaturedBot | null>({
    queryKey: ["/api/marketplace/featured"],
  });

  const { data: topPerformers = [] } = useQuery<TopPerformer[]>({
    queryKey: ["/api/marketplace/top-performers"],
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

  const filteredAndSortedBots = bots
    ?.filter((bot) => {
      const matchesSearch = bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bot.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStrategy = strategyFilter === "all" || bot.strategy === strategyFilter;
      const matchesRisk = riskFilter === "all" || bot.riskLevel === riskFilter;
      return matchesSearch && matchesStrategy && matchesRisk;
    })
    .sort((a, b) => {
      if (!a.performance || !b.performance) return 0;
      switch (sortBy) {
        case "roi":
          return parseFloat(b.performance.totalRoi) - parseFloat(a.performance.totalRoi);
        case "winRate":
          return parseFloat(b.performance.winRate) - parseFloat(a.performance.winRate);
        case "subscribers":
          return b.performance.subscribers - a.performance.subscribers;
        case "sharpe":
          return parseFloat(b.performance.sharpeRatio) - parseFloat(a.performance.sharpeRatio);
        default:
          return 0;
      }
    }) ?? [];

  const strategies = Array.from(new Set(bots?.map((bot) => bot.strategy) ?? []));
  const riskLevels = ["Low", "Medium", "High"];

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" data-testid="icon-rank-1" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" data-testid="icon-rank-2" />;
      case 2:
        return <Award className="h-5 w-5 text-amber-600" data-testid="icon-rank-3" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{index + 1}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-96 bg-muted/50 rounded-lg animate-pulse" />
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
              <a href="/api/login">Sign In</a>
            </Button>
          </div>
        </header>
      )}
      <div className={!isAuthenticated ? "pt-24 px-8 pb-8" : "p-8"}>
        <div className="mb-8">
          {!isAuthenticated && (
            <Link href="/">
              <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-to-home">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          )}
          <h1 className="text-3xl font-bold mb-2">Bot Marketplace</h1>
          <p className="text-muted-foreground">
            Discover and subscribe to the best trading algorithms
          </p>
        </div>

        {featuredPlacement && (
          <Card className="mb-8 bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20" data-testid="card-featured-bot">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Badge variant="default" className="gap-1" data-testid="badge-featured">
                  <Star className="h-3 w-3" />
                  Featured
                </Badge>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{featuredPlacement.bot.name}</h2>
                  <p className="text-muted-foreground mb-4">{featuredPlacement.bot.description}</p>
                  <div className="flex flex-wrap gap-4 mb-4">
                    {featuredPlacement.bot.performance && (
                      <>
                        <div>
                          <p className="text-sm text-muted-foreground">Total ROI</p>
                          <p className="text-xl font-bold text-primary">
                            {parseFloat(featuredPlacement.bot.performance.totalRoi).toFixed(2)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Win Rate</p>
                          <p className="text-xl font-bold">
                            {parseFloat(featuredPlacement.bot.performance.winRate).toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Subscribers</p>
                          <p className="text-xl font-bold">
                            {featuredPlacement.bot.performance.subscribers}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedBot(featuredPlacement.bot);
                      setSubscribeDialogOpen(true);
                    }}
                    data-testid="button-subscribe-featured"
                  >
                    View Details & Subscribe
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
              <SelectItem value="roi">Highest ROI</SelectItem>
              <SelectItem value="winRate">Win Rate</SelectItem>
              <SelectItem value="subscribers">Most Popular</SelectItem>
              <SelectItem value="sharpe">Sharpe Ratio</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {topPerformers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Top Performers - Last 7 Days
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {topPerformers.slice(0, 5).map((bot, index) => (
                <Card key={bot.id} className="hover-elevate" data-testid={`card-top-performer-${index + 1}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getRankBadge(index)}
                      </div>
                      <Badge variant="secondary" className="text-xs" data-testid={`badge-rank-${index + 1}`}>
                        {bot.sevenDayRoi.toFixed(2)}% ROI
                      </Badge>
                    </div>
                    <h3 className="font-bold mb-1 truncate" data-testid={`text-bot-name-${index + 1}`}>{bot.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {bot.description}
                    </p>
                    {bot.performance && (
                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <div>
                          <p className="text-muted-foreground">Win Rate</p>
                          <p className="font-semibold">{parseFloat(bot.performance.winRate).toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Sharpe</p>
                          <p className="font-semibold">{parseFloat(bot.performance.sharpeRatio).toFixed(2)}</p>
                        </div>
                      </div>
                    )}
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setSelectedBot(bot);
                        setSubscribeDialogOpen(true);
                      }}
                      data-testid={`button-subscribe-top-${index + 1}`}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {filteredAndSortedBots.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No bots found matching your criteria</p>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold mb-4">All Trading Bots</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedBots.map((bot) => (
                <BotCard
                  key={bot.id}
                  bot={bot}
                  onSubscribe={() => {
                    setSelectedBot(bot);
                    setSubscribeDialogOpen(true);
                  }}
                />
              ))}
            </div>
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
