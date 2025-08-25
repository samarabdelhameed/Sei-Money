import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import type { Address } from '../types';

// Real contract addresses from Sei testnet
const CONTRACTS = {
  PAYMENTS: "sei1kfpm92hs5gsmp84098wc3jpy2a440l50cq2ycsxlkpnlaygl9azqdhsygg",
  GROUPS: "sei1vq3ncyvf4k22lc0xhm7x6dtkn6jyxkexa2xy6uk2sj33dysnyy2syn73qt",
  POTS: "sei1c5d4flfqv3zjms0g894z82hnhv62h2vjr9hgd05c6xh456q8xjfq8f3qmj",
  VAULTS: "sei12k2yxf3cyec8p89qtgm5w30m4g2775tn7j8wx4jpuallygu45r9qs68u2h",
  RISK_ESCROW: "sei1q3gqr9ywvma6j6kja67n4h7fxz790x5lhj4v5phv2za0v7wsp5qqkrz0pj",
  ALIAS: "sei1thjuavd70uq7txe79uj8pfy2vfyl3zvmenkyxh6ew4vag9mckq4qrtjav4",
} as const;

const NETWORK_CONFIG = {
  CHAIN_ID: "atlantic-2",
  RPC_URL: "https://rpc.atlantic-2.seinetwork.io:443",
  DENOM: "usei",
} as const;

// Cache for blockchain data (5 minute TTL)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(prefix: string, address: string): string {
  return `${prefix}:${address}`;
}

function getFromCache<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// Initialize CosmWasm client
let client: CosmWasmClient | null = null;

async function getClient(): Promise<CosmWasmClient> {
  if (!client) {
    client = await CosmWasmClient.connect(NETWORK_CONFIG.RPC_URL);
  }
  return client;
}

export interface AddressHistory {
  transfers: {
    sent: any[];
    received: any[];
    claimed: any[];
    refunded: any[];
  };
  groupContributions: any[];
  potDeposits: any[];
  vaultOperations: any[];
  escrowCases: any[];
  totalTransactions: number;
  firstTransactionDate?: Date;
  lastTransactionDate?: Date;
}

export interface AddressStats {
  ageInDays: number;
  totalTransactions: number;
  failureRate: number;
  averageTransactionSize: number;
  uniqueContractsInteracted: number;
  hasUnusualPatterns: boolean;
  riskFactors: string[];
}

export async function getAddressHistory(address: Address): Promise<AddressHistory> {
  const cacheKey = getCacheKey('history', address);
  const cached = getFromCache<AddressHistory>(cacheKey);
  
  if (cached) {
    return cached;
  }

  try {
    const cosmWasmClient = await getClient();
    
    // Get transfers from Payments contract
    const [sentTransfers, receivedTransfers] = await Promise.all([
      getTransfersBySender(cosmWasmClient, address),
      getTransfersByRecipient(cosmWasmClient, address)
    ]);

    // Get group contributions
    const groupContributions = await getGroupContributions(cosmWasmClient, address);

    // Get pot deposits
    const potDeposits = await getPotDeposits(cosmWasmClient, address);

    // Get vault operations
    const vaultOperations = await getVaultOperations(cosmWasmClient, address);

    // Get escrow cases
    const escrowCases = await getEscrowCases(cosmWasmClient, address);

    const history: AddressHistory = {
      transfers: {
        sent: sentTransfers,
        received: receivedTransfers,
        claimed: [], // Would need to parse from transaction events
        refunded: [], // Would need to parse from transaction events
      },
      groupContributions,
      potDeposits,
      vaultOperations,
      escrowCases,
      totalTransactions: sentTransfers.length + receivedTransfers.length + 
                        groupContributions.length + potDeposits.length + 
                        vaultOperations.length + escrowCases.length,
      firstTransactionDate: calculateFirstTransactionDate([
        ...sentTransfers, ...receivedTransfers, ...groupContributions,
        ...potDeposits, ...vaultOperations, ...escrowCases
      ]),
      lastTransactionDate: calculateLastTransactionDate([
        ...sentTransfers, ...receivedTransfers, ...groupContributions,
        ...potDeposits, ...vaultOperations, ...escrowCases
      ])
    };

    setCache(cacheKey, history);
    return history;
  } catch (error) {
    console.error('Error fetching address history:', error);
    // Return empty history on error
    const emptyHistory: AddressHistory = {
      transfers: { sent: [], received: [], claimed: [], refunded: [] },
      groupContributions: [],
      potDeposits: [],
      vaultOperations: [],
      escrowCases: [],
      totalTransactions: 0
    };
    return emptyHistory;
  }
}

