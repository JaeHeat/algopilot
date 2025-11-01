import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
import {
  BaseExchangeClient,
  ExchangeCredentials,
  PlaceOrderParams,
  OrderResult,
  Balance,
  Position,
  ExchangeError,
} from './base';

export class BinanceClient extends BaseExchangeClient {
  private axiosInstance: AxiosInstance;

  constructor(credentials: ExchangeCredentials) {
    super(credentials);
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
    });
  }

  protected getBaseUrl(): string {
    return this.credentials.isTestnet
      ? 'https://testnet.binance.vision/api'
      : 'https://api.binance.com/api';
  }

  private createSignature(queryString: string): string {
    return crypto
      .createHmac('sha256', this.credentials.apiSecret)
      .update(queryString)
      .digest('hex');
  }

  private createHeaders(): Record<string, string> {
    return {
      'X-MBX-APIKEY': this.credentials.apiKey,
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = this.createSignature(queryString);
      
      await this.axiosInstance.get('/v3/account', {
        params: { timestamp, signature },
        headers: this.createHeaders(),
      });
      
      return true;
    } catch (error: any) {
      console.error('[Binance] Connection test failed:', error.response?.data || error.message);
      return false;
    }
  }

  async getBalance(asset?: string): Promise<Balance[]> {
    try {
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = this.createSignature(queryString);

      const response = await this.axiosInstance.get('/v3/account', {
        params: { timestamp, signature },
        headers: this.createHeaders(),
      });

      const balances = response.data.balances
        .filter((b: any) => {
          const total = parseFloat(b.free) + parseFloat(b.locked);
          return asset ? b.asset === asset && total > 0 : total > 0;
        })
        .map((b: any) => ({
          asset: b.asset,
          free: parseFloat(b.free),
          locked: parseFloat(b.locked),
          total: parseFloat(b.free) + parseFloat(b.locked),
        }));

      return balances;
    } catch (error: any) {
      throw new ExchangeError(
        error.response?.data?.msg || 'Failed to get balance',
        'Binance',
        error.response?.data?.code?.toString(),
        error.response?.status
      );
    }
  }

  async placeOrder(params: PlaceOrderParams): Promise<OrderResult> {
    try {
      const timestamp = Date.now();
      
      const orderParams: any = {
        symbol: params.symbol.replace('/', ''),
        side: params.side.type.toUpperCase(),
        type: params.orderType.toUpperCase(),
        quantity: params.quantity.toString(),
        timestamp,
      };

      if (params.orderType === 'limit' && params.price) {
        orderParams.price = params.price.toString();
        orderParams.timeInForce = 'GTC';
      }

      const queryString = new URLSearchParams(orderParams).toString();
      const signature = this.createSignature(queryString);

      const response = await this.axiosInstance.post(
        '/v3/order',
        null,
        {
          params: { ...orderParams, signature },
          headers: this.createHeaders(),
        }
      );

      return {
        orderId: response.data.orderId.toString(),
        symbol: params.symbol,
        side: params.side.type,
        quantity: parseFloat(response.data.executedQty || response.data.origQty),
        price: parseFloat(response.data.price || params.price || '0'),
        status: this.mapOrderStatus(response.data.status),
        filledQuantity: parseFloat(response.data.executedQty || '0'),
        averagePrice: parseFloat(response.data.avgPrice || response.data.price || '0'),
        fees: parseFloat(response.data.cummulativeQuoteQty || '0') * 0.001,
        timestamp: response.data.transactTime || timestamp,
      };
    } catch (error: any) {
      throw new ExchangeError(
        error.response?.data?.msg || 'Failed to place order',
        'Binance',
        error.response?.data?.code?.toString(),
        error.response?.status
      );
    }
  }

  async cancelOrder(orderId: string, symbol: string): Promise<boolean> {
    try {
      const timestamp = Date.now();
      const params = {
        symbol: symbol.replace('/', ''),
        orderId,
        timestamp,
      };

      const queryString = new URLSearchParams(params as any).toString();
      const signature = this.createSignature(queryString);

      await this.axiosInstance.delete('/v3/order', {
        params: { ...params, signature },
        headers: this.createHeaders(),
      });

      return true;
    } catch (error: any) {
      console.error('[Binance] Cancel order failed:', error.response?.data || error.message);
      return false;
    }
  }

  async getOrderStatus(orderId: string, symbol: string): Promise<OrderResult> {
    try {
      const timestamp = Date.now();
      const params = {
        symbol: symbol.replace('/', ''),
        orderId,
        timestamp,
      };

      const queryString = new URLSearchParams(params as any).toString();
      const signature = this.createSignature(queryString);

      const response = await this.axiosInstance.get('/v3/order', {
        params: { ...params, signature },
        headers: this.createHeaders(),
      });

      return {
        orderId: response.data.orderId.toString(),
        symbol: symbol,
        side: response.data.side.toLowerCase(),
        quantity: parseFloat(response.data.origQty),
        price: parseFloat(response.data.price),
        status: this.mapOrderStatus(response.data.status),
        filledQuantity: parseFloat(response.data.executedQty),
        averagePrice: parseFloat(response.data.avgPrice || response.data.price || '0'),
        timestamp: response.data.time,
      };
    } catch (error: any) {
      throw new ExchangeError(
        error.response?.data?.msg || 'Failed to get order status',
        'Binance',
        error.response?.data?.code?.toString(),
        error.response?.status
      );
    }
  }

  async getOpenPositions(): Promise<Position[]> {
    return [];
  }

  async closePosition(symbol: string, side: 'long' | 'short'): Promise<OrderResult> {
    throw new Error('Position closing not implemented for spot trading');
  }

  private mapOrderStatus(status: string): OrderResult['status'] {
    const statusMap: Record<string, OrderResult['status']> = {
      'NEW': 'pending',
      'PARTIALLY_FILLED': 'partially_filled',
      'FILLED': 'filled',
      'CANCELED': 'cancelled',
      'REJECTED': 'rejected',
      'EXPIRED': 'cancelled',
    };
    return statusMap[status] || 'pending';
  }
}
