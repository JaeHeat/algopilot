import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { SubscriptionCard } from "@/components/subscription-card";
import { Bot as BotIcon, Pause, CalendarX } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Subscription, Bot as BotType, BotPerformance } from "@shared/schema";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";

type SubscriptionWithBot = Subscription & { bot: BotType; performance: BotPerformance | null };

export default function DashboardMyBots() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [location, setLocation] = useLocation();

  const { data: subscriptions, isLoading, error } = useQuery<SubscriptionWithBot[]>({
    queryKey: ["/api/subscriptions"],
    enabled: isAuthenticated,
    retry: false,
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

  const activeSubscriptions = subscriptions?.filter(sub => !sub.isPaused && !sub.subscriptionEndsAt) || [];
  const pausedSubscriptions = subscriptions?.filter(sub => sub.isPaused && !sub.subscriptionEndsAt) || [];
  const cancelledSubscriptions = subscriptions?.filter(sub => sub.subscriptionEndsAt && new Date(sub.subscriptionEndsAt) > new Date()) || [];

  if (authLoading || isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-muted/50 rounded-lg animate-pulse" />
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Bots</h1>
          <p className="text-muted-foreground">Manage all your trading bot subscriptions</p>
        </div>
        <Button onClick={() => setLocation("/dashboard/marketplace")} data-testid="button-browse-marketplace">
          <BotIcon className="h-4 w-4 mr-2" />
          Browse Marketplace
        </Button>
      </div>

      {/* Active Bots Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BotIcon className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-semibold">
            Active Bots {activeSubscriptions.length > 0 && `(${activeSubscriptions.length})`}
          </h2>
        </div>
        
        {activeSubscriptions.length === 0 ? (
          <div className="border rounded-lg p-8 text-center">
            <BotIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Active Bots</h3>
            <p className="text-muted-foreground mb-4">
              You don't have any active trading bots yet
            </p>
            <Button onClick={() => setLocation("/dashboard/marketplace")}>
              Browse Marketplace
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activeSubscriptions.map((subscription) => (
              <SubscriptionCard
                key={subscription.id}
                subscription={subscription}
              />
            ))}
          </div>
        )}
      </div>

      {/* Paused Bots Section */}
      {pausedSubscriptions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Pause className="h-5 w-5 text-yellow-600" />
            <h2 className="text-2xl font-semibold">
              Paused Bots ({pausedSubscriptions.length})
            </h2>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pausedSubscriptions.map((subscription) => (
              <SubscriptionCard
                key={subscription.id}
                subscription={subscription}
              />
            ))}
          </div>
        </div>
      )}

      {/* Cancelled Bots Section */}
      {cancelledSubscriptions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CalendarX className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-2xl font-semibold">
              Ending Soon ({cancelledSubscriptions.length})
            </h2>
          </div>
          
          <p className="text-sm text-muted-foreground">
            These subscriptions are scheduled to end but remain active until their end date
          </p>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cancelledSubscriptions.map((subscription) => (
              <SubscriptionCard
                key={subscription.id}
                subscription={subscription}
              />
            ))}
          </div>
        </div>
      )}

      {subscriptions && subscriptions.length === 0 && (
        <div className="border rounded-lg p-12 text-center">
          <BotIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-semibold mb-2">No Subscriptions Yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Start your automated trading journey by subscribing to a bot from our marketplace
          </p>
          <Button size="lg" onClick={() => setLocation("/dashboard/marketplace")}>
            <BotIcon className="h-5 w-5 mr-2" />
            Explore Trading Bots
          </Button>
        </div>
      )}
    </div>
  );
}
