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
      { name: 'Binance', fn: () => this.fetchFromBinance(symbol) },
      { name: 'Bybit', fn: () => this.fetchFromBybit(symbol) },
      { name: 'CoinGecko', fn: () => this.fetchFromCoinGecko(symbol) },
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
