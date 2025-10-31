import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { MetricCard } from "@/components/metric-card";
import { PerformanceChart } from "@/components/performance-chart";
import { TradeTable } from "@/components/trade-table";
import { SubscriptionCard } from "@/components/subscription-card";
import { SubscriptionSettingsDialog } from "@/components/subscription-settings-dialog";
import { WelcomeModal } from "@/components/welcome-modal";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { DollarSign, TrendingUp, Bot, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Subscription, Bot as BotType, BotPerformance, UserOnboarding } from "@shared/schema";
import { useEffect, useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";

type SubscriptionWithBot = Subscription & { bot: BotType; performance: BotPerformance | null };

type Timeframe = '24h' | '7d' | '1m' | '3m' | '6m' | '1y';

export default function DashboardOverview() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionWithBot | null>(null);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1m');
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
        window.location.href = "/api/login";
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

  const { labels: chartLabels, data: chartData } = useMemo(() => {
    const baseValue = 10000;
    
    switch (selectedTimeframe) {
      case '24h': {
        const hours = Array.from({ length: 24 }, (_, i) => {
          const hour = i;
          return hour === 0 ? '12am' : hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`;
        });
        const data = Array.from({ length: 24 }, (_, i) => {
          const volatility = 100 + Math.sin(i / 4) * 50 + Math.sin(i / 2) * 30;
          return baseValue + i * 15 + volatility;
        });
        return { labels: hours, data };
      }
      case '7d': {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const data = [10000, 10200, 10500, 10800, 11200, 11500, 11800];
        return { labels: days, data };
      }
      case '1m': {
        const labels = Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`);
        const data = Array.from({ length: 30 }, (_, i) => {
          return baseValue + i * 50 + Math.sin(i / 3) * 200 + Math.cos(i / 4) * 100;
        });
        return { labels, data };
      }
      case '3m': {
        const weeks = Array.from({ length: 12 }, (_, i) => `W${i + 1}`);
        const data = Array.from({ length: 12 }, (_, i) => {
          return baseValue + i * 200 + Math.sin(i / 2) * 300;
        });
        return { labels: weeks, data };
      }
      case '6m': {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const data = [10000, 10500, 11200, 11800, 12500, 13200];
        return { labels: months, data };
      }
      case '1y': {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const data = [10000, 10500, 10200, 11000, 11500, 11200, 12000, 12800, 12500, 13200, 13800, 14500];
        return { labels: months, data };
      }
      default:
        return { labels: [], data: [] };
    }
  }, [selectedTimeframe]);
  
  const mockTrades = [
    { id: "1", pair: "BTC/USDT", type: "BUY" as const, amount: 0.0523, price: 43250, profit: 245.50, timestamp: "2 mins ago" },
    { id: "2", pair: "ETH/USDT", type: "SELL" as const, amount: 1.2341, price: 2250, profit: 89.20, timestamp: "5 mins ago" },
    { id: "3", pair: "BTC/USDT", type: "SELL" as const, amount: 0.0312, price: 43180, profit: -32.10, timestamp: "12 mins ago" },
    { id: "4", pair: "SOL/USDT", type: "BUY" as const, amount: 12.5000, price: 98, profit: 156.75, timestamp: "18 mins ago" },
    { id: "5", pair: "AVAX/USDT", type: "BUY" as const, amount: 25.4200, price: 35, profit: 78.30, timestamp: "25 mins ago" },
  ];

  const activeSubscriptions = subscriptions?.filter(sub => !sub.isPaused) || [];
  
  const avgRoi = activeSubscriptions.reduce((sum, sub) => {
    const roi = sub.performance ? parseFloat(sub.performance.totalRoi) : 0;
    return sum + roi;
  }, 0);
  
  const avgWinRate = activeSubscriptions.reduce((sum, sub) => {
    const winRate = sub.performance ? parseFloat(sub.performance.winRate) : 0;
    return sum + winRate;
  }, 0);

  const activeBotCount = activeSubscriptions.length;
  const calculatedAvgWinRate = activeBotCount > 0 ? (avgWinRate / activeBotCount).toFixed(0) : "0";
  
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
          title="Total Portfolio Value"
          value="$45,231"
          change="+12.5% this month"
          icon={DollarSign}
          trend="up"
        />
        <MetricCard
          title="24h P&L"
          value="+$1,234"
          change="+2.7% today"
          icon={TrendingUp}
          trend="up"
        />
        <MetricCard
          title="Active Bots"
          value={activeBotCount.toString()}
          change={activeBotCount > 0 ? `${activeBotCount} active` : "Subscribe to bots"}
          icon={Bot}
        />
        <MetricCard
          title="Avg Win Rate"
          value={`${calculatedAvgWinRate}%`}
          change="Across all bots"
          icon={Target}
          trend={parseFloat(calculatedAvgWinRate) > 65 ? "up" : undefined}
        />
      </div>
      
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold">Portfolio Equity Curve</h3>
          <div className="flex gap-1">
            {(['24h', '7d', '1m', '3m', '6m', '1y'] as Timeframe[]).map((tf) => (
              <Button
                key={tf}
                variant={selectedTimeframe === tf ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedTimeframe(tf)}
                data-testid={`button-timeframe-${tf}`}
                className="min-w-[60px]"
              >
                {tf}
              </Button>
            ))}
          </div>
        </div>
        <PerformanceChart
          title=""
          data={chartData}
          labels={chartLabels}
          showCard={false}
        />
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
            <a href="/dashboard/marketplace" className="text-primary hover:underline">
              Browse the marketplace
            </a>
          </div>
        )}
      </div>
      
      <TradeTable trades={mockTrades} />
      
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
