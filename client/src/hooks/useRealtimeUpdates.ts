import { useEffect, useRef } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import type { TradeExecutedPayload, EvaluationProgressPayload, EvaluationStatusPayload, PositionPayload } from '@/lib/websocket';

interface UseRealtimeUpdatesOptions {
  botId?: string;
  enableNotifications?: boolean;
  enableQueryInvalidation?: boolean;
}

export function useRealtimeUpdates(options: UseRealtimeUpdatesOptions = {}) {
  const { 
    botId, 
    enableNotifications = true, 
    enableQueryInvalidation = true 
  } = options;
  
  const { 
    isConnected,
    lastTradeEvent,
    lastEvaluationProgress,
    lastEvaluationStatus,
    lastPositionOpened,
    lastPositionClosed,
    subscribeToBot,
    unsubscribeFromBot,
  } = useWebSocket();
  
  const { toast } = useToast();
  const processedEvents = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (botId && isConnected) {
      subscribeToBot(botId);
      return () => unsubscribeFromBot(botId);
    }
  }, [botId, isConnected, subscribeToBot, unsubscribeFromBot]);

  useEffect(() => {
    if (!lastTradeEvent) return;
    
    const eventKey = `trade-${lastTradeEvent.tradeId}`;
    if (processedEvents.current.has(eventKey)) return;
    processedEvents.current.add(eventKey);
    
    if (botId && lastTradeEvent.botId !== botId) return;

    if (enableQueryInvalidation) {
      queryClient.invalidateQueries({ queryKey: ['/api/creator/bots', lastTradeEvent.botId] });
      queryClient.invalidateQueries({ queryKey: ['/api/creator/bots', lastTradeEvent.botId, 'evaluation'] });
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trades'] });
    }

    if (enableNotifications) {
      const isProfit = (lastTradeEvent.pnlValue ?? 0) >= 0;
      const pnlText = lastTradeEvent.pnlValue !== undefined 
        ? ` | P&L: ${isProfit ? '+' : ''}$${lastTradeEvent.pnlValue.toFixed(2)}`
        : '';
      
      toast({
        title: lastTradeEvent.legType === 'entry' ? 'Position Opened' : 'Position Closed',
        description: `${lastTradeEvent.botName}: ${lastTradeEvent.side.toUpperCase()} ${lastTradeEvent.symbol} @ $${lastTradeEvent.price.toFixed(2)}${pnlText}`,
        variant: lastTradeEvent.legType === 'exit' && !isProfit ? 'destructive' : 'default',
      });
    }
  }, [lastTradeEvent, botId, enableNotifications, enableQueryInvalidation, toast]);

  useEffect(() => {
    if (!lastEvaluationProgress) return;
    
    if (botId && lastEvaluationProgress.botId !== botId) return;

    if (enableQueryInvalidation) {
      queryClient.invalidateQueries({ queryKey: ['/api/creator/bots', lastEvaluationProgress.botId] });
      queryClient.invalidateQueries({ queryKey: ['/api/creator/bots', lastEvaluationProgress.botId, 'evaluation'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bots', lastEvaluationProgress.botId, 'evaluation'] });
    }
  }, [lastEvaluationProgress, botId, enableQueryInvalidation]);

  useEffect(() => {
    if (!lastEvaluationStatus) return;
    
    const eventKey = `eval-status-${lastEvaluationStatus.botId}-${lastEvaluationStatus.status}`;
    if (processedEvents.current.has(eventKey)) return;
    processedEvents.current.add(eventKey);
    
    if (botId && lastEvaluationStatus.botId !== botId) return;

    if (enableQueryInvalidation) {
      queryClient.invalidateQueries({ queryKey: ['/api/creator/bots'] });
      queryClient.invalidateQueries({ queryKey: ['/api/creator/bots', lastEvaluationStatus.botId] });
      queryClient.invalidateQueries({ queryKey: ['/api/bots', lastEvaluationStatus.botId] });
    }

    if (enableNotifications) {
      if (lastEvaluationStatus.status === 'passed') {
        toast({
          title: 'Evaluation Passed!',
          description: 'Your bot has successfully passed evaluation and is now live!',
        });
      } else if (lastEvaluationStatus.status === 'failed') {
        toast({
          title: 'Evaluation Failed',
          description: lastEvaluationStatus.failureReason || 'Bot evaluation has failed.',
          variant: 'destructive',
        });
      }
    }
  }, [lastEvaluationStatus, botId, enableNotifications, enableQueryInvalidation, toast]);

  useEffect(() => {
    if (!lastPositionOpened) return;
    
    const eventKey = `pos-open-${lastPositionOpened.positionId}`;
    if (processedEvents.current.has(eventKey)) return;
    processedEvents.current.add(eventKey);
    
    if (botId && lastPositionOpened.botId !== botId) return;

    if (enableQueryInvalidation) {
      queryClient.invalidateQueries({ queryKey: ['/api/creator/bots', lastPositionOpened.botId, 'evaluation'] });
      queryClient.invalidateQueries({ queryKey: ['/api/positions'] });
    }
  }, [lastPositionOpened, botId, enableQueryInvalidation]);

  useEffect(() => {
    if (!lastPositionClosed) return;
    
    const eventKey = `pos-close-${lastPositionClosed.positionId}`;
    if (processedEvents.current.has(eventKey)) return;
    processedEvents.current.add(eventKey);
    
    if (botId && lastPositionClosed.botId !== botId) return;

    if (enableQueryInvalidation) {
      queryClient.invalidateQueries({ queryKey: ['/api/creator/bots', lastPositionClosed.botId, 'evaluation'] });
      queryClient.invalidateQueries({ queryKey: ['/api/positions'] });
    }
  }, [lastPositionClosed, botId, enableQueryInvalidation]);

  return {
    isConnected,
    lastTradeEvent,
    lastEvaluationProgress,
    lastEvaluationStatus,
    lastPositionOpened,
    lastPositionClosed,
  };
}

export function useGlobalRealtimeUpdates() {
  return useRealtimeUpdates({
    enableNotifications: true,
    enableQueryInvalidation: true,
  });
}
