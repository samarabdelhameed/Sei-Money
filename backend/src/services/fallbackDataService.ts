import { logger } from '../lib/logger';

export interface FallbackData {
  transfers: any[];
  vaults: any[];
  groups: any[];
  pots: any[];
  marketStats: any;
  userBalance: any[];
}

export interface FallbackConfig {
  enableFallback: boolean;
  fallbackTimeout: number;
  cacheTimeout: number;
  maxRetries: number;
}

export class FallbackDataService {
  private static fallbackCache = new Map<string, { data: any; timestamp: number }>();
  private static readonly DEFAULT_CONFIG: FallbackConfig = {
    enableFallback: true,
    fallbackTimeout: 5000, // 5 seconds
    cacheTimeout: 300000, // 5 minutes
    maxRetries: 3
  };

  /**
   * Get fallback data when real data is unavailable
   */
  static getFallbackData(dataType: keyof FallbackData): any {
    const cacheKey = `fallback_${dataType}`;
    const cached = this.fallbackCache.get(cacheKey);
    
    // Return cached fallback data if available and not expired
    if (cached && Date.now() - cached.timestamp < this.DEFAULT_CONFIG.cacheTimeout) {
      logger.info(`Returning cached fallback data for ${dataType}`);
      return cached.data;
    }

    // Generate new fallback data
    const fallbackData = this.generateFallbackData(dataType);
    this.fallbackCache.set(cacheKey, {
      data: fallbackData,
      timestamp: Date.now()
    });

    logger.warn(`Generated fallback data for ${dataType}`);
    return fallbackData;
  }

  /**
   * Generate appropriate fallback data based on type
   */
  private static generateFallbackData(dataType: keyof FallbackData): any {
    switch (dataType) {
      case 'transfers':
        return [];

      case 'vaults':
        return [
          {
            id: 'fallback-vault-1',
            label: 'Conservative Strategy',
            strategy: 'Low Risk',
            tvl: '0',
            apy: 0,
            feesBps: 100,
            status: 'unavailable',
            userPosition: null
          }
        ];

      case 'groups':
        return [];

      case 'pots':
        return [];

      case 'marketStats':
        return {
          totalTvl: 0,
          activeUsers: 0,
          totalTransactions: 0,
          successRate: 0,
          avgApy: 0,
          timestamp: new Date().toISOString(),
          status: 'unavailable'
        };

      case 'userBalance':
        return [];

      default:
        return null;
    }
  }

  /**
   * Execute operation with fallback support
   */
  static async withFallback<T>(
    operation: () => Promise<T>,
    fallbackDataType: keyof FallbackData,
    context: string
  ): Promise<T> {
    try {
      // Try the main operation with timeout
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Operation timeout')), this.DEFAULT_CONFIG.fallbackTimeout)
        )
      ]);

      // Cache successful result for future fallback use
      this.cacheFallbackData(fallbackDataType, result);
      return result;

    } catch (error) {
      logger.warn(`Operation failed in ${context}, using fallback data:`, error);
      
      if (this.DEFAULT_CONFIG.enableFallback) {
        return this.getFallbackData(fallbackDataType) as T;
      }
      
      throw error;
    }
  }

  /**
   * Cache successful data for future fallback use
   */
  private static cacheFallbackData(dataType: keyof FallbackData, data: any): void {
    // Only cache if data is valid and not empty
    if (data && (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0)) {
      const cacheKey = `success_${dataType}`;
      this.fallbackCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Get cached successful data as fallback
   */
  static getCachedSuccessData(dataType: keyof FallbackData): any | null {
    const cacheKey = `success_${dataType}`;
    const cached = this.fallbackCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.DEFAULT_CONFIG.cacheTimeout) {
      return cached.data;
    }
    
    return null;
  }

  /**
   * Check if fallback mode is active
   */
  static isFallbackActive(): boolean {
    return this.DEFAULT_CONFIG.enableFallback;
  }

  /**
   * Enable or disable fallback mode
   */
  static setFallbackMode(enabled: boolean): void {
    this.DEFAULT_CONFIG.enableFallback = enabled;
    logger.info(`Fallback mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Clear fallback cache
   */
  static clearCache(): void {
    this.fallbackCache.clear();
    logger.info('Fallback cache cleared');
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): {
    totalEntries: number;
    fallbackEntries: number;
    successEntries: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    const entries = Array.from(this.fallbackCache.entries());
    const fallbackEntries = entries.filter(([key]) => key.startsWith('fallback_'));
    const successEntries = entries.filter(([key]) => key.startsWith('success_'));
    
    const timestamps = entries.map(([, value]) => value.timestamp);
    
    return {
      totalEntries: entries.length,
      fallbackEntries: fallbackEntries.length,
      successEntries: successEntries.length,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : null
    };
  }
}

// UI State service for handling different error states
export class UIStateService {
  /**
   * Get UI state based on error type
   */
  static getUIState(errorType: string): {
    showRetryButton: boolean;
    showFallbackData: boolean;
    showErrorMessage: boolean;
    showLoadingSpinner: boolean;
    disableInteractions: boolean;
  } {
    const baseState = {
      showRetryButton: true,
      showFallbackData: false,
      showErrorMessage: true,
      showLoadingSpinner: false,
      disableInteractions: false
    };

    switch (errorType) {
      case 'NETWORK_TIMEOUT':
      case 'CONNECTION_REFUSED':
      case 'DNS_RESOLUTION_FAILED':
        return {
          ...baseState,
          showFallbackData: true,
          showRetryButton: true
        };

      case 'RATE_LIMITED':
        return {
          ...baseState,
          showRetryButton: false,
          showLoadingSpinner: true,
          disableInteractions: true
        };

      case 'INSUFFICIENT_FUNDS':
      case 'TRANSFER_EXPIRED':
      case 'TRANSFER_ALREADY_CLAIMED':
        return {
          ...baseState,
          showRetryButton: false,
          showFallbackData: false
        };

      case 'WALLET_NOT_FOUND':
      case 'WALLET_LOCKED':
      case 'CHAIN_NOT_FOUND':
        return {
          ...baseState,
          showFallbackData: false,
          disableInteractions: true
        };

      case 'USER_REJECTED':
        return {
          ...baseState,
          showErrorMessage: false,
          showFallbackData: false
        };

      default:
        return baseState;
    }
  }

  /**
   * Get loading state configuration
   */
  static getLoadingState(context: string): {
    message: string;
    showProgress: boolean;
    estimatedTime?: number;
  } {
    const loadingStates: Record<string, any> = {
      'wallet_connection': {
        message: 'Connecting to wallet...',
        showProgress: true,
        estimatedTime: 5
      },
      'transaction_signing': {
        message: 'Please sign the transaction in your wallet...',
        showProgress: false
      },
      'transaction_broadcasting': {
        message: 'Broadcasting transaction to network...',
        showProgress: true,
        estimatedTime: 10
      },
      'contract_query': {
        message: 'Loading data from blockchain...',
        showProgress: true,
        estimatedTime: 3
      },
      'balance_check': {
        message: 'Checking wallet balance...',
        showProgress: true,
        estimatedTime: 2
      }
    };

    return loadingStates[context] || {
      message: 'Loading...',
      showProgress: true,
      estimatedTime: 5
    };
  }

  /**
   * Get empty state configuration
   */
  static getEmptyState(dataType: string): {
    title: string;
    message: string;
    actionLabel?: string;
    actionUrl?: string;
  } {
    const emptyStates: Record<string, any> = {
      'transfers': {
        title: 'No Transfers Yet',
        message: 'You haven\'t sent or received any transfers. Create your first transfer to get started.',
        actionLabel: 'Create Transfer',
        actionUrl: '/payments/create'
      },
      'vaults': {
        title: 'No Vault Positions',
        message: 'You don\'t have any active vault positions. Deposit into a vault to start earning.',
        actionLabel: 'Browse Vaults',
        actionUrl: '/vaults'
      },
      'groups': {
        title: 'No Group Pools',
        message: 'You haven\'t joined any group pools yet. Join or create a pool to start saving together.',
        actionLabel: 'Browse Groups',
        actionUrl: '/groups'
      },
      'pots': {
        title: 'No Savings Pots',
        message: 'You don\'t have any savings pots. Create a pot to start saving towards your goals.',
        actionLabel: 'Create Pot',
        actionUrl: '/pots/create'
      }
    };

    return emptyStates[dataType] || {
      title: 'No Data Available',
      message: 'There\'s no data to display at the moment.'
    };
  }
}