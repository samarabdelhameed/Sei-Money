import { ApiResponse } from '../../types';
import { webSocketService, BlockchainEvent } from './websocket-service';
import { blockchainService } from './blockchain-service';

// Sync Configuration
export interface SyncConfig {
  balanceRefreshInterval: number; // milliseconds
  contractRefreshInterval: number;
  maxRetries: number;
  retryDelay: number;
  enableRealTimeUpdates: boolean;
  priorityAddresses: string[];
  priorityContracts: string[];
}

export interface SyncStatus {
  isActive: boolean;
  lastSync: number;
  nextSync: number;
  errors: SyncError[];
  subscriptions: string[];
  performance: SyncPerformance;
}

export interface SyncError {
  type: 'balance' | 'contract' | 'websocket' | 'api';
  message: string;
  timestamp: number;
  retryCount: number;
  resolved: boolean;
}

export interface SyncPerformance {
  avgResponseTime: number;
  successRate: number;
  totalRequests: number;
  failedRequests: number;
}

export interface DataUpdateCallback {
  (type: 'balance' | 'contract' | 'transaction', data: any): void;
}

export interface RealTimeSyncService {
  // Core sync operations
  startSync(config?: Partial<SyncConfig>): Promise<boolean>;
  stopSync(): void;
  pauseSync(): void;
  resumeSync(): void;
  
  // Configuration
  updateConfig(config: Partial<SyncConfig>): void;
  getConfig(): SyncConfig;
  
  // Status monitoring
  getStatus(): SyncStatus;
  getErrors(): SyncError[];
  clearErrors(): void;
  
  // Data refresh
  forceRefresh(type?: 'balance' | 'contract' | 'all'): Promise<void>;
  refreshAddress(address: string): Promise<void>;
  refreshContract(contractAddress: string): Promise<void>;
  
  // Subscription management
  subscribeToUpdates(callback: DataUpdateCallback): string;
  unsubscribeFromUpdates(subscriptionId: string): void;
  
  // Conflict resolution
  resolveDataConflict(type: string, localData: any, remoteData: any): any;
}

class RealTimeSyncServiceImpl implements RealTimeSyncService {
  private config: SyncConfig = {
    balanceRefreshInterval: 30000, // 30 seconds
    contractRefreshInterval: 60000, // 1 minute
    maxRetries: 3,
    retryDelay: 1000,
    enableRealTimeUpdates: true,
    priorityAddresses: [],
    priorityContracts: []
  };

  private status: SyncStatus = {
    isActive: false,
    lastSync: 0,
    nextSync: 0,
    errors: [],
    subscriptions: [],
    performance: {
      avgResponseTime: 0,
      successRate: 100,
      totalRequests: 0,
      failedRequests: 0
    }
  };

  private syncIntervals: Map<string, NodeJS.Timeout> = new Map();
  private updateCallbacks: Map<string, DataUpdateCallback> = new Map();
  private wsSubscriptions: string[] = [];
  private isRunning = false;
  private isPaused = false;

  // Cache for conflict resolution
  private dataCache: Map<string, { data: any; timestamp: number }> = new Map();

  async startSync(config?: Partial<SyncConfig>): Promise<boolean> {
    if (this.isRunning) {
      console.log('Sync service already running');
      return true;
    }

    // Update configuration
    if (config) {
      this.updateConfig(config);
    }

    try {
      // Connect to WebSocket if real-time updates are enabled
      if (this.config.enableRealTimeUpdates) {
        const connected = await webSocketService.connect();
        if (!connected) {
          throw new Error('Failed to connect to WebSocket');
        }
        this.setupWebSocketSubscriptions();
      }

      // Start sync intervals
      this.startSyncIntervals();
      
      this.isRunning = true;
      this.status.isActive = true;
      this.status.lastSync = Date.now();
      
      console.log('Real-time sync service started');
      return true;

    } catch (error) {
      this.addError('websocket', error instanceof Error ? error.message : 'Failed to start sync', 0);
      return false;
    }
  }

  stopSync(): void {
    if (!this.isRunning) {
      return;
    }

    // Clear all intervals
    for (const interval of this.syncIntervals.values()) {
      clearInterval(interval);
    }
    this.syncIntervals.clear();

    // Unsubscribe from WebSocket
    for (const subscriptionId of this.wsSubscriptions) {
      webSocketService.unsubscribe(subscriptionId);
    }
    this.wsSubscriptions = [];
    webSocketService.disconnect();

    this.isRunning = false;
    this.status.isActive = false;
    
    console.log('Real-time sync service stopped');
  }

