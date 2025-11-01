export interface ExchangeCredentials {
  apiKey: string;
  apiSecret: string;
  passphrase?: string;
  isTestnet: boolean;
  accountType?: 'spot' | 'futures';
}

export interface OrderSide {
  type: 'buy' | 'sell';
  positionSide?: 'long' | 'short';
  reduceOnly?: boolean;
}

export interface PlaceOrderParams {
  symbol: string;
  side: OrderSide;
  quantity: number;
  price?: number;
  orderType: 'market' | 'limit';
  reduceOnly?: boolean;
}

export interface OrderResult {
  orderId: string;
  symbol: string;
  side: string;
  quantity: number;
  price: number;
  status: 'pending' | 'filled' | 'partially_filled' | 'cancelled' | 'rejected';
  filledQuantity: number;
  averagePrice?: number;
  fees?: number;
  timestamp: number;
}

export interface Balance {
  asset: string;
  free: number;
  locked: number;
  total: number;
}

export interface Position {
  symbol: string;
  side: 'long' | 'short';
  size: number;
  quantity?: number;
  entryPrice: number;
  markPrice: number;
  unrealizedPnl: number;
  leverage: number;
  liquidationPrice?: number;
}

export abstract class BaseExchangeClient {
  protected credentials: ExchangeCredentials;
  protected baseUrl: string;

  constructor(credentials: ExchangeCredentials) {
    this.credentials = credentials;
    this.baseUrl = this.getBaseUrl();
  }

  protected abstract getBaseUrl(): string;

  abstract testConnection(): Promise<boolean>;

  abstract getBalance(asset?: string): Promise<Balance[]>;

  abstract placeOrder(params: PlaceOrderParams): Promise<OrderResult>;

  abstract cancelOrder(orderId: string, symbol: string): Promise<boolean>;

  abstract getOrderStatus(orderId: string, symbol: string): Promise<OrderResult>;

  abstract getOpenPositions(): Promise<Position[]>;

  abstract closePosition(symbol: string, side: 'long' | 'short'): Promise<OrderResult>;

  protected generateSignature(params: string, secret: string): string {
    const crypto = require('crypto');
    return crypto
      .createHmac('sha256', secret)
      .update(params)
      .digest('hex');
  }

  protected async makeRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    params: any = {},
    authenticated: boolean = true
  ): Promise<any> {
    throw new Error('makeRequest must be implemented by subclass');
  }
}

export class ExchangeError extends Error {
  constructor(
    message: string,
    public exchange: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ExchangeError';
  }
}
