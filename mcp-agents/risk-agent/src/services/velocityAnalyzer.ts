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

// Cache for velocity data (2 minute TTL for real-time analysis)
const velocityCache = new Map<string, { data: any; timestamp: number }>();
const VELOCITY_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

function getVelocityCacheKey(address: string): string {
  return `velocity:${address}`;
}

function getFromVelocityCache<T>(key: string): T | null {
  const cached = velocityCache.get(key);
  if (cached && Date.now() - cached.timestamp < VELOCITY_CACHE_TTL) {
    return cached.data as T;
  }
  return null;
}

function setVelocityCache(key: string, data: any): void {
  velocityCache.set(key, { data, timestamp: Date.now() });
}

// Initialize CosmWasm client
let client: CosmWasmClient | null = null;

async function getClient(): Promise<CosmWasmClient> {
  if (!client) {
    client = await CosmWasmClient.connect(NETWORK_CONFIG.RPC_URL);
  }
  return client;
}

export interface VelocityStats {
  transactionsLastHour: number;
  transactionsLastDay: number;
  transactionsLastWeek: number;
  averageHourlyRate: number;
  averageDailyRate: number;
  peakHourlyRate: number;
  burstDetected: boolean;
  velocityTrend: 'decreasing' | 'stable' | 'increasing' | 'rapidly_increasing';
  unusualPatterns: string[];
  lastAnalyzed: Date;
}

export async function getVelocityStats(address: Address): Promise<VelocityStats | null> {
  const cacheKey = getVelocityCacheKey(address);
  const cached = getFromVelocityCache<VelocityStats>(cacheKey);
  
  if (cached) {
    return cached;
  }

  try {
    const cosmWasmClient = await getClient();
    
    // Get recent transaction history
    const transactions = await getRecentTransactions(cosmWasmClient, address);
    
    if (transactions.length === 0) {
      return null;
    }

    // Analyze velocity patterns
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Count transactions in different time windows
    const transactionsLastHour = countTransactionsInWindow(transactions, oneHourAgo, now);
    const transactionsLastDay = countTransactionsInWindow(transactions, oneDayAgo, now);
    const transactionsLastWeek = countTransactionsInWindow(transactions, oneWeekAgo, now);

    // Calculate rates
    const averageHourlyRate = transactionsLastWeek / (7 * 24); // Average over the week
    const averageDailyRate = transactionsLastWeek / 7;

    // Calculate peak hourly rate (highest hour in the last day)
    const peakHourlyRate = calculatePeakHourlyRate(transactions, oneDayAgo, now);

    // Detect bursts (sudden spikes in activity)
    const burstDetected = detectBurst(transactions, now);

    // Analyze velocity trend
    const velocityTrend = analyzeVelocityTrend(transactions, now);

    // Detect unusual patterns
    const unusualPatterns = detectUnusualPatterns(transactions, now);

    const stats: VelocityStats = {
      transactionsLastHour,
      transactionsLastDay,
      transactionsLastWeek,
      averageHourlyRate,
      averageDailyRate,
      peakHourlyRate,
      burstDetected,
      velocityTrend,
      unusualPatterns,
      lastAnalyzed: now
    };

    setVelocityCache(cacheKey, stats);
    return stats;
  } catch (error) {
    console.error('Error calculating velocity stats:', error);
    return null;
  }
}

async function getRecentTransactions(client: CosmWasmClient, address: Address): Promise<any[]> {
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

    // Add transaction type and normalize timestamps
    const normalizedSent = sentTransfers.map(tx => ({
      ...tx,
      type: 'sent',
      timestamp: new Date(tx.created_at || tx.timestamp || Date.now())
    }));

    const normalizedReceived = receivedTransfers.map(tx => ({
      ...tx,
      type: 'received',
      timestamp: new Date(tx.created_at || tx.timestamp || Date.now())
    }));

    transactions.push(...normalizedSent, ...normalizedReceived);

    // Get other contract interactions (simplified)
    try {
      const potResult = await client.queryContractSmart(CONTRACTS.POTS, {
        list_pots_by_owner: { owner: address }
      });
      
      const normalizedPots = (potResult.pots || []).map(pot => ({
        ...pot,
        type: 'pot_operation',
        timestamp: new Date(pot.created_at || pot.timestamp || Date.now())
      }));
      
      transactions.push(...normalizedPots);
    } catch (error) {
      console.warn('Error fetching pot data for velocity analysis:', error);
    }

    // Sort by timestamp (most recent first)
    transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return transactions;
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    return [];
  }
}

function countTransactionsInWindow(transactions: any[], startTime: Date, endTime: Date): number {
  return transactions.filter(tx => {
    const txTime = tx.timestamp;
    return txTime >= startTime && txTime <= endTime;
  }).length;
}

function calculatePeakHourlyRate(transactions: any[], startTime: Date, endTime: Date): number {
  const hourlyBuckets = new Map<number, number>();
  
  transactions.forEach(tx => {
    const txTime = tx.timestamp;
    if (txTime >= startTime && txTime <= endTime) {
      const hourBucket = Math.floor(txTime.getTime() / (60 * 60 * 1000));
      hourlyBuckets.set(hourBucket, (hourlyBuckets.get(hourBucket) || 0) + 1);
    }
  });

  return Math.max(...Array.from(hourlyBuckets.values()), 0);
}

