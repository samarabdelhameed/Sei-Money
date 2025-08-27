import { SeiMoneySDKEnhanced, getEnhancedSdk } from '../lib/sdk-enhanced-fixed';
import { logger } from '../lib/logger';
import { EventEmitter } from 'events';

export interface BlockchainEvent {
  id: string;
  type: 'transfer_created' | 'transfer_claimed' | 'transfer_refunded' | 
        'group_created' | 'group_contributed' | 'group_distributed' |
        'pot_created' | 'pot_deposited' | 'pot_withdrawn' |
        'vault_deposited' | 'vault_withdrawn' | 'vault_harvested';
  contractAddress: string;
  blockHeight: number;
  txHash: string;
  timestamp: string;
  data: any;
  processed: boolean;
}

export interface EventIndexerConfig {
  pollInterval: number; // milliseconds
  batchSize: number;
  maxRetries: number;
  startFromBlock?: number;
}

export class EventIndexer extends EventEmitter {
  private sdk!: SeiMoneySDKEnhanced;
  private config: EventIndexerConfig;
  private isRunning: boolean = false;
  private currentBlock: number = 0;
  private eventQueue: BlockchainEvent[] = [];
  private processedEvents: Set<string> = new Set();
  private pollTimer: NodeJS.Timeout | null = null;

  constructor(config: EventIndexerConfig) {
    super();
    this.config = {
      ...config,
      pollInterval: config.pollInterval || 5000,
      batchSize: config.batchSize || 100,
      maxRetries: config.maxRetries || 3
    };
  }

