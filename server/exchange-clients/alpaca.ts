import axios, { AxiosInstance } from 'axios';
import {
  BaseExchangeClient,
  ExchangeCredentials,
  PlaceOrderParams,
  OrderResult,
  Balance,
  Position,
  ExchangeError,
} from './base';

/**
 * Alpaca client — US stocks/ETFs (and Alpaca crypto).
 *
 * Differences vs the crypto-exchange clients:
 *  - Auth is via static headers (APCA-API-KEY-ID / APCA-API-SECRET-KEY), no HMAC signing.
 *  - Equities are commission-free (fees = 0).
 *  - Market orders settle asynchronously: placeOrder returns status "pending"/"accepted";
 *    poll getOrderStatus for the fill. closePosition liquidates the whole position.
 *  - `isTestnet` selects the paper-trading endpoint (paper vs live account).
 *  - Symbols are passed through unchanged ("AAPL" for stocks, "BTC/USD" for Alpaca crypto).
 *  - Account-level margin only: per-order leverage is ignored.
 */
export class AlpacaClient extends BaseExchangeClient {
  private axiosInstance: AxiosInstance;

  constructor(credentials: ExchangeCredentials) {
    super(credentials);
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: this.createHeaders(),
    });
  }

  protected getBaseUrl(): string {
    return this.credentials.isTestnet
      ? 'https://paper-api.alpaca.markets'
      : 'https://api.alpaca.markets';
  }

  private createHeaders(): Record<string, string> {
    return {
      'APCA-API-KEY-ID': this.credentials.apiKey,
      'APCA-API-SECRET-KEY': this.credentials.apiSecret,
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.axiosInstance.get('/v2/account');
      return true;
    } catch (error: any) {
      console.error('[Alpaca] Connection test failed:', error.response?.data || error.message);
      return false;
    }
  }

  async getBalance(asset?: string): Promise<Balance[]> {
    try {
      const response = await this.axiosInstance.get('/v2/account');
      const data = response.data;

      // Alpaca accounts are USD-denominated. Expose buying power as "free" and
      // total equity as "total" so position-sizing logic has both numbers.
      const cash = parseFloat(data.cash ?? '0');
      const equity = parseFloat(data.equity ?? data.portfolio_value ?? '0');
      const currency = (data.currency ?? 'USD') as string;

      if (asset && asset !== currency) {
        return [];
      }

      return [
        {
          asset: currency,
          free: cash,
          locked: Math.max(0, equity - cash),
          total: equity,
        },
      ];
    } catch (error: any) {
      throw new ExchangeError(
        error.response?.data?.message || 'Failed to get balance',
        'Alpaca',
        error.response?.data?.code?.toString(),
        error.response?.status,
      );
    }
  }

  async placeOrder(params: PlaceOrderParams): Promise<OrderResult> {
    try {
      const body: Record<string, any> = {
        symbol: params.symbol,
        side: params.side.type, // 'buy' | 'sell'
        type: params.orderType, // 'market' | 'limit'
        qty: params.quantity.toString(),
        time_in_force: params.orderType === 'limit' ? 'gtc' : 'day',
      };

      if (params.orderType === 'limit' && params.price) {
        body.limit_price = params.price.toString();
      }

      const response = await this.axiosInstance.post('/v2/orders', body);
      return this.toOrderResult(response.data, params.symbol);
    } catch (error: any) {
      throw new ExchangeError(
        error.response?.data?.message || 'Failed to place order',
        'Alpaca',
        error.response?.data?.code?.toString(),
        error.response?.status,
      );
    }
  }

  async cancelOrder(orderId: string, _symbol: string): Promise<boolean> {
    try {
      await this.axiosInstance.delete(`/v2/orders/${orderId}`);
      return true;
    } catch (error: any) {
      console.error('[Alpaca] Cancel order failed:', error.response?.data || error.message);
      return false;
    }
  }

  async getOrderStatus(orderId: string, symbol: string): Promise<OrderResult> {
    try {
      const response = await this.axiosInstance.get(`/v2/orders/${orderId}`);
      return this.toOrderResult(response.data, symbol);
    } catch (error: any) {
      throw new ExchangeError(
        error.response?.data?.message || 'Failed to get order status',
        'Alpaca',
        error.response?.data?.code?.toString(),
        error.response?.status,
      );
    }
  }

  async getOpenPositions(): Promise<Position[]> {
    try {
      const response = await this.axiosInstance.get('/v2/positions');
      return (response.data as any[]).map((p) => {
        const qty = parseFloat(p.qty);
        return {
          symbol: p.symbol,
          side: (p.side === 'short' || qty < 0 ? 'short' : 'long') as 'long' | 'short',
          size: Math.abs(qty),
          quantity: Math.abs(qty),
          entryPrice: parseFloat(p.avg_entry_price ?? '0'),
          markPrice: parseFloat(p.current_price ?? p.avg_entry_price ?? '0'),
          unrealizedPnl: parseFloat(p.unrealized_pl ?? '0'),
          leverage: 1,
        };
      });
    } catch (error: any) {
      throw new ExchangeError(
        error.response?.data?.message || 'Failed to get positions',
        'Alpaca',
        error.response?.data?.code?.toString(),
        error.response?.status,
      );
    }
  }

  async closePosition(symbol: string, _side: 'long' | 'short'): Promise<OrderResult> {
    try {
      // DELETE /v2/positions/{symbol} liquidates the entire position and returns the closing order.
      const response = await this.axiosInstance.delete(`/v2/positions/${encodeURIComponent(symbol)}`);
      return this.toOrderResult(response.data, symbol);
    } catch (error: any) {
      throw new ExchangeError(
        error.response?.data?.message || 'Failed to close position',
        'Alpaca',
        error.response?.data?.code?.toString(),
        error.response?.status,
      );
    }
  }

  private toOrderResult(data: any, symbol: string): OrderResult {
    const filledQty = parseFloat(data.filled_qty ?? '0');
    const reqQty = parseFloat(data.qty ?? '0') || filledQty;
    const avgPrice = parseFloat(data.filled_avg_price ?? '0');
    const limitPrice = parseFloat(data.limit_price ?? '0');

    return {
      orderId: data.id?.toString() ?? '',
      symbol: data.symbol ?? symbol,
      side: data.side ?? '',
      quantity: reqQty,
      price: avgPrice || limitPrice || 0,
      status: this.mapOrderStatus(data.status),
      filledQuantity: filledQty,
      averagePrice: avgPrice || undefined,
      fees: 0, // Alpaca equities are commission-free
      timestamp: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
    };
  }

  private mapOrderStatus(status: string): OrderResult['status'] {
    const statusMap: Record<string, OrderResult['status']> = {
      filled: 'filled',
      partially_filled: 'partially_filled',
      canceled: 'cancelled',
      expired: 'cancelled',
      done_for_day: 'cancelled',
      replaced: 'cancelled',
      rejected: 'rejected',
      suspended: 'rejected',
      stopped: 'rejected',
      new: 'pending',
      accepted: 'pending',
      pending_new: 'pending',
      accepted_for_bidding: 'pending',
      pending_cancel: 'pending',
      pending_replace: 'pending',
      calculated: 'pending',
    };
    return statusMap[status] || 'pending';
  }
}
