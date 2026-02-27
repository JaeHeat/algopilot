import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { MetricCard } from "@/components/metric-card";
import { PerformanceChart } from "@/components/performance-chart";
import { SubscriptionCard } from "@/components/subscription-card";
import { SubscriptionSettingsDialog } from "@/components/subscription-settings-dialog";
import { WelcomeModal } from "@/components/welcome-modal";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { TrendingUp, TrendingDown, Bot, Target, Activity, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Subscription, Bot as BotType, BotPerformance, UserOnboarding } from "@shared/schema";
import { useEffect, useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation, Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, formatDistanceToNow } from "date-fns";

type SubscriptionWithBot = Subscription & { bot: BotType; performance: BotPerformance | null };

export default function DashboardOverview() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionWithBot | null>(null);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const { data: subscriptions, isLoading, error } = useQuery<SubscriptionWithBot[]>({
    queryKey: ["/api/subscriptions"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: onboarding } = useQuery<UserOnboarding>({
    queryKey: ["/api/onboarding"],
    enabled: isAuthenticated,
  });

  const { data: analytics } = useQuery<{
    totalTrades: number;
    closedTrades: number;
    openPositions: number;
    totalPnl: string;
    unrealizedPnl: string;
    combinedPnl: string;
    winningTrades: number;
    losingTrades: number;
    winRate: string;
    profitFactor: string;
    bestTrade: { symbol: string; pnl: string; date: string } | null;
    worstTrade: { symbol: string; pnl: string; date: string } | null;
  }>({
    queryKey: ["/api/user/analytics"],
    enabled: isAuthenticated,
  });

  const { data: recentTrades = [] } = useQuery<Array<{
    id: string;
    symbol: string;
    side: string;
    quantity: string;
    price: string;
    fees: string;
    pnl: string | null;
    executedAt: string;
    bot: { name: string };
  }>>({
    queryKey: ["/api/user/trades"],
    enabled: isAuthenticated,
  });

  const { data: userPositions = [] } = useQuery<Array<{
    id: string;
    symbol: string;
    positionType: string;
    quantity: string;
    entryPrice: string;
    currentPrice: string;
    unrealizedPnl: string;
    status: string;
    openedAt: string;
    closedAt: string | null;
  }>>({
    queryKey: ["/api/user/positions"],
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

  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/onboarding/complete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding"] });
    },
  });

  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 500);
    }
  }, [error, toast]);

  useEffect(() => {
    if (onboarding && !onboarding.hasCompletedWelcome && !showWelcomeModal) {
      setShowWelcomeModal(true);
    }
  }, [onboarding]);

  useEffect(() => {
    if (onboarding && !onboarding.hasViewedDashboard) {
      updateOnboardingMutation.mutate({ hasViewedDashboard: true });
    }
  }, [onboarding]);

  useEffect(() => {
    if (subscriptions && subscriptions.length > 0 && onboarding && !onboarding.hasSubscribedToBot) {
      updateOnboardingMutation.mutate({ hasSubscribedToBot: true });
    }
  }, [subscriptions, onboarding]);

  const handleWelcomeClose = (dontShowAgain?: boolean) => {
    setShowWelcomeModal(false);
    if (onboarding && !onboarding.hasCompletedWelcome && dontShowAgain) {
      updateOnboardingMutation.mutate({ hasCompletedWelcome: true });
    }
  };

  const handleDismissChecklist = () => {
    completeOnboardingMutation.mutate();
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const openSettingsId = params.get('openSettings');
    
    if (openSettingsId && subscriptions) {
      const subscription = subscriptions.find(sub => sub.id === openSettingsId);
      if (subscription) {
        setSelectedSubscription(subscription);
        setSettingsDialogOpen(true);
        window.history.replaceState({}, '', '/dashboard');
      } else if (subscriptions.length > 0) {
        window.history.replaceState({}, '', '/dashboard');
      }
    }
  }, [subscriptions]);

  const { chartLabels, chartData, hasChartData } = useMemo(() => {
    const closedPositions = userPositions
      .filter(p => p.status === 'closed' && p.closedAt)
      .sort((a, b) => new Date(a.closedAt!).getTime() - new Date(b.closedAt!).getTime());

    if (closedPositions.length === 0) {
      return { chartLabels: [], chartData: [], hasChartData: false };
    }

    let equity = 10000;
    const points: number[] = [equity];
    const labels: string[] = ['Start'];

    for (const pos of closedPositions) {
      equity += parseFloat(pos.unrealizedPnl);
      points.push(Math.max(0, equity));
      labels.push(format(new Date(pos.closedAt!), 'MMM d'));
    }

    return { chartLabels: labels, chartData: points, hasChartData: true };
  }, [userPositions]);

  const exitTrades = useMemo(() => {
    return recentTrades
      .filter(t => t.pnl !== null)
      .slice(0, 10);
  }, [recentTrades]);

  const activeSubscriptions = subscriptions?.filter(sub => !sub.isPaused) || [];

  const avgWinRate = activeSubscriptions.reduce((sum, sub) => {
    const winRate = sub.performance ? parseFloat(sub.performance.winRate) : 0;
    return sum + winRate;
  }, 0);

  const activeBotCount = activeSubscriptions.length;
  const calculatedAvgWinRate = activeBotCount > 0 ? (avgWinRate / activeBotCount).toFixed(0) : "0";

  const totalPnl = analytics ? parseFloat(analytics.totalPnl) : 0;
  const unrealizedPnl = analytics ? parseFloat(analytics.unrealizedPnl) : 0;
  const combinedPnl = totalPnl + unrealizedPnl;
  const analyticsWinRate = analytics ? parseFloat(analytics.winRate) : 0;

  const getSideColor = (side: string) => {
    const s = side.toLowerCase();
    if (s === 'buy' || s === 'long') return 'text-success';
    return 'text-destructive';
  };

  if (authLoading || isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-muted/50 rounded-lg animate-pulse" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <WelcomeModal open={showWelcomeModal} onClose={handleWelcomeClose} />
      
      {onboarding && !onboarding.completedAt && (
        <OnboardingChecklist 
          onboarding={onboarding} 
          onDismiss={handleDismissChecklist}
        />
      )}
      
      <div>
        <h1 className="text-3xl font-bold mb-2">Portfolio Overview</h1>
        <p className="text-muted-foreground">Track your trading performance and active bots</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Realized P&L"
          value={`${totalPnl >= 0 ? '+' : ''}$${Math.abs(totalPnl).toFixed(2)}`}
          change={analytics ? `${analytics.closedTrades} closed trade${analytics.closedTrades !== 1 ? 's' : ''}` : "No trades yet"}
          icon={TrendingUp}
          trend={totalPnl > 0 ? "up" : totalPnl < 0 ? "down" : undefined}
        />
        <MetricCard
          title="Unrealized P&L"
          value={`${unrealizedPnl >= 0 ? '+' : ''}$${Math.abs(unrealizedPnl).toFixed(2)}`}
          change={analytics ? `${analytics.openPositions} open position${analytics.openPositions !== 1 ? 's' : ''}` : "No open positions"}
          icon={Activity}
          trend={unrealizedPnl > 0 ? "up" : unrealizedPnl < 0 ? "down" : undefined}
        />
        <MetricCard
          title="Active Bots"
          value={activeBotCount.toString()}
          change={activeBotCount > 0 ? `${activeBotCount} active` : "Subscribe to bots"}
          icon={Bot}
        />
        <MetricCard
          title="Win Rate"
          value={analytics ? `${analyticsWinRate.toFixed(0)}%` : `${calculatedAvgWinRate}%`}
          change={analytics ? `${analytics.winningTrades}W / ${analytics.losingTrades}L` : "Across all bots"}
          icon={Target}
          trend={analyticsWinRate > 55 ? "up" : undefined}
        />
      </div>
      
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold">Portfolio Equity Curve</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Based on your real closed positions</p>
          </div>
          {combinedPnl !== 0 && (
            <div className={`text-sm font-semibold ${combinedPnl >= 0 ? 'text-success' : 'text-destructive'}`}>
              {combinedPnl >= 0 ? '+' : ''}${Math.abs(combinedPnl).toFixed(2)} total
            </div>
          )}
        </div>
        {hasChartData ? (
          <PerformanceChart
            title=""
            data={chartData}
            labels={chartLabels}
            showCard={false}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Activity className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium text-muted-foreground">No trading history yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your equity curve will appear here once you have closed positions
            </p>
          </div>
        )}
      </Card>
      
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Active Bots</h2>
          <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard/my-bots")} data-testid="button-view-all-bots">
            View All Bots
          </Button>
        </div>
        {activeSubscriptions.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {activeSubscriptions.map((subscription) => (
              <SubscriptionCard
                key={subscription.id}
                subscription={subscription}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">You don't have any active bots</p>
            <p className="text-sm text-muted-foreground mb-4">
              {subscriptions && subscriptions.length > 0 
                ? "All your bots are paused. Visit My Bots to manage them."
                : "You haven't subscribed to any bots yet"}
            </p>
            <Link href="/marketplace" className="text-primary hover:underline">
              Browse the marketplace
            </Link>
          </div>
        )}
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Recent Trades</h3>
          <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard/my-trades")} data-testid="button-view-all-trades">
            View All
          </Button>
        </div>
        {exitTrades.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-sm text-muted-foreground">
                  <th className="text-left py-3 font-medium">Pair</th>
                  <th className="text-left py-3 font-medium">Bot</th>
                  <th className="text-left py-3 font-medium">Side</th>
                  <th className="text-right py-3 font-medium">Qty</th>
                  <th className="text-right py-3 font-medium">Price</th>
                  <th className="text-right py-3 font-medium">P&L</th>
                  <th className="text-right py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {exitTrades.map((trade) => {
                  const pnl = parseFloat(trade.pnl || "0");
                  return (
                    <tr
                      key={trade.id}
                      className="border-b border-border last:border-0"
                      data-testid={`row-trade-${trade.id}`}
                    >
                      <td className="py-3 font-medium text-sm">{trade.symbol}</td>
                      <td className="py-3 text-sm text-muted-foreground">{trade.bot?.name || '—'}</td>
                      <td className="py-3">
                        <Badge variant={trade.side.toLowerCase() === 'buy' ? "default" : "secondary"} className="text-xs">
                          {trade.side.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3 text-right text-sm tabular-nums">{parseFloat(trade.quantity).toFixed(4)}</td>
                      <td className="py-3 text-right text-sm tabular-nums">${parseFloat(trade.price).toLocaleString()}</td>
                      <td className={`py-3 text-right text-sm font-semibold tabular-nums ${pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {pnl >= 0 ? '+' : ''}${Math.abs(pnl).toFixed(2)}
                      </td>
                      <td className="py-3 text-right text-xs text-muted-foreground">
                        <div className="flex items-center justify-end gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(trade.executedAt), { addSuffix: true })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium text-muted-foreground">No trades yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Completed trades will appear here once your bots execute
            </p>
          </div>
        )}
      </Card>
      
      {selectedSubscription && (
        <SubscriptionSettingsDialog
          subscription={selectedSubscription}
          open={settingsDialogOpen}
          onOpenChange={setSettingsDialogOpen}
        />
      )}
    </div>
  );
}
