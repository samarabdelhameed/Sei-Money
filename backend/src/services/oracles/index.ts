import axios from 'axios';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';

// Oracle sources
export enum OracleSource {
  RIVALZ = 'rivalz',
  INTERNAL = 'internal',
  FALLBACK = 'fallback'
}

// Asset types
export enum AssetType {
  STAKING = 'staking',
  LENDING = 'lending',
  LIQUIDITY = 'liquidity',
  YIELD_FARMING = 'yield_farming'
}

// Price data interface
export interface PriceData {
  denom: string;
  price: number;
  source: OracleSource;
  timestamp: number;
  confidence: number; // 0-1
}

// APR data interface
export interface APRData {
  assetType: AssetType;
  apr: number;
  source: string;
  timestamp: number;
  volatility: number; // 0-1
}

// Cache configuration
const CACHE_TTL = {
  PRICES: 15 * 1000, // 15 seconds
  APR: 60 * 1000,    // 1 minute
  TVL: 5 * 60 * 1000 // 5 minutes
};

// In-memory cache
const priceCache = new Map<string, PriceData>();
const aprCache = new Map<string, APRData>();
const tvlCache = new Map<string, number>();

// Rivalz API configuration
const RIVALZ_CONFIG = {
  baseUrl: process.env.RIVALZ_BASE_URL || 'https://api.rivalz.io',
  apiKey: process.env.RIVALZ_API_KEY,
  timeout: 10000
};

// Fallback prices (for development/testing)
const FALLBACK_PRICES: Record<string, number> = {
  'usei': 0.25,
  'uatom': 8.50,
  'uosmo': 0.85,
  'ujuno': 0.45,
  'ustars': 0.12
};

// Fallback APRs (for development/testing)
const FALLBACK_APRS: Record<AssetType, number> = {
  [AssetType.STAKING]: 0.12,      // 12%
  [AssetType.LENDING]: 0.08,      // 8%
  [AssetType.LIQUIDITY]: 0.20,    // 20%
  [AssetType.YIELD_FARMING]: 0.35 // 35%
};

// Get price from Rivalz
async function getPriceFromRivalz(denom: string): Promise<PriceData | null> {
  if (!RIVALZ_CONFIG.apiKey) {
    logger.debug('Rivalz API key not configured');
    return null;
  }

  try {
    const response = await axios.get(`${RIVALZ_CONFIG.baseUrl}/v1/prices/${denom}`, {
      headers: { 'Authorization': `Bearer ${RIVALZ_CONFIG.apiKey}` },
      timeout: RIVALZ_CONFIG.timeout
    });

    if (response.data && response.data.price) {
      return {
        denom,
        price: response.data.price,
        source: OracleSource.RIVALZ,
        timestamp: Date.now(),
        confidence: response.data.confidence || 0.9
      };
    }
  } catch (error) {
    logger.warn(`Failed to get price from Rivalz for ${denom}:`, error);
  }

  return null;
}

// Get price from internal index
async function getPriceFromInternal(denom: string): Promise<PriceData | null> {
  try {
    // Query internal price index from database
    // Price index table doesn't exist in schema, using mock data
    const priceRecord = null;
    /*
    const priceRecord = await prisma.priceIndex.findFirst({
      where: { denom },
      orderBy: { timestamp: 'desc' }
    });
    */

    if (priceRecord && (priceRecord as any).price) {
      return {
        denom,
        price: (priceRecord as any).price,
        source: OracleSource.INTERNAL,
        timestamp: (priceRecord as any).timestamp.getTime(),
        confidence: 0.95
      };
    }
  } catch (error) {
    logger.warn(`Failed to get internal price for ${denom}:`, error);
  }

  return null;
}

// Get fallback price
function getFallbackPrice(denom: string): PriceData | null {
  const price = FALLBACK_PRICES[denom];
  if (price !== undefined) {
    return {
      denom,
      price,
      source: OracleSource.FALLBACK,
      timestamp: Date.now(),
      confidence: 0.5
    };
  }
  return null;
}

