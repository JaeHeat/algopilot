import { useState } from "react";
import { TrendingUp, TrendingDown, Users, Settings, Pause, Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SubscriptionSettingsDialog } from "@/components/subscription-settings-dialog";
import { useLocation } from "wouter";
import type { Subscription, Bot, BotPerformance } from "@shared/schema";

interface SubscriptionCardProps {
  subscription: Subscription & { bot: Bot; performance: BotPerformance | null };
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const [, setLocation] = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const roi = subscription.performance ? parseFloat(subscription.performance.totalRoi) : 0;
  const isPositive = roi > 0;
  
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
      </Card>

      <SubscriptionSettingsDialog
        subscription={subscription}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </>
  );
}
