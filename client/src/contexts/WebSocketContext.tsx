import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { wsClient, type WebSocketMessage, type TradeExecutedPayload, type EvaluationProgressPayload, type EvaluationStatusPayload, type PositionPayload } from '@/lib/websocket';
import { useAuth } from '@/hooks/useAuth';

interface WebSocketContextValue {
  isConnected: boolean;
  subscribeToEvent: (type: string, handler: (message: WebSocketMessage) => void) => () => void;
  subscribeToBot: (botId: string) => void;
  unsubscribeFromBot: (botId: string) => void;
  lastTradeEvent: TradeExecutedPayload | null;
  lastEvaluationProgress: EvaluationProgressPayload | null;
  lastEvaluationStatus: EvaluationStatusPayload | null;
  lastPositionOpened: PositionPayload | null;
  lastPositionClosed: PositionPayload | null;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastTradeEvent, setLastTradeEvent] = useState<TradeExecutedPayload | null>(null);
  const [lastEvaluationProgress, setLastEvaluationProgress] = useState<EvaluationProgressPayload | null>(null);
  const [lastEvaluationStatus, setLastEvaluationStatus] = useState<EvaluationStatusPayload | null>(null);
  const [lastPositionOpened, setLastPositionOpened] = useState<PositionPayload | null>(null);
  const [lastPositionClosed, setLastPositionClosed] = useState<PositionPayload | null>(null);

  useEffect(() => {
    if (!user) {
      wsClient.disconnect();
      setIsConnected(false);
      return;
    }

    wsClient.connect()
      .then(() => setIsConnected(true))
      .catch((error) => {
        console.error('[WebSocketContext] Failed to connect:', error);
        setIsConnected(false);
      });

    const checkConnection = setInterval(() => {
      setIsConnected(wsClient.isConnected());
    }, 5000);

    return () => {
      clearInterval(checkConnection);
      wsClient.disconnect();
      setIsConnected(false);
    };
  }, [user]);

  useEffect(() => {
    if (!isConnected) return;

    const unsubTrade = wsClient.subscribe('trade.executed', (message) => {
      setLastTradeEvent(message.payload as TradeExecutedPayload);
    });

    const unsubEvalProgress = wsClient.subscribe('evaluation.progress', (message) => {
      setLastEvaluationProgress(message.payload as EvaluationProgressPayload);
    });

    const unsubEvalStatus = wsClient.subscribe('evaluation.status', (message) => {
      setLastEvaluationStatus(message.payload as EvaluationStatusPayload);
    });

    const unsubPositionOpened = wsClient.subscribe('position.opened', (message) => {
      setLastPositionOpened(message.payload as PositionPayload);
    });

    const unsubPositionClosed = wsClient.subscribe('position.closed', (message) => {
      setLastPositionClosed(message.payload as PositionPayload);
    });

    return () => {
      unsubTrade();
      unsubEvalProgress();
      unsubEvalStatus();
      unsubPositionOpened();
      unsubPositionClosed();
    };
  }, [isConnected]);

  const subscribeToEvent = useCallback((type: string, handler: (message: WebSocketMessage) => void) => {
    return wsClient.subscribe(type, handler);
  }, []);

  const subscribeToBot = useCallback((botId: string) => {
    if (isConnected) {
      wsClient.subscribeToBot(botId);
    }
  }, [isConnected]);

  const unsubscribeFromBot = useCallback((botId: string) => {
    if (isConnected) {
      wsClient.unsubscribeFromBot(botId);
    }
  }, [isConnected]);

  const value: WebSocketContextValue = {
    isConnected,
    subscribeToEvent,
    subscribeToBot,
    unsubscribeFromBot,
    lastTradeEvent,
    lastEvaluationProgress,
    lastEvaluationStatus,
    lastPositionOpened,
    lastPositionClosed,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

export function useWebSocketEvent<T = any>(
  eventType: string,
  handler: (payload: T) => void,
  deps: any[] = []
) {
  const { subscribeToEvent } = useWebSocket();

  useEffect(() => {
    const unsubscribe = subscribeToEvent(eventType, (message) => {
      handler(message.payload as T);
    });

    return unsubscribe;
  }, [eventType, subscribeToEvent, ...deps]);
}
