export interface WebSocketMessage {
  type: 'trade.executed' | 'evaluation.progress' | 'evaluation.status' | 'position.opened' | 'position.closed' | 'subscription.update' | 'ping' | 'pong' | 'subscribe' | 'unsubscribe' | 'error';
  payload: any;
  timestamp: number;
}

export interface TradeExecutedPayload {
  botId: string;
  botName: string;
  tradeId: string;
  symbol: string;
  side: 'buy' | 'sell' | 'long' | 'short';
  price: number;
  quantity: number;
  pnlValue?: number;
  pnlPercentage?: number;
  legType: 'entry' | 'exit';
  positionId: string;
}

export interface EvaluationProgressPayload {
  botId: string;
  botName: string;
  totalTrades: number;
  profitPercentage: number;
  maxDrawdown: number;
  evaluationStatus: string;
  requiredTrades: number;
  requiredProfit: number;
  maxAllowedDrawdown: number;
}

export interface EvaluationStatusPayload {
  botId: string;
  status: string;
  failureReason?: string;
}

export interface PositionPayload {
  botId: string;
  botName: string;
  positionId: string;
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  quantity: number;
  exitPrice?: number;
  pnlValue?: number;
  pnlPercentage?: number;
}

export type WebSocketEventHandler = (message: WebSocketMessage) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 1000;
  private maxReconnectDelay: number = 30000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private handlers: Map<string, Set<WebSocketEventHandler>> = new Map();
  private isIntentionallyClosed: boolean = false;
  private subscribedBots: Set<string> = new Set();
  private ownedBots: Set<string> = new Set();

  constructor() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.url = `${protocol}//${window.location.host}/ws`;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.isIntentionallyClosed = false;

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected');
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          this.startHeartbeat();
          this.resubscribeAll();
          resolve();
        };

        this.ws.onclose = (event) => {
          console.log('[WebSocket] Disconnected', event.code, event.reason);
          this.stopHeartbeat();
          
          if (!this.isIntentionallyClosed) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          reject(error);
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('[WebSocket] Failed to parse message:', error);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect() {
    this.isIntentionallyClosed = true;
    this.stopHeartbeat();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[WebSocket] Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect().catch(() => {
        this.scheduleReconnect();
      });
    }, delay);
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', payload: {}, timestamp: Date.now() });
      }
    }, 25000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private handleMessage(message: WebSocketMessage) {
    if (message.type === 'ping') {
      this.send({ type: 'pong', payload: {}, timestamp: Date.now() });
      return;
    }
    
    if (message.type === 'pong') {
      if (message.payload?.subscribedBots && Array.isArray(message.payload.subscribedBots)) {
        message.payload.subscribedBots.forEach((botId: string) => {
          this.subscribedBots.add(botId);
        });
      }
      if (message.payload?.ownedBots && Array.isArray(message.payload.ownedBots)) {
        message.payload.ownedBots.forEach((botId: string) => {
          this.ownedBots.add(botId);
        });
      }
      return;
    }

    const handlers = this.handlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message));
    }

    const allHandlers = this.handlers.get('*');
    if (allHandlers) {
      allHandlers.forEach(handler => handler(message));
    }
  }

  send(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  subscribe(type: string, handler: WebSocketEventHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);

    return () => {
      const handlers = this.handlers.get(type);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.handlers.delete(type);
        }
      }
    };
  }

  subscribeToBot(botId: string) {
    this.send({
      type: 'subscribe',
      payload: { botId },
      timestamp: Date.now(),
    });
    this.subscribedBots.add(botId);
  }

  unsubscribeFromBot(botId: string) {
    this.send({
      type: 'unsubscribe',
      payload: { botId },
      timestamp: Date.now(),
    });
    this.subscribedBots.delete(botId);
  }

  private resubscribeAll() {
    this.subscribedBots.forEach(botId => {
      this.send({
        type: 'subscribe',
        payload: { botId },
        timestamp: Date.now(),
      });
    });
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getSubscribedBots(): Set<string> {
    return new Set(this.subscribedBots);
  }

  getOwnedBots(): Set<string> {
    return new Set(this.ownedBots);
  }
}

export const wsClient = new WebSocketClient();
