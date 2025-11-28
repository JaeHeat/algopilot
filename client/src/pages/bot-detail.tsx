import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SubscribeDialog } from "@/components/subscribe-dialog";
import { PostFeed } from "@/components/post-feed";
import { PostComposer } from "@/components/post-composer";
import { useState } from "react";
import { ArrowLeft, TrendingUp, TrendingDown, Shield, CheckCircle, Clock, DollarSign, Trophy, Zap, BarChart3, Target } from "lucide-react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from "chart.js";
import type { Bot, User, BotTradeLog, BotPerformanceHistory, BotPerformance, Subscription } from "@shared/schema";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

type BotWithCreator = Bot & { creator: User; performance: BotPerformance | null };

export default function BotDetail() {
  const params = useParams() as { id: string };
  const [, setLocation] = useLocation();
  const [subscribeDialogOpen, setSubscribeDialogOpen] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("1D");
  const { user } = useAuth();

  const { data: bot, isLoading: botLoading } = useQuery<BotWithCreator>({
    queryKey: ["/api/bots", params.id],
    enabled: !!params.id,
  });

  const { data: trades = [], isLoading: tradesLoading } = useQuery<BotTradeLog[]>({
    queryKey: ["/api/bots", params.id, "trades"],
    enabled: !!params.id,
  });

  const { data: performanceHistory = [] } = useQuery<BotPerformanceHistory[]>({
    queryKey: ["/api/bots", params.id, "performance-history"],
    enabled: !!params.id,
  });

  const { data: userSubscriptions = [] } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions"],
    enabled: !!user,
  });

  const existingSubscription = userSubscriptions.find(sub => sub.botId === params.id);

  if (botLoading) {
    return (
      <div className="container max-w-6xl mx-auto p-8">
        <div className="space-y-6">
          <div className="h-8 w-32 bg-muted/50 rounded animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-96 bg-muted/50 rounded-lg animate-pulse" />
              <div className="h-64 bg-muted/50 rounded-lg animate-pulse" />
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-muted/50 rounded-lg animate-pulse" />
              <div className="h-32 bg-muted/50 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!bot) {
    return (
      <div className="container max-w-6xl mx-auto p-8 text-center">
        <p className="text-muted-foreground">Bot not found</p>
        <Button variant="outline" className="mt-4" onClick={() => setLocation("/dashboard/marketplace")}>
          Back to Marketplace
        </Button>
      </div>
    );
  }

  const getRiskLabelAndColor = (riskLevel: string) => {
    const riskMap: Record<string, { label: string; color: string }> = {
      "Low": { label: "Low Risk", color: "bg-green-500/10 text-green-600 dark:text-green-400" },
      "Medium": { label: "Medium Risk", color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" },
      "High": { label: "High Risk", color: "bg-red-500/10 text-red-600 dark:text-red-400" },
    };
    return riskMap[riskLevel] || { label: riskLevel, color: "bg-muted" };
  };

  const riskInfo = getRiskLabelAndColor(bot.riskLevel);

  const currentHistory = performanceHistory.find(h => h.bucket === selectedTimeframe);
  const equityCurveData = currentHistory?.equityCurve as any[] || [];

  const chartData = {
    labels: equityCurveData.map((_, i) => i),
    datasets: [
      {
        label: "Equity Curve",
        data: equityCurveData,
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        beginAtZero: false,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
    },
  };

  const closedTrades = trades.filter(t => t.status === "closed");
  const EVALUATION_CAPITAL = 10000; // $10,000 evaluation capital
  
  // Use dollar PnL (pnlValue field) for win/loss determination - more accurate than percentage
  const winningTrades = closedTrades.filter(t => parseFloat(t.pnlValue || "0") > 0);
  const losingTrades = closedTrades.filter(t => parseFloat(t.pnlValue || "0") < 0);
  const winRate = closedTrades.length > 0 ? ((winningTrades.length / closedTrades.length) * 100).toFixed(1) : "0.0";
  
  // Calculate total P&L as percentage of evaluation capital
  const totalPnlDollars = closedTrades.reduce((sum, t) => sum + parseFloat(t.pnlValue || "0"), 0);
  const avgPnl = closedTrades.length > 0 
    ? ((totalPnlDollars / EVALUATION_CAPITAL) * 100 / closedTrades.length).toFixed(2)
    : "0.00";

  // Calculate advanced analytics using dollar PnL values
  const analytics = (() => {
    if (closedTrades.length === 0) {
      return {
        winRateNum: 0,
        profitFactor: 0,
        avgWin: 0,
        avgLoss: 0,
        edgeEV: 0,
        sharpeRatio: 0,
        totalWins: 0,
        totalLosses: 0,
      };
    }

    // Use dollar amounts for profit factor calculation
    const totalGainsDollars = winningTrades.reduce((sum, t) => sum + parseFloat(t.pnlValue || "0"), 0);
    const totalLossesDollars = Math.abs(losingTrades.reduce((sum, t) => sum + parseFloat(t.pnlValue || "0"), 0));
    
    const winRateNum = (winningTrades.length / closedTrades.length) * 100;
    const lossRate = (losingTrades.length / closedTrades.length) * 100;
    
    // Profit Factor = Total $ Gains / Total $ Losses
    const profitFactor = totalLossesDollars > 0 ? totalGainsDollars / totalLossesDollars : totalGainsDollars > 0 ? Infinity : 0;
    
    // Average win/loss as percentage of evaluation capital
    const avgWin = winningTrades.length > 0 ? (totalGainsDollars / winningTrades.length / EVALUATION_CAPITAL) * 100 : 0;
    const avgLoss = losingTrades.length > 0 ? (totalLossesDollars / losingTrades.length / EVALUATION_CAPITAL) * 100 : 0;
    
    // Edge/EV = (Win% × Avg Win%) - (Loss% × Avg Loss%) - result is expected return per trade as % of capital
    const edgeEV = ((winRateNum / 100) * avgWin) - ((lossRate / 100) * avgLoss);
    
    // Sharpe Ratio calculation using account-relative returns
    const returns = closedTrades.map(t => (parseFloat(t.pnlValue || "0") / EVALUATION_CAPITAL) * 100);
    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? (meanReturn / stdDev) * Math.sqrt(252) : 0; // Annualized

    return {
      winRateNum,
      profitFactor,
      avgWin,
      avgLoss,
      edgeEV,
      sharpeRatio,
      totalWins: winningTrades.length,
      totalLosses: losingTrades.length,
    };
  })();

  return (
    <div className="container max-w-6xl mx-auto p-8">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => setLocation("/dashboard/marketplace")}
        data-testid="button-back-to-marketplace"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Marketplace
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-3xl" data-testid="text-bot-name">{bot.name}</CardTitle>
                    {bot.isVerified && (
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle className="h-3 w-3 text-blue-600" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-base">{bot.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge className={riskInfo.color} data-testid="badge-risk-level">{riskInfo.label}</Badge>
                <Badge variant="outline" data-testid="badge-strategy">{bot.strategy}</Badge>
                {bot.category && (
                  <Badge variant="outline" className="bg-primary/5 border-primary/20" data-testid="badge-category">
                    {bot.category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </Badge>
                )}
                <Badge variant="outline" data-testid="text-monthly-price">
                  ${parseFloat(bot.monthlyPrice).toFixed(0)}/mo
                </Badge>
              </div>

              {bot.performance && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total ROI</p>
                    <p className="text-2xl font-bold text-green-600" data-testid="text-total-roi">
                      +{parseFloat(bot.performance.totalRoi).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Win Rate</p>
                    <p className="text-2xl font-bold" data-testid="text-win-rate">
                      {winRate}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Sharpe Ratio</p>
                    <p className="text-2xl font-bold" data-testid="text-sharpe-ratio">
                      {parseFloat(bot.performance.sharpeRatio).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Max Drawdown</p>
                    <p className="text-2xl font-bold text-red-600" data-testid="text-max-drawdown">
                      -{parseFloat(bot.performance.maxDrawdown).toFixed(1)}%
                    </p>
                  </div>
                </div>
              )}

              {/* Advanced Analytics */}
              {closedTrades.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 rounded-lg bg-muted/30">
                  <div className="flex items-start gap-2">
                    <Trophy className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Win Rate</p>
                      <p className={`text-lg font-bold ${analytics.winRateNum >= 50 ? 'text-green-600' : 'text-amber-600'}`} data-testid="text-analytics-win-rate">
                        {analytics.winRateNum.toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">{analytics.totalWins}W / {analytics.totalLosses}L</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Profit Factor</p>
                      <p className={`text-lg font-bold ${analytics.profitFactor >= 1.5 ? 'text-green-600' : analytics.profitFactor >= 1 ? 'text-amber-600' : 'text-red-600'}`} data-testid="text-profit-factor">
                        {analytics.profitFactor === Infinity ? 'N/A' : analytics.profitFactor.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {analytics.profitFactor >= 1.5 ? 'Excellent' : analytics.profitFactor >= 1 ? 'Profitable' : 'Needs work'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Target className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Edge (EV)</p>
                      <p className={`text-lg font-bold ${analytics.edgeEV >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="text-edge-ev">
                        {analytics.edgeEV >= 0 ? '+' : ''}{analytics.edgeEV.toFixed(2)}%
                      </p>
                      <p className="text-xs text-muted-foreground">Per trade expected</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Sharpe Ratio</p>
                      <p className={`text-lg font-bold ${analytics.sharpeRatio >= 1 ? 'text-green-600' : analytics.sharpeRatio >= 0.5 ? 'text-amber-600' : 'text-red-600'}`} data-testid="text-analytics-sharpe">
                        {analytics.sharpeRatio.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">Risk-adjusted return</p>
                    </div>
                  </div>
                </div>
              )}

              {equityCurveData.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">Performance Chart</h4>
                    <div className="flex gap-1">
                      {["1D", "1W", "1M", "3M", "1Y", "ALL"].map((timeframe) => (
                        <Button
                          key={timeframe}
                          variant={selectedTimeframe === timeframe ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedTimeframe(timeframe)}
                          data-testid={`button-timeframe-${timeframe.toLowerCase()}`}
                        >
                          {timeframe}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="h-64">
                    <Line data={chartData} options={chartOptions} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Strategy Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Strategy Type</h4>
                  <p className="text-muted-foreground">{bot.strategy}</p>
                </div>
                {bot.strategyDescription && (
                  <div>
                    <h4 className="font-semibold mb-2">How It Works</h4>
                    <p className="text-muted-foreground">{bot.strategyDescription}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <Tabs defaultValue="recent" className="w-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Trade History</CardTitle>
                  <TabsList>
                    <TabsTrigger value="recent" data-testid="tab-recent-trades">Recent</TabsTrigger>
                    <TabsTrigger value="all" data-testid="tab-all-trades">All</TabsTrigger>
                  </TabsList>
                </div>
              </CardHeader>
              <CardContent>
                <TabsContent value="recent" className="mt-0">
                  {tradesLoading ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-12 bg-muted/50 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : trades.slice(0, 10).length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Symbol</TableHead>
                          <TableHead>Side</TableHead>
                          <TableHead>Entry</TableHead>
                          <TableHead>Exit</TableHead>
                          <TableHead>PnL %</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trades.slice(0, 10).map((trade) => (
                          <TableRow key={trade.id}>
                            <TableCell className="font-medium" data-testid={`trade-symbol-${trade.id}`}>
                              {trade.symbol}
                            </TableCell>
                            <TableCell>
                              <Badge variant={trade.side === "buy" ? "default" : "outline"}>
                                {trade.side.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell data-testid={`trade-entry-${trade.id}`}>
                              ${parseFloat(trade.entryPrice).toFixed(2)}
                            </TableCell>
                            <TableCell data-testid={`trade-exit-${trade.id}`}>
                              {trade.exitPrice ? `$${parseFloat(trade.exitPrice).toFixed(2)}` : "-"}
                            </TableCell>
                            <TableCell>
                              {trade.pnlPercentage && (
                                <span
                                  className={parseFloat(trade.pnlPercentage) >= 0 ? "text-green-600" : "text-red-600"}
                                  data-testid={`trade-pnl-${trade.id}`}
                                >
                                  {parseFloat(trade.pnlPercentage) >= 0 ? "+" : ""}
                                  {parseFloat(trade.pnlPercentage).toFixed(2)}%
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={trade.status === "closed" ? "outline" : "default"}>
                                {trade.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No trades yet</p>
                  )}
                </TabsContent>
                <TabsContent value="all" className="mt-0">
                  {trades.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Symbol</TableHead>
                          <TableHead>Side</TableHead>
                          <TableHead>Entry Time</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>PnL %</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trades.map((trade) => (
                          <TableRow key={trade.id}>
                            <TableCell className="font-medium">{trade.symbol}</TableCell>
                            <TableCell>
                              <Badge variant={trade.side === "buy" ? "default" : "outline"}>
                                {trade.side.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {format(new Date(trade.entryTime), "MMM d, h:mm a")}
                            </TableCell>
                            <TableCell>
                              {trade.durationMinutes ? `${trade.durationMinutes}m` : "-"}
                            </TableCell>
                            <TableCell>
                              {trade.pnlPercentage && (
                                <span
                                  className={parseFloat(trade.pnlPercentage) >= 0 ? "text-green-600" : "text-red-600"}
                                >
                                  {parseFloat(trade.pnlPercentage) >= 0 ? "+" : ""}
                                  {parseFloat(trade.pnlPercentage).toFixed(2)}%
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={trade.status === "closed" ? "outline" : "default"}>
                                {trade.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No trades yet</p>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>

          <div className="space-y-6">
            <CardTitle className="text-xl">Creator Updates</CardTitle>
            {user && bot.creatorId === user.id && (
              <PostComposer botId={bot.id} creatorId={bot.creatorId} />
            )}
            <PostFeed botId={bot.id} />
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Creator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={bot.creator.profileImageUrl || undefined} />
                  <AvatarFallback data-testid="avatar-creator-initials">
                    {bot.creator.firstName?.[0]}{bot.creator.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold" data-testid="text-creator-name">
                    {bot.creator.firstName} {bot.creator.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground" data-testid="text-creator-email">
                    {bot.creator.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{existingSubscription ? 'Your Subscription' : `Subscribe to ${bot.name}`}</CardTitle>
              <CardDescription>
                {existingSubscription 
                  ? 'Manage your active subscription'
                  : 'Start trading with this bot and customize your settings'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!existingSubscription && (
                  <>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>${parseFloat(bot.monthlyPrice).toFixed(2)}/month</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      <span>{riskInfo.label}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Cancel anytime</span>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => setSubscribeDialogOpen(true)}
                      data-testid="button-subscribe"
                    >
                      Subscribe Now
                    </Button>
                  </>
                )}
                {existingSubscription && (
                  <>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-green-600 font-medium">Active Subscription</span>
                    </div>
                    {existingSubscription.cancelledAt && existingSubscription.subscriptionEndsAt && (
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">
                          Subscription ends on {format(new Date(existingSubscription.subscriptionEndsAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    )}
                    <Link href="/dashboard/my-bots">
                      <Button className="w-full" variant="outline" data-testid="button-manage-subscription">
                        Manage Subscription
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {bot.performance && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Trades</span>
                  <span className="font-semibold" data-testid="text-total-trades">
                    {bot.performance.totalTrades}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Avg PnL</span>
                  <span className={`font-semibold ${parseFloat(avgPnl) >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {parseFloat(avgPnl) >= 0 ? "+" : ""}{avgPnl}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Subscribers</span>
                  <span className="font-semibold" data-testid="text-subscribers">
                    {bot.performance.subscribers}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <SubscribeDialog
        bot={bot}
        open={subscribeDialogOpen}
        onOpenChange={setSubscribeDialogOpen}
      />
    </div>
  );
}