function detectBurst(transactions: any[], currentTime: Date): boolean {
  // Look for sudden spikes in the last 15 minutes
  const fifteenMinutesAgo = new Date(currentTime.getTime() - 15 * 60 * 1000);
  const thirtyMinutesAgo = new Date(currentTime.getTime() - 30 * 60 * 1000);
  
  const recentTransactions = countTransactionsInWindow(transactions, fifteenMinutesAgo, currentTime);
  const previousTransactions = countTransactionsInWindow(transactions, thirtyMinutesAgo, fifteenMinutesAgo);
  
  // Burst detected if recent activity is 5x higher than previous period
  return recentTransactions > 5 && recentTransactions > previousTransactions * 5;
}

function analyzeVelocityTrend(transactions: any[], currentTime: Date): VelocityStats['velocityTrend'] {
  // Compare recent periods to detect trends
  const now = currentTime.getTime();
  const oneHour = 60 * 60 * 1000;
  
  const periods = [
    { start: now - oneHour, end: now }, // Last hour
    { start: now - 2 * oneHour, end: now - oneHour }, // Previous hour
    { start: now - 3 * oneHour, end: now - 2 * oneHour }, // Hour before that
  ];

  const counts = periods.map(period => 
    countTransactionsInWindow(transactions, new Date(period.start), new Date(period.end))
  );

  const [recent, previous, beforeThat] = counts;

  // Analyze trend
  if (recent > previous * 3 && previous > beforeThat) {
    return 'rapidly_increasing';
  } else if (recent > previous && previous >= beforeThat) {
    return 'increasing';
  } else if (recent < previous && previous <= beforeThat) {
    return 'decreasing';
  } else {
    return 'stable';
  }
}

function detectUnusualPatterns(transactions: any[], currentTime: Date): string[] {
  const patterns: string[] = [];
  
  // Pattern 1: Regular intervals (bot-like behavior)
  if (detectRegularIntervals(transactions)) {
    patterns.push('regular-intervals');
  }

  // Pattern 2: Identical amounts (potential automation)
  if (detectIdenticalAmounts(transactions)) {
    patterns.push('identical-amounts');
  }

  // Pattern 3: Rapid alternating send/receive
  if (detectAlternatingPattern(transactions)) {
    patterns.push('alternating-send-receive');
  }

  // Pattern 4: Sudden activity after dormancy
  if (detectSuddenActivity(transactions, currentTime)) {
    patterns.push('sudden-activity');
  }

  return patterns;
}

function detectRegularIntervals(transactions: any[]): boolean {
  if (transactions.length < 5) return false;

  const intervals: number[] = [];
  for (let i = 1; i < Math.min(transactions.length, 10); i++) {
    const interval = transactions[i-1].timestamp.getTime() - transactions[i].timestamp.getTime();
    intervals.push(interval);
  }

  // Check if intervals are very similar (within 10% variance)
  const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
  const stdDev = Math.sqrt(variance);
  
  return stdDev / avgInterval < 0.1; // Less than 10% variance
}

function detectIdenticalAmounts(transactions: any[]): boolean {
  if (transactions.length < 3) return false;

  const amounts = transactions
    .map(tx => tx.amount?.amount)
    .filter(amount => amount)
    .slice(0, 10); // Check last 10 transactions

  if (amounts.length < 3) return false;

  // Check if more than 70% of amounts are identical
  const amountCounts = new Map<string, number>();
  amounts.forEach(amount => {
    amountCounts.set(amount, (amountCounts.get(amount) || 0) + 1);
  });

  const maxCount = Math.max(...Array.from(amountCounts.values()));
  return maxCount / amounts.length > 0.7;
}

function detectAlternatingPattern(transactions: any[]): boolean {
  if (transactions.length < 6) return false;

  const recentTypes = transactions.slice(0, 6).map(tx => tx.type);
  
  // Check for alternating send/receive pattern
  let alternating = true;
  for (let i = 1; i < recentTypes.length; i++) {
    if (recentTypes[i] === recentTypes[i-1]) {
      alternating = false;
      break;
    }
  }

  return alternating;
}

function detectSuddenActivity(transactions: any[], currentTime: Date): boolean {
  const oneHourAgo = new Date(currentTime.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(currentTime.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(currentTime.getTime() - 7 * 24 * 60 * 60 * 1000);

  const recentActivity = countTransactionsInWindow(transactions, oneHourAgo, currentTime);
  const dayActivity = countTransactionsInWindow(transactions, oneDayAgo, oneHourAgo);
  const weekActivity = countTransactionsInWindow(transactions, oneWeekAgo, oneDayAgo);

  // Sudden activity: recent hour has more activity than the entire previous day
  return recentActivity > 0 && recentActivity > dayActivity && dayActivity === 0 && weekActivity > 0;
}

// Utility function to clear cache (useful for testing)
export function clearVelocityCache(): void {
  velocityCache.clear();
}