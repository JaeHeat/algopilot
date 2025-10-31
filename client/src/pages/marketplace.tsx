import { useQuery, useMutation } from "@tanstack/react-query";
import { BotCard } from "@/components/bot-card";
import { SubscribeDialog } from "@/components/subscribe-dialog";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { Bot, BotPerformance, UserOnboarding } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";

type BotWithPerformance = Bot & { performance: BotPerformance | null };

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

  const { data: onboarding } = useQuery<UserOnboarding>({
    queryKey: ["/api/onboarding"],
    enabled: isAuthenticated,
  });

  const updateOnboardingMutation = useMutation({
    mutationFn: async (updates: Partial<UserOnboarding>) => {
      return await apiRequest("/api/onboarding/progress", {
        method: "POST",
        body: JSON.stringify(updates),
      });
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
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Bot Marketplace</h1>
        <p className="text-muted-foreground">
          Discover and subscribe to the best trading algorithms
        </p>
      </div>

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

      {filteredAndSortedBots.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No bots found matching your criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedBots.map((bot) => (
            <BotCard
              key={bot.id}
              bot={bot}
              performance={bot.performance}
              onSubscribe={() => {
                setSelectedBot(bot);
                setSubscribeDialogOpen(true);
              }}
            />
          ))}
        </div>
      )}

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
