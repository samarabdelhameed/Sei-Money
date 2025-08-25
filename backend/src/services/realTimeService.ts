import { EventEmitter } from 'events';
import { getEventIndexer, EventIndexer } from './eventIndexer';
import { getWebSocketService, WebSocketService } from './websocketService';
import { getPollingService, PollingService } from './pollingService';
import { ApplicationCache } from './cacheService';
import { logger } from '../lib/logger';

export interface RealTimeConfig {
  enableEventIndexing: boolean;
  enableWebSocket: boolean;
  enablePolling: boolean;
  webSocketPort: number;
  eventIndexerConfig?: any;
  pollingConfig?: any;
}

export interface SystemStatus {
  eventIndexer: {
    running: boolean;
    currentBlock: number;
    queueSize: number;
    processedCount: number;
  };
  webSocket: {
    running: boolean;
    connectedClients: number;
    port: number;
  };
  polling: {
    running: boolean;
    totalTasks: number;
    enabledTasks: number;
    runningTasks: number;
  };
  cache: {
    totalCaches: number;
    totalEntries: number;
    hitRate: number;
  };
}

export class RealTimeService extends EventEmitter {
  private config: RealTimeConfig;
  private eventIndexer: EventIndexer;
  private webSocketService: WebSocketService;
  private pollingService: PollingService;
  private isInitialized: boolean = false;
  private isRunning: boolean = false;

  constructor(config: Partial<RealTimeConfig> = {}) {
    super();
    
    this.config = {
      enableEventIndexing: true,
      enableWebSocket: true,
      enablePolling: true,
      webSocketPort: 8081,
      ...config
    };

    // Initialize services
    this.eventIndexer = getEventIndexer(this.config.eventIndexerConfig);
    this.webSocketService = getWebSocketService();
    this.pollingService = getPollingService();

    this.setupEventListeners();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Real-time service is already initialized');
      return;
    }

