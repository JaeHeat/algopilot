import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, TrendingDown, Activity, DollarSign, Target, Award, X } from "lucide-react";
import { format } from "date-fns";
import { Line } from "react-chartjs-2";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DashboardMyTrades() {
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<any>(null);
  const [closePrice, setClosePrice] = useState("");
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [priceSource, setPriceSource] = useState<string | null>(null);
  const { toast } = useToast();

  const closePositionMutation = useMutation({
    mutationFn: async ({ positionId, closePrice }: { positionId: string; closePrice: string }) => {
      const response = await apiRequest("POST", `/api/positions/${positionId}/close`, { closePrice });
      return await response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/positions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      setCloseDialogOpen(false);
      setSelectedPosition(null);
      setClosePrice("");
      toast({
        title: "Position Closed",
        description: `Position closed successfully. P&L: $${data.pnl}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to close position",
        variant: "destructive",
      });
    },
  });

  const handleOpenCloseDialog = async (position: any) => {
    setSelectedPosition(position);
    setClosePrice("");
    setPriceSource(null);
    setCloseDialogOpen(true);
    setFetchingPrice(true);

    try {
      const response = await fetch(`/api/crypto/price/${position.symbol}`);
      if (response.ok) {
        const data = await response.json();
        setClosePrice(data.price);
        setPriceSource(data.source);
        console.log(`Fetched real-time price for ${position.symbol}: $${data.price} from ${data.source}`);
      } else {
        console.error(`Failed to fetch price for ${position.symbol}`);
        setPriceSource('failed');
        toast({
          title: "Price Fetch Failed",
          description: "Unable to get current market price. Please try again.",
          variant: "destructive",
        });
        setCloseDialogOpen(false);
      }
    } catch (error) {
      console.error("Error fetching real-time price:", error);
      setPriceSource('failed');
      toast({
        title: "Price Fetch Failed",
        description: "Unable to get current market price. Please try again.",
        variant: "destructive",
      });
      setCloseDialogOpen(false);
    } finally {
      setFetchingPrice(false);
    }
  };

  const handleClosePosition = () => {
    if (!selectedPosition || !closePrice) return;
    closePositionMutation.mutate({
      positionId: selectedPosition.id,
      closePrice,
    });
  };

  const { data: analytics, isLoading: analyticsLoading } = useQuery<{
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
  });

  const { data: trades = [], isLoading: tradesLoading } = useQuery<Array<{
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
  });

  const { data: positions = [], isLoading: positionsLoading } = useQuery<Array<{
    id: string;
    symbol: string;
    positionType: string;
    quantity: string;
    entryPrice: string;
    currentPrice: string;
    unrealizedPnl: string;
    status: string;
    openedAt: string;
    bot: { name: string };
  }>>({
    queryKey: ["/api/user/positions"],
  });

  const closedTrades = trades.filter(t => t.pnl !== null);
  const sortedClosedTrades = [...closedTrades].sort((a, b) => 
    new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime()
  );
  
  const cumulativePnl = sortedClosedTrades.reduce((acc, trade, idx) => {
    const prevPnl = idx > 0 ? acc[idx - 1] : 0;
    acc.push(prevPnl + parseFloat(trade.pnl!));
    return acc;
  }, [] as number[]);

  const chartData = {
    labels: sortedClosedTrades.map((trade, idx) => idx + 1),
    datasets: [
      {
        label: 'Cumulative P&L ($)',
        data: cumulativePnl,
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
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
        callbacks: {
          label: function(context: any) {
            return `P&L: $${context.parsed.y.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        title: {
          display: true,
          text: 'Trade Number',
        },
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        title: {
          display: true,
          text: 'Cumulative P&L ($)',
        },
      },
    },
  };

  const openPositions = positions.filter(p => p.status === 'open');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-my-trades">My Trades</h1>
        <p className="text-muted-foreground mt-1">Track your trading performance across all subscriptions</p>
      </div>

      {analyticsLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading analytics...</div>
      ) : analytics ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold tabular-nums ${parseFloat(analytics.combinedPnl) >= 0 ? 'text-success' : 'text-danger'}`} data-testid="text-total-pnl">
                  ${analytics.combinedPnl}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Realized: ${analytics.totalPnl} | Unrealized: ${analytics.unrealizedPnl}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums" data-testid="text-win-rate">
                  {analytics.winRate}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.winningTrades}W / {analytics.losingTrades}L
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums" data-testid="text-total-trades">
                  {analytics.totalTrades}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.closedTrades} closed, {analytics.openPositions} open
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums" data-testid="text-profit-factor">
                  {analytics.profitFactor}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Wins / Losses ratio
                </p>
              </CardContent>
            </Card>
          </div>

          {analytics.bestTrade && analytics.worstTrade && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-success" />
                    Best Trade
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{analytics.bestTrade.symbol}</span>
                      <span className="text-success font-bold">+${analytics.bestTrade.pnl}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(analytics.bestTrade.date), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-danger" />
                    Worst Trade
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{analytics.worstTrade.symbol}</span>
                      <span className="text-danger font-bold">${analytics.worstTrade.pnl}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(analytics.worstTrade.date), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {closedTrades.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Equity Curve</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Line data={chartData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground">No analytics data available</div>
      )}

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all-trades">All Trades</TabsTrigger>
          <TabsTrigger value="open" data-testid="tab-open-positions">Open Positions ({openPositions.length})</TabsTrigger>
          <TabsTrigger value="closed" data-testid="tab-closed-trades">Closed Trades ({closedTrades.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {tradesLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading trades...</div>
          ) : trades.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <div className="rounded-md border">
                  <table className="w-full" data-testid="table-all-trades">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 text-sm font-medium">Date</th>
                        <th className="text-left p-3 text-sm font-medium">Bot</th>
                        <th className="text-left p-3 text-sm font-medium">Symbol</th>
                        <th className="text-left p-3 text-sm font-medium">Side</th>
                        <th className="text-right p-3 text-sm font-medium">Quantity</th>
                        <th className="text-right p-3 text-sm font-medium">Price</th>
                        <th className="text-right p-3 text-sm font-medium">Fees</th>
                        <th className="text-right p-3 text-sm font-medium">P&L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trades.map((trade) => {
                        const pnl = trade.pnl ? parseFloat(trade.pnl) : null;
                        const isPnlPositive = pnl !== null && pnl >= 0;
                        return (
                          <tr key={trade.id} className="border-b last:border-0" data-testid={`row-trade-${trade.id}`}>
                            <td className="p-3 text-sm">
                              {format(new Date(trade.executedAt), 'MMM dd, HH:mm')}
                            </td>
                            <td className="p-3 text-sm">{trade.bot.name}</td>
                            <td className="p-3 text-sm font-semibold">{trade.symbol}</td>
                            <td className="p-3 text-sm">
                              <Badge variant={trade.side === 'buy' ? 'default' : 'outline'}>
                                {trade.side.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="p-3 text-sm text-right tabular-nums">
                              {parseFloat(trade.quantity).toFixed(4)}
                            </td>
                            <td className="p-3 text-sm text-right tabular-nums">
                              ${parseFloat(trade.price).toFixed(2)}
                            </td>
                            <td className="p-3 text-sm text-right tabular-nums">
                              ${parseFloat(trade.fees).toFixed(2)}
                            </td>
                            <td className={`p-3 text-sm text-right tabular-nums font-semibold ${pnl !== null ? (isPnlPositive ? 'text-success' : 'text-danger') : 'text-muted-foreground'}`}>
                              {pnl !== null ? `${isPnlPositive ? '+' : ''}${pnl.toFixed(2)}` : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No trades yet</div>
          )}
        </TabsContent>

        <TabsContent value="open" className="space-y-4">
          {positionsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading positions...</div>
          ) : openPositions.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {openPositions.map((position) => {
                const pnl = parseFloat(position.unrealizedPnl);
                const isPnlPositive = pnl >= 0;
                return (
                  <Card key={position.id} data-testid={`card-position-${position.id}`}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-lg">{position.symbol}</span>
                            <Badge variant={position.positionType === 'long' ? 'default' : 'outline'}>
                              {position.positionType?.toUpperCase() || 'LONG'}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Bot: {position.bot.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Qty: {parseFloat(position.quantity).toFixed(4)} @ ${parseFloat(position.entryPrice).toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Opened {format(new Date(position.openedAt), 'MMM dd, yyyy HH:mm')}
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <div className={`text-2xl font-bold tabular-nums ${isPnlPositive ? 'text-success' : 'text-danger'}`}>
                            {isPnlPositive && '+'}{pnl.toFixed(2)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Current: ${parseFloat(position.currentPrice).toFixed(2)}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenCloseDialog(position)}
                            data-testid={`button-close-position-${position.id}`}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Close Position
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No open positions</div>
          )}
        </TabsContent>

        <TabsContent value="closed" className="space-y-4">
          {tradesLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading trades...</div>
          ) : closedTrades.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <div className="rounded-md border">
                  <table className="w-full" data-testid="table-closed-trades">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 text-sm font-medium">Date</th>
                        <th className="text-left p-3 text-sm font-medium">Bot</th>
                        <th className="text-left p-3 text-sm font-medium">Symbol</th>
                        <th className="text-left p-3 text-sm font-medium">Side</th>
                        <th className="text-right p-3 text-sm font-medium">Quantity</th>
                        <th className="text-right p-3 text-sm font-medium">Price</th>
                        <th className="text-right p-3 text-sm font-medium">Fees</th>
                        <th className="text-right p-3 text-sm font-medium">P&L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {closedTrades.map((trade) => {
                        const pnl = parseFloat(trade.pnl!);
                        const isPnlPositive = pnl >= 0;
                        return (
                          <tr key={trade.id} className="border-b last:border-0" data-testid={`row-trade-${trade.id}`}>
                            <td className="p-3 text-sm">
                              {format(new Date(trade.executedAt), 'MMM dd, HH:mm')}
                            </td>
                            <td className="p-3 text-sm">{trade.bot.name}</td>
                            <td className="p-3 text-sm font-semibold">{trade.symbol}</td>
                            <td className="p-3 text-sm">
                              <Badge variant={trade.side === 'buy' ? 'default' : 'outline'}>
                                {trade.side.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="p-3 text-sm text-right tabular-nums">
                              {parseFloat(trade.quantity).toFixed(4)}
                            </td>
                            <td className="p-3 text-sm text-right tabular-nums">
                              ${parseFloat(trade.price).toFixed(2)}
                            </td>
                            <td className="p-3 text-sm text-right tabular-nums">
                              ${parseFloat(trade.fees).toFixed(2)}
                            </td>
                            <td className={`p-3 text-sm text-right tabular-nums font-semibold ${isPnlPositive ? 'text-success' : 'text-danger'}`}>
                              {isPnlPositive ? '+' : ''}{pnl.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No closed trades yet</div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent data-testid="dialog-close-position">
          <DialogHeader>
            <DialogTitle>Close Position</DialogTitle>
            <DialogDescription>
              Enter the current market price to close your {selectedPosition?.positionType?.toUpperCase()} position for {selectedPosition?.symbol}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Position Details</Label>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Entry Price: ${parseFloat(selectedPosition?.entryPrice || "0").toFixed(2)}</div>
                <div>Quantity: {parseFloat(selectedPosition?.quantity || "0").toFixed(4)}</div>
                <div>Current Unrealized P&L: ${parseFloat(selectedPosition?.unrealizedPnl || "0").toFixed(2)}</div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="close-price">Close Price</Label>
              <Input
                id="close-price"
                type="number"
                step="0.01"
                placeholder="Fetching real-time price..."
                value={closePrice}
                readOnly
                disabled={fetchingPrice}
                className="bg-muted cursor-not-allowed"
                data-testid="input-close-price"
              />
              <p className="text-xs text-muted-foreground">
                {fetchingPrice ? (
                  <span className="text-primary">Fetching real-time price...</span>
                ) : priceSource === 'binance' ? (
                  "✓ Real-time market price from Binance (read-only)"
                ) : priceSource === 'kraken' ? (
                  "✓ Real-time market price from Kraken (read-only)"
                ) : priceSource === 'coinbase' ? (
                  "✓ Real-time market price from Coinbase (read-only)"
                ) : priceSource === 'coingecko' ? (
                  "✓ Real-time market price from CoinGecko (read-only)"
                ) : priceSource === 'cryptocompare' ? (
                  "✓ Real-time market price from CryptoCompare (read-only)"
                ) : (
                  "Market price will be auto-fetched from multiple sources"
                )}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCloseDialogOpen(false)}
              data-testid="button-cancel-close"
            >
              Cancel
            </Button>
            <Button
              onClick={handleClosePosition}
              disabled={!closePrice || closePositionMutation.isPending}
              data-testid="button-confirm-close"
            >
              {closePositionMutation.isPending ? "Closing..." : "Close Position"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
