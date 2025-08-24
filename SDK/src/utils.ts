/**
 * Utility functions for Sei Money SDK
 */

import { Coin, Amount, Denom, SeiMoneyError } from './types';

/**
 * Convert number to Uint128 string
 */
export function toUint128(value: number | string): string {
  return value.toString();
}

/**
 * Convert Uint128 string to number
 */
export function fromUint128(value: string): number {
  return parseInt(value, 10);
}

/**
 * Format coin amount with proper decimals
 */
export function formatCoin(coin: Coin, decimals: number = 6): string {
  const amount = parseFloat(coin.amount) / Math.pow(10, decimals);
  return `${amount.toFixed(decimals)} ${coin.denom}`;
}

/**
 * Parse coin amount from string
 */
export function parseCoin(input: string): Coin {
  const match = input.match(/^(\d+(?:\.\d+)?)\s+(\w+)$/);
  if (!match) {
    throw new SeiMoneyError('Invalid coin format', 'INVALID_COIN_FORMAT', { input });
  }
  
  const [, amount, denom] = match;
  return {
    denom,
    amount: (parseFloat(amount) * Math.pow(10, 6)).toString(), // Assuming 6 decimals
  };
}

/**
 * Add two coins of the same denomination
 */
export function addCoins(coin1: Coin, coin2: Coin): Coin {
  if (coin1.denom !== coin2.denom) {
    throw new SeiMoneyError('Cannot add coins of different denominations', 'DENOM_MISMATCH', {
      denom1: coin1.denom,
      denom2: coin2.denom,
    });
  }
  
  const amount1 = parseInt(coin1.amount, 10);
  const amount2 = parseInt(coin2.amount, 10);
  
  return {
    denom: coin1.denom,
    amount: (amount1 + amount2).toString(),
  };
}

/**
 * Subtract two coins of the same denomination
 */
export function subtractCoins(coin1: Coin, coin2: Coin): Coin {
  if (coin1.denom !== coin2.denom) {
    throw new SeiMoneyError('Cannot subtract coins of different denominations', 'DENOM_MISMATCH', {
      denom1: coin1.denom,
      denom2: coin2.denom,
    });
  }
  
  const amount1 = parseInt(coin1.amount, 10);
  const amount2 = parseInt(coin2.amount, 10);
  
  if (amount1 < amount2) {
    throw new SeiMoneyError('Insufficient balance', 'INSUFFICIENT_BALANCE', {
      available: amount1,
      required: amount2,
    });
  }
  
  return {
    denom: coin1.denom,
    amount: (amount1 - amount2).toString(),
  };
}

/**
 * Multiply coin by a factor
 */
export function multiplyCoin(coin: Coin, factor: number): Coin {
  const amount = parseInt(coin.amount, 10);
  return {
    denom: coin.denom,
    amount: Math.floor(amount * factor).toString(),
  };
}

/**
 * Divide coin by a factor
 */
export function divideCoin(coin: Coin, factor: number): Coin {
  if (factor === 0) {
    throw new SeiMoneyError('Cannot divide by zero', 'DIVISION_BY_ZERO');
  }
  
  const amount = parseInt(coin.amount, 10);
  return {
    denom: coin.denom,
    amount: Math.floor(amount / factor).toString(),
  };
}

/**
 * Calculate percentage of a coin
 */
export function percentageOfCoin(coin: Coin, percentage: number): Coin {
  if (percentage < 0 || percentage > 100) {
    throw new SeiMoneyError('Percentage must be between 0 and 100', 'INVALID_PERCENTAGE', {
      percentage,
    });
  }
  
  return multiplyCoin(coin, percentage / 100);
}

/**
 * Validate address format
 */
export function isValidAddress(address: string): boolean {
  // Basic Sei address validation (bech32 format starting with 'sei')
  return /^sei[a-zA-Z0-9]{38}$/.test(address);
}

/**
 * Validate denom format
 */
export function isValidDenom(denom: string): boolean {
  // Basic denom validation
  return /^[a-zA-Z][a-zA-Z0-9/]*$/.test(denom);
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Calculate gas estimate with safety margin
 */
export function estimateGas(baseGas: string, safetyMargin: number = 1.3): string {
  const gas = parseInt(baseGas, 10);
  return Math.ceil(gas * safetyMargin).toString();
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Generate random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as T;
  }
  
  if (typeof obj === 'object') {
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  
  return obj;
}

/**
 * Check if value is empty
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Safe JSON parse
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Safe JSON stringify
 */
export function safeJsonStringify(obj: any, fallback: string = '{}'): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return fallback;
  }
}
