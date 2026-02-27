import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Award, TrendingUp, AlertCircle, CheckCircle2, XCircle, Target, BarChart3, RefreshCw, History, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { format, formatDistanceToNow } from "date-fns";

export default function DashboardCreatorEvaluation() {
  const [, params] = useRoute("/dashboard/creator/evaluation/:botId");
  const botId = params?.botId;
  const { toast } = useToast();

  const { data: creatorBots = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/creator/bots"],
  });

  const { data: evaluationData } = useQuery<{
    run: any;
    trades: any[];
    evaluation: any;
  }>({
    queryKey: ["/api/creator/bots", botId, "evaluation"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/creator/bots/${botId}/evaluation`);
      return await res.json();
    },
    enabled: !!botId,
    refetchInterval: 15000,
  });

  const bot = creatorBots.find((b) => b.id === botId);

  const restartMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/bots/${botId}/evaluation/restart`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator/bots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/creator/bots", botId, "evaluation"] });
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

  const isLive = bot.evaluationStatus === "live";
  const isInEvaluation = bot.evaluationStatus === "in_evaluation";
  const isFailed = bot.evaluationStatus === "failed";
  const progress = bot.evaluationProgress || {
    tradeCount: 0,
    profitPercentage: 0,
    maxDrawdown: 0,
    requiredTrades: 10,
    requiredProfit: 8,
    requiredMaxDrawdown: 12,
  };

  const tradeProgress = (progress.tradeCount / progress.requiredTrades) * 100;
  const profitProgress = Math.max(0, (progress.profitPercentage / progress.requiredProfit) * 100);
  const drawdownUsedPct = progress.requiredMaxDrawdown > 0
    ? (progress.maxDrawdown / progress.requiredMaxDrawdown) * 100
    : 0;
  const drawdownPassing = progress.maxDrawdown <= progress.requiredMaxDrawdown;

  const meetsRequirements =
    progress.tradeCount >= progress.requiredTrades &&
    progress.profitPercentage >= progress.requiredProfit &&
    progress.maxDrawdown <= progress.requiredMaxDrawdown;

  const completedTrades = evaluationData?.trades?.filter((t: any) => t.legType === 'exit') || [];

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
            <div className="flex items-center justify-between gap-4 flex-wrap">
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
                All three requirements must be met independently. You need at least {progress.requiredTrades} trades, cumulative profit of +{progress.requiredProfit}%, AND maximum drawdown under {progress.requiredMaxDrawdown}%.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold">Trade Count</p>
                      <p className="text-sm text-muted-foreground">
                        Minimum {progress.requiredTrades} trades required
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold tabular-nums">
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
                  <Progress value={Math.min(100, tradeProgress)} className="h-2.5" data-testid="progress-trades" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold">Total Profitability</p>
                      <p className="text-sm text-muted-foreground">
                        Cumulative profit must reach +{progress.requiredProfit}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold tabular-nums ${progress.profitPercentage >= progress.requiredProfit ? 'text-success' : progress.profitPercentage >= 0 ? 'text-foreground' : 'text-destructive'}`}>
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
                  <Progress value={Math.min(100, profitProgress)} className="h-2.5" data-testid="progress-profit" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold">Maximum Drawdown</p>
                      <p className="text-sm text-muted-foreground">
                        Must stay under {progress.requiredMaxDrawdown}% — currently at {progress.maxDrawdown.toFixed(2)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold tabular-nums ${drawdownPassing ? 'text-success' : 'text-destructive'}`}>
                        {progress.maxDrawdown.toFixed(2)}% / {progress.requiredMaxDrawdown}%
                      </p>
                      {drawdownPassing && progress.tradeCount > 0 && (
                        <Badge variant="default" className="gap-1 mt-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Passing
                        </Badge>
                      )}
                      {!drawdownPassing && progress.tradeCount > 0 && (
                        <Badge variant="destructive" className="gap-1 mt-1">
                          <XCircle className="h-3 w-3" />
                          Failed
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <Progress
                      value={Math.min(100, drawdownUsedPct)}
                      className="h-2.5"
                      data-testid="progress-drawdown"
                    />
                    {drawdownUsedPct > 75 && drawdownUsedPct <= 100 && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                        Warning: {(100 - drawdownUsedPct).toFixed(0)}% of drawdown limit remaining
                      </p>
                    )}
                  </div>
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

          {completedTrades.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Trade History
                </CardTitle>
                <CardDescription>
                  {completedTrades.length} completed trade{completedTrades.length !== 1 ? 's' : ''} during this evaluation run
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left py-2.5 font-medium">#</th>
                        <th className="text-left py-2.5 font-medium">Symbol</th>
                        <th className="text-left py-2.5 font-medium">Side</th>
                        <th className="text-right py-2.5 font-medium">Entry Price</th>
                        <th className="text-right py-2.5 font-medium">Exit Price</th>
                        <th className="text-right py-2.5 font-medium">P&L</th>
                        <th className="text-right py-2.5 font-medium">P&L %</th>
                        <th className="text-right py-2.5 font-medium">Closed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedTrades.map((trade: any, index: number) => {
                        const pnlValue = parseFloat(trade.pnlValue || "0");
                        const pnlPct = parseFloat(trade.pnlPercentage || "0") * 100;
                        const isProfit = pnlValue >= 0;
                        return (
                          <tr key={trade.id} className="border-b border-border last:border-0">
                            <td className="py-2.5 text-muted-foreground">{completedTrades.length - index}</td>
                            <td className="py-2.5 font-medium">{trade.symbol}</td>
                            <td className="py-2.5">
                              <div className="flex items-center gap-1">
                                {trade.side === 'long' || trade.side === 'buy' ? (
                                  <ArrowUpRight className="h-3.5 w-3.5 text-success" />
                                ) : (
                                  <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
                                )}
                                <span className="capitalize">{trade.side}</span>
                              </div>
                            </td>
                            <td className="py-2.5 text-right tabular-nums">
                              ${parseFloat(trade.entryPrice || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                            </td>
                            <td className="py-2.5 text-right tabular-nums">
                              ${parseFloat(trade.exitPrice || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                            </td>
                            <td className={`py-2.5 text-right font-semibold tabular-nums ${isProfit ? 'text-success' : 'text-destructive'}`}>
                              {isProfit ? '+' : ''}${Math.abs(pnlValue).toFixed(2)}
                            </td>
                            <td className={`py-2.5 text-right tabular-nums ${isProfit ? 'text-success' : 'text-destructive'}`}>
                              {isProfit ? '+' : ''}{pnlPct.toFixed(2)}%
                            </td>
                            <td className="py-2.5 text-right text-muted-foreground">
                              {trade.executedAt ? formatDistanceToNow(new Date(trade.executedAt), { addSuffix: true }) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

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
                  {drawdownPassing ? (
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
