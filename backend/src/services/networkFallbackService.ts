import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { logger } from '../lib/logger';
import { BlockchainErrorHandler, UserFriendlyError } from '../lib/blockchain-error-handler';

export interface NetworkEndpoint {
  url: string;
  priority: number;
  isHealthy: boolean;
  lastChecked: Date;
  responseTime?: number;
}

export interface FallbackConfig {
  healthCheckInterval: number;
  maxResponseTime: number;
  retryAttempts: number;
  circuitBreakerThreshold: number;
}

export class NetworkFallbackService {
  private endpoints: NetworkEndpoint[] = [];

  private healthCheckTimer?: NodeJS.Timeout;
  private circuitBreakerCounts = new Map<string, number>();

  private readonly config: FallbackConfig = {
    healthCheckInterval: 30000, // 30 seconds
    maxResponseTime: 5000, // 5 seconds
    retryAttempts: 3,
    circuitBreakerThreshold: 5
  };

  constructor(endpoints: string[]) {
    this.endpoints = endpoints.map((url, index) => ({
      url,
      priority: index,
      isHealthy: true,
      lastChecked: new Date()
    }));

    this.startHealthChecking();
  }

  /**
   * Get the best available endpoint
   */
  getCurrentEndpoint(): NetworkEndpoint {
    // Find the first healthy endpoint with highest priority
    const healthyEndpoint = this.endpoints
      .filter(ep => ep.isHealthy)
      .sort((a, b) => a.priority - b.priority)[0];

    if (healthyEndpoint) {
      return healthyEndpoint;
    }

    // If no healthy endpoints, return the first one and log warning
    logger.warn('No healthy endpoints available, using first endpoint as fallback');
    if (this.endpoints.length === 0) {
      throw new Error('No endpoints configured');
    }
    return this.endpoints[0];
  }

  /**
   * Create a CosmWasm client with fallback support
   */
  async createClient(): Promise<CosmWasmClient> {
    const endpoint = this.getCurrentEndpoint();
    
    try {
      const client = await CosmWasmClient.connect(endpoint.url);
      this.markEndpointHealthy(endpoint.url);
      return client;
    } catch (error) {
      logger.error(`Failed to connect to endpoint ${endpoint.url}:`, error);
      this.markEndpointUnhealthy(endpoint.url);
      
      // Try next endpoint
      const nextEndpoint = this.getNextHealthyEndpoint(endpoint.url);
      if (nextEndpoint) {
        try {
          const client = await CosmWasmClient.connect(nextEndpoint.url);
          this.markEndpointHealthy(nextEndpoint.url);
          return client;
        } catch (fallbackError) {
          logger.error(`Fallback endpoint ${nextEndpoint.url} also failed:`, fallbackError);
          this.markEndpointUnhealthy(nextEndpoint.url);
        }
      }
      
      throw error;
    }
  }

  /**
   * Execute operation with automatic fallback
   */
  async executeWithFallback<T>(
    operation: (client: CosmWasmClient) => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: any;
    const attemptedEndpoints = new Set<string>();

    for (const endpoint of this.getOrderedEndpoints()) {
      if (attemptedEndpoints.has(endpoint.url)) {
        continue;
      }

      attemptedEndpoints.add(endpoint.url);

      // Check circuit breaker
      if (this.isCircuitBreakerOpen(endpoint.url)) {
        logger.warn(`Circuit breaker open for ${endpoint.url}, skipping`);
        continue;
      }

      try {
        const client = await CosmWasmClient.connect(endpoint.url);
        const startTime = Date.now();
        
        const result = await BlockchainErrorHandler.withRetry(
          () => operation(client),
          { maxRetries: 2 }
        );

        const responseTime = Date.now() - startTime;
        this.updateEndpointMetrics(endpoint.url, responseTime, true);
        
        return result;
      } catch (error) {
        lastError = error;
        this.updateEndpointMetrics(endpoint.url, 0, false);
        
        const userFriendlyError = BlockchainErrorHandler.categorizeError(error);
        
        logger.warn(`Operation failed on ${endpoint.url} in ${context}:`, {
          error: userFriendlyError.message,
          retryable: userFriendlyError.retryable,
          endpoint: endpoint.url
        });

        // If error is not retryable, don't try other endpoints
        if (!userFriendlyError.retryable) {
          throw error;
        }
      }
    }

    // All endpoints failed
    logger.error(`All endpoints failed for operation: ${context}`);
    throw lastError || new Error('All network endpoints are unavailable');
  }

  /**
   * Get endpoints ordered by health and priority
   */
  private getOrderedEndpoints(): NetworkEndpoint[] {
    return [...this.endpoints].sort((a, b) => {
      // Healthy endpoints first
      if (a.isHealthy && !b.isHealthy) return -1;
      if (!a.isHealthy && b.isHealthy) return 1;
      
      // Then by response time (faster first)
      if (a.responseTime && b.responseTime) {
        return a.responseTime - b.responseTime;
      }
      
      // Finally by priority
      return a.priority - b.priority;
    });
  }

