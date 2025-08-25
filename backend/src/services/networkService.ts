import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { NETWORK_CONFIG } from '../lib/sdk-enhanced-fixed';
import { logger } from '../lib/logger';

export interface NetworkHealth {
  chainId: string;
  blockHeight: number;
  blockTime: string;
  rpcEndpoints: RpcEndpointStatus[];
  averageLatency: number;
  healthy: boolean;
  lastChecked: string;
}

export interface RpcEndpointStatus {
  url: string;
  status: 'healthy' | 'unhealthy' | 'slow';
  latency?: number;
  blockHeight?: number;
  error?: string;
  lastChecked: string;
}

export interface NetworkMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  uptime: number;
  lastReset: string;
}

export class NetworkService {
  private rpcEndpoints = [
    NETWORK_CONFIG.RPC_URL,
    "https://rpc.atlantic-2.seinetwork.io",
    "https://sei-testnet-rpc.polkachu.com",
    "https://sei-testnet-rpc.brocha.in",
  ];

  private metrics: NetworkMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    uptime: 100,
    lastReset: new Date().toISOString(),
  };

  private healthCache: { data: NetworkHealth; timestamp: number } | null = null;
  private readonly HEALTH_CACHE_TTL = 15000; // 15 seconds

  // Network status checking and health monitoring
  async getNetworkHealth(): Promise<NetworkHealth> {
    // Check cache first
    if (this.healthCache && Date.now() - this.healthCache.timestamp < this.HEALTH_CACHE_TTL) {
      return this.healthCache.data;
    }

    const endpointStatuses = await this.checkAllEndpoints();
    const healthyEndpoints = endpointStatuses.filter(ep => ep.status === 'healthy');
    
    if (healthyEndpoints.length === 0) {
      throw new Error('No healthy RPC endpoints available');
    }

    // Get the highest block height from healthy endpoints
    const maxBlockHeight = Math.max(...healthyEndpoints.map(ep => ep.blockHeight || 0));
    
    // Calculate average latency
    const latencies = healthyEndpoints.filter(ep => ep.latency).map(ep => ep.latency!);
    const averageLatency = latencies.length > 0 ? 
      latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length : 0;

    const networkHealth: NetworkHealth = {
      chainId: NETWORK_CONFIG.CHAIN_ID,
      blockHeight: maxBlockHeight,
      blockTime: new Date().toISOString(),
      rpcEndpoints: endpointStatuses,
      averageLatency,
      healthy: healthyEndpoints.length >= 2, // At least 2 healthy endpoints
      lastChecked: new Date().toISOString(),
    };

    // Cache the result
    this.healthCache = { data: networkHealth, timestamp: Date.now() };
    
    logger.info(`Network health updated: ${healthyEndpoints.length}/${endpointStatuses.length} endpoints healthy`);
    return networkHealth;
  }

  // Check individual RPC endpoint
  async checkEndpoint(url: string): Promise<RpcEndpointStatus> {
    const startTime = Date.now();
    
    try {
      this.metrics.totalRequests++;
      
      const client = await CosmWasmClient.connect(url);
      const blockHeight = await client.getHeight();
      const latency = Date.now() - startTime;
      
      this.metrics.successfulRequests++;
      this.updateAverageResponseTime(latency);
      
      // Determine status based on latency
      let status: 'healthy' | 'slow' = 'healthy';
      if (latency > 5000) { // 5 seconds
        status = 'slow';
      }
      
      return {
        url,
        status,
        latency,
        blockHeight,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      this.metrics.failedRequests++;
      
      return {
        url,
        status: 'unhealthy',
        error: (error as Error).message,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  // Check all RPC endpoints
  async checkAllEndpoints(): Promise<RpcEndpointStatus[]> {
    const promises = this.rpcEndpoints.map(url => this.checkEndpoint(url));
    return Promise.all(promises);
  }

  // Get the best available RPC endpoint
  async getBestEndpoint(): Promise<string> {
    const health = await this.getNetworkHealth();
    const healthyEndpoints = health.rpcEndpoints.filter(ep => ep.status === 'healthy');
    
    if (healthyEndpoints.length === 0) {
      throw new Error('No healthy RPC endpoints available');
    }
    
    // Sort by latency (lowest first)
    healthyEndpoints.sort((a, b) => (a.latency || Infinity) - (b.latency || Infinity));
    
    return healthyEndpoints[0].url;
  }

  // Monitor network continuously
  startNetworkMonitoring(intervalMs: number = 30000): () => void {
    let isMonitoring = true;
    
    const monitor = async () => {
      while (isMonitoring) {
        try {
          await this.getNetworkHealth();
          await new Promise(resolve => setTimeout(resolve, intervalMs));
        } catch (error) {
          logger.error('Network monitoring error:', error);
          await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
      }
    };
    
    // Start monitoring
    monitor();
    logger.info(`Network monitoring started with ${intervalMs}ms interval`);
    
    // Return stop function
    return () => {
      isMonitoring = false;
      logger.info('Network monitoring stopped');
    };
  }

  // Get network metrics
  getNetworkMetrics(): NetworkMetrics {
    // Calculate uptime percentage
    const uptime = this.metrics.totalRequests > 0 ? 
      (this.metrics.successfulRequests / this.metrics.totalRequests) * 100 : 100;
    
    return {
      ...this.metrics,
      uptime,
    };
  }

  // Reset metrics
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      uptime: 100,
      lastReset: new Date().toISOString(),
    };
    
    logger.info('Network metrics reset');
  }

  // Add custom RPC endpoint
  addRpcEndpoint(url: string): void {
    if (!this.rpcEndpoints.includes(url)) {
      this.rpcEndpoints.push(url);
      logger.info(`Added RPC endpoint: ${url}`);
    }
  }

  // Remove RPC endpoint
  removeRpcEndpoint(url: string): void {
    const index = this.rpcEndpoints.indexOf(url);
    if (index > -1) {
      this.rpcEndpoints.splice(index, 1);
      logger.info(`Removed RPC endpoint: ${url}`);
    }
  }

  // Get all configured endpoints
  getRpcEndpoints(): string[] {
    return [...this.rpcEndpoints];
  }

  // Test connection to specific endpoint
  async testConnection(url: string): Promise<{ success: boolean; latency?: number; error?: string }> {
    try {
      const startTime = Date.now();
      const client = await CosmWasmClient.connect(url);
      await client.getHeight();
      const latency = Date.now() - startTime;
      
      return { success: true, latency };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // Get network chain info
  async getChainInfo(): Promise<{
    chainId: string;
    blockHeight: number;
    blockTime: string;
    nodeVersion?: string;
  }> {
    const bestEndpoint = await this.getBestEndpoint();
    const client = await CosmWasmClient.connect(bestEndpoint);
    const blockHeight = await client.getHeight();
    
    return {
      chainId: NETWORK_CONFIG.CHAIN_ID,
      blockHeight,
      blockTime: new Date().toISOString(),
      nodeVersion: 'sei-testnet',
    };
  }

  // Clear cache
  clearCache(): void {
    this.healthCache = null;
    logger.info('Network service cache cleared');
  }

  // Private helper methods
  private updateAverageResponseTime(newLatency: number): void {
    if (this.metrics.successfulRequests === 1) {
      this.metrics.averageResponseTime = newLatency;
    } else {
      // Calculate running average
      const totalTime = this.metrics.averageResponseTime * (this.metrics.successfulRequests - 1);
      this.metrics.averageResponseTime = (totalTime + newLatency) / this.metrics.successfulRequests;
    }
  }
}

// Singleton instance
let networkServiceInstance: NetworkService | null = null;

export function getNetworkService(): NetworkService {
  if (!networkServiceInstance) {
    networkServiceInstance = new NetworkService();
    logger.info('NetworkService initialized');
  }
  
  return networkServiceInstance;
}