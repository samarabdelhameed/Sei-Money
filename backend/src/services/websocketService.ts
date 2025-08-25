import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { EventIndexer, getEventIndexer, BlockchainEvent } from './eventIndexer';
import { getMarketDataService } from './marketDataService';
import { getRealDataService } from './realDataService';
import { logger } from '../lib/logger';

export interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'event' | 'data_update' | 'error' | 'ping' | 'pong';
  channel?: string;
  data?: any;
  timestamp?: string;
  id?: string;
}

export interface WebSocketClient {
  id: string;
  ws: WebSocket;
  subscriptions: Set<string>;
  address?: string;
  lastPing: number;
}

export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, WebSocketClient> = new Map();
  private eventIndexer: EventIndexer;
  private pingInterval: NodeJS.Timeout | null = null;
  private dataRefreshInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.eventIndexer = getEventIndexer();
    this.setupEventListeners();
  }

  initialize(port: number = 8081): void {
    this.wss = new WebSocketServer({ 
      port,
      perMessageDeflate: false,
      clientTracking: true
    });

    this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      this.handleConnection(ws, request);
    });

    this.wss.on('error', (error) => {
      logger.error('WebSocket server error:', error);
    });

    // Start ping/pong mechanism
    this.startPingPong();

    // Start periodic data refresh
    this.startDataRefresh();

    logger.info(`WebSocket server started on port ${port}`);
  }

  private handleConnection(ws: WebSocket, request: IncomingMessage): void {
    const clientId = this.generateClientId();
    const client: WebSocketClient = {
      id: clientId,
      ws,
      subscriptions: new Set(),
      lastPing: Date.now()
    };

    this.clients.set(clientId, client);
    logger.info(`WebSocket client connected: ${clientId}`);

    // Send welcome message
    this.sendMessage(client, {
      type: 'event',
      channel: 'system',
      data: { message: 'Connected to SeiMoney WebSocket', clientId },
      timestamp: new Date().toISOString()
    });

    ws.on('message', (data: Buffer) => {
      this.handleMessage(client, data);
    });

    ws.on('close', (code: number, reason: Buffer) => {
      this.handleDisconnection(client, code, reason);
    });

    ws.on('error', (error: Error) => {
      logger.error(`WebSocket client error (${clientId}):`, error);
    });

    ws.on('pong', () => {
      client.lastPing = Date.now();
    });
  }

  private handleMessage(client: WebSocketClient, data: Buffer): void {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'subscribe':
          this.handleSubscribe(client, message);
          break;
        case 'unsubscribe':
          this.handleUnsubscribe(client, message);
          break;
        case 'ping':
          this.sendMessage(client, { type: 'pong', timestamp: new Date().toISOString() });
          break;
        default:
          logger.warn(`Unknown message type from ${client.id}:`, message.type);
      }
    } catch (error) {
      logger.error(`Error parsing message from ${client.id}:`, error);
      this.sendMessage(client, {
        type: 'error',
        data: { message: 'Invalid message format' },
        timestamp: new Date().toISOString()
      });
    }
  }

  private handleSubscribe(client: WebSocketClient, message: WebSocketMessage): void {
    const channel = message.channel;
    if (!channel) {
      this.sendMessage(client, {
        type: 'error',
        data: { message: 'Channel is required for subscription' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Validate channel
    const validChannels = [
      'market_stats',
      'transfers',
      'groups',
      'pots',
      'vaults',
      'user_portfolio',
      'blockchain_events',
      'system'
    ];

    if (!validChannels.includes(channel)) {
      this.sendMessage(client, {
        type: 'error',
        data: { message: `Invalid channel: ${channel}` },
        timestamp: new Date().toISOString()
      });
      return;
    }

    client.subscriptions.add(channel);
    
    // Store user address if provided
    if (message.data?.address) {
      client.address = message.data.address;
    }

    this.sendMessage(client, {
      type: 'event',
      channel: 'system',
      data: { message: `Subscribed to ${channel}` },
      timestamp: new Date().toISOString()
    });

    logger.info(`Client ${client.id} subscribed to ${channel}`);

    // Send initial data for the channel
    this.sendInitialData(client, channel);
  }

  private handleUnsubscribe(client: WebSocketClient, message: WebSocketMessage): void {
    const channel = message.channel;
    if (!channel) return;

    client.subscriptions.delete(channel);
    
    this.sendMessage(client, {
      type: 'event',
      channel: 'system',
      data: { message: `Unsubscribed from ${channel}` },
      timestamp: new Date().toISOString()
    });

    logger.info(`Client ${client.id} unsubscribed from ${channel}`);
  }

  private handleDisconnection(client: WebSocketClient, code: number, reason: Buffer): void {
    this.clients.delete(client.id);
    logger.info(`WebSocket client disconnected: ${client.id} (code: ${code})`);
  }

  private async sendInitialData(client: WebSocketClient, channel: string): Promise<void> {
    try {
      let data: any = null;

      switch (channel) {
        case 'market_stats':
          const marketDataService = await getMarketDataService();
          data = await marketDataService.getMarketStats();
          break;

        case 'transfers':
          if (client.address) {
            const realDataService = await getRealDataService();
            data = await realDataService.getUserTransfers(client.address);
          }
          break;

        case 'groups':
          const realDataService2 = await getRealDataService();
          data = await realDataService2.getGroups();
          break;

        case 'pots':
          if (client.address) {
            const realDataService3 = await getRealDataService();
            data = await realDataService3.getUserPots(client.address);
          }
          break;

        case 'vaults':
          const realDataService4 = await getRealDataService();
          data = await realDataService4.getVaults();
          break;

        case 'blockchain_events':
          data = await this.eventIndexer.getRecentEvents(20);
          break;
      }

      if (data) {
        this.sendMessage(client, {
          type: 'data_update',
          channel,
          data,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      logger.error(`Error sending initial data for ${channel}:`, error);
    }
  }

  private sendMessage(client: WebSocketClient, message: WebSocketMessage): void {
    if (client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify(message));
      } catch (error) {
        logger.error(`Error sending message to ${client.id}:`, error);
      }
    }
  }

  private broadcast(message: WebSocketMessage, channel?: string): void {
    for (const client of this.clients.values()) {
      if (!channel || client.subscriptions.has(channel)) {
        this.sendMessage(client, message);
      }
    }
  }

  private setupEventListeners(): void {
    // Listen for blockchain events
    this.eventIndexer.on('event', (event: BlockchainEvent) => {
      this.broadcast({
        type: 'event',
        channel: 'blockchain_events',
        data: event,
        timestamp: new Date().toISOString()
      }, 'blockchain_events');

      // Also broadcast to specific channels based on event type
      const channelMap: Record<string, string> = {
        'transfer_created': 'transfers',
        'transfer_claimed': 'transfers',
        'transfer_refunded': 'transfers',
        'group_created': 'groups',
        'group_contributed': 'groups',
        'group_distributed': 'groups',
        'pot_created': 'pots',
        'pot_deposited': 'pots',
        'pot_withdrawn': 'pots',
        'vault_deposited': 'vaults',
        'vault_withdrawn': 'vaults',
        'vault_harvested': 'vaults'
      };

      const targetChannel = channelMap[event.type];
      if (targetChannel) {
        this.broadcast({
          type: 'data_update',
          channel: targetChannel,
          data: { event, type: 'new_activity' },
          timestamp: new Date().toISOString()
        }, targetChannel);
      }
    });

    // Listen for cache invalidation events
    this.eventIndexer.on('cache_invalidate', (cacheKey: string) => {
      this.handleCacheInvalidation(cacheKey);
    });
  }

  private async handleCacheInvalidation(cacheKey: string): Promise<void> {
    try {
      // Refresh and broadcast updated data based on cache key
      switch (cacheKey) {
        case 'market_stats':
          const marketDataService = await getMarketDataService();
          const marketStats = await marketDataService.getMarketStats();
          this.broadcast({
            type: 'data_update',
            channel: 'market_stats',
            data: marketStats,
            timestamp: new Date().toISOString()
          }, 'market_stats');
          break;

        case 'transfers':
          // Notify clients that transfer data should be refreshed
          this.broadcast({
            type: 'data_update',
            channel: 'transfers',
            data: { type: 'refresh_required' },
            timestamp: new Date().toISOString()
          }, 'transfers');
          break;

        case 'groups':
          const realDataService = await getRealDataService();
          const groups = await realDataService.getGroups();
          this.broadcast({
            type: 'data_update',
            channel: 'groups',
            data: groups,
            timestamp: new Date().toISOString()
          }, 'groups');
          break;

        case 'vaults':
          const realDataService2 = await getRealDataService();
          const vaults = await realDataService2.getVaults();
          this.broadcast({
            type: 'data_update',
            channel: 'vaults',
            data: vaults,
            timestamp: new Date().toISOString()
          }, 'vaults');
          break;
      }
    } catch (error) {
      logger.error(`Error handling cache invalidation for ${cacheKey}:`, error);
    }
  }

  private startPingPong(): void {
    this.pingInterval = setInterval(() => {
      const now = Date.now();
      const timeout = 30000; // 30 seconds

      for (const [clientId, client] of this.clients.entries()) {
        if (now - client.lastPing > timeout) {
          logger.warn(`Client ${clientId} ping timeout, disconnecting`);
          client.ws.terminate();
          this.clients.delete(clientId);
        } else if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.ping();
        }
      }
    }, 15000); // Check every 15 seconds
  }

  private startDataRefresh(): void {
    this.dataRefreshInterval = setInterval(async () => {
      try {
        // Refresh market stats every 30 seconds
        const marketDataService = await getMarketDataService();
        const marketStats = await marketDataService.getMarketStats();
        
        this.broadcast({
          type: 'data_update',
          channel: 'market_stats',
          data: marketStats,
          timestamp: new Date().toISOString()
        }, 'market_stats');

      } catch (error) {
        logger.error('Error in periodic data refresh:', error);
      }
    }, 30000); // Every 30 seconds
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public methods
  getConnectedClients(): number {
    return this.clients.size;
  }

  getClientSubscriptions(): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    for (const [clientId, client] of this.clients.entries()) {
      result[clientId] = Array.from(client.subscriptions);
    }
    return result;
  }

  async broadcastToChannel(channel: string, data: any): Promise<void> {
    this.broadcast({
      type: 'data_update',
      channel,
      data,
      timestamp: new Date().toISOString()
    }, channel);
  }

  shutdown(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    if (this.dataRefreshInterval) {
      clearInterval(this.dataRefreshInterval);
    }

    if (this.wss) {
      this.wss.close();
    }

    logger.info('WebSocket service shut down');
  }
}

// Singleton instance
let webSocketServiceInstance: WebSocketService | null = null;

export function getWebSocketService(): WebSocketService {
  if (!webSocketServiceInstance) {
    webSocketServiceInstance = new WebSocketService();
  }
  return webSocketServiceInstance;
}