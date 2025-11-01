import { BaseExchangeClient, ExchangeCredentials } from './base';
import { BinanceClient } from './binance';
import { BybitClient } from './bybit';

export type SupportedExchange = 'Binance' | 'Bybit' | 'OKX' | 'Kraken' | 'Bitfinex';

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
    return ['Binance', 'Bybit', 'OKX', 'Kraken', 'Bitfinex'];
  }

  static isExchangeSupported(exchange: string): boolean {
    const normalizedExchange = exchange.toLowerCase();
    return ['binance', 'bybit', 'okx', 'kraken', 'bitfinex'].includes(normalizedExchange);
  }
}