  async initialize(): Promise<void> {
    try {
      this.sdk = await getEnhancedSdk();
      
      // Get current block height
      const health = await this.sdk.healthCheck();
      this.currentBlock = this.config.startFromBlock || 0;
      
      logger.info(`Event indexer initialized at block ${this.currentBlock}`);
    } catch (error) {
      logger.error('Failed to initialize event indexer:', error);
      throw error;
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Event indexer is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting event indexer...');

    // Start polling for new events
    this.pollTimer = setInterval(() => {
      this.pollForEvents().catch(error => {
        logger.error('Error polling for events:', error);
      });
    }, this.config.pollInterval);

    // Process event queue
    this.processEventQueue();

    this.emit('started');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    logger.info('Event indexer stopped');
    this.emit('stopped');
  }

  private async pollForEvents(): Promise<void> {
    try {
      // Get latest block height from network
      const latestBlock = await this.getCurrentBlockHeight();
      
      if (latestBlock <= this.currentBlock) {
        return; // No new blocks
      }

      logger.debug(`Polling events from block ${this.currentBlock + 1} to ${latestBlock}`);

      // Process blocks in batches
      const fromBlock = this.currentBlock + 1;
      const toBlock = Math.min(fromBlock + this.config.batchSize - 1, latestBlock);

      await this.indexBlockRange(fromBlock, toBlock);
      
      this.currentBlock = toBlock;
      
    } catch (error) {
      logger.error('Error in pollForEvents:', error);
    }
  }

  private async getCurrentBlockHeight(): Promise<number> {
    try {
      // This is a simplified approach - in production you'd query the actual block height
      // For now, we'll simulate block progression
      return this.currentBlock + Math.floor(Math.random() * 3) + 1;
    } catch (error) {
      logger.error('Failed to get current block height:', error);
      return this.currentBlock;
    }
  }

  private async indexBlockRange(fromBlock: number, toBlock: number): Promise<void> {
    try {
      // Query all contracts for events in this block range
      const contracts = [
        { address: 'sei1kfpm92hs5gsmp84098wc3jpy2a440l50cq2ycsxlkpnlaygl9azqdhsygg', type: 'payments' },
        { address: 'sei1vq3ncyvf4k22lc0xhm7x6dtkn6jyxkexa2xy6uk2sj33dysnyy2syn73qt', type: 'groups' },
        { address: 'sei1c5d4flfqv3zjms0g894z82hnhv62h2vjr9hgd05c6xh456q8xjfq8f3qmj', type: 'pots' },
        { address: 'sei12k2yxf3cyec8p89qtgm5w30m4g2775tn7j8wx4jpuallygu45r9qs68u2h', type: 'vaults' }
      ];

      for (const contract of contracts) {
        await this.indexContractEvents(contract.address, contract.type, fromBlock, toBlock);
      }

    } catch (error) {
      logger.error(`Error indexing block range ${fromBlock}-${toBlock}:`, error);
    }
  }

  private async indexContractEvents(
    contractAddress: string, 
    contractType: string, 
    fromBlock: number, 
    toBlock: number
  ): Promise<void> {
    try {
      // Simulate event detection by querying contract state changes
      // In a real implementation, you'd parse transaction logs and events
      
      const events = await this.detectContractEvents(contractAddress, contractType, fromBlock, toBlock);
      
      for (const event of events) {
        if (!this.processedEvents.has(event.id)) {
          this.eventQueue.push(event);
          this.processedEvents.add(event.id);
          logger.debug(`Queued event: ${event.type} from ${contractType}`);
        }
      }

    } catch (error) {
      logger.error(`Error indexing events for ${contractType}:`, error);
    }
  }

  private async detectContractEvents(
    contractAddress: string, 
    contractType: string, 
    fromBlock: number, 
    toBlock: number
  ): Promise<BlockchainEvent[]> {
    const events: BlockchainEvent[] = [];

    try {
      switch (contractType) {
        case 'payments':
          const transfers = await this.sdk.listTransfersBySender(''); // Get all transfers
          for (const transfer of transfers.slice(0, 2)) { // Simulate new transfers
            events.push({
              id: `transfer_${transfer.id}_${Date.now()}`,
              type: 'transfer_created',
              contractAddress,
              blockHeight: fromBlock,
              txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
              timestamp: new Date().toISOString(),
              data: transfer,
              processed: false
            });
          }
          break;

        case 'groups':
          const groups = await this.sdk.listGroups();
          for (const group of groups.slice(0, 1)) { // Simulate new groups
            events.push({
              id: `group_${group.id}_${Date.now()}`,
              type: 'group_created',
              contractAddress,
              blockHeight: fromBlock,
              txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
              timestamp: new Date().toISOString(),
              data: group,
              processed: false
            });
          }
          break;

        case 'pots':
          const pots = await this.sdk.listAllPots();
          for (const pot of pots.slice(0, 1)) { // Simulate new pots
            events.push({
              id: `pot_${pot.id}_${Date.now()}`,
              type: 'pot_created',
              contractAddress,
              blockHeight: fromBlock,
              txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
              timestamp: new Date().toISOString(),
              data: pot,
              processed: false
            });
          }
          break;

        case 'vaults':
          const vaults = await this.sdk.listVaults();
          for (const vault of vaults.slice(0, 1)) { // Simulate vault activity
            events.push({
              id: `vault_${vault.id}_${Date.now()}`,
              type: 'vault_deposited',
              contractAddress,
              blockHeight: fromBlock,
              txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
              timestamp: new Date().toISOString(),
              data: vault,
              processed: false
            });
          }
          break;
      }
    } catch (error) {
      logger.error(`Error detecting events for ${contractType}:`, error);
    }

    return events;
  }

  private async processEventQueue(): Promise<void> {
    if (!this.isRunning) return;

    try {
      const batchSize = 10;
      const eventsToProcess = this.eventQueue.splice(0, batchSize);

      for (const event of eventsToProcess) {
        await this.processEvent(event);
      }

      if (eventsToProcess.length > 0) {
        logger.debug(`Processed ${eventsToProcess.length} events`);
      }

    } catch (error) {
      logger.error('Error processing event queue:', error);
    }

    // Schedule next processing
    setTimeout(() => {
      this.processEventQueue();
    }, 1000);
  }

  private async processEvent(event: BlockchainEvent): Promise<void> {
    try {
      // Emit event for real-time updates
      this.emit('event', event);

      // Store event in database (would be implemented with actual DB)
      await this.storeEvent(event);

      // Update cache based on event type
      await this.updateCacheForEvent(event);

      event.processed = true;
      logger.debug(`Processed event: ${event.type} - ${event.id}`);

    } catch (error) {
      logger.error(`Error processing event ${event.id}:`, error);
    }
  }

  private async storeEvent(event: BlockchainEvent): Promise<void> {
    // In a real implementation, this would store the event in a database
    // For now, we'll just log it
    logger.info(`Storing event: ${event.type} at block ${event.blockHeight}`);
  }

  private async updateCacheForEvent(event: BlockchainEvent): Promise<void> {
    // Update relevant caches based on event type
    switch (event.type) {
      case 'transfer_created':
      case 'transfer_claimed':
      case 'transfer_refunded':
        this.emit('cache_invalidate', 'transfers');
        this.emit('cache_invalidate', 'user_portfolio');
        break;

      case 'group_created':
      case 'group_contributed':
      case 'group_distributed':
        this.emit('cache_invalidate', 'groups');
        this.emit('cache_invalidate', 'market_stats');
        break;

      case 'pot_created':
      case 'pot_deposited':
      case 'pot_withdrawn':
        this.emit('cache_invalidate', 'pots');
        this.emit('cache_invalidate', 'user_portfolio');
        break;

      case 'vault_deposited':
      case 'vault_withdrawn':
      case 'vault_harvested':
        this.emit('cache_invalidate', 'vaults');
        this.emit('cache_invalidate', 'market_stats');
        this.emit('cache_invalidate', 'vault_performance');
        break;
    }
  }

  // Public methods for querying events
  async getEventsByType(eventType: string, limit: number = 100): Promise<BlockchainEvent[]> {
    // In a real implementation, this would query the database
    return this.eventQueue
      .filter(event => event.type === eventType)
      .slice(0, limit);
  }

  async getEventsByContract(contractAddress: string, limit: number = 100): Promise<BlockchainEvent[]> {
    return this.eventQueue
      .filter(event => event.contractAddress === contractAddress)
      .slice(0, limit);
  }

  async getRecentEvents(limit: number = 50): Promise<BlockchainEvent[]> {
    return this.eventQueue
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // Statistics
  getStats(): {
    currentBlock: number;
    queueSize: number;
    processedCount: number;
    isRunning: boolean;
  } {
    return {
      currentBlock: this.currentBlock,
      queueSize: this.eventQueue.length,
      processedCount: this.processedEvents.size,
      isRunning: this.isRunning
    };
  }
}

// Singleton instance
let eventIndexerInstance: EventIndexer | null = null;

export function getEventIndexer(config?: EventIndexerConfig): EventIndexer {
  if (!eventIndexerInstance) {
    eventIndexerInstance = new EventIndexer(config || {
      pollInterval: 5000,
      batchSize: 100,
      maxRetries: 3
    });
  }
  return eventIndexerInstance;
}