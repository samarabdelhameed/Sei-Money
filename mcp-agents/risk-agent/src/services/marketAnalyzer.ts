import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import type { Address } from '../types';

// Real contract addresses from Sei testnet
const CONTRACTS = {
  PAYMENTS: "sei1kfpm92hs5gsmp84098wc3jpy2a440l50cq2ycsxlkpnlaygl9azqdhsygg",
  GROUPS: "sei1vq3ncyvf4k22lc0xhm7x6dtkn6jyxkexa2xy6uk2sj33dysnyy2syn73qt",
  POTS: "sei1c5d4flfqv3zjms0g894z82hnhv62h2vjr9hgd05c6xh456q8xjfq8f3qmj",
  VAULTS: "sei12k2yxf3cyec8p89qtgm5w30m4g2775tn7j8wx4jpuallygu45r9qs68u2h",
} as const;

const NETWORK_CONFIG = {
  RPC_URL: "https://rpc.atlantic-2.seinetwork.io:443",
} as const;

// Cache for market data (10 minute TTL)
const marketCache = new Map<string, { data: any; timestamp: number }>();
const MARKET_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function getMarketCacheKey(key: string): string {
  return `market:${key}`;
}

function getFromMarketCache<T>(key: string): T | null {
  const cached = marketCache.get(key);
  if (cached && Date.now() - cached.timestamp < MARKET_CACHE_TTL) {
    return cached.data as T;
  }
  return null;
}

function setMarketCache(key: string, data: any): void {
  marketCache.set(key, { data, timestamp: Date.now() });
}

// Initialize CosmWasm client
let client: CosmWasmClient | null = null;

async function getClient(): Promise<CosmWasmClient> {
  if (!client) {
    client = await CosmWasmClient.connect(NETWORK_CONFIG.RPC_URL);
  }
  return client;
}

export interface MarketStats {
  totalTransactions: number;
  averageTransactionSize: number; // in SEI
  medianTransactionSize: number; // in SEI
  transactionSizeStdDev: number; // in SEI
  totalVolume: number; // in SEI
  activeAddresses: number;
  largeTransactionThreshold: number; // in SEI
  suspiciousPatternCount: number;
  lastUpdated: Date;
}

export interface UserTransactionStats {
  totalTransactions: number;
  averageTransactionSize: number; // in SEI
  medianTransactionSize: number; // in SEI
  transactionSizeStdDev: number; // in SEI
  largeTransactionCount: number;
  firstTransactionDate?: Date;
  lastTransactionDate?: Date;
  transactionFrequency: number; // transactions per day
}

export async function getMarketStats(): Promise<MarketStats> {
  const cacheKey = getMarketCacheKey('stats');
  const cached = getFromMarketCache<MarketStats>(cacheKey);
  
  if (cached) {
    return cached;
  }

  try {
    const cosmWasmClient = await getClient();
    
    // Collect transaction data from all contracts
    const allTransactions = await collectAllTransactions(cosmWasmClient);
    
    // Calculate statistics
    const amounts = allTransactions
      .map(tx => parseFloat(tx.amount?.amount || '0') / 1_000_000) // Convert to SEI
      .filter(amount => amount > 0)
      .sort((a, b) => a - b);

    const totalTransactions = amounts.length;
    const totalVolume = amounts.reduce((sum, amount) => sum + amount, 0);
    const averageTransactionSize = totalVolume / totalTransactions || 0;
    
    // Calculate median
    const medianTransactionSize = totalTransactions > 0 
      ? amounts[Math.floor(amounts.length / 2)] 
      : 0;

    // Calculate standard deviation
    const variance = amounts.reduce((sum, amount) => {
      return sum + Math.pow(amount - averageTransactionSize, 2);
    }, 0) / totalTransactions;
    const transactionSizeStdDev = Math.sqrt(variance);

    // Count unique addresses
    const uniqueAddresses = new Set([
      ...allTransactions.map(tx => tx.sender).filter(Boolean),
      ...allTransactions.map(tx => tx.recipient).filter(Boolean),
      ...allTransactions.map(tx => tx.from).filter(Boolean),
      ...allTransactions.map(tx => tx.to).filter(Boolean),
    ]);

    // Define large transaction threshold (95th percentile)
    const largeTransactionThreshold = totalTransactions > 0 
      ? amounts[Math.floor(amounts.length * 0.95)] 
      : 100; // Default 100 SEI

    // Count suspicious patterns (placeholder - would need more sophisticated analysis)
    const suspiciousPatternCount = 0;

    const stats: MarketStats = {
      totalTransactions,
      averageTransactionSize,
      medianTransactionSize,
      transactionSizeStdDev,
      totalVolume,
      activeAddresses: uniqueAddresses.size,
      largeTransactionThreshold,
      suspiciousPatternCount,
      lastUpdated: new Date()
    };

    setMarketCache(cacheKey, stats);
    return stats;
  } catch (error) {
    console.error('Error calculating market stats:', error);
    
    // Return default stats on error
    return {
      totalTransactions: 0,
      averageTransactionSize: 10, // Default 10 SEI
      medianTransactionSize: 5,   // Default 5 SEI
      transactionSizeStdDev: 5,   // Default 5 SEI
      totalVolume: 0,
      activeAddresses: 0,
      largeTransactionThreshold: 100, // Default 100 SEI
      suspiciousPatternCount: 0,
      lastUpdated: new Date()
    };
  }
}

