/**
 * Tests for utils module
 */

import {
  toUint128,
  fromUint128,
  formatCoin,
  parseCoin,
  addCoins,
  subtractCoins,
  multiplyCoin,
  divideCoin,
  percentageOfCoin,
  isValidAddress,
  isValidDenom,
  retry,
  estimateGas,
  sleep,
  generateId,
  deepClone,
  isEmpty,
  safeJsonParse,
  safeJsonStringify
} from '../utils';
import { Coin, SeiMoneyError } from '../types';

describe('Utils', () => {
  describe('toUint128', () => {
    it('should convert number to string', () => {
      expect(toUint128(100)).toBe('100');
      expect(toUint128(0)).toBe('0');
      expect(toUint128('1000')).toBe('1000');
    });
  });

  describe('fromUint128', () => {
    it('should convert string to number', () => {
      expect(fromUint128('100')).toBe(100);
      expect(fromUint128('0')).toBe(0);
      expect(fromUint128('1000')).toBe(1000);
    });
  });

  describe('formatCoin', () => {
    it('should format coin with default decimals', () => {
      const coin: Coin = { denom: 'usei', amount: '1000000' };
      expect(formatCoin(coin)).toBe('1.000000 usei');
    });

    it('should format coin with custom decimals', () => {
      const coin: Coin = { denom: 'usei', amount: '1000000' };
      expect(formatCoin(coin, 3)).toBe('1.000 usei');
    });
  });

  describe('parseCoin', () => {
    it('should parse valid coin string', () => {
      const result = parseCoin('1.5 usei');
      expect(result.denom).toBe('usei');
      expect(result.amount).toBe('1500000');
    });

    it('should throw error for invalid format', () => {
      expect(() => parseCoin('invalid')).toThrow(SeiMoneyError);
      expect(() => parseCoin('1.5')).toThrow(SeiMoneyError);
    });
  });

  describe('addCoins', () => {
    it('should add coins of same denomination', () => {
      const coin1: Coin = { denom: 'usei', amount: '1000000' };
      const coin2: Coin = { denom: 'usei', amount: '2000000' };
      const result = addCoins(coin1, coin2);
      
      expect(result.denom).toBe('usei');
      expect(result.amount).toBe('3000000');
    });

    it('should throw error for different denominations', () => {
      const coin1: Coin = { denom: 'usei', amount: '1000000' };
      const coin2: Coin = { denom: 'uatom', amount: '2000000' };
      
      expect(() => addCoins(coin1, coin2)).toThrow(SeiMoneyError);
    });
  });

  describe('subtractCoins', () => {
    it('should subtract coins of same denomination', () => {
      const coin1: Coin = { denom: 'usei', amount: '3000000' };
      const coin2: Coin = { denom: 'usei', amount: '1000000' };
      const result = subtractCoins(coin1, coin2);
      
      expect(result.denom).toBe('usei');
      expect(result.amount).toBe('2000000');
    });

    it('should throw error for insufficient balance', () => {
      const coin1: Coin = { denom: 'usei', amount: '1000000' };
      const coin2: Coin = { denom: 'usei', amount: '2000000' };
      
      expect(() => subtractCoins(coin1, coin2)).toThrow(SeiMoneyError);
    });
  });

  describe('multiplyCoin', () => {
    it('should multiply coin by factor', () => {
      const coin: Coin = { denom: 'usei', amount: '1000000' };
      const result = multiplyCoin(coin, 2.5);
      
      expect(result.denom).toBe('usei');
      expect(result.amount).toBe('2500000');
    });
  });

  describe('divideCoin', () => {
    it('should divide coin by factor', () => {
      const coin: Coin = { denom: 'usei', amount: '1000000' };
      const result = divideCoin(coin, 2);
      
      expect(result.denom).toBe('usei');
      expect(result.amount).toBe('500000');
    });

    it('should throw error for division by zero', () => {
      const coin: Coin = { denom: 'usei', amount: '1000000' };
      expect(() => divideCoin(coin, 0)).toThrow(SeiMoneyError);
    });
  });

  describe('percentageOfCoin', () => {
    it('should calculate percentage of coin', () => {
      const coin: Coin = { denom: 'usei', amount: '1000000' };
      const result = percentageOfCoin(coin, 25);
      
      expect(result.denom).toBe('usei');
      expect(result.amount).toBe('250000');
    });

    it('should throw error for invalid percentage', () => {
      const coin: Coin = { denom: 'usei', amount: '1000000' };
      expect(() => percentageOfCoin(coin, -10)).toThrow(SeiMoneyError);
      expect(() => percentageOfCoin(coin, 150)).toThrow(SeiMoneyError);
    });
  });

  describe('isValidAddress', () => {
    it('should validate correct Sei addresses', () => {
      expect(isValidAddress('sei1abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz1234567890')).toBe(true);
    });

    it('should reject invalid addresses', () => {
      expect(isValidAddress('invalid')).toBe(false);
      expect(isValidAddress('cosmos1...')).toBe(false);
      expect(isValidAddress('')).toBe(false);
    });
  });

  describe('isValidDenom', () => {
    it('should validate correct denominations', () => {
      expect(isValidDenom('usei')).toBe(true);
      expect(isValidDenom('uatom')).toBe(true);
      expect(isValidDenom('ibc/...')).toBe(true);
    });

    it('should reject invalid denominations', () => {
      expect(isValidDenom('')).toBe(false);
      expect(isValidDenom('123')).toBe(false);
      expect(isValidDenom('invalid-denom')).toBe(false);
    });
  });

  describe('retry', () => {
    it('should retry failed operations', async () => {
      let attempts = 0;
      const fn = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      });

      const result = await retry(fn, 3, 10);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries', async () => {
      const fn = jest.fn().mockImplementation(() => {
        throw new Error('Persistent failure');
      });

      await expect(retry(fn, 2, 10)).rejects.toThrow('Persistent failure');
      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('estimateGas', () => {
    it('should calculate gas with safety margin', () => {
      expect(estimateGas('100000', 1.3)).toBe('130000');
      expect(estimateGas('100000', 1.0)).toBe('100000');
      expect(estimateGas('100000', 2.0)).toBe('200000');
    });
  });

  describe('sleep', () => {
    it('should sleep for specified milliseconds', async () => {
      const start = Date.now();
      await sleep(100);
      const end = Date.now();
      
      expect(end - start).toBeGreaterThanOrEqual(95); // Allow small timing variance
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });
  });

  describe('deepClone', () => {
    it('should clone primitive values', () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone('test')).toBe('test');
      expect(deepClone(null)).toBe(null);
    });

    it('should clone objects', () => {
      const obj = { a: 1, b: { c: 2 } };
      const cloned = deepClone(obj);
      
      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
      expect(cloned.b).not.toBe(obj.b);
    });

    it('should clone arrays', () => {
      const arr = [1, [2, 3], { a: 4 }];
      const cloned = deepClone(arr);
      
      expect(cloned).toEqual(arr);
      expect(cloned).not.toBe(arr);
      expect(cloned[1]).not.toBe(arr[1]);
    });
  });

  describe('isEmpty', () => {
    it('should check if values are empty', () => {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
      expect(isEmpty('')).toBe(true);
      expect(isEmpty('   ')).toBe(true);
      expect(isEmpty([])).toBe(true);
      expect(isEmpty({})).toBe(true);
      
      expect(isEmpty('hello')).toBe(false);
      expect(isEmpty([1, 2, 3])).toBe(false);
      expect(isEmpty({ a: 1 })).toBe(false);
      expect(isEmpty(0)).toBe(false);
      expect(isEmpty(false)).toBe(false);
    });
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      const result = safeJsonParse('{"a": 1}', {});
      expect(result).toEqual({ a: 1 });
    });

    it('should return fallback for invalid JSON', () => {
      const fallback = { default: true };
      const result = safeJsonParse('invalid json', fallback);
      expect(result).toBe(fallback);
    });
  });

  describe('safeJsonStringify', () => {
    it('should stringify valid objects', () => {
      const result = safeJsonStringify({ a: 1 });
      expect(result).toBe('{"a":1}');
    });

    it('should return fallback for circular references', () => {
      const obj: any = { a: 1 };
      obj.self = obj;
      
      const result = safeJsonStringify(obj, 'fallback');
      expect(result).toBe('fallback');
    });
  });
});