    try {
      logger.info('Initializing real-time service...');

      // Initialize event indexer
      if (this.config.enableEventIndexing) {
        await this.eventIndexer.initialize();
        logger.info('Event indexer initialized');
      }

      // Initialize WebSocket service
      if (this.config.enableWebSocket) {
        this.webSocketService.initialize(this.config.webSocketPort);
        logger.info(`WebSocket service initialized on port ${this.config.webSocketPort}`);
      }

      // Polling service doesn't need initialization
      if (this.config.enablePolling) {
        logger.info('Polling service ready');
      }

      this.isInitialized = true;
      logger.info('Real-time service initialized successfully');
      this.emit('initialized');

    } catch (error) {
      logger.error('Failed to initialize real-time service:', error);
      throw error;
    }
  }

  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.isRunning) {
      logger.warn('Real-time service is already running');
      return;
    }

    try {
      logger.info('Starting real-time service...');

      // Start event indexer
      if (this.config.enableEventIndexing) {
        await this.eventIndexer.start();
        logger.info('Event indexer started');
      }

      // WebSocket service starts automatically on initialize
      
      // Start polling service
      if (this.config.enablePolling) {
        this.pollingService.start();
        logger.info('Polling service started');
      }

      this.isRunning = true;
      logger.info('Real-time service started successfully');
      this.emit('started');

    } catch (error) {
      logger.error('Failed to start real-time service:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      logger.info('Stopping real-time service...');

      // Stop event indexer
      if (this.config.enableEventIndexing) {
        await this.eventIndexer.stop();
        logger.info('Event indexer stopped');
      }

      // Stop polling service
      if (this.config.enablePolling) {
        this.pollingService.stop();
        logger.info('Polling service stopped');
      }

      // WebSocket service shutdown
      if (this.config.enableWebSocket) {
        this.webSocketService.shutdown();
        logger.info('WebSocket service stopped');
      }

      this.isRunning = false;
      logger.info('Real-time service stopped');
      this.emit('stopped');

    } catch (error) {
      logger.error('Error stopping real-time service:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    // Event indexer events
    this.eventIndexer.on('started', () => {
      this.emit('component_started', 'event_indexer');
    });

    this.eventIndexer.on('stopped', () => {
      this.emit('component_stopped', 'event_indexer');
    });

    this.eventIndexer.on('event', (event) => {
      this.handleBlockchainEvent(event);
    });

    this.eventIndexer.on('cache_invalidate', (cacheKey) => {
      this.handleCacheInvalidation(cacheKey);
    });

    // Polling service events
    this.pollingService.on('started', () => {
      this.emit('component_started', 'polling_service');
    });

    this.pollingService.on('stopped', () => {
      this.emit('component_stopped', 'polling_service');
    });

    this.pollingService.on('task_completed', (taskId, result, duration) => {
      this.emit('polling_task_completed', { taskId, result, duration });
    });

    this.pollingService.on('task_error', (taskId, error, duration) => {
      this.emit('polling_task_error', { taskId, error, duration });
      logger.error(`Polling task error (${taskId}):`, error);
    });

    this.pollingService.on('task_failed', (taskId, error) => {
      this.emit('polling_task_failed', { taskId, error });
      logger.error(`Polling task failed permanently (${taskId}):`, error);
    });

    this.pollingService.on('health_check', (stats) => {
      this.emit('polling_health_check', stats);
    });
  }

  private async handleBlockchainEvent(event: any): Promise<void> {
    try {
      logger.debug(`Processing blockchain event: ${event.type}`);

      // Invalidate relevant caches
      await this.invalidateCachesForEvent(event);

      // Broadcast to WebSocket clients
      if (this.config.enableWebSocket) {
        await this.webSocketService.broadcastToChannel('blockchain_events', event);
      }

      // Emit for other services
      this.emit('blockchain_event', event);

    } catch (error) {
      logger.error('Error handling blockchain event:', error);
    }
  }

  private async handleCacheInvalidation(cacheKey: string): Promise<void> {
    try {
      logger.debug(`Handling cache invalidation: ${cacheKey}`);

      // Get appropriate cache and invalidate
      const cacheMap: Record<string, any> = {
        'market_stats': ApplicationCache.getMarketDataCache(),
        'user_portfolio': ApplicationCache.getUserDataCache(),
        'transfers': ApplicationCache.getUserDataCache(),
        'groups': ApplicationCache.getContractDataCache(),
        'pots': ApplicationCache.getContractDataCache(),
        'vaults': ApplicationCache.getContractDataCache(),
        'vault_performance': ApplicationCache.getContractDataCache()
      };

      const cache = cacheMap[cacheKey];
      if (cache) {
        cache.invalidateByTag(cacheKey);
      }

      // Notify WebSocket clients about data changes
      if (this.config.enableWebSocket) {
        await this.webSocketService.broadcastToChannel(cacheKey, {
          type: 'cache_invalidated',
          cacheKey,
          timestamp: new Date().toISOString()
        });
      }

      this.emit('cache_invalidated', cacheKey);

    } catch (error) {
      logger.error(`Error handling cache invalidation for ${cacheKey}:`, error);
    }
  }

  private async invalidateCachesForEvent(event: any): Promise<void> {
    const eventTypeToCacheMap: Record<string, string[]> = {
      'transfer_created': ['transfers', 'user_portfolio', 'market_stats'],
      'transfer_claimed': ['transfers', 'user_portfolio', 'market_stats'],
      'transfer_refunded': ['transfers', 'user_portfolio', 'market_stats'],
      'group_created': ['groups', 'market_stats'],
      'group_contributed': ['groups', 'user_portfolio', 'market_stats'],
      'group_distributed': ['groups', 'user_portfolio', 'market_stats'],
      'pot_created': ['pots', 'user_portfolio'],
      'pot_deposited': ['pots', 'user_portfolio', 'market_stats'],
      'pot_withdrawn': ['pots', 'user_portfolio', 'market_stats'],
      'vault_deposited': ['vaults', 'vault_performance', 'user_portfolio', 'market_stats'],
      'vault_withdrawn': ['vaults', 'vault_performance', 'user_portfolio', 'market_stats'],
      'vault_harvested': ['vaults', 'vault_performance', 'market_stats']
    };

    const cachesToInvalidate = eventTypeToCacheMap[event.type] || [];
    
    for (const cacheKey of cachesToInvalidate) {
      await this.handleCacheInvalidation(cacheKey);
    }
  }

  // Public API methods
  getSystemStatus(): SystemStatus {
    const eventIndexerStats = this.eventIndexer.getStats();
    const pollingStats = this.pollingService.getTaskStats();
    const caches = ApplicationCache.getAllCaches();

    let totalEntries = 0;
    let totalHits = 0;
    let totalMisses = 0;

    for (const cache of caches.values()) {
      const stats = cache.getStats();
      totalEntries += stats.totalEntries;
      totalHits += stats.totalHits;
      totalMisses += stats.totalMisses;
    }

    const hitRate = totalHits + totalMisses > 0 ? totalHits / (totalHits + totalMisses) : 0;

    return {
      eventIndexer: {
        running: this.eventIndexer.getStats().isRunning,
        currentBlock: eventIndexerStats.currentBlock,
        queueSize: eventIndexerStats.queueSize,
        processedCount: eventIndexerStats.processedCount
      },
      webSocket: {
        running: this.isRunning && this.config.enableWebSocket,
        connectedClients: this.webSocketService.getConnectedClients(),
        port: this.config.webSocketPort
      },
      polling: {
        running: this.isRunning && this.config.enablePolling,
        totalTasks: Object.keys(pollingStats).length,
        enabledTasks: Object.values(pollingStats).filter((task: any) => task.enabled).length,
        runningTasks: Object.values(pollingStats).filter((task: any) => task.isRunning).length
      },
      cache: {
        totalCaches: caches.size,
        totalEntries,
        hitRate
      }
    };
  }

  async refreshAllData(): Promise<void> {
    logger.info('Refreshing all real-time data...');

    try {
      // Clear all caches
      ApplicationCache.clearAllCaches();

      // Run all polling tasks immediately
      const pollingStats = this.pollingService.getTaskStats();
      const tasks = Object.keys(pollingStats);

      for (const taskId of tasks) {
        try {
          await this.pollingService.runTaskNow(taskId);
        } catch (error) {
          logger.error(`Error running task ${taskId}:`, error);
        }
      }

      // Broadcast refresh notification
      if (this.config.enableWebSocket) {
        await this.webSocketService.broadcastToChannel('system', {
          type: 'data_refreshed',
          timestamp: new Date().toISOString()
        });
      }

      logger.info('All real-time data refreshed');
      this.emit('data_refreshed');

    } catch (error) {
      logger.error('Error refreshing all data:', error);
      throw error;
    }
  }

  // Service access methods
  getEventIndexer(): EventIndexer {
    return this.eventIndexer;
  }

  getWebSocketService(): WebSocketService {
    return this.webSocketService;
  }

  getPollingService(): PollingService {
    return this.pollingService;
  }

  // Configuration methods
  updateConfig(newConfig: Partial<RealTimeConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Real-time service configuration updated');
    this.emit('config_updated', this.config);
  }

  getConfig(): RealTimeConfig {
    return { ...this.config };
  }

  // Health check
  async healthCheck(): Promise<{
    healthy: boolean;
    services: Record<string, boolean>;
    details: SystemStatus;
  }> {
    const status = this.getSystemStatus();
    
    const services = {
      eventIndexer: this.config.enableEventIndexing ? status.eventIndexer.running : true,
      webSocket: this.config.enableWebSocket ? status.webSocket.running : true,
      polling: this.config.enablePolling ? status.polling.running : true
    };

    const healthy = Object.values(services).every(s => s);

    return {
      healthy,
      services,
      details: status
    };
  }

  shutdown(): void {
    this.stop().then(() => {
      ApplicationCache.shutdownAllCaches();
      logger.info('Real-time service shut down completely');
    }).catch(error => {
      logger.error('Error during shutdown:', error);
    });
  }
}

// Singleton instance
let realTimeServiceInstance: RealTimeService | null = null;

export function getRealTimeService(config?: Partial<RealTimeConfig>): RealTimeService {
  if (!realTimeServiceInstance) {
    realTimeServiceInstance = new RealTimeService(config);
  }
  return realTimeServiceInstance;
}