import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { Coin } from '@cosmjs/amino';
import { getEnhancedSdk } from '../lib/sdk-enhanced-fixed';
import { NETWORK_CONFIG } from '../lib/sdk-enhanced-fixed';
import { logger } from '../lib/logger';

export interface WalletBalance {
  address: string;
  balances: Coin[];
  totalValue: number;
  lastUpdated: string;
}

export interface NetworkStatus {
  chainId: string;
  latestBlockHeight: number;
  latestBlockTime: string;
  nodeInfo: {
    network: string;
    version: string;
  };
  healthy: boolean;
  rpcEndpoints: {
    url: string;
    status: 'healthy' | 'unhealthy';
    latency?: number;
  }[];
}

export class WalletService {
  private cache: Map<string, { data: WalletBalance; timestamp: number }> = new Map();
  private networkCache: { data: NetworkStatus; timestamp: number } | null = null;
  private readonly CACHE_TTL = 30000; // 30 seconds
  private readonly NETWORK_CACHE_TTL = 10000; // 10 seconds

  // Wallet balance service using CosmWasmClient.getBalance
  async getWalletBalance(address: string): Promise<WalletBalance> {
    // Check cache first
    const cacheKey = `balance:${address}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const sdk = await getEnhancedSdk();
      const balances = await sdk.getWalletBalance(address);
      
      // Calculate total value in SEI
      const totalValue = this.calculateTotalValue(balances);
      
      const walletBalance: WalletBalance = {
        address,
        balances,
        totalValue,
        lastUpdated: new Date().toISOString(),
      };

      // Cache the result
      this.cache.set(cacheKey, { data: walletBalance, timestamp: Date.now() });
      
      logger.info(`Retrieved balance for ${address}: ${totalValue} SEI`);
      return walletBalance;
    } catch (error) {
      logger.error(`Failed to get wallet balance for ${address}:`, error);
      throw new Error(`Failed to retrieve wallet balance: ${(error as Error).message}`);
    }
  }

  // Get balance for multiple addresses
  async getMultipleWalletBalances(addresses: string[]): Promise<WalletBalance[]> {
    const promises = addresses.map(address => 
      this.getWalletBalance(address).catch(error => {
        logger.warn(`Failed to get balance for ${address}:`, error);
        return {
          address,
          balances: [],
          totalValue: 0,
          lastUpdated: new Date().toISOString(),
        } as WalletBalance;
      })
    );

    return Promise.all(promises);
  }

  // Network status checking and health monitoring
  async getNetworkStatus(): Promise<NetworkStatus> {
    // Check cache first
    if (this.networkCache && Date.now() - this.networkCache.timestamp < this.NETWORK_CACHE_TTL) {
      return this.networkCache.data;
    }

    try {
      const sdk = await getEnhancedSdk();
      const health = await sdk.healthCheck();
      
      // Get network info from the first healthy RPC
      const rpcEndpoints = [
        NETWORK_CONFIG.RPC_URL,
        "https://rpc.atlantic-2.seinetwork.io",
        "https://sei-testnet-rpc.polkachu.com"
      ];

      const endpointStatuses = await Promise.all(
        rpcEndpoints.map(async (url) => {
          try {
            const startTime = Date.now();
            const client = await CosmWasmClient.connect(url);
            const height = await client.getHeight();
            const latency = Date.now() - startTime;
            
            return {
              url,
              status: 'healthy' as const,
              latency,
              height,
            };
          } catch (error) {
            return {
              url,
              status: 'unhealthy' as const,
              error: (error as Error).message,
            };
          }
        })
      );

      // Get the best endpoint info
      const healthyEndpoint = endpointStatuses.find(ep => ep.status === 'healthy');
      
      if (!healthyEndpoint) {
        throw new Error('No healthy RPC endpoints available');
      }

      const networkStatus: NetworkStatus = {
        chainId: NETWORK_CONFIG.CHAIN_ID,
        latestBlockHeight: healthyEndpoint.height || 0,
        latestBlockTime: new Date().toISOString(),
        nodeInfo: {
          network: NETWORK_CONFIG.CHAIN_ID,
          version: 'sei-testnet',
        },
        healthy: health.healthy,
        rpcEndpoints: endpointStatuses.map(ep => ({
          url: ep.url,
          status: ep.status,
          latency: ep.latency,
        })),
      };

      // Cache the result
      this.networkCache = { data: networkStatus, timestamp: Date.now() };
      
      logger.info(`Network status updated: Block ${networkStatus.latestBlockHeight}`);
      return networkStatus;
    } catch (error) {
      logger.error('Failed to get network status:', error);
      throw new Error(`Failed to retrieve network status: ${(error as Error).message}`);
    }
  }

  // Wallet address validation and format checking
  validateWalletAddress(address: string): { valid: boolean; error?: string } {
    try {
      // Sei addresses start with 'sei1' and are between 58-62 characters long
      const seiAddressRegex = /^sei1[a-z0-9]{58,62}$/;
      
      if (!address) {
        return { valid: false, error: 'Address is required' };
      }
      
      if (typeof address !== 'string') {
        return { valid: false, error: 'Address must be a string' };
      }
      
      if (!address.startsWith('sei1')) {
        return { valid: false, error: 'Address must start with "sei1"' };
      }
      
      if (!seiAddressRegex.test(address)) {
        return { valid: false, error: 'Invalid Sei address format' };
      }
      
      return { valid: true };
    } catch (error) {
      return { valid: false, error: `Validation error: ${(error as Error).message}` };
    }
  }

  // Batch validate multiple addresses
  validateMultipleAddresses(addresses: string[]): { address: string; valid: boolean; error?: string }[] {
    return addresses.map(address => ({
      address,
      ...this.validateWalletAddress(address),
    }));
  }

  // Caching layer for frequently accessed balance data
  getCacheStats(): { entries: number; hitRate: number } {
    return {
      entries: this.cache.size,
      hitRate: 0.85, // Placeholder - would need actual tracking
    };
  }

  clearCache(): void {
    this.cache.clear();
    this.networkCache = null;
    logger.info('Wallet service cache cleared');
  }

  // Get cached balance if available
  getCachedBalance(address: string): WalletBalance | null {
    const cached = this.cache.get(`balance:${address}`);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  // Health check for wallet service
  async healthCheck(): Promise<{
    healthy: boolean;
    networkStatus: boolean;
    cacheSize: number;
    lastNetworkUpdate?: string;
  }> {
    try {
      const networkStatus = await this.getNetworkStatus();
      
      return {
        healthy: networkStatus.healthy,
        networkStatus: networkStatus.healthy,
        cacheSize: this.cache.size,
        lastNetworkUpdate: networkStatus.latestBlockTime,
      };
    } catch (error) {
      logger.error('Wallet service health check failed:', error);
      return {
        healthy: false,
        networkStatus: false,
        cacheSize: this.cache.size,
      };
    }
  }

  // Private helper methods
  private calculateTotalValue(balances: Coin[]): number {
    const seiBalance = balances.find(coin => coin.denom === NETWORK_CONFIG.DENOM);
    if (!seiBalance) return 0;
    
    // Convert from usei to SEI (divide by 1,000,000)
    return parseFloat(seiBalance.amount) / 1000000;
  }

  // Get balance for specific denomination
  async getBalanceByDenom(address: string, denom: string): Promise<Coin | null> {
    const walletBalance = await this.getWalletBalance(address);
    return walletBalance.balances.find(coin => coin.denom === denom) || null;
  }

  // Monitor wallet for balance changes
  async monitorWallet(address: string, callback: (balance: WalletBalance) => void): Promise<() => void> {
    const validation = this.validateWalletAddress(address);
    if (!validation.valid) {
      throw new Error(`Invalid address: ${validation.error}`);
    }

    let isMonitoring = true;
    let lastBalance = '';

    const monitor = async () => {
      while (isMonitoring) {
        try {
          const balance = await this.getWalletBalance(address);
          const currentBalance = JSON.stringify(balance.balances);
          
          if (currentBalance !== lastBalance) {
            lastBalance = currentBalance;
            callback(balance);
          }
        } catch (error) {
          logger.error(`Error monitoring wallet ${address}:`, error);
        }
        
        // Wait 30 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    };

    // Start monitoring
    monitor();

    // Return stop function
    return () => {
      isMonitoring = false;
    };
  }
}

// Singleton instance
let walletServiceInstance: WalletService | null = null;

export function getWalletService(): WalletService {
  if (!walletServiceInstance) {
    walletServiceInstance = new WalletService();
    logger.info('WalletService initialized');
  }
  
  return walletServiceInstance;
}