  /**
   * Get next healthy endpoint after the given one
   */
  private getNextHealthyEndpoint(currentUrl: string): NetworkEndpoint | null {
    const currentIndex = this.endpoints.findIndex(ep => ep.url === currentUrl);
    
    for (let i = 1; i < this.endpoints.length; i++) {
      const nextIndex = (currentIndex + i) % this.endpoints.length;
      const endpoint = this.endpoints[nextIndex];
      
      if (endpoint && endpoint.isHealthy && !this.isCircuitBreakerOpen(endpoint.url)) {
        return endpoint;
      }
    }
    
    return null;
  }

  /**
   * Mark endpoint as healthy
   */
  private markEndpointHealthy(url: string): void {
    const endpoint = this.endpoints.find(ep => ep.url === url);
    if (endpoint) {
      endpoint.isHealthy = true;
      endpoint.lastChecked = new Date();
      this.circuitBreakerCounts.delete(url);
    }
  }

  /**
   * Mark endpoint as unhealthy
   */
  private markEndpointUnhealthy(url: string): void {
    const endpoint = this.endpoints.find(ep => ep.url === url);
    if (endpoint) {
      endpoint.isHealthy = false;
      endpoint.lastChecked = new Date();
      
      // Increment circuit breaker counter
      const currentCount = this.circuitBreakerCounts.get(url) || 0;
      this.circuitBreakerCounts.set(url, currentCount + 1);
    }
  }

  /**
   * Update endpoint metrics
   */
  private updateEndpointMetrics(url: string, responseTime: number, success: boolean): void {
    const endpoint = this.endpoints.find(ep => ep.url === url);
    if (endpoint) {
      endpoint.responseTime = responseTime;
      endpoint.lastChecked = new Date();
      
      if (success) {
        endpoint.isHealthy = true;
        this.circuitBreakerCounts.delete(url);
      } else {
        const currentCount = this.circuitBreakerCounts.get(url) || 0;
        this.circuitBreakerCounts.set(url, currentCount + 1);
        
        if (currentCount >= this.config.circuitBreakerThreshold) {
          endpoint.isHealthy = false;
        }
      }
    }
  }

  /**
   * Check if circuit breaker is open for endpoint
   */
  private isCircuitBreakerOpen(url: string): boolean {
    const failureCount = this.circuitBreakerCounts.get(url) || 0;
    return failureCount >= this.config.circuitBreakerThreshold;
  }

  /**
   * Start periodic health checking
   */
  private startHealthChecking(): void {
    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  /**
   * Perform health checks on all endpoints
   */
  private async performHealthChecks(): Promise<void> {
    const healthCheckPromises = this.endpoints.map(async (endpoint) => {
      try {
        const startTime = Date.now();
        const client = await CosmWasmClient.connect(endpoint.url);
        
        // Simple health check - get chain info
        await client.getChainId();
        
        const responseTime = Date.now() - startTime;
        
        if (responseTime <= this.config.maxResponseTime) {
          this.updateEndpointMetrics(endpoint.url, responseTime, true);
        } else {
          logger.warn(`Endpoint ${endpoint.url} response time too slow: ${responseTime}ms`);
          this.updateEndpointMetrics(endpoint.url, responseTime, false);
        }
      } catch (error) {
        logger.warn(`Health check failed for ${endpoint.url}:`, (error as Error).message);
        this.updateEndpointMetrics(endpoint.url, 0, false);
      }
    });

    await Promise.allSettled(healthCheckPromises);
    
    // Log current endpoint status
    const healthyCount = this.endpoints.filter(ep => ep.isHealthy).length;
    logger.info(`Network health check completed: ${healthyCount}/${this.endpoints.length} endpoints healthy`);
  }

  /**
   * Get network status for monitoring
   */
  getNetworkStatus(): {
    endpoints: NetworkEndpoint[];
    healthyCount: number;
    currentEndpoint: string;
    circuitBreakerStatus: Record<string, number>;
  } {
    return {
      endpoints: this.endpoints.map(ep => ({ ...ep })),
      healthyCount: this.endpoints.filter(ep => ep.isHealthy).length,
      currentEndpoint: this.getCurrentEndpoint().url,
      circuitBreakerStatus: Object.fromEntries(this.circuitBreakerCounts)
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined as any;
    }
  }
}

// Singleton instance for the application
export const networkFallbackService = new NetworkFallbackService([
  'https://rpc.atlantic-2.seinetwork.io:443',
  'https://sei-testnet-rpc.polkachu.com:443',
  'https://rpc-testnet.sei-apis.com:443'
]);