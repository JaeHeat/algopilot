import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Target, Activity, Percent } from "lucide-react";
import { format } from "date-fns";
import type { Subscription } from "@shared/schema";

interface Trade {
  id: string;
  symbol: string;
  side: string;
  quantity: string;
  price: string;
  exchange: string;
  status: string;
  fees: string;
  pnl?: string;
  executedAt: string;
}

interface Position {
  id: string;
  symbol: string;
  quantity: string;
  entryPrice: string;
  currentPrice: string;
  unrealizedPnl: string;
  status: string;
  openedAt: string;
  closedAt?: string;
}

interface PnLSummary {
  currentBalance: string;
  initialBalance: string;
  realizedPnl: string;
  unrealizedPnl: string;
  totalPnl: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: string;
  openPositions: number;
}

interface SubscriptionDetailsDialogProps {
  subscription: Subscription;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscriptionDetailsDialog({ subscription, open, onOpenChange }: SubscriptionDetailsDialogProps) {
  const { data: trades = [], isLoading: tradesLoading } = useQuery<Trade[]>({
    queryKey: ["/api/subscriptions", subscription.id, "trades"],
    queryFn: async () => {
      const res = await fetch(`/api/subscriptions/${subscription.id}/trades`);
      if (!res.ok) throw new Error("Failed to fetch trades");
      return res.json();
    },
    enabled: open,
  });

  const { data: positions = [], isLoading: positionsLoading } = useQuery<Position[]>({
    queryKey: ["/api/subscriptions", subscription.id, "positions"],
    queryFn: async () => {
      const res = await fetch(`/api/subscriptions/${subscription.id}/positions`);
      if (!res.ok) throw new Error("Failed to fetch positions");
      return res.json();
    },
    enabled: open,
  });

  const { data: pnlData, isLoading: pnlLoading } = useQuery<PnLSummary>({
    queryKey: ["/api/subscriptions", subscription.id, "pnl"],
    queryFn: async () => {
      const res = await fetch(`/api/subscriptions/${subscription.id}/pnl`);
      if (!res.ok) throw new Error("Failed to fetch PnL");
      return res.json();
    },
    enabled: open,
  });

  const totalPnl = pnlData ? parseFloat(pnlData.totalPnl) : 0;
  const isProfitable = totalPnl >= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-subscription-details">
        <DialogHeader>
          <DialogTitle>Trading Performance</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="positions" data-testid="tab-positions">Positions</TabsTrigger>
            <TabsTrigger value="trades" data-testid="tab-trades">Trade History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {pnlLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading performance data...</div>
            ) : pnlData ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold tabular-nums ${isProfitable ? 'text-success' : 'text-danger'}`} data-testid="text-total-pnl">
                        ${totalPnl.toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {isProfitable ? '+' : ''}{((totalPnl / parseFloat(pnlData.initialBalance)) * 100).toFixed(2)}% ROI
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
                      <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold tabular-nums" data-testid="text-current-balance">
                        ${parseFloat(pnlData.currentBalance).toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Initial: ${parseFloat(pnlData.initialBalance).toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                      <Percent className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold tabular-nums" data-testid="text-win-rate">
                        {parseFloat(pnlData.winRate).toFixed(0)}%
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {pnlData.winningTrades}W / {pnlData.losingTrades}L
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold tabular-nums" data-testid="text-total-trades">
                        {pnlData.totalTrades}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {pnlData.openPositions} open
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Realized P&L</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-xl font-bold tabular-nums ${parseFloat(pnlData.realizedPnl) >= 0 ? 'text-success' : 'text-danger'}`}>
                        ${parseFloat(pnlData.realizedPnl).toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">From closed positions</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Unrealized P&L</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-xl font-bold tabular-nums ${parseFloat(pnlData.unrealizedPnl) >= 0 ? 'text-success' : 'text-danger'}`}>
                        ${parseFloat(pnlData.unrealizedPnl).toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">From open positions</p>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No performance data available</div>
            )}
          </TabsContent>

          <TabsContent value="positions" className="space-y-4">
            {positionsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading positions...</div>
            ) : positions.length > 0 ? (
              <div className="space-y-2">
                {positions.map((position) => {
                  const pnl = parseFloat(position.unrealizedPnl);
                  const isPnlPositive = pnl >= 0;
                  return (
                    <Card key={position.id} data-testid={`card-position-${position.id}`}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold" data-testid={`text-position-symbol-${position.id}`}>
                                {position.symbol}
                              </span>
                              <Badge variant={position.positionType === 'long' ? 'default' : 'outline'} data-testid={`badge-position-type-${position.id}`}>
                                {position.positionType?.toUpperCase() || 'LONG'}
                              </Badge>
                              <Badge variant={position.status === 'open' ? 'default' : 'secondary'}>
                                {position.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Qty: {parseFloat(position.quantity).toFixed(4)} @ ${parseFloat(position.entryPrice).toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Opened {format(new Date(position.openedAt), 'MMM dd, yyyy HH:mm')}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold tabular-nums ${isPnlPositive ? 'text-success' : 'text-danger'}`}>
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

          <TabsContent value="trades" className="space-y-4">
            {tradesLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading trades...</div>
            ) : trades.length > 0 ? (
              <div className="rounded-md border">
                <table className="w-full" data-testid="table-trades">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 text-sm font-medium">Date</th>
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
                      const isBuy = trade.side.toLowerCase() === 'buy';
                      return (
                        <tr 
                          key={trade.id} 
                          className="border-b hover-elevate"
                          data-testid={`row-trade-${trade.id}`}
                        >
                          <td className="p-3 text-sm text-muted-foreground">
                            {format(new Date(trade.executedAt), 'MMM dd, HH:mm')}
                          </td>
                          <td className="p-3 text-sm font-medium" data-testid={`text-trade-symbol-${trade.id}`}>
                            {trade.symbol}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              {isBuy ? (
                                <TrendingUp className="h-3 w-3 text-success" />
                              ) : (
                                <TrendingDown className="h-3 w-3 text-danger" />
                              )}
                              <Badge variant={isBuy ? 'default' : 'secondary'} className="text-xs">
                                {trade.side.toUpperCase()}
                              </Badge>
                            </div>
                          </td>
                          <td className="p-3 text-sm text-right tabular-nums">
                            {parseFloat(trade.quantity).toFixed(4)}
                          </td>
                          <td className="p-3 text-sm text-right tabular-nums">
                            ${parseFloat(trade.price).toFixed(2)}
                          </td>
                          <td className="p-3 text-sm text-right tabular-nums text-muted-foreground">
                            ${parseFloat(trade.fees).toFixed(2)}
                          </td>
                          <td className="p-3 text-sm text-right tabular-nums">
                            {pnl !== null ? (
                              <span className={isPnlPositive ? 'text-success font-medium' : 'text-danger font-medium'}>
                                {isPnlPositive && '+'}{pnl.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No trades yet</div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