// Get APR from external sources
async function getAPRFromExternal(assetType: AssetType): Promise<APRData | null> {
  try {
    // Query external APR feeds
    // This would integrate with various DeFi protocols
    const response = await axios.get(`${RIVALZ_CONFIG.baseUrl}/v1/apy/${assetType}`, {
      headers: { 'Authorization': `Bearer ${RIVALZ_CONFIG.apiKey}` },
      timeout: RIVALZ_CONFIG.timeout
    });

    if (response.data && response.data.apr !== undefined) {
      return {
        assetType,
        apr: response.data.apr,
        source: 'external',
        timestamp: Date.now(),
        volatility: response.data.volatility || 0.1
      };
    }
  } catch (error) {
    logger.warn(`Failed to get external APR for ${assetType}:`, error);
  }

  return null;
}

// Get APR from internal calculations
async function getAPRFromInternal(assetType: AssetType): Promise<APRData | null> {
  try {
    // Calculate APR based on internal data
    // APR index table doesn't exist in schema, using mock data
    const aprRecord = null;
    /*
    const aprRecord = await prisma.aprIndex.findFirst({
      where: { assetType },
      orderBy: { timestamp: 'desc' }
    });
    */

    if (aprRecord && (aprRecord as any).apr !== undefined) {
      return {
        assetType,
        apr: (aprRecord as any).apr,
        source: 'internal',
        timestamp: (aprRecord as any).timestamp?.getTime() || Date.now(),
        volatility: (aprRecord as any).volatility || 0.1
      };
    }
  } catch (error) {
    logger.warn(`Failed to get internal APR for ${assetType}:`, error);
  }

  return null;
}

// Get fallback APR
function getFallbackAPR(assetType: AssetType): APRData {
  return {
    assetType,
    apr: FALLBACK_APRS[assetType],
    source: 'fallback',
    timestamp: Date.now(),
    volatility: 0.2
  };
}

// Main price function
export async function getPrice(denom: string, forceRefresh = false): Promise<PriceData> {
  const cacheKey = denom.toLowerCase();
  const now = Date.now();
  
  // Check cache first
  if (!forceRefresh) {
    const cached = priceCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < CACHE_TTL.PRICES) {
      return cached;
    }
  }

  // Try different sources in order of preference
  let priceData: PriceData | null = null;

  // 1. Try Rivalz first
  priceData = await getPriceFromRivalz(denom);
  
  // 2. Fall back to internal index
  if (!priceData) {
    priceData = await getPriceFromInternal(denom);
  }
  
  // 3. Use fallback prices
  if (!priceData) {
    priceData = getFallbackPrice(denom);
  }

  if (!priceData) {
    throw new Error(`Unable to get price for ${denom} from any source`);
  }

  // Cache the result
  priceCache.set(cacheKey, priceData);
  
  // Store in database for historical tracking
  try {
    // Price index table doesn't exist, skipping
    /*
    await prisma.priceIndex.create({
      data: {
        denom: priceData.denom,
        price: priceData.price,
        source: priceData.source,
        confidence: priceData.confidence,
        timestamp: new Date(priceData.timestamp)
      }
    });
    */
  } catch (error) {
    logger.warn('Failed to store price in database:', error);
  }

  return priceData;
}

// Main APR function
export async function getAPR(assetType: AssetType, forceRefresh = false): Promise<APRData> {
  const cacheKey = assetType;
  const now = Date.now();
  
  // Check cache first
  if (!forceRefresh) {
    const cached = aprCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < CACHE_TTL.APR) {
      return cached;
    }
  }

  // Try different sources
  let aprData: APRData | null = null;

  // 1. Try external sources
  aprData = await getAPRFromExternal(assetType);
  
  // 2. Fall back to internal calculations
  if (!aprData) {
    aprData = await getAPRFromInternal(assetType);
  }
  
  // 3. Use fallback APRs
  if (!aprData) {
    aprData = getFallbackAPR(assetType);
  }

  if (!aprData) {
    throw new Error(`Unable to get APR for ${assetType} from any source`);
  }

  // Cache the result
  aprCache.set(cacheKey, aprData);
  
  // Store in database
  try {
    // APR index table doesn't exist, skipping
    /*
    await prisma.aprIndex.create({
      data: {
        assetType: aprData.assetType,
        apr: aprData.apr,
        source: aprData.source,
        volatility: aprData.volatility,
        timestamp: new Date(aprData.timestamp)
      }
    });
    */
  } catch (error) {
    logger.warn('Failed to store APR in database:', error);
  }

  return aprData;
}

