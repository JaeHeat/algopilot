import { ExchangeConnectionCard } from "../exchange-connection-card";

export default function ExchangeConnectionCardExample() {
  return (
    <div className="p-6 space-y-4">
      <ExchangeConnectionCard exchange="Binance" connected={true} />
      <ExchangeConnectionCard exchange="Coinbase" connected={false} />
    </div>
  );
}