  pauseSync(): void {
    if (!this.isRunning || this.isPaused) {
      return;
    }

    this.isPaused = true;
    
    // Clear intervals but keep WebSocket connections
    for (const interval of this.syncIntervals.values()) {
      clearInterval(interval);
    }
    this.syncIntervals.clear();
    
    console.log('Real-time sync service paused');
  }

  resumeSync(): void {
    if (!this.isRunning || !this.isPaused) {
      return;
    }

    this.isPaused = false;
    this.startSyncIntervals();
    
    console.log('Real-time sync service resumed');
  }

  updateConfig(config: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart sync with new configuration if running
    if (this.isRunning) {
      this.stopSync();
      this.startSync();
    }
  }

  getConfig(): SyncConfig {
    return { ...this.config };
  }

  getStatus(): SyncStatus {
    return {
      ...this.status,
      nextSync: this.calculateNextSync(),
      subscriptions: [...this.wsSubscriptions]
    };
  }

  getErrors(): SyncError[] {
    return [...this.status.errors];
  }

  clearErrors(): void {
    this.status.errors = [];
  }

  async forceRefresh(type: 'balance' | 'contract' | 'all' = 'all'): Promise<void> {
    if (type === 'balance' || type === 'all') {
      await this.refreshAllBalances();
    }
    
    if (type === 'contract' || type === 'all') {
      await this.refreshAllContracts();
    }
    
    this.status.lastSync = Date.now();
  }

  async refreshAddress(address: string): Promise<void> {
    try {
      const startTime = Date.now();
      const balance = await blockchainService.getBalance(address);
      
      if (balance.success) {
        this.updatePerformance(Date.now() - startTime, true);
        this.notifyCallbacks('balance', { address, balance: balance.data });
        this.updateCache(`balance_${address}`, balance.data);
      } else {
        this.updatePerformance(Date.now() - startTime, false);
        this.addError('balance', `Failed to refresh balance for ${address}`, 0);
      }
    } catch (error) {
      this.addError('balance', error instanceof Error ? error.message : 'Unknown error', 0);
    }
  }

  async refreshContract(contractAddress: string): Promise<void> {
    try {
      const startTime = Date.now();
      // This would call specific contract query methods based on contract type
      // For now, we'll use a generic approach
      
      this.updatePerformance(Date.now() - startTime, true);
      this.notifyCallbacks('contract', { contractAddress, updated: true });
      
    } catch (error) {
      this.addError('contract', error instanceof Error ? error.message : 'Unknown error', 0);
    }
  }

  subscribeToUpdates(callback: DataUpdateCallback): string {
    const subscriptionId = this.generateSubscriptionId();
    this.updateCallbacks.set(subscriptionId, callback);
    return subscriptionId;
  }

  unsubscribeFromUpdates(subscriptionId: string): void {
    this.updateCallbacks.delete(subscriptionId);
  }

  resolveDataConflict(type: string, localData: any, remoteData: any): any {
    // Simple conflict resolution strategy - prefer remote data if it's newer
    const cacheKey = `${type}_conflict_resolution`;
    const cached = this.dataCache.get(cacheKey);
    
    if (!cached || remoteData.timestamp > cached.timestamp) {
      this.updateCache(cacheKey, remoteData);
      return remoteData;
    }
    
    return localData;
  }

  // Private methods
  private startSyncIntervals(): void {
    // Balance sync interval
    const balanceInterval = setInterval(async () => {
      if (!this.isPaused) {
        await this.refreshAllBalances();
      }
    }, this.config.balanceRefreshInterval);
    
    this.syncIntervals.set('balance', balanceInterval);

    // Contract sync interval
    const contractInterval = setInterval(async () => {
      if (!this.isPaused) {
        await this.refreshAllContracts();
      }
    }, this.config.contractRefreshInterval);
    
    this.syncIntervals.set('contract', contractInterval);
  }

