import { SiBinance } from "react-icons/si";

const exchanges = [
  { name: "Binance", icon: <SiBinance className="h-8 w-8" />, hasIcon: true },
  { name: "Bybit", letter: "B" },
  { name: "OKX", letter: "O" },
  { name: "Kraken", letter: "K" },
  { name: "Bitfinex", letter: "B" },
];

export function LandingExchanges() {
  return (
    <div className="py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <p className="text-center text-sm font-medium text-muted-foreground mb-8 uppercase tracking-wide">
          Supports API Trading with Leverage on Major Exchanges
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
          * Currently using mock integrations • Real API trading coming soon
        </p>
      </div>
    </div>
  );
}
