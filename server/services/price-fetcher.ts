import axios from 'axios';

interface PriceResult {
  symbol: string;
  price: number;
  source: string;
}

export class PriceFetcher {
  private static priceCache = new Map<string, { price: number; timestamp: number }>();
  private static CACHE_TTL = 10000; // 10 seconds

  static async getCurrentPrice(symbol: string): Promise<number | null> {
    const normalizedSymbol = symbol.toUpperCase();
    
    const cached = this.priceCache.get(normalizedSymbol);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.price;
    }

    const price = await this.fetchPrice(normalizedSymbol);
    
    if (price !== null) {
      this.priceCache.set(normalizedSymbol, { price, timestamp: Date.now() });
    }
    
    return price;
  }

  private static async fetchPrice(symbol: string): Promise<number | null> {
    const sources = [
      () => this.fetchFromBinance(symbol),
      () => this.fetchFromBybit(symbol),
      () => this.fetchFromCoinGecko(symbol),
    ];

    for (const fetchFn of sources) {
      try {
        const price = await fetchFn();
        if (price !== null) {
          return price;
        }
      } catch (error) {
        continue;
      }
    }

    return null;
  }

  private static async fetchFromBinance(symbol: string): Promise<number | null> {
    try {
      const binanceSymbol = symbol.replace('USD', 'USDT');
      const response = await axios.get(`https://api.binance.com/api/v3/ticker/price`, {
        params: { symbol: binanceSymbol },
        timeout: 3000,
      });
      return parseFloat(response.data.price);
    } catch (error) {
      return null;
    }
  }

  private static async fetchFromBybit(symbol: string): Promise<number | null> {
    try {
      const response = await axios.get(`https://api.bybit.com/v5/market/tickers`, {
        params: { 
          category: 'spot',
          symbol: symbol.replace('USD', 'USDT')
        },
        timeout: 3000,
      });
      
      const ticker = response.data.result?.list?.[0];
      if (ticker?.lastPrice) {
        return parseFloat(ticker.lastPrice);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  private static async fetchFromCoinGecko(symbol: string): Promise<number | null> {
    try {
      const coinMap: Record<string, string> = {
        'BTCUSDT': 'bitcoin',
        'ETHUSDT': 'ethereum',
        'AVAXUSDT': 'avalanche-2',
        'LINKUSDT': 'chainlink',
        'XRPUSDT': 'ripple',
        'ADAUSDT': 'cardano',
        'SOLUSDT': 'solana',
      };

      const normalizedSymbol = symbol.replace('USD', 'USDT');
      const coinId = coinMap[normalizedSymbol];
      
      if (!coinId) {
        return null;
      }

      const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
        params: {
          ids: coinId,
          vs_currencies: 'usd',
        },
        timeout: 3000,
      });

      return response.data[coinId]?.usd || null;
    } catch (error) {
      return null;
    }
  }

  static async getCurrentPrices(symbols: string[]): Promise<Map<string, number>> {
    const priceMap = new Map<string, number>();
    
    const pricePromises = symbols.map(async (symbol) => {
      const price = await this.getCurrentPrice(symbol);
      return { symbol, price };
    });

    const results = await Promise.all(pricePromises);
    
    results.forEach(({ symbol, price }) => {
      if (price !== null) {
        priceMap.set(symbol, price);
      }
    });

    return priceMap;
  }
}
