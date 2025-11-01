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

      // Validate inputs
      if (!quantity || quantity <= 0) {
        return {
          success: false,
          error: 'Invalid quantity - must be greater than zero',
          exchange: exchangeConnection.exchange,
        };
      }

      if (!price || price <= 0) {
        return {
          success: false,
          error: 'Invalid price - must be greater than zero',
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

      // Validate sufficient balance (approximate check for BUY orders)
      const normalizedAction = action.toLowerCase();
      const side = (normalizedAction === 'buy' || normalizedAction === 'long') ? 'buy' : 'sell';
      
      if (side === 'buy') {
        const estimatedCost = price * quantity * 1.001; // Include 0.1% fee buffer
        const balanceCheck = await this.validateSufficientBalance(
          exchangeConnection,
          estimatedCost,
          'USDT'
        );

        if (!balanceCheck.sufficient) {
          return {
            success: false,
            error: `Insufficient balance. Required: $${estimatedCost.toFixed(2)}, Available: $${balanceCheck.availableBalance.toFixed(2)}`,
            exchange: exchangeConnection.exchange,
          };
        }
      }

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

      console.log(`[TradeExecution] Order result from exchange:`, {
        orderId: orderResult.orderId,
        status: orderResult.status,
        filledQuantity: orderResult.filledQuantity,
        averagePrice: orderResult.averagePrice,
        price: orderResult.price,
      });

      // Validate order result has required data
      const executedPrice = orderResult.averagePrice || orderResult.price || 0;
      const executedQuantity = orderResult.filledQuantity || orderResult.quantity || 0;

      // Guard against zero or missing execution data
      if (executedPrice <= 0 || executedQuantity <= 0) {
        console.error(`[TradeExecution] Order placed but missing execution data:`, {
          orderId: orderResult.orderId,
          executedPrice,
          executedQuantity,
          rawResult: orderResult,
        });

        return {
          success: false,
          error: `Order placed but execution data incomplete (price: ${executedPrice}, qty: ${executedQuantity}). This may indicate an exchange API issue. Please check your exchange account directly.`,
          orderId: orderResult.orderId,
          exchange: exchangeConnection.exchange,
        };
      }

      return {
        success: true,
        orderId: orderResult.orderId,
        executedPrice,
        executedQuantity,
        fees: orderResult.fees || 0,
        exchange: exchangeConnection.exchange,
      };

    } catch (error: any) {
      console.error(`[TradeExecution] Failed to execute trade on ${exchangeConnection.exchange}:`, error);
      
      // Extract more detailed error information
      const errorMessage = error.response?.data?.msg || 
                          error.response?.data?.retMsg ||
                          error.message || 
                          'Unknown error occurred';

      return {
        success: false,
        error: errorMessage,
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
