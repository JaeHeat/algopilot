import { TrendingUp, TrendingDown, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Bot, BotPerformance } from "@shared/schema";

interface BotCardProps {
  bot: Bot;
  performance: BotPerformance | null;
  onSubscribe?: (botId: string) => void;
  showSubscribeButton?: boolean;
}

export function BotCard({ bot, performance, onSubscribe, showSubscribeButton = true }: BotCardProps) {
  const roi = performance ? parseFloat(performance.totalRoi) : 0;
  const isPositive = roi > 0;
  
  return (
    <Card className="p-6 hover-elevate" data-testid={`card-bot-${bot.id}`}>
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
            <div>
              <h3 className="font-semibold text-lg">{bot.name}</h3>
              <p className="text-sm text-muted-foreground">{bot.description.substring(0, 50)}...</p>
            </div>
          </div>
          <Badge variant="secondary">{bot.strategy}</Badge>
        </div>
        
        {performance && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className={`text-2xl font-bold tabular-nums ${isPositive ? 'text-success' : 'text-danger'}`}>
                  {isPositive ? '+' : ''}{roi.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">Total ROI</div>
              </div>
              <div>
                <div className="text-2xl font-bold tabular-nums">{parseFloat(performance.winRate).toFixed(0)}%</div>
                <div className="text-xs text-muted-foreground">Win Rate</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{performance.subscribers} subscribers</span>
              </div>
              <div className="text-muted-foreground">{performance.totalTrades} trades</div>
            </div>
          </>
        )}
        
        <div className="flex items-center justify-between gap-4 pt-2">
          <div className="text-lg font-semibold">${parseFloat(bot.monthlyPrice).toFixed(0)}/mo</div>
          {showSubscribeButton && (
            <Button 
              className="flex-1" 
              data-testid={`button-subscribe-${bot.id}`}
              onClick={() => onSubscribe?.(bot.id)}
            >
              Subscribe
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
