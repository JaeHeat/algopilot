import type { IStorage } from "../storage";
import type { Bot, BotEvaluationRun } from "@shared/schema";

interface EvaluationSignal {
  botId: string;
  symbol: string;
  action: 'buy' | 'sell' | 'long' | 'short' | 'entry' | 'exit';
  positionSide?: 'long' | 'short' | null;
  price: number;
  timestamp?: string;
}

interface ProcessSignalResult {
  success: boolean;
  message: string;
  tradeId?: string;
  error?: string;
}

export async function processEvaluationSignal(
  signal: EvaluationSignal,
  storage: IStorage
): Promise<ProcessSignalResult> {
  const { botId, symbol, action, positionSide, price } = signal;
  
  console.log(`[Evaluation] Processing signal for bot ${botId}: ${action} ${symbol} @ ${price}`);
  
  try {
    let evaluationRun = await storage.getActiveEvaluationRun(botId);
    
    if (!evaluationRun) {
      console.log(`[Evaluation] No active run found - creating new evaluation run for bot ${botId}`);
      evaluationRun = await storage.createEvaluationRun(botId);
    }
    
    const botSettings = await storage.getBotSettings(botId);
    
    let riskPercent = parseFloat(evaluationRun.riskPercentPerTrade);
    const currentBalance = parseFloat(evaluationRun.currentBalance);
    
    let positionSize = 0;
    
    if (botSettings) {
      const strategy = botSettings.positionSizingStrategy;
      
      if (strategy === 'percent_of_balance') {
        const percentage = parseFloat(botSettings.positionSizeValue);
        positionSize = (currentBalance * percentage) / 100;
      } else if (strategy === 'risk_based') {
        const riskAmount = (currentBalance * parseFloat(botSettings.positionSizeValue)) / 100;
        positionSize = riskAmount;
        riskPercent = parseFloat(botSettings.positionSizeValue);
      } else if (strategy === 'kelly_criterion') {
        const kellyFraction = parseFloat(botSettings.positionSizeValue) / 100;
        positionSize = currentBalance * kellyFraction;
      } else {
        positionSize = parseFloat(botSettings.positionSizeValue);
      }
    } else {
      positionSize = (currentBalance * riskPercent) / 100;
    }
    
    const quantity = positionSize / price;
    const fees = positionSize * 0.001;
    
    const normalizedAction = action.toLowerCase();
    
    // Entry signals: buy, long, entry
    if (normalizedAction === 'buy' || normalizedAction === 'long' || normalizedAction === 'entry') {
      // Determine the actual position side: prefer explicit positionSide from webhook, else infer from action
      const actualSide = positionSide === 'short' ? 'short' : 
                         positionSide === 'long' ? 'long' :
                         normalizedAction === 'buy' ? 'long' :
                         normalizedAction === 'long' ? 'long' : 'long'; // Default to long
      
      return await handleEntrySignal(evaluationRun, {
        symbol,
        side: actualSide,
        price,
        quantity,
        fees,
        botId,
        storage
      });
    } 
    // Exit signals: sell, short, exit
    else if (normalizedAction === 'sell' || normalizedAction === 'short' || normalizedAction === 'exit') {
      return await handleExitSignal(evaluationRun, {
        symbol,
        side: normalizedAction,
        price,
        quantity,
        fees,
        botId,
        storage
      });
    }
    
    return {
      success: false,
      message: `Unknown action: ${action}`,
    };
  } catch (error) {
    console.error(`[Evaluation] Error processing signal for bot ${botId}:`, error);
    return {
      success: false,
      message: "Error processing evaluation signal",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function handleEntrySignal(
  evaluationRun: BotEvaluationRun,
  params: {
    symbol: string;
    side: string;
    price: number;
    quantity: number;
    fees: number;
    botId: string;
    storage: IStorage;
  }
): Promise<ProcessSignalResult> {
  const { symbol, side, price, quantity, fees, botId, storage } = params;
  
  try {
    console.log(`[Evaluation] handleEntrySignal started for ${symbol}`);
    
    const existingPosition = await storage.getEvaluationPosition(evaluationRun.id, symbol);
    console.log(`[Evaluation] Checked existing position:`, existingPosition ? 'found' : 'none');
    
    if (existingPosition) {
      console.log(`[Evaluation] Position already exists for ${symbol}, skipping entry signal`);
      return {
        success: false,
        message: `Position already open for ${symbol}`,
      };
    }
    
    console.log(`[Evaluation] Creating position for ${symbol}...`);
    const position = await storage.createEvaluationPosition({
      evaluationRunId: evaluationRun.id,
      botId,
      symbol,
      side,
      quantity: quantity.toFixed(8),
      entryPrice: price.toFixed(8),
      fees: fees.toFixed(8),
    });
    console.log(`[Evaluation] Position created: ${position.id}`);
    
    console.log(`[Evaluation] Creating entry trade for ${symbol}...`);
    const trade = await storage.createEvaluationTrade({
      evaluationRunId: evaluationRun.id,
      positionId: position.id,
      botId,
      symbol,
      side,
      legType: 'entry',
      quantity: quantity.toFixed(8),
      price: price.toFixed(8),
      fees: fees.toFixed(8),
      balanceAfterTrade: parseFloat(evaluationRun.currentBalance).toFixed(8),
    });
    console.log(`[Evaluation] Trade created: ${trade.id}`);
    
    console.log(`[Evaluation] Updating run metrics...`);
    await storage.updateEvaluationRunMetrics(evaluationRun.id, {
      tradeCount: evaluationRun.tradeCount + 1,
    });
    console.log(`[Evaluation] Run metrics updated`);
    
    console.log(`[Evaluation] Opened ${side} position for ${symbol} @ ${price} (trade ${trade.id})`);
    
    return {
      success: true,
      message: `Entry signal processed successfully`,
      tradeId: trade.id,
    };
  } catch (error) {
    console.error(`[Evaluation] Error in handleEntrySignal for ${symbol}:`, error);
    throw error;
  }
}

async function handleExitSignal(
  evaluationRun: BotEvaluationRun,
  params: {
    symbol: string;
    side: string;
    price: number;
    quantity: number;
    fees: number;
    botId: string;
    storage: IStorage;
  }
): Promise<ProcessSignalResult> {
  const { symbol, side, price, quantity, fees, botId, storage } = params;
  
  const existingPosition = await storage.getEvaluationPosition(evaluationRun.id, symbol);
  
  if (!existingPosition) {
    console.log(`[Evaluation] No open position found for ${symbol}, skipping exit signal`);
    return {
      success: false,
      message: `No open position found for ${symbol}`,
    };
  }
  
  const entryPrice = parseFloat(existingPosition.entryPrice);
  const positionQty = parseFloat(existingPosition.quantity);
  const entryFees = parseFloat(existingPosition.fees);
  
  let realizedPnl = 0;
  if (existingPosition.side === 'long' || existingPosition.side === 'buy') {
    realizedPnl = ((price - entryPrice) * positionQty) - entryFees - fees;
  } else {
    realizedPnl = ((entryPrice - price) * positionQty) - entryFees - fees;
  }
  
  await storage.closeEvaluationPosition(existingPosition.id, realizedPnl.toFixed(8));
  
  const currentBalance = parseFloat(evaluationRun.currentBalance);
  const newBalance = currentBalance + realizedPnl;
  
  const trade = await storage.createEvaluationTrade({
    evaluationRunId: evaluationRun.id,
    positionId: existingPosition.id,
    botId,
    symbol,
    side,
    legType: 'exit',
    quantity: positionQty.toFixed(8),
    price: price.toFixed(8),
    fees: fees.toFixed(8),
    realizedPnl: realizedPnl.toFixed(8),
    balanceAfterTrade: newBalance.toFixed(8),
  });
  
  const startingBalance = parseFloat(evaluationRun.startingBalance);
  const cumulativeReturnPct = ((newBalance - startingBalance) / startingBalance) * 100;
  
  const peakEquity = parseFloat(evaluationRun.peakEquity);
  const newPeakEquity = Math.max(peakEquity, newBalance);
  
  const drawdownFromPeak = ((newPeakEquity - newBalance) / newPeakEquity) * 100;
  const currentMaxDrawdown = parseFloat(evaluationRun.maxDrawdownPct);
  const newMaxDrawdown = Math.max(currentMaxDrawdown, drawdownFromPeak);
  
  await storage.updateEvaluationRunMetrics(evaluationRun.id, {
    currentBalance: newBalance.toFixed(2),
    peakEquity: newPeakEquity.toFixed(2),
    cumulativeReturnPct: cumulativeReturnPct.toFixed(4),
    maxDrawdownPct: newMaxDrawdown.toFixed(4),
    tradeCount: evaluationRun.tradeCount + 1,
  });
  
  console.log(`[Evaluation] Closed ${existingPosition.side} position for ${symbol} @ ${price} | P&L: ${realizedPnl.toFixed(2)} | Return: ${cumulativeReturnPct.toFixed(2)}% | Drawdown: ${newMaxDrawdown.toFixed(2)}%`);
  
  const freshRun = await storage.getActiveEvaluationRun(botId);
  if (freshRun) {
    await checkEvaluationStatus(freshRun.id, botId, storage, {
      tradeCount: freshRun.tradeCount,
      cumulativeReturnPct: parseFloat(freshRun.cumulativeReturnPct),
      maxDrawdownPct: parseFloat(freshRun.maxDrawdownPct),
    });
  }
  
  return {
    success: true,
    message: `Exit signal processed successfully`,
    tradeId: trade.id,
  };
}

async function checkEvaluationStatus(
  evaluationRunId: string,
  botId: string,
  storage: IStorage,
  metrics: {
    tradeCount: number;
    cumulativeReturnPct: number;
    maxDrawdownPct: number;
  }
) {
  const { tradeCount, cumulativeReturnPct, maxDrawdownPct } = metrics;
  
  const REQUIRED_TRADES = 10;
  const REQUIRED_PROFIT_PCT = 10;
  const MAX_DRAWDOWN_PCT = 5;
  const MAX_TRADES_WITHOUT_PROFIT = 50;
  
  if (maxDrawdownPct > MAX_DRAWDOWN_PCT) {
    console.log(`[Evaluation] Bot ${botId} FAILED - Max drawdown exceeded: ${maxDrawdownPct.toFixed(2)}% > ${MAX_DRAWDOWN_PCT}%`);
    
    await storage.closeEvaluationRun(
      evaluationRunId,
      'failed',
      `Maximum drawdown exceeded: ${maxDrawdownPct.toFixed(2)}% (limit: ${MAX_DRAWDOWN_PCT}%)`
    );
    
    await storage.updateBot(botId, { 
      evaluationStatus: 'failed',
      failureReason: `Maximum drawdown exceeded: ${maxDrawdownPct.toFixed(2)}% (limit: ${MAX_DRAWDOWN_PCT}%)`
    });
    
    return;
  }
  
  if (tradeCount >= MAX_TRADES_WITHOUT_PROFIT && cumulativeReturnPct < REQUIRED_PROFIT_PCT) {
    console.log(`[Evaluation] Bot ${botId} FAILED - Did not reach profit target after ${MAX_TRADES_WITHOUT_PROFIT} trades`);
    
    await storage.closeEvaluationRun(
      evaluationRunId,
      'failed',
      `Failed to reach ${REQUIRED_PROFIT_PCT}% profit after ${MAX_TRADES_WITHOUT_PROFIT} trades`
    );
    
    await storage.updateBot(botId, {
      evaluationStatus: 'failed',
      failureReason: `Failed to reach ${REQUIRED_PROFIT_PCT}% profit after ${MAX_TRADES_WITHOUT_PROFIT} trades`
    });
    
    return;
  }
  
  if (tradeCount >= REQUIRED_TRADES && cumulativeReturnPct >= REQUIRED_PROFIT_PCT) {
    console.log(`[Evaluation] Bot ${botId} PASSED - ${tradeCount} trades, ${cumulativeReturnPct.toFixed(2)}% profit, ${maxDrawdownPct.toFixed(2)}% max drawdown`);
    
    await storage.closeEvaluationRun(
      evaluationRunId,
      'completed',
      `Passed with ${tradeCount} trades and ${cumulativeReturnPct.toFixed(2)}% profit`
    );
    
    await storage.updateBot(botId, {
      evaluationStatus: 'passed',
      isActive: true
    });
    
    return;
  }
  
  console.log(`[Evaluation] Bot ${botId} in progress - ${tradeCount}/${REQUIRED_TRADES} trades, ${cumulativeReturnPct.toFixed(2)}%/${REQUIRED_PROFIT_PCT}% profit, ${maxDrawdownPct.toFixed(2)}%/${MAX_DRAWDOWN_PCT}% drawdown`);
}
