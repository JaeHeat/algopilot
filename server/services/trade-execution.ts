import { ExchangeClientFactory } from '../exchange-clients/factory';
import { getDecryptedCredentials } from '../exchange-helpers';
import type { ExchangeConnection } from '@shared/schema';
import type { PlaceOrderParams, OrderResult } from '../exchange-clients/base';

export interface TradeExecutionParams {
  symbol: string;
  action: 'buy' | 'sell' | 'long' | 'short';
  price: number;
  quantity: number;
  exchangeConnection: ExchangeConnection;
}

export interface TradeExecutionResult {
  success: boolean;
  orderId?: string;
  executedPrice?: number;
  executedQuantity?: number;
  fees?: number;
  error?: string;
  exchange: string;
}

export class TradeExecutionService {
  async executeTrade(params: TradeExecutionParams): Promise<TradeExecutionResult> {
    const { symbol, action, price, quantity, exchangeConnection } = params;

    try {
      // Validate exchange connection
      if (!exchangeConnection.isActive) {
        return {
          success: false,
          error: 'Exchange connection is not active',
          exchange: exchangeConnection.exchange,
        };
      }

      // Get decrypted credentials
      const credentials = getDecryptedCredentials(exchangeConnection);

      // Create exchange client
      const client = ExchangeClientFactory.createClient(
        exchangeConnection.exchange,
        credentials
      );

      // Determine order side and type
      const normalizedAction = action.toLowerCase();
      const side = (normalizedAction === 'buy' || normalizedAction === 'long') ? 'buy' : 'sell';

      // Prepare order parameters
      const orderParams: PlaceOrderParams = {
        symbol,
        side: { type: side },
        quantity,
        orderType: 'market', // Use market orders for webhook signals
      };

      // Place the order
      console.log(`[TradeExecution] Placing ${side} order on ${exchangeConnection.exchange}:`, {
        symbol,
        quantity,
        accountType: exchangeConnection.accountType,
        isTestnet: exchangeConnection.isTestnet,
      });

      const orderResult: OrderResult = await client.placeOrder(orderParams);

      console.log(`[TradeExecution] Order executed successfully:`, {
        orderId: orderResult.orderId,
        status: orderResult.status,
        filledQuantity: orderResult.filledQuantity,
        averagePrice: orderResult.averagePrice,
      });

      return {
        success: true,
        orderId: orderResult.orderId,
        executedPrice: orderResult.averagePrice || orderResult.price,
        executedQuantity: orderResult.filledQuantity || orderResult.quantity,
        fees: orderResult.fees || 0,
        exchange: exchangeConnection.exchange,
      };

    } catch (error: any) {
      console.error(`[TradeExecution] Failed to execute trade on ${exchangeConnection.exchange}:`, error);
      
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        exchange: exchangeConnection.exchange,
      };
    }
  }

  async getExchangeBalance(exchangeConnection: ExchangeConnection, asset: string = 'USDT'): Promise<number> {
    try {
      const credentials = getDecryptedCredentials(exchangeConnection);
      const client = ExchangeClientFactory.createClient(
        exchangeConnection.exchange,
        credentials
      );

      const balances = await client.getBalance(asset);
      const balance = balances.find(b => b.asset === asset);

      return balance?.free || 0;

    } catch (error: any) {
      console.error(`[TradeExecution] Failed to get balance from ${exchangeConnection.exchange}:`, error);
      return 0;
    }
  }

  async validateSufficientBalance(
    exchangeConnection: ExchangeConnection,
    requiredAmount: number,
    asset: string = 'USDT'
  ): Promise<{ sufficient: boolean; availableBalance: number }> {
    const availableBalance = await this.getExchangeBalance(exchangeConnection, asset);
    
    return {
      sufficient: availableBalance >= requiredAmount,
      availableBalance,
    };
  }
}

export const tradeExecutionService = new TradeExecutionService();
