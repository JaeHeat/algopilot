import { SiBinance } from "react-icons/si";

const exchanges = [
  { name: "Alpaca", letter: "A" },
  { name: "Binance", icon: <SiBinance className="h-8 w-8" />, hasIcon: true },
  { name: "Bybit", letter: "B" },
];

export function LandingExchanges() {
  return (
    <div className="py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <p className="text-center text-sm font-medium text-muted-foreground mb-8 uppercase tracking-wide">
          Connect your own broker or exchange — stocks &amp; crypto
        </p>
        <div className="flex flex-wrap items-center justify-center gap-12 lg:gap-16">
          {exchanges.map((exchange) => (
            <div 
              key={exchange.name}
              className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity"
              data-testid={`exchange-${exchange.name.toLowerCase()}`}
            >
              {exchange.hasIcon ? (
                exchange.icon
              ) : (
                <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">{exchange.letter}</span>
                </div>
              )}
              <span className="text-xl font-semibold">{exchange.name}</span>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">
          Connect with your own API keys — start in paper mode, go live when you're ready.
        </p>
      </div>
    </div>
  );
}
