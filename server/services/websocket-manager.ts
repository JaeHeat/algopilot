import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import type { IncomingMessage } from 'http';

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

interface AuthenticatedSocket extends WebSocket {
  userId: string;
  isAlive: boolean;
  subscribedBots: Set<string>;
  isCreator: boolean;
  ownedBotIds: Set<string>;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private userSockets: Map<string, Set<AuthenticatedSocket>> = new Map();
  private botSubscribers: Map<string, Set<string>> = new Map();
  private botCreators: Map<string, string> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  initialize(server: Server, sessionParser: any, storage: any) {
    this.wss = new WebSocketServer({ 
      noServer: true,
      path: '/ws'
    });

    server.on('upgrade', async (request: IncomingMessage, socket, head) => {
      if (request.url !== '/ws') {
        socket.destroy();
        return;
      }

      try {
        const fakeRes: any = {
          writeHead: () => {},
          end: () => {},
        };

        sessionParser(request, fakeRes, async () => {
          const req = request as any;
          if (!req.session?.userId) {
            console.log('[WebSocket] Unauthorized upgrade attempt');
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
          }

          const userId = req.session.userId;

          this.wss!.handleUpgrade(request, socket, head, async (ws) => {
            const authenticatedWs = ws as AuthenticatedSocket;
            authenticatedWs.userId = userId;
            authenticatedWs.isAlive = true;
            authenticatedWs.subscribedBots = new Set();
            authenticatedWs.ownedBotIds = new Set();

            try {
              const user = await storage.getUser(userId);
              authenticatedWs.isCreator = user?.role === 'creator' || user?.role === 'admin';
              
              if (authenticatedWs.isCreator) {
                const creatorBots = await storage.getBotsByCreatorId(userId);
                creatorBots.forEach((bot: any) => {
                  authenticatedWs.ownedBotIds.add(bot.id);
                  this.botCreators.set(bot.id, userId);
                });
              }

              const subscriptions = await storage.getUserSubscriptions(userId);
              subscriptions.forEach((sub: any) => {
                if (sub.status === 'active') {
                  authenticatedWs.subscribedBots.add(sub.botId);
                  this.addBotSubscriber(sub.botId, userId);
                }
              });
            } catch (error) {
              console.error('[WebSocket] Error loading user data:', error);
            }

            this.addUserSocket(userId, authenticatedWs);
            this.wss!.emit('connection', authenticatedWs, request);
          });
        });
      } catch (error) {
        console.error('[WebSocket] Upgrade error:', error);
        socket.destroy();
      }
    });

    this.wss.on('connection', (ws: AuthenticatedSocket) => {
      console.log(`[WebSocket] Client connected: ${ws.userId}`);

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString()) as WebSocketMessage;
          this.handleClientMessage(ws, message);
        } catch (error) {
          this.sendToSocket(ws, {
            type: 'error',
            payload: { message: 'Invalid message format' },
            timestamp: Date.now(),
          });
        }
      });

      ws.on('close', () => {
        console.log(`[WebSocket] Client disconnected: ${ws.userId}`);
        this.removeUserSocket(ws.userId, ws);
      });

      ws.on('error', (error) => {
        console.error(`[WebSocket] Socket error for user ${ws.userId}:`, error);
      });

      this.sendToSocket(ws, {
        type: 'pong',
        payload: { 
          message: 'Connected',
          subscribedBots: Array.from(ws.subscribedBots),
          ownedBots: Array.from(ws.ownedBotIds),
        },
        timestamp: Date.now(),
      });
    });

    this.heartbeatInterval = setInterval(() => {
      this.wss?.clients.forEach((ws) => {
        const authWs = ws as AuthenticatedSocket;
        if (!authWs.isAlive) {
          console.log(`[WebSocket] Terminating inactive connection: ${authWs.userId}`);
          this.removeUserSocket(authWs.userId, authWs);
          return authWs.terminate();
        }
        authWs.isAlive = false;
        this.sendToSocket(authWs, {
          type: 'ping',
          payload: {},
          timestamp: Date.now(),
        });
      });
    }, 30000);

    console.log('[WebSocket] WebSocket server initialized');
  }

  private handleClientMessage(ws: AuthenticatedSocket, message: WebSocketMessage) {
    switch (message.type) {
      case 'ping':
        ws.isAlive = true;
        this.sendToSocket(ws, {
          type: 'pong',
          payload: {
            subscribedBots: Array.from(ws.subscribedBots),
            ownedBots: Array.from(ws.ownedBotIds),
          },
          timestamp: Date.now(),
        });
        break;

      case 'pong':
        ws.isAlive = true;
        break;

      case 'subscribe':
        if (message.payload?.botId) {
          ws.subscribedBots.add(message.payload.botId);
          this.addBotSubscriber(message.payload.botId, ws.userId);
        }
        break;

      case 'unsubscribe':
        if (message.payload?.botId) {
          ws.subscribedBots.delete(message.payload.botId);
          this.removeBotSubscriber(message.payload.botId, ws.userId);
        }
        break;

      default:
        break;
    }
  }

  private addUserSocket(userId: string, ws: AuthenticatedSocket) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(ws);
  }

  private removeUserSocket(userId: string, ws: AuthenticatedSocket) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(ws);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }

    ws.subscribedBots.forEach((botId) => {
      this.removeBotSubscriber(botId, userId);
    });
  }

  private addBotSubscriber(botId: string, userId: string) {
    if (!this.botSubscribers.has(botId)) {
      this.botSubscribers.set(botId, new Set());
    }
    this.botSubscribers.get(botId)!.add(userId);
  }

  private removeBotSubscriber(botId: string, userId: string) {
    const subscribers = this.botSubscribers.get(botId);
    if (subscribers) {
      subscribers.delete(userId);
      if (subscribers.size === 0) {
        this.botSubscribers.delete(botId);
      }
    }
  }

  private sendToSocket(ws: WebSocket, message: WebSocketMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendToUser(userId: string, message: WebSocketMessage) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.forEach((ws) => {
        this.sendToSocket(ws, message);
      });
    }
  }

  async publishTradeExecuted(payload: TradeExecutedPayload, storage?: any) {
    const message: WebSocketMessage = {
      type: 'trade.executed',
      payload,
      timestamp: Date.now(),
    };

    let creatorId = this.botCreators.get(payload.botId);
    if (!creatorId && storage) {
      const bot = await storage.getBotById(payload.botId);
      if (bot) {
        creatorId = bot.creatorId;
        this.botCreators.set(payload.botId, creatorId);
      }
    }
    
    if (creatorId) {
      this.sendToUser(creatorId, message);
    }

    const subscribers = this.botSubscribers.get(payload.botId);
    if (subscribers) {
      subscribers.forEach((userId) => {
        if (userId !== creatorId) {
          this.sendToUser(userId, message);
        }
      });
    }

    console.log(`[WebSocket] Published trade.executed for bot ${payload.botId}`);
  }

  async publishEvaluationProgress(payload: EvaluationProgressPayload, storage?: any) {
    const message: WebSocketMessage = {
      type: 'evaluation.progress',
      payload,
      timestamp: Date.now(),
    };

    let creatorId = this.botCreators.get(payload.botId);
    if (!creatorId && storage) {
      const bot = await storage.getBotById(payload.botId);
      if (bot) {
        creatorId = bot.creatorId;
        this.botCreators.set(payload.botId, creatorId);
      }
    }
    
    if (creatorId) {
      this.sendToUser(creatorId, message);
    }

    console.log(`[WebSocket] Published evaluation.progress for bot ${payload.botId}`);
  }

  async publishEvaluationStatus(botId: string, status: string, failureReason?: string, storage?: any) {
    const message: WebSocketMessage = {
      type: 'evaluation.status',
      payload: { botId, status, failureReason },
      timestamp: Date.now(),
    };

    let creatorId = this.botCreators.get(botId);
    if (!creatorId && storage) {
      const bot = await storage.getBotById(botId);
      if (bot) {
        creatorId = bot.creatorId;
        this.botCreators.set(botId, creatorId);
      }
    }
    
    if (creatorId) {
      this.sendToUser(creatorId, message);
    }

    console.log(`[WebSocket] Published evaluation.status for bot ${botId}: ${status}`);
  }

  async publishPositionOpened(payload: PositionPayload, storage?: any) {
    const message: WebSocketMessage = {
      type: 'position.opened',
      payload,
      timestamp: Date.now(),
    };

    let creatorId = this.botCreators.get(payload.botId);
    if (!creatorId && storage) {
      const bot = await storage.getBotById(payload.botId);
      if (bot) {
        creatorId = bot.creatorId;
        this.botCreators.set(payload.botId, creatorId);
      }
    }
    
    if (creatorId) {
      this.sendToUser(creatorId, message);
    }

    const subscribers = this.botSubscribers.get(payload.botId);
    if (subscribers) {
      subscribers.forEach((userId) => {
        if (userId !== creatorId) {
          this.sendToUser(userId, message);
        }
      });
    }

    console.log(`[WebSocket] Published position.opened for bot ${payload.botId}`);
  }

  async publishPositionClosed(payload: PositionPayload, storage?: any) {
    const message: WebSocketMessage = {
      type: 'position.closed',
      payload,
      timestamp: Date.now(),
    };

    let creatorId = this.botCreators.get(payload.botId);
    if (!creatorId && storage) {
      const bot = await storage.getBotById(payload.botId);
      if (bot) {
        creatorId = bot.creatorId;
        this.botCreators.set(payload.botId, creatorId);
      }
    }
    
    if (creatorId) {
      this.sendToUser(creatorId, message);
    }

    const subscribers = this.botSubscribers.get(payload.botId);
    if (subscribers) {
      subscribers.forEach((userId) => {
        if (userId !== creatorId) {
          this.sendToUser(userId, message);
        }
      });
    }

    console.log(`[WebSocket] Published position.closed for bot ${payload.botId}`);
  }

  publishSubscriptionUpdate(userId: string, botId: string, action: 'subscribed' | 'unsubscribed') {
    const message: WebSocketMessage = {
      type: 'subscription.update',
      payload: { botId, action },
      timestamp: Date.now(),
    };

    this.sendToUser(userId, message);

    if (action === 'subscribed') {
      this.addBotSubscriber(botId, userId);
    } else {
      this.removeBotSubscriber(botId, userId);
    }

    console.log(`[WebSocket] Published subscription.update for user ${userId}: ${action} bot ${botId}`);
  }

  registerCreatorBot(botId: string, creatorId: string) {
    this.botCreators.set(botId, creatorId);
    
    const sockets = this.userSockets.get(creatorId);
    if (sockets) {
      sockets.forEach((ws) => {
        ws.ownedBotIds.add(botId);
      });
    }
  }

  getConnectionCount(): number {
    return this.wss?.clients.size || 0;
  }

  shutdown() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.wss?.clients.forEach((ws) => {
      ws.close();
    });
    this.wss?.close();
    console.log('[WebSocket] WebSocket server shut down');
  }
}

export const wsManager = new WebSocketManager();
