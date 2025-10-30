import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, DollarSign, Target, Award } from "lucide-react";
import { format } from "date-fns";
import { Line } from "react-chartjs-2";
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
                      <div className="flex items-center justify-between">
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
                        <div className="text-right">
                          <div className={`text-2xl font-bold tabular-nums ${isPnlPositive ? 'text-success' : 'text-danger'}`}>
                            {isPnlPositive && '+'}{pnl.toFixed(2)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Current: ${parseFloat(position.currentPrice).toFixed(2)}
                          </div>
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
    </div>
  );
}
