import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Trade {
  id: string;
  pair: string;
  type: "BUY" | "SELL";
  amount: number;
  price: number;
  profit: number;
  timestamp: string;
}

interface TradeTableProps {
  trades: Trade[];
}

export function TradeTable({ trades }: TradeTableProps) {
  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-6">Recent Trades</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-sm text-muted-foreground">
              <th className="text-left py-3 font-medium">Pair</th>
              <th className="text-left py-3 font-medium">Type</th>
              <th className="text-right py-3 font-medium">Amount</th>
              <th className="text-right py-3 font-medium">Price</th>
              <th className="text-right py-3 font-medium">Profit/Loss</th>
              <th className="text-right py-3 font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => (
              <tr 
                key={trade.id} 
                className="border-b border-border hover-elevate"
                data-testid={`row-trade-${trade.id}`}
              >
                <td className="py-4 font-medium">{trade.pair}</td>
                <td className="py-4">
                  <Badge variant={trade.type === "BUY" ? "default" : "secondary"}>
                    {trade.type}
                  </Badge>
                </td>
                <td className="py-4 text-right tabular-nums">{trade.amount.toFixed(4)}</td>
                <td className="py-4 text-right tabular-nums">${trade.price.toLocaleString()}</td>
                <td className={`py-4 text-right font-semibold tabular-nums ${
                  trade.profit >= 0 ? "text-success" : "text-danger"
                }`}>
                  {trade.profit >= 0 ? "+" : ""}${trade.profit.toFixed(2)}
                </td>
                <td className="py-4 text-right text-sm text-muted-foreground">
                  {trade.timestamp}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
