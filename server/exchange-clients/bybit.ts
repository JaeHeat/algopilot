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

export class BybitClient extends BaseExchangeClient {
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
      ? 'https://api-testnet.bybit.com'
      : 'https://api.bybit.com';
  }

  private createSignature(timestamp: number, params: string): string {
    const sign = timestamp + this.credentials.apiKey + params;
    return crypto
      .createHmac('sha256', this.credentials.apiSecret)
      .update(sign)
      .digest('hex');
  }

  private createHeaders(timestamp: number, params: string): Record<string, string> {
    return {
      'X-BAPI-API-KEY': this.credentials.apiKey,
      'X-BAPI-TIMESTAMP': timestamp.toString(),
      'X-BAPI-SIGN': this.createSignature(timestamp, params),
      'Content-Type': 'application/json',
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const timestamp = Date.now();
      const recvWindow = 5000;
      const params = `${recvWindow}`;
      
      const endpoint = this.credentials.accountType === 'futures' 
        ? '/v5/position/list'
        : '/v5/account/wallet-balance';
      
      const queryParams = this.credentials.accountType === 'futures'
        ? `category=linear&settleCoin=USDT`
        : `accountType=UNIFIED`;

      await this.axiosInstance.get(endpoint, {
        params: { 
          ...(this.credentials.accountType === 'futures' 
            ? { category: 'linear', settleCoin: 'USDT' }
            : { accountType: 'UNIFIED' })
        },
        headers: this.createHeaders(timestamp, params),
      });
      
      return true;
    } catch (error: any) {
      console.error('[Bybit] Connection test failed:', error.response?.data || error.message);
      return false;
    }
  }

  async getBalance(asset?: string): Promise<Balance[]> {
    try {
      const timestamp = Date.now();
      const recvWindow = 5000;
      const params = `${recvWindow}`;

      const accountType = this.credentials.accountType === 'futures' ? 'CONTRACT' : 'UNIFIED';
      
      const response = await this.axiosInstance.get('/v5/account/wallet-balance', {
        params: { accountType },
        headers: this.createHeaders(timestamp, params),
      });

      if (response.data.retCode !== 0) {
        throw new Error(response.data.retMsg || 'Failed to get balance');
      }

      const walletData = response.data.result?.list?.[0];
      if (!walletData) {
        return [];
      }

      const coins = walletData.coin || [];
      const balances = coins
        .filter((coin: any) => {
          const total = parseFloat(coin.walletBalance || '0');
          return asset ? coin.coin === asset && total > 0 : total > 0;
        })
        .map((coin: any) => ({
          asset: coin.coin,
          free: parseFloat(coin.availableToWithdraw || '0'),
          locked: parseFloat(coin.locked || '0'),
          total: parseFloat(coin.walletBalance || '0'),
        }));

      return balances;
    } catch (error: any) {
      throw new ExchangeError(
        error.response?.data?.retMsg || 'Failed to get balance',
        'Bybit',
        error.response?.data?.retCode?.toString(),
        error.response?.status
      );
    }
  }

  async placeOrder(params: PlaceOrderParams): Promise<OrderResult> {
    try {
      const timestamp = Date.now();
      
      const category = this.credentials.accountType === 'futures' ? 'linear' : 'spot';
      const symbol = params.symbol.replace('/', '');
      
      const orderParams: any = {
        category,
        symbol,
        side: params.side.type === 'buy' ? 'Buy' : 'Sell',
        orderType: params.orderType === 'market' ? 'Market' : 'Limit',
        qty: params.quantity.toString(),
      };

      if (params.orderType === 'limit' && params.price) {
        orderParams.price = params.price.toString();
      }

      if (this.credentials.accountType === 'futures') {
        orderParams.positionIdx = 0;
      }

      const bodyString = JSON.stringify(orderParams);
      const recvWindow = 5000;
      const signParams = `${recvWindow}${bodyString}`;

      const response = await this.axiosInstance.post(
        '/v5/order/create',
        orderParams,
        {
          headers: this.createHeaders(timestamp, signParams),
        }
      );

      if (response.data.retCode !== 0) {
        throw new Error(response.data.retMsg || 'Order failed');
      }

      const result = response.data.result;
      
      return {
        orderId: result.orderId,
        symbol: params.symbol,
        side: params.side.type,
        quantity: parseFloat(params.quantity.toString()),
        price: parseFloat(params.price?.toString() || '0'),
        status: 'pending',
        filledQuantity: 0,
        averagePrice: 0,
        fees: 0,
        timestamp: timestamp,
      };
    } catch (error: any) {
      throw new ExchangeError(
        error.response?.data?.retMsg || 'Failed to place order',
        'Bybit',
        error.response?.data?.retCode?.toString(),
        error.response?.status
      );
    }
  }

  async cancelOrder(orderId: string, symbol: string): Promise<boolean> {
    try {
      const timestamp = Date.now();
      const category = this.credentials.accountType === 'futures' ? 'linear' : 'spot';
      
      const params = {
        category,
        symbol: symbol.replace('/', ''),
        orderId,
      };

      const bodyString = JSON.stringify(params);
      const recvWindow = 5000;
      const signParams = `${recvWindow}${bodyString}`;

      const response = await this.axiosInstance.post(
        '/v5/order/cancel',
        params,
        {
          headers: this.createHeaders(timestamp, signParams),
        }
      );

      return response.data.retCode === 0;
    } catch (error: any) {
      console.error('[Bybit] Cancel order failed:', error.response?.data || error.message);
      return false;
    }
  }

  async getOrderStatus(orderId: string, symbol: string): Promise<OrderResult> {
    try {
      const timestamp = Date.now();
      const category = this.credentials.accountType === 'futures' ? 'linear' : 'spot';
      const recvWindow = 5000;
      const params = `${recvWindow}`;
      
      const response = await this.axiosInstance.get('/v5/order/realtime', {
        params: {
          category,
          symbol: symbol.replace('/', ''),
          orderId,
        },
        headers: this.createHeaders(timestamp, params),
      });

      if (response.data.retCode !== 0) {
        throw new Error(response.data.retMsg || 'Failed to get order status');
      }

      const order = response.data.result?.list?.[0];
      if (!order) {
        throw new Error('Order not found');
      }

      return {
        orderId: order.orderId,
        symbol: symbol,
        side: order.side.toLowerCase(),
        quantity: parseFloat(order.qty),
        price: parseFloat(order.price),
        status: this.mapOrderStatus(order.orderStatus),
        filledQuantity: parseFloat(order.cumExecQty || '0'),
        averagePrice: parseFloat(order.avgPrice || order.price || '0'),
        timestamp: parseInt(order.createdTime),
      };
    } catch (error: any) {
      throw new ExchangeError(
        error.response?.data?.retMsg || 'Failed to get order status',
        'Bybit',
        error.response?.data?.retCode?.toString(),
        error.response?.status
      );
    }
  }

  async getOpenPositions(): Promise<Position[]> {
    if (this.credentials.accountType !== 'futures') {
      return [];
    }

    try {
      const timestamp = Date.now();
      const recvWindow = 5000;
      const params = `${recvWindow}`;

      const response = await this.axiosInstance.get('/v5/position/list', {
        params: {
          category: 'linear',
          settleCoin: 'USDT',
        },
        headers: this.createHeaders(timestamp, params),
      });

      if (response.data.retCode !== 0) {
        throw new Error(response.data.retMsg || 'Failed to get positions');
      }

      const positions = response.data.result?.list || [];
      
      return positions
        .filter((pos: any) => parseFloat(pos.size) > 0)
        .map((pos: any) => ({
          symbol: pos.symbol,
          side: pos.side.toLowerCase() as 'long' | 'short',
          size: parseFloat(pos.size),
          entryPrice: parseFloat(pos.avgPrice),
          markPrice: parseFloat(pos.markPrice),
          unrealizedPnl: parseFloat(pos.unrealisedPnl),
          liquidationPrice: parseFloat(pos.liqPrice || '0'),
          leverage: parseFloat(pos.leverage),
        }));
    } catch (error: any) {
      throw new ExchangeError(
        error.response?.data?.retMsg || 'Failed to get positions',
        'Bybit',
        error.response?.data?.retCode?.toString(),
        error.response?.status
      );
    }
  }

  async closePosition(symbol: string, side: 'long' | 'short'): Promise<OrderResult> {
    if (this.credentials.accountType !== 'futures') {
      throw new Error('Position closing only available for futures accounts');
    }

    try {
      const positions = await this.getOpenPositions();
      const position = positions.find(p => p.symbol === symbol && p.side === side);
      
      if (!position) {
        throw new Error('Position not found');
      }

      const closeSide = side === 'long' ? 'sell' : 'buy';
      
      return await this.placeOrder({
        symbol,
        side: { type: closeSide, reduceOnly: true },
        orderType: 'market',
        quantity: position.size,
      });
    } catch (error: any) {
      throw new ExchangeError(
        error.message || 'Failed to close position',
        'Bybit',
        undefined,
        undefined
      );
    }
  }

  private mapOrderStatus(status: string): OrderResult['status'] {
    const statusMap: Record<string, OrderResult['status']> = {
      'Created': 'pending',
      'New': 'pending',
      'PartiallyFilled': 'partially_filled',
      'Filled': 'filled',
      'Cancelled': 'cancelled',
      'Rejected': 'rejected',
      'PartiallyFilledCanceled': 'cancelled',
    };
    return statusMap[status] || 'pending';
  }
}