export async function getUserTransactionStats(address: Address): Promise<UserTransactionStats | null> {
  const cacheKey = getMarketCacheKey(`user:${address}`);
  const cached = getFromMarketCache<UserTransactionStats>(cacheKey);
  
  if (cached) {
    return cached;
  }

  try {
    const cosmWasmClient = await getClient();
    
    // Get user's transaction history
    const userTransactions = await collectUserTransactions(cosmWasmClient, address);
    
    if (userTransactions.length === 0) {
      return null;
    }

    // Calculate user-specific statistics
    const amounts = userTransactions
      .map(tx => parseFloat(tx.amount?.amount || '0') / 1_000_000) // Convert to SEI
      .filter(amount => amount > 0)
      .sort((a, b) => a - b);

    const totalTransactions = amounts.length;
    const totalVolume = amounts.reduce((sum, amount) => sum + amount, 0);
    const averageTransactionSize = totalVolume / totalTransactions || 0;
    
    // Calculate median
    const medianTransactionSize = totalTransactions > 0 
      ? amounts[Math.floor(amounts.length / 2)] 
      : 0;

    // Calculate standard deviation
    const variance = amounts.reduce((sum, amount) => {
      return sum + Math.pow(amount - averageTransactionSize, 2);
    }, 0) / totalTransactions;
    const transactionSizeStdDev = Math.sqrt(variance);

    // Count large transactions (> 100 SEI)
    const largeTransactionCount = amounts.filter(amount => amount > 100).length;

    // Calculate dates
    const dates = userTransactions
      .map(tx => tx.created_at || tx.timestamp)
      .filter(date => date)
      .map(date => new Date(date))
      .sort((a, b) => a.getTime() - b.getTime());

    const firstTransactionDate = dates.length > 0 ? dates[0] : undefined;
    const lastTransactionDate = dates.length > 0 ? dates[dates.length - 1] : undefined;

    // Calculate transaction frequency
    let transactionFrequency = 0;
    if (firstTransactionDate && lastTransactionDate) {
      const daysDiff = (lastTransactionDate.getTime() - firstTransactionDate.getTime()) / (1000 * 60 * 60 * 24);
      transactionFrequency = daysDiff > 0 ? totalTransactions / daysDiff : totalTransactions;
    }

    const stats: UserTransactionStats = {
      totalTransactions,
      averageTransactionSize,
      medianTransactionSize,
      transactionSizeStdDev,
      largeTransactionCount,
      firstTransactionDate,
      lastTransactionDate,
      transactionFrequency
    };

    setMarketCache(cacheKey, stats);
    return stats;
  } catch (error) {
    console.error('Error calculating user transaction stats:', error);
    return null;
  }
}

// Helper functions to collect transaction data
async function collectAllTransactions(client: CosmWasmClient): Promise<any[]> {
  const transactions: any[] = [];

  try {
    // This is a simplified approach - in a real implementation, you would need to:
    // 1. Query transaction history from blockchain indexer
    // 2. Parse contract events from transaction logs
    // 3. Aggregate data from multiple sources
    
    // For now, we'll return empty array as we don't have a comprehensive indexer
    // In production, this would connect to a blockchain indexer service
    
    console.log('Note: collectAllTransactions is a placeholder - would need blockchain indexer');
    return transactions;
  } catch (error) {
    console.error('Error collecting all transactions:', error);
    return [];
  }
}

async function collectUserTransactions(client: CosmWasmClient, address: Address): Promise<any[]> {
  const transactions: any[] = [];

  try {
    // Get transfers from Payments contract
    const [sentTransfers, receivedTransfers] = await Promise.all([
      client.queryContractSmart(CONTRACTS.PAYMENTS, {
        list_by_sender: { sender: address }
      }).then(result => result.transfers || []).catch(() => []),
      
      client.queryContractSmart(CONTRACTS.PAYMENTS, {
        list_by_recipient: { recipient: address }
      }).then(result => result.transfers || []).catch(() => [])
    ]);

    transactions.push(...sentTransfers, ...receivedTransfers);

    // Get pot deposits
    try {
      const potResult = await client.queryContractSmart(CONTRACTS.POTS, {
        list_pots_by_owner: { owner: address }
      });
      transactions.push(...(potResult.pots || []));
    } catch (error) {
      console.warn('Error fetching pot data:', error);
    }

    // Get vault positions (these represent deposits/withdrawals)
    try {
      const vaultResult = await client.queryContractSmart(CONTRACTS.VAULTS, {
        list_user_positions: { address }
      });
      transactions.push(...(vaultResult.positions || []));
    } catch (error) {
      console.warn('Error fetching vault data:', error);
    }

    return transactions;
  } catch (error) {
    console.error('Error collecting user transactions:', error);
    return [];
  }
}

// Utility function to clear cache (useful for testing)
export function clearMarketCache(): void {
  marketCache.clear();
}