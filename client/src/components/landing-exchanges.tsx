import { SiBinance, SiCoinbase } from "react-icons/si";

export function LandingExchanges() {
  return (
    <div className="py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <p className="text-center text-sm font-medium text-muted-foreground mb-8 uppercase tracking-wide">
          Trusted Integration with Leading Exchanges
        </p>
        <div className="flex flex-wrap items-center justify-center gap-12 lg:gap-16">
          <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
            <SiBinance className="h-8 w-8" />
            <span className="text-xl font-semibold">Binance</span>
          </div>
          <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
            <SiCoinbase className="h-8 w-8" />
            <span className="text-xl font-semibold">Coinbase</span>
          </div>
          <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">B</span>
            </div>
            <span className="text-xl font-semibold">Bybit</span>
          </div>
          <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">K</span>
            </div>
            <span className="text-xl font-semibold">KuCoin</span>
          </div>
        </div>
      </div>
    </div>
  );
}
