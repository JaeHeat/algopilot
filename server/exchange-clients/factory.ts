import { BaseExchangeClient, ExchangeCredentials } from './base';
import { BinanceClient } from './binance';
import { BybitClient } from './bybit';
import { AlpacaClient } from './alpaca';

export type SupportedExchange = 'Binance' | 'Bybit' | 'Alpaca' | 'OKX' | 'Kraken' | 'Bitfinex';

// Asset class each venue trades — used to tag bots/connections and filter the marketplace.
export type AssetClass = 'crypto' | 'stocks';

export const EXCHANGE_ASSET_CLASS: Record<string, AssetClass> = {
  binance: 'crypto',
  bybit: 'crypto',
  alpaca: 'stocks',
};

export class ExchangeClientFactory {
  static createClient(
    exchange: string,
    credentials: ExchangeCredentials
  ): BaseExchangeClient {
    const normalizedExchange = exchange.toLowerCase();

    switch (normalizedExchange) {
      case 'binance':
        return new BinanceClient(credentials);
      
      case 'bybit':
        return new BybitClient(credentials);

      case 'alpaca':
        return new AlpacaClient(credentials);

      case 'okx':
        throw new Error('OKX integration coming soon');
      
      case 'kraken':
        throw new Error('Kraken integration coming soon');
      
      case 'bitfinex':
        throw new Error('Bitfinex integration coming soon');
      
      default:
        throw new Error(`Unsupported exchange: ${exchange}`);
    }
  }

  static getSupportedExchanges(): SupportedExchange[] {
    return ['Binance', 'Bybit', 'Alpaca', 'OKX', 'Kraken', 'Bitfinex'];
  }

  static isExchangeSupported(exchange: string): boolean {
    const normalizedExchange = exchange.toLowerCase();
    return ['binance', 'bybit', 'alpaca'].includes(normalizedExchange);
  }

  static getAssetClass(exchange: string): AssetClass | undefined {
    return EXCHANGE_ASSET_CLASS[exchange.toLowerCase()];
  }
}
