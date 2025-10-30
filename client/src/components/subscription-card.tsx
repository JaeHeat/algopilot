import { useState } from "react";
import { TrendingUp, TrendingDown, Users, Settings, Pause, Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SubscriptionSettingsDialog } from "@/components/subscription-settings-dialog";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Subscription, Bot, BotPerformance } from "@shared/schema";

interface SubscriptionCardProps {
  subscription: Subscription & { bot: Bot; performance: BotPerformance | null };
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const [, setLocation] = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { toast } = useToast();
  const roi = subscription.performance ? parseFloat(subscription.performance.totalRoi) : 0;
  const isPositive = roi > 0;

  const togglePauseMutation = useMutation({
    mutationFn: async (shouldResume: boolean) => {
      const endpoint = shouldResume ? `/api/subscriptions/${subscription.id}/resume` : `/api/subscriptions/${subscription.id}/pause`;
      const res = await apiRequest("POST", endpoint, shouldResume ? {} : { reason: "User toggled off" });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      toast({
        title: subscription.isPaused ? "Bot Activated" : "Bot Paused",
        description: subscription.isPaused ? "Your bot is now live and trading" : "Your bot has been paused",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update bot status",
        variant: "destructive",
      });
    },
  });
  
  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    setLocation(`/bot/${subscription.bot.id}`);
  };

  const getRiskLabel = (risk: number) => {
    const labels = ["", "Safest", "Safe", "Aggressive", "High Risk", "DANGER"];
    return labels[risk] || "";
  };
  
  return (
    <>
      <Card 
        className="p-6 hover-elevate cursor-pointer" 
        data-testid={`card-subscription-${subscription.id}`}
        onClick={handleCardClick}
      >
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                {isPositive ? (
                  <TrendingUp className="h-6 w-6 text-primary" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg" data-testid={`text-bot-name-${subscription.id}`}>
                    {subscription.bot.name}
                  </h3>
                  {subscription.isPaused && (
                    <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">
                      <Pause className="h-3 w-3 mr-1" />
                      Paused
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {subscription.bot.description.substring(0, 50)}...
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Badge variant="secondary">{subscription.bot.strategy}</Badge>
              <Badge variant="outline" className="text-xs">
                {getRiskLabel(subscription.riskPercentage)}
              </Badge>
            </div>
          </div>
          
          {subscription.performance && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className={`text-2xl font-bold tabular-nums ${isPositive ? 'text-success' : 'text-danger'}`}>
                    {isPositive ? '+' : ''}{roi.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Total ROI</div>
                </div>
                <div>
                  <div className="text-2xl font-bold tabular-nums">
                    {parseFloat(subscription.performance.winRate).toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Win Rate</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{subscription.performance.subscribers} subscribers</span>
                </div>
                <div className="text-muted-foreground">
                  {subscription.performance.totalTrades} trades
                </div>
              </div>
            </>
          )}
          
          <div className="flex items-center justify-between gap-4 pt-2">
            <div className="space-y-1">
              <div className="text-lg font-semibold">
                ${parseFloat(subscription.bot.monthlyPrice).toFixed(0)}/mo
              </div>
              {subscription.capitalAllocated && (
                <div className="text-xs text-muted-foreground">
                  Capital: ${parseFloat(subscription.capitalAllocated).toFixed(0)}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div 
                className="flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <Label 
                  htmlFor={`toggle-${subscription.id}`}
                  className="text-sm cursor-pointer"
                  data-testid={`label-toggle-${subscription.id}`}
                >
                  {subscription.isPaused ? "Off" : "On"}
                </Label>
                <Switch
                  id={`toggle-${subscription.id}`}
                  checked={!subscription.isPaused}
                  onCheckedChange={(checked) => {
                    togglePauseMutation.mutate(checked);
                  }}
                  disabled={togglePauseMutation.isPending}
                  data-testid={`toggle-${subscription.id}`}
                />
              </div>
              <Button 
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setSettingsOpen(true);
                }}
                data-testid={`button-settings-${subscription.id}`}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <SubscriptionSettingsDialog
        subscription={subscription}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </>
  );
}