  private setupWebSocketSubscriptions(): void {
    // Subscribe to priority addresses
    for (const address of this.config.priorityAddresses) {
      const subscriptionId = webSocketService.subscribeToBalance(address, (event) => {
        this.handleWebSocketEvent(event);
      });
      this.wsSubscriptions.push(subscriptionId);
    }

    // Subscribe to priority contracts
    for (const contractAddress of this.config.priorityContracts) {
      const subscriptionId = webSocketService.subscribeToContract(contractAddress, (event) => {
        this.handleWebSocketEvent(event);
      });
      this.wsSubscriptions.push(subscriptionId);
    }

    // Subscribe to new blocks for general updates
    const blockSubscriptionId = webSocketService.subscribeToBlocks((event) => {
      this.handleWebSocketEvent(event);
    });
    this.wsSubscriptions.push(blockSubscriptionId);
  }

  private handleWebSocketEvent(event: BlockchainEvent): void {
    switch (event.type) {
      case 'balance_change':
        this.notifyCallbacks('balance', {
          address: event.address,
          change: event.data,
          timestamp: event.timestamp
        });
        break;
        
      case 'contract_event':
        this.notifyCallbacks('contract', {
          contractAddress: event.contractAddress,
          event: event.data,
          timestamp: event.timestamp
        });
        break;
        
      case 'transaction_confirmed':
        this.notifyCallbacks('transaction', {
          txHash: event.txHash,
          confirmation: event.data,
          timestamp: event.timestamp
        });
        break;
        
      case 'block_update':
        // Trigger refresh for priority data on new blocks
        this.refreshPriorityData();
        break;
    }
  }

  private async refreshAllBalances(): Promise<void> {
    const addresses = [...this.config.priorityAddresses];
    
    for (const address of addresses) {
      await this.refreshAddress(address);
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  private async refreshAllContracts(): Promise<void> {
    const contracts = [...this.config.priorityContracts];
    
    for (const contractAddress of contracts) {
      await this.refreshContract(contractAddress);
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  private async refreshPriorityData(): Promise<void> {
    // Refresh only the most critical data on block updates
    const priorityAddresses = this.config.priorityAddresses.slice(0, 3); // Top 3 priority
    const priorityContracts = this.config.priorityContracts.slice(0, 3);
    
    await Promise.all([
      ...priorityAddresses.map(address => this.refreshAddress(address)),
      ...priorityContracts.map(contract => this.refreshContract(contract))
    ]);
  }

  private notifyCallbacks(type: 'balance' | 'contract' | 'transaction', data: any): void {
    for (const callback of this.updateCallbacks.values()) {
      try {
        callback(type, data);
      } catch (error) {
        console.error('Error in sync callback:', error);
      }
    }
  }

  private addError(type: SyncError['type'], message: string, retryCount: number): void {
    const error: SyncError = {
      type,
      message,
      timestamp: Date.now(),
      retryCount,
      resolved: false
    };
    
    this.status.errors.push(error);
    
    // Keep only last 50 errors
    if (this.status.errors.length > 50) {
      this.status.errors = this.status.errors.slice(-50);
    }
  }

  private updatePerformance(responseTime: number, success: boolean): void {
    this.status.performance.totalRequests++;
    
    if (success) {
      // Update average response time
      const total = this.status.performance.avgResponseTime * (this.status.performance.totalRequests - 1);
      this.status.performance.avgResponseTime = (total + responseTime) / this.status.performance.totalRequests;
    } else {
      this.status.performance.failedRequests++;
    }
    
    // Update success rate
    this.status.performance.successRate = 
      ((this.status.performance.totalRequests - this.status.performance.failedRequests) / 
       this.status.performance.totalRequests) * 100;
  }

  private updateCache(key: string, data: any): void {
    this.dataCache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // Clean old cache entries (older than 1 hour)
    const oneHourAgo = Date.now() - 3600000;
    for (const [cacheKey, cacheData] of this.dataCache.entries()) {
      if (cacheData.timestamp < oneHourAgo) {
        this.dataCache.delete(cacheKey);
      }
    }
  }

  private calculateNextSync(): number {
    const now = Date.now();
    const nextBalance = this.status.lastSync + this.config.balanceRefreshInterval;
    const nextContract = this.status.lastSync + this.config.contractRefreshInterval;
    
    return Math.min(nextBalance, nextContract);
  }

  private generateSubscriptionId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const realTimeSyncService = new RealTimeSyncServiceImpl();
export default realTimeSyncService;