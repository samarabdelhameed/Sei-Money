import { SeiMoneySDKEnhanced, getEnhancedSdk, BlockchainErrorHandler } from '../lib/sdk-enhanced-fixed';
import { MarketDataService, getMarketDataService } from './marketDataService';
import { logger } from '../lib/logger';
import { Coin } from '@cosmjs/amino';

export interface UserPortfolio {
  totalBalance: number;
  balanceByDenom: Record<string, string>;
  transfers: {
    sent: any[];
    received: any[];
    total: number;
  };
  pots: any[];
  alias?: string | undefined;
  lastUpdated: string;
}

export interface MarketStats {
  totalTvl: number;
  activeUsers: number;
  totalTransactions: number;
  successRate: number;
  avgApy: number;
  contractsHealth: Record<string, string>;
  timestamp: string;
}

export class RealDataService {
  private sdk: SeiMoneySDKEnhanced;
  private marketDataService: MarketDataService;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 30000; // 30 seconds

  constructor(sdk: SeiMoneySDKEnhanced, marketDataService: MarketDataService) {
    this.sdk = sdk;
    this.marketDataService = marketDataService;
  }

  // Cache management
  private getCacheKey(prefix: string, ...params: string[]): string {
    return `${prefix}:${params.join(':')}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as T;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  // User portfolio data
  async getUserPortfolio(address: string): Promise<UserPortfolio> {
    const cacheKey = this.getCacheKey('portfolio', address);
    const cached = this.getFromCache<UserPortfolio>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const userData = await this.sdk.getUserData(address);
      
      // Calculate total balance in SEI
      const totalBalance = this.calculateTotalBalance(userData.balance);
      
      // Create balance by denomination map
      const balanceByDenom: Record<string, string> = {};
      userData.balance.forEach(coin => {
        balanceByDenom[coin.denom] = coin.amount;
      });

      const portfolio: UserPortfolio = {
        totalBalance,
        balanceByDenom,
        transfers: {
          sent: userData.transfers.sent,
          received: userData.transfers.received,
          total: userData.transfers.sent.length + userData.transfers.received.length,
        },
        pots: userData.pots,
        alias: userData.alias || undefined,
        lastUpdated: new Date().toISOString(),
      };

      this.setCache(cacheKey, portfolio);
      return portfolio;
    } catch (error) {
      logger.error('Error fetching user portfolio:', error);
      throw BlockchainErrorHandler.handleContractError(error);
    }
  }

  // Market statistics - delegate to MarketDataService
  async getMarketStats(): Promise<MarketStats> {
    try {
      return await this.marketDataService.getMarketStats();
    } catch (error) {
      logger.error('Error fetching market stats:', error);
      throw BlockchainErrorHandler.handleContractError(error);
    }
  }

  // Transfer operations
  async getUserTransfers(address: string): Promise<any[]> {
    const cacheKey = this.getCacheKey('transfers', address);
    const cached = this.getFromCache<any[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const [sent, received] = await Promise.all([
        this.sdk.listTransfersBySender(address),
        this.sdk.listTransfersByRecipient(address),
      ]);

      // Combine and sort transfers by timestamp
      const allTransfers = [
        ...sent.map(t => ({ ...t, type: 'sent' })),
        ...received.map(t => ({ ...t, type: 'received' })),
      ].sort((a, b) => {
        const timeA = new Date(a.created_at || a.timestamp || 0).getTime();
        const timeB = new Date(b.created_at || b.timestamp || 0).getTime();
        return timeB - timeA; // Most recent first
      });

      this.setCache(cacheKey, allTransfers);
      return allTransfers;
    } catch (error) {
      logger.error('Error fetching user transfers:', error);
      throw BlockchainErrorHandler.handleContractError(error);
    }
  }

  // Vault operations
  async getVaults(): Promise<any[]> {
    const cacheKey = this.getCacheKey('vaults');
    const cached = this.getFromCache<any[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const vaults = await this.sdk.listVaults();
      
      // Enhance vaults with calculated data
      const enhancedVaults = await Promise.all(vaults.map(async (vault) => {
        try {
          const performance = await this.sdk.getVaultPerformance(vault.id);
          return {
            ...vault,
            performance,
            tvlFormatted: this.formatAmount(vault.tvl || '0'),
            aprFormatted: `${(vault.apr || 0).toFixed(2)}%`,
            lastUpdated: new Date().toISOString(),
          };
        } catch (error) {
          logger.warn(`Failed to get performance for vault ${vault.id}:`, error);
          return {
            ...vault,
            tvlFormatted: this.formatAmount(vault.tvl || '0'),
            aprFormatted: `${(vault.apr || 0).toFixed(2)}%`,
            lastUpdated: new Date().toISOString(),
          };
        }
      }));
      
      this.setCache(cacheKey, enhancedVaults);
      return enhancedVaults;
    } catch (error) {
      logger.error('Error fetching vaults:', error);
      throw BlockchainErrorHandler.handleContractError(error);
    }
  }

  async getVault(vaultId: string): Promise<any> {
    const cacheKey = this.getCacheKey('vault', vaultId);
    const cached = this.getFromCache<any>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const vault = await this.sdk.getVault(vaultId);
      if (!vault) {
        return null;
      }

      // Enhance vault with performance data
      try {
        const performance = await this.sdk.getVaultPerformance(vaultId);
        const enhancedVault = {
          ...vault,
          performance,
          tvlFormatted: this.formatAmount(vault.tvl || '0'),
          aprFormatted: `${(vault.apr || 0).toFixed(2)}%`,
          lastUpdated: new Date().toISOString(),
        };
        
        this.setCache(cacheKey, enhancedVault);
        return enhancedVault;
      } catch (error) {
        logger.warn(`Failed to get performance for vault ${vaultId}:`, error);
        const enhancedVault = {
          ...vault,
          tvlFormatted: this.formatAmount(vault.tvl || '0'),
          aprFormatted: `${(vault.apr || 0).toFixed(2)}%`,
          lastUpdated: new Date().toISOString(),
        };
        
        this.setCache(cacheKey, enhancedVault);
        return enhancedVault;
      }
    } catch (error) {
      logger.error(`Error fetching vault ${vaultId}:`, error);
      throw BlockchainErrorHandler.handleContractError(error);
    }
  }

  async getUserVaultPositions(address: string): Promise<any[]> {
    const cacheKey = this.getCacheKey('user-vault-positions', address);
    const cached = this.getFromCache<any[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const positions = await this.sdk.getUserVaultPositions(address);
      
      // Enhance positions with vault details and calculated values
      const enhancedPositions = await Promise.all(positions.map(async (position) => {
        try {
          const vault = await this.sdk.getVault(position.vault_id);
          const shareValue = this.calculateShareValue(position.shares, vault);
          
          return {
            ...position,
            vault,
            shareValue,
            shareValueFormatted: this.formatAmount(shareValue.toString()),
            sharesFormatted: this.formatAmount(position.shares || '0'),
            percentage: this.calculateSharePercentage(position.shares, vault?.total_shares),
            lastUpdated: new Date().toISOString(),
          };
        } catch (error) {
          logger.warn(`Failed to enhance position for vault ${position.vault_id}:`, error);
          return {
            ...position,
            shareValue: 0,
            shareValueFormatted: '0 SEI',
            sharesFormatted: this.formatAmount(position.shares || '0'),
            percentage: 0,
            lastUpdated: new Date().toISOString(),
          };
        }
      }));
      
      this.setCache(cacheKey, enhancedPositions);
      return enhancedPositions;
    } catch (error) {
      logger.error(`Error fetching user vault positions for ${address}:`, error);
      throw BlockchainErrorHandler.handleContractError(error);
    }
  }

  async getUserVaultPosition(vaultId: string, address: string): Promise<any> {
    const cacheKey = this.getCacheKey('user-vault-position', vaultId, address);
    const cached = this.getFromCache<any>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const position = await this.sdk.getUserVaultPosition(vaultId, address);
      if (!position) {
        return null;
      }

      // Enhance position with vault details
      const vault = await this.sdk.getVault(vaultId);
      const shareValue = this.calculateShareValue(position.shares, vault);
      
      const enhancedPosition = {
        ...position,
        vault,
        shareValue,
        shareValueFormatted: this.formatAmount(shareValue.toString()),
        sharesFormatted: this.formatAmount(position.shares || '0'),
        percentage: this.calculateSharePercentage(position.shares, vault?.total_shares),
        lastUpdated: new Date().toISOString(),
      };
      
      this.setCache(cacheKey, enhancedPosition);
      return enhancedPosition;
    } catch (error) {
      logger.error(`Error fetching user position for vault ${vaultId}, address ${address}:`, error);
      throw BlockchainErrorHandler.handleContractError(error);
    }
  }

  // Group operations
  async getGroups(): Promise<any[]> {
    const cacheKey = this.getCacheKey('groups');
    const cached = this.getFromCache<any[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const groups = await this.sdk.listGroups();
      this.setCache(cacheKey, groups);
      return groups;
    } catch (error) {
      logger.error('Error fetching groups:', error);
      throw BlockchainErrorHandler.handleContractError(error);
    }
  }

  // Pot operations
  async getPots(): Promise<any[]> {
    const cacheKey = this.getCacheKey('pots');
    const cached = this.getFromCache<any[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const pots = await this.sdk.listAllPots();
      this.setCache(cacheKey, pots);
      return pots;
    } catch (error) {
      logger.error('Error fetching pots:', error);
      throw BlockchainErrorHandler.handleContractError(error);
    }
  }

  async getUserPots(address: string): Promise<any[]> {
    const cacheKey = this.getCacheKey('user-pots', address);
    const cached = this.getFromCache<any[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const pots = await this.sdk.listPotsByOwner(address);
      this.setCache(cacheKey, pots);
      return pots;
    } catch (error) {
      logger.error('Error fetching user pots:', error);
      throw BlockchainErrorHandler.handleContractError(error);
    }
  }

  // Health check
  async getSystemHealth(): Promise<{
    healthy: boolean;
    contracts: Record<string, string>;
    rpcHealth: { healthy: number; total: number };
    cacheStats: { entries: number; hitRate: number };
  }> {
    try {
      const health = await this.sdk.healthCheck();
      
      return {
        ...health,
        cacheStats: {
          entries: this.cache.size,
          hitRate: 0.85, // Placeholder - would need actual tracking
        },
      };
    } catch (error) {
      logger.error('Error checking system health:', error);
      throw BlockchainErrorHandler.handleContractError(error);
    }
  }

  // Utility methods
  private calculateTotalBalance(coins: Coin[]): number {
    const seiCoin = coins.find(coin => coin.denom === 'usei');
    if (!seiCoin) return 0;
    
    // Convert from usei to SEI (divide by 1,000,000)
    return parseFloat(seiCoin.amount) / 1000000;
  }

  private calculateShareValue(shares: string, vault: any): number {
    if (!shares || !vault || !vault.tvl || !vault.total_shares) {
      return 0;
    }

    const sharesNum = parseFloat(shares);
    const totalShares = parseFloat(vault.total_shares);
    const tvl = parseFloat(vault.tvl);

    if (totalShares === 0) {
      return 0;
    }

    // Calculate share value: (user_shares / total_shares) * tvl
    const shareValue = (sharesNum / totalShares) * tvl;
    
    // Convert from usei to SEI
    return shareValue / 1000000;
  }

  private calculateSharePercentage(shares: string, totalShares: string): number {
    if (!shares || !totalShares) {
      return 0;
    }

    const sharesNum = parseFloat(shares);
    const totalSharesNum = parseFloat(totalShares);

    if (totalSharesNum === 0) {
      return 0;
    }

    return (sharesNum / totalSharesNum) * 100;
  }

  private formatAmount(amount: string): string {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) {
      return '0 SEI';
    }

    // Convert from usei to SEI
    const seiAmount = amountNum / 1000000;
    
    if (seiAmount < 0.01) {
      return `${seiAmount.toFixed(6)} SEI`;
    } else if (seiAmount < 1) {
      return `${seiAmount.toFixed(4)} SEI`;
    } else {
      return `${seiAmount.toFixed(2)} SEI`;
    }
  }

  // Clear cache (useful for testing or manual refresh)
  clearCache(): void {
    this.cache.clear();
    logger.info('Cache cleared');
  }

  // Get cache statistics
  getCacheStats(): { entries: number; keys: string[] } {
    return {
      entries: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Singleton instance
let realDataServiceInstance: RealDataService | null = null;

export async function getRealDataService(): Promise<RealDataService> {
  if (!realDataServiceInstance) {
    const sdk = await getEnhancedSdk();
    const marketDataService = await getMarketDataService();
    realDataServiceInstance = new RealDataService(sdk, marketDataService);
    logger.info('RealDataService initialized with MarketDataService');
  }
  
  return realDataServiceInstance;
}