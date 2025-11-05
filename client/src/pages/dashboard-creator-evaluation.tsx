import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Award, TrendingUp, AlertCircle, CheckCircle2, XCircle, Target, BarChart3, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function DashboardCreatorEvaluation() {
  const [, params] = useRoute("/dashboard/creator/evaluation/:botId");
  const botId = params?.botId;

  const { data: creatorBots = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/creator/bots"],
  });

  const bot = creatorBots.find((b) => b.id === botId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!bot) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Bot not found</h2>
        <Link href="/dashboard/creator">
          <Button variant="outline" data-testid="button-back-to-creator">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Creator Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const { toast } = useToast();
  
  const isLive = bot.evaluationStatus === "live";
  const isInEvaluation = bot.evaluationStatus === "in_evaluation";
  const isFailed = bot.evaluationStatus === "failed";
  const progress = bot.evaluationProgress || { 
    tradeCount: 0, 
    profitPercentage: 0, 
    maxDrawdown: 0,
    requiredTrades: 10, 
    requiredProfit: 10,
    requiredMaxDrawdown: 5,
  };
  const tradeProgress = (progress.tradeCount / progress.requiredTrades) * 100;
  const profitProgress = Math.max(0, (progress.profitPercentage / progress.requiredProfit) * 100);
  const drawdownProgress = progress.maxDrawdown <= progress.requiredMaxDrawdown ? 100 : 0;
  const meetsRequirements = 
    progress.tradeCount >= progress.requiredTrades && 
    progress.profitPercentage >= progress.requiredProfit &&
    progress.maxDrawdown <= progress.requiredMaxDrawdown;

  const restartMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/bots/${botId}/evaluation/restart`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator/bots"] });
      toast({
        title: "Evaluation restarted",
        description: "All previous trades have been cleared. You can now start fresh.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to restart evaluation",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/creator">
          <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Creator Dashboard
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{bot.name}</h1>
          {isLive && (
            <Badge variant="default" className="gap-1" data-testid="badge-evaluation-status">
              <Award className="h-3 w-3" />
              Live on Marketplace
            </Badge>
          )}
          {isInEvaluation && (
            <Badge variant="secondary" className="gap-1" data-testid="badge-evaluation-status">
              <TrendingUp className="h-3 w-3" />
              In Evaluation
            </Badge>
          )}
          {isFailed && (
            <Badge variant="destructive" className="gap-1" data-testid="badge-evaluation-status">
              <XCircle className="h-3 w-3" />
              Evaluation Failed
            </Badge>
          )}
          {!isLive && !isInEvaluation && !isFailed && (
            <Badge variant="outline" className="gap-1" data-testid="badge-evaluation-status">
              <AlertCircle className="h-3 w-3" />
              Not Started
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground mt-2">
          Your bot must meet all three requirements independently to go live on the marketplace
        </p>
      </div>

      {isFailed ? (
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-destructive" />
                <CardTitle className="text-destructive">Evaluation Failed</CardTitle>
              </div>
              <Button
                onClick={() => restartMutation.mutate()}
                disabled={restartMutation.isPending}
                data-testid="button-restart-evaluation"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${restartMutation.isPending ? 'animate-spin' : ''}`} />
                Restart Evaluation
              </Button>
            </div>
            <CardDescription>
              {bot.failureReason || "Your bot did not meet the evaluation requirements."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="text-sm font-medium mb-2">What happens when you restart?</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>All previous evaluation trades will be deleted</li>
                  <li>Evaluation status will reset to "In Evaluation"</li>
                  <li>Your bot can start receiving new trade signals immediately</li>
                  <li>Webhooks will be re-enabled for this bot</li>
                </ul>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Trades Before Failure</p>
                  <p className="text-2xl font-bold">{progress.tradeCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Profit Before Failure</p>
                  <p className={`text-2xl font-bold ${progress.profitPercentage >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {progress.profitPercentage >= 0 ? '+' : ''}{progress.profitPercentage.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Max Drawdown</p>
                  <p className={`text-2xl font-bold ${progress.maxDrawdown <= progress.requiredMaxDrawdown ? 'text-success' : 'text-destructive'}`}>
                    {progress.maxDrawdown.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : isLive ? (
        <Card className="border-success">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <CardTitle className="text-success">Bot is Live!</CardTitle>
            </div>
            <CardDescription>
              Your bot has successfully completed the evaluation phase and is now live on the marketplace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Trades</p>
                <p className="text-2xl font-bold">{progress.tradeCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Profit</p>
                <p className="text-2xl font-bold text-success">+{progress.profitPercentage.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Max Drawdown</p>
                <p className="text-2xl font-bold text-success">{progress.maxDrawdown.toFixed(2)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Current Progress
              </CardTitle>
              <CardDescription>
                All three requirements must be met independently. You need at least 10 trades, cumulative profit of +10%, AND maximum drawdown under 5%.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold">Trade Count</p>
                      <p className="text-sm text-muted-foreground">
                        Minimum {progress.requiredTrades} trades required
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        {progress.tradeCount} / {progress.requiredTrades}
                      </p>
                      {progress.tradeCount >= progress.requiredTrades && (
                        <Badge variant="default" className="gap-1 mt-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Complete
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Progress value={Math.min(100, tradeProgress)} className="h-3" data-testid="progress-trades" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold">Total Profitability</p>
                      <p className="text-sm text-muted-foreground">
                        Cumulative profit must reach +{progress.requiredProfit}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${progress.profitPercentage >= progress.requiredProfit ? 'text-success' : progress.profitPercentage >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                        {progress.profitPercentage > 0 ? '+' : ''}{progress.profitPercentage.toFixed(2)}%
                      </p>
                      {progress.profitPercentage >= progress.requiredProfit && (
                        <Badge variant="default" className="gap-1 mt-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Complete
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Progress value={Math.min(100, profitProgress)} className="h-3" data-testid="progress-profit" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold">Maximum Drawdown</p>
                      <p className="text-sm text-muted-foreground">
                        Must stay under {progress.requiredMaxDrawdown}% drawdown
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${progress.maxDrawdown <= progress.requiredMaxDrawdown ? 'text-success' : 'text-destructive'}`}>
                        {progress.maxDrawdown.toFixed(2)}%
                      </p>
                      {progress.maxDrawdown <= progress.requiredMaxDrawdown && (
                        <Badge variant="default" className="gap-1 mt-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Complete
                        </Badge>
                      )}
                      {progress.maxDrawdown > progress.requiredMaxDrawdown && progress.tradeCount > 0 && (
                        <Badge variant="destructive" className="gap-1 mt-1">
                          <XCircle className="h-3 w-3" />
                          Failed
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Progress 
                    value={drawdownProgress}
                    className="h-3" 
                    data-testid="progress-drawdown" 
                  />
                </div>
              </div>

              {meetsRequirements && (
                <div className="p-4 bg-success/10 border border-success rounded-md" data-testid="success-message">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                    <div>
                      <p className="font-semibold text-success">Requirements Met!</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your bot has successfully completed the evaluation phase. It will be automatically published to the marketplace and available for traders to subscribe to.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!meetsRequirements && progress.tradeCount > 0 && (
                <div className="p-4 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground">
                    Keep trading! Your bot needs to meet all three requirements to go live on the marketplace.
                  </p>
                </div>
              )}

              {progress.tradeCount === 0 && (
                <div className="p-4 bg-muted rounded-md">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-semibold">Start Trading</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Connect your TradingView alerts to the webhook URL and start sending trade signals to begin the evaluation process.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Evaluation Requirements
              </CardTitle>
              <CardDescription>
                Your bot must meet these criteria to go live on the marketplace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  {progress.tradeCount >= progress.requiredTrades ? (
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                  )}
                  <div>
                    <p className="font-semibold">Minimum Trade Count</p>
                    <p className="text-sm text-muted-foreground">
                      Execute at least {progress.requiredTrades} completed trades (both entry and exit) to demonstrate consistency. This prevents bots from going live based on a single lucky trade.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  {progress.profitPercentage >= progress.requiredProfit ? (
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                  )}
                  <div>
                    <p className="font-semibold">Profitability Threshold</p>
                    <p className="text-sm text-muted-foreground">
                      Achieve a cumulative profit of at least +{progress.requiredProfit}% across all completed trades. This ensures your strategy is genuinely profitable and not just breaking even or losing money.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  {progress.maxDrawdown <= progress.requiredMaxDrawdown ? (
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                  ) : progress.tradeCount > 0 ? (
                    <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                  )}
                  <div>
                    <p className="font-semibold">Maximum Drawdown Limit</p>
                    <p className="text-sm text-muted-foreground">
                      Maintain a maximum drawdown under {progress.requiredMaxDrawdown}% throughout the evaluation. Drawdown measures the largest peak-to-trough decline in your account equity, ensuring your strategy manages risk effectively.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-semibold">Performance-Based Approval</p>
                    <p className="text-sm text-muted-foreground">
                      Similar to prop firm evaluations, this system ensures only profitable, proven strategies with solid risk management reach the marketplace. This protects traders and builds platform trust.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-muted rounded-md mt-4">
                  <p className="text-xs text-muted-foreground">
                    <strong>Note:</strong> All trades are tracked via your bot's trade logs. Profit is calculated as the sum of all trade P&L percentages. Drawdown is calculated by tracking your running equity from peak to current level throughout the evaluation period.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
