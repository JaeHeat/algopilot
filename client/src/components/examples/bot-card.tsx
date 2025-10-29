import { BotCard } from "../bot-card";

export default function BotCardExample() {
  return (
    <div className="p-6">
      <BotCard
        id="1"
        name="Momentum Master"
        creator="CryptoQuant"
        roi={124.5}
        winRate={68}
        subscribers={342}
        totalTrades={1245}
        price={29}
        strategy="Momentum"
      />
    </div>
  );
}
