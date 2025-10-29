import { TradeTable } from "../trade-table";

export default function TradeTableExample() {
  const mockTrades = [
    { id: "1", pair: "BTC/USDT", type: "BUY" as const, amount: 0.0523, price: 43250, profit: 245.50, timestamp: "2 mins ago" },
    { id: "2", pair: "ETH/USDT", type: "SELL" as const, amount: 1.2341, price: 2250, profit: 89.20, timestamp: "5 mins ago" },
    { id: "3", pair: "BTC/USDT", type: "SELL" as const, amount: 0.0312, price: 43180, profit: -32.10, timestamp: "12 mins ago" },
    { id: "4", pair: "SOL/USDT", type: "BUY" as const, amount: 12.5000, price: 98, profit: 156.75, timestamp: "18 mins ago" },
  ];
  
  return (
    <div className="p-6">
      <TradeTable trades={mockTrades} />
    </div>
  );
}
