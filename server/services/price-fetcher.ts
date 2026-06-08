import axios from 'axios';

interface PriceResult {
  symbol: string;
  price: number;
  source: string;
}

export class PriceFetcher {
  private static priceCache = new Map<string, { price: number; timestamp: number }>();
  private static CACHE_TTL = 30000; // 30 seconds to reduce rate limiting

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
      { name: 'Binance', fn: () => this.fetchFromBinance(symbol) },
      { name: 'Bybit', fn: () => this.fetchFromBybit(symbol) },
      { name: 'CoinGecko', fn: () => this.fetchFromCoinGecko(symbol) },
      // Equities fallback: reached when the crypto sources fail (i.e. stock tickers like AAPL).
      { name: 'Yahoo', fn: () => this.fetchFromYahoo(symbol) },
    ];

    for (const source of sources) {
      try {
        const price = await source.fn();
        if (price !== null) {
          console.log(`[PriceFetcher] Successfully fetched ${symbol} price from ${source.name}: $${price}`);
          return price;
        }
      } catch (error: any) {
        console.log(`[PriceFetcher] ${source.name} failed for ${symbol}:`, error.message);
        continue;
      }
    }

    console.log(`[PriceFetcher] All sources failed for ${symbol}`);
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

      let normalizedSymbol = symbol.toUpperCase();
      // Strip perpetual contract suffixes (.P for Bybit perpetuals)
      normalizedSymbol = normalizedSymbol.replace(/\.P$/, '');
      // Strip PERP suffix (used by some exchanges)
      normalizedSymbol = normalizedSymbol.replace(/PERP$/, '');
      // Normalize USD endings to USDT
      if (!normalizedSymbol.endsWith('USDT') && normalizedSymbol.endsWith('USD')) {
        normalizedSymbol = normalizedSymbol.replace(/USD$/, 'USDT');
      }
      const coinId = coinMap[normalizedSymbol];
      
      if (!coinId) {
        console.log(`[PriceFetcher] CoinGecko: No mapping for ${symbol}`);
        return null;
      }

      const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
        params: {
          ids: coinId,
          vs_currencies: 'usd',
        },
        timeout: 5000,
        headers: {
          'Accept': 'application/json',
        }
      });

      const price = response.data[coinId]?.usd;
      if (!price) {
        console.log(`[PriceFetcher] CoinGecko: No price in response for ${coinId}`, response.data);
        return null;
      }
      
      return price;
    } catch (error: any) {
      console.log(`[PriceFetcher] CoinGecko error for ${symbol}:`, error.response?.status, error.response?.data || error.message);
      return null;
    }
  }

  private static async fetchFromYahoo(symbol: string): Promise<number | null> {
    try {
      // Skip obviously-crypto symbols so we don't mis-resolve them against an equities feed.
      const upper = symbol.toUpperCase();
      if (upper.endsWith('USDT') || upper.includes('.P') || upper.endsWith('PERP')) {
        return null;
      }
      // Equities tickers are passed through as-is (e.g. AAPL, SPY); strip a trailing /USD if present.
      const ticker = upper.replace(/\/USD$/, '').replace(/\/.*$/, '');

      const response = await axios.get(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`,
        {
          params: { interval: '1d', range: '1d' },
          timeout: 4000,
          headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
        },
      );

      const price = response.data?.chart?.result?.[0]?.meta?.regularMarketPrice;
      return typeof price === 'number' ? price : null;
    } catch (error: any) {
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