// Get TVL for a vault or protocol
export async function getTVL(identifier: string, forceRefresh = false): Promise<number> {
  const now = Date.now();
  
  // Check cache first
  if (!forceRefresh) {
    const cached = tvlCache.get(identifier);
    if (cached !== undefined && (now - cached) < CACHE_TTL.TVL) {
      return cached;
    }
  }

  try {
    // Query TVL from database
    // TVL index table doesn't exist in schema, using mock data
    const tvlRecord = null;
    /*
    const tvlRecord = await prisma.tvlIndex.findFirst({
      where: { identifier },
      orderBy: { timestamp: 'desc' }
    });
    */

    if (tvlRecord && (tvlRecord as any).tvl !== undefined) {
      tvlCache.set(identifier, (tvlRecord as any).tvl);
      return (tvlRecord as any).tvl;
    }
  } catch (error) {
    logger.warn(`Failed to get TVL for ${identifier}:`, error);
  }

  return 0;
}

// Get multiple prices at once
export async function getPrices(denoms: string[]): Promise<PriceData[]> {
  const prices = await Promise.all(
    denoms.map(denom => getPrice(denom).catch(error => {
      logger.error(`Failed to get price for ${denom}:`, error);
      return null;
    }))
  );

  return prices.filter((p): p is PriceData => p !== null);
}

// Get multiple APRs at once
export async function getAPRs(assetTypes: AssetType[]): Promise<APRData[]> {
  const aprs = await Promise.all(
    assetTypes.map(type => getAPR(type).catch(error => {
      logger.error(`Failed to get APR for ${type}:`, error);
      return null;
    }))
  );

  return aprs.filter((a): a is APRData => a !== null);
}

// Calculate portfolio APY
export async function calculatePortfolioAPY(allocations: Array<{ assetType: AssetType; weight: number }>): Promise<number> {
  try {
    const aprs = await getAPRs(allocations.map(a => a.assetType));
    
    let totalAPY = 0;
    let totalWeight = 0;

    for (const allocation of allocations) {
      const apr = aprs.find(a => a.assetType === allocation.assetType);
      if (apr) {
        totalAPY += apr.apr * allocation.weight;
        totalWeight += allocation.weight;
      }
    }

    return totalWeight > 0 ? totalAPY / totalWeight : 0;
  } catch (error) {
    logger.error('Failed to calculate portfolio APY:', error);
    return 0;
  }
}

// Health check
export async function healthCheck(): Promise<{ healthy: boolean; sources: Record<string, string> }> {
  const sources: Record<string, string> = {};
  
  try {
    // Test Rivalz
    const rivalzPrice = await getPriceFromRivalz('usei');
    sources.rivalz = rivalzPrice ? 'healthy' : 'unavailable';
  } catch (error) {
    sources.rivalz = 'error';
  }

  try {
    // Test internal
    const internalPrice = await getPriceFromInternal('usei');
    sources.internal = internalPrice ? 'healthy' : 'unavailable';
  } catch (error) {
    sources.internal = 'error';
  }

  sources.fallback = 'available';

  const healthy = Object.values(sources).some(status => status === 'healthy');
  
  return { healthy, sources };
}

// Initialize oracles service
export async function initOracles(): Promise<void> {
  logger.info('Initializing oracles service...');
  
  // Test connectivity
  const health = await healthCheck();
  logger.info('Oracles health check:', health);
  
  if (!health.healthy) {
    logger.warn('Some oracle sources are unavailable, using fallbacks');
  }
  
  logger.info('Oracles service initialized');
}

// Clear cache
export function clearCache(): void {
  priceCache.clear();
  aprCache.clear();
  tvlCache.clear();
  logger.info('Oracle cache cleared');
}