export async function getAddressStats(address: Address): Promise<AddressStats> {
  const cacheKey = getCacheKey('stats', address);
  const cached = getFromCache<AddressStats>(cacheKey);
  
  if (cached) {
    return cached;
  }

  try {
    const history = await getAddressHistory(address);
    const cosmWasmClient = await getClient();
    
    // Calculate age
    const ageInDays = history.firstTransactionDate 
      ? Math.floor((Date.now() - history.firstTransactionDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Calculate failure rate (would need transaction result analysis)
    const failureRate = 0; // Placeholder - would need to analyze transaction results

    // Calculate average transaction size
    const allAmounts = [
      ...history.transfers.sent.map(t => parseFloat(t.amount?.amount || '0')),
      ...history.transfers.received.map(t => parseFloat(t.amount?.amount || '0')),
      // Add other transaction types...
    ].filter(amount => amount > 0);
    
    const averageTransactionSize = allAmounts.length > 0 
      ? allAmounts.reduce((sum, amount) => sum + amount, 0) / allAmounts.length
      : 0;

    // Count unique contracts interacted with
    const uniqueContracts = new Set([
      ...(history.transfers.sent.length > 0 ? [CONTRACTS.PAYMENTS] : []),
      ...(history.groupContributions.length > 0 ? [CONTRACTS.GROUPS] : []),
      ...(history.potDeposits.length > 0 ? [CONTRACTS.POTS] : []),
      ...(history.vaultOperations.length > 0 ? [CONTRACTS.VAULTS] : []),
      ...(history.escrowCases.length > 0 ? [CONTRACTS.RISK_ESCROW] : []),
    ]);

    // Detect unusual patterns
    const hasUnusualPatterns = detectUnusualPatterns(history);

    // Identify risk factors
    const riskFactors = identifyRiskFactors(history, {
      ageInDays,
      totalTransactions: history.totalTransactions,
      averageTransactionSize,
      hasUnusualPatterns
    });

    const stats: AddressStats = {
      ageInDays,
      totalTransactions: history.totalTransactions,
      failureRate,
      averageTransactionSize,
      uniqueContractsInteracted: uniqueContracts.size,
      hasUnusualPatterns,
      riskFactors
    };

    setCache(cacheKey, stats);
    return stats;
  } catch (error) {
    console.error('Error calculating address stats:', error);
    // Return conservative stats on error
    return {
      ageInDays: 0,
      totalTransactions: 0,
      failureRate: 0,
      averageTransactionSize: 0,
      uniqueContractsInteracted: 0,
      hasUnusualPatterns: false,
      riskFactors: ['analysis-error']
    };
  }
}

// Helper functions for fetching specific contract data
async function getTransfersBySender(client: CosmWasmClient, address: Address): Promise<any[]> {
  try {
    const result = await client.queryContractSmart(CONTRACTS.PAYMENTS, {
      list_by_sender: { sender: address }
    });
    return result.transfers || [];
  } catch (error) {
    console.warn('Error fetching transfers by sender:', error);
    return [];
  }
}

async function getTransfersByRecipient(client: CosmWasmClient, address: Address): Promise<any[]> {
  try {
    const result = await client.queryContractSmart(CONTRACTS.PAYMENTS, {
      list_by_recipient: { recipient: address }
    });
    return result.transfers || [];
  } catch (error) {
    console.warn('Error fetching transfers by recipient:', error);
    return [];
  }
}

async function getGroupContributions(client: CosmWasmClient, address: Address): Promise<any[]> {
  try {
    // This would need to be implemented based on the Groups contract query methods
    // For now, return empty array as placeholder
    return [];
  } catch (error) {
    console.warn('Error fetching group contributions:', error);
    return [];
  }
}

async function getPotDeposits(client: CosmWasmClient, address: Address): Promise<any[]> {
  try {
    const result = await client.queryContractSmart(CONTRACTS.POTS, {
      list_pots_by_owner: { owner: address }
    });
    return result.pots || [];
  } catch (error) {
    console.warn('Error fetching pot deposits:', error);
    return [];
  }
}

async function getVaultOperations(client: CosmWasmClient, address: Address): Promise<any[]> {
  try {
    const result = await client.queryContractSmart(CONTRACTS.VAULTS, {
      list_user_positions: { address }
    });
    return result.positions || [];
  } catch (error) {
    console.warn('Error fetching vault operations:', error);
    return [];
  }
}

async function getEscrowCases(client: CosmWasmClient, address: Address): Promise<any[]> {
  try {
    // This would need to be implemented based on the Risk Escrow contract query methods
    // For now, return empty array as placeholder
    return [];
  } catch (error) {
    console.warn('Error fetching escrow cases:', error);
    return [];
  }
}

// Utility functions
function calculateFirstTransactionDate(transactions: any[]): Date | undefined {
  const dates = transactions
    .map(tx => tx.created_at || tx.timestamp)
    .filter(date => date)
    .map(date => new Date(date))
    .sort((a, b) => a.getTime() - b.getTime());
  
  return dates.length > 0 ? dates[0] : undefined;
}

function calculateLastTransactionDate(transactions: any[]): Date | undefined {
  const dates = transactions
    .map(tx => tx.created_at || tx.timestamp)
    .filter(date => date)
    .map(date => new Date(date))
    .sort((a, b) => b.getTime() - a.getTime());
  
  return dates.length > 0 ? dates[0] : undefined;
}

function detectUnusualPatterns(history: AddressHistory): boolean {
  // Detect patterns that might indicate suspicious behavior
  
  // Pattern 1: Very high frequency of small transactions
  const smallTransactions = history.transfers.sent.filter(t => 
    parseFloat(t.amount?.amount || '0') < 1000000 // < 1 SEI
  );
  if (smallTransactions.length > 100) {
    return true;
  }

  // Pattern 2: Alternating send/receive pattern (possible wash trading)
  if (history.transfers.sent.length > 10 && history.transfers.received.length > 10) {
    const ratio = Math.min(history.transfers.sent.length, history.transfers.received.length) / 
                  Math.max(history.transfers.sent.length, history.transfers.received.length);
    if (ratio > 0.8) { // Very similar send/receive counts
      return true;
    }
  }

  // Pattern 3: Large number of failed transactions (would need transaction result data)
  // This would require analyzing transaction results from blockchain

  return false;
}

function identifyRiskFactors(history: AddressHistory, stats: Partial<AddressStats>): string[] {
  const factors: string[] = [];

  if (stats.ageInDays === 0) {
    factors.push('new-address');
  }

  if (stats.totalTransactions === 0) {
    factors.push('no-transaction-history');
  }

  if (stats.hasUnusualPatterns) {
    factors.push('suspicious-patterns');
  }

  if (stats.averageTransactionSize && stats.averageTransactionSize > 100000000) { // > 100 SEI
    factors.push('large-transactions');
  }

  if (stats.uniqueContractsInteracted === 1) {
    factors.push('single-contract-interaction');
  }

  return factors;
}

// Export for testing
export { detectUnusualPatterns, identifyRiskFactors };