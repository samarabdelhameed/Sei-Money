import { EventEmitter } from 'events';
import { logger } from '../lib/logger';

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  tags: string[];
  accessCount: number;
  lastAccessed: number;
}

export interface CacheConfig {
  defaultTTL: number;
  maxSize: number;
  cleanupInterval: number;
  enableStats: boolean;
}

export interface CacheStats {
  totalEntries: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  memoryUsage: number;
  oldestEntry: number;
  newestEntry: number;
}

export class CacheService extends EventEmitter {
  private cache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;
  private stats: CacheStats;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private tagIndex: Map<string, Set<string>> = new Map(); // tag -> set of keys

  constructor(config: Partial<CacheConfig> = {}) {
    super();
    
    this.config = {
      defaultTTL: 300000, // 5 minutes
      maxSize: 10000,
      cleanupInterval: 60000, // 1 minute
      enableStats: true,
      ...config
    };

    this.stats = {
      totalEntries: 0,
      totalHits: 0,
      totalMisses: 0,
      hitRate: 0,
      memoryUsage: 0,
      oldestEntry: 0,
      newestEntry: 0
    };

    this.startCleanupTimer();
  }

  // Set cache entry
  set<T>(
    key: string, 
    data: T, 
    options: {
      ttl?: number;
      tags?: string[];
    } = {}
  ): void {
    const now = Date.now();
    const ttl = options.ttl || this.config.defaultTTL;
    const tags = options.tags || [];

    // Check if we need to evict entries
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    // Remove existing entry if it exists
    if (this.cache.has(key)) {
      this.removeFromTagIndex(key);
    }

    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: now,
      ttl,
      tags,
      accessCount: 0,
      lastAccessed: now
    };

    this.cache.set(key, entry);
    this.addToTagIndex(key, tags);

    if (this.config.enableStats) {
      this.updateStats();
    }

    this.emit('set', key, data, tags);
    logger.debug(`Cache set: ${key} (TTL: ${ttl}ms, Tags: ${tags.join(', ')})`);
  }

  // Get cache entry
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      if (this.config.enableStats) {
        this.stats.totalMisses++;
        this.updateHitRate();
      }
      return null;
    }

    const now = Date.now();
    
    // Check if entry has expired
    if (now - entry.timestamp > entry.ttl) {
      this.delete(key);
      if (this.config.enableStats) {
        this.stats.totalMisses++;
        this.updateHitRate();
      }
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;

    if (this.config.enableStats) {
      this.stats.totalHits++;
      this.updateHitRate();
    }

    logger.debug(`Cache hit: ${key}`);
    return entry.data as T;
  }

  // Check if key exists and is not expired
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.delete(key);
      return false;
    }

    return true;
  }

  // Delete cache entry
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    this.cache.delete(key);
    this.removeFromTagIndex(key);

    if (this.config.enableStats) {
      this.updateStats();
    }

    this.emit('delete', key);
    logger.debug(`Cache delete: ${key}`);
    return true;
  }

  // Clear all cache entries
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.tagIndex.clear();

    if (this.config.enableStats) {
      this.updateStats();
    }

    this.emit('clear');
    logger.info(`Cache cleared: ${size} entries removed`);
  }

  // Invalidate entries by tag
  invalidateByTag(tag: string): number {
    const keys = this.tagIndex.get(tag);
    if (!keys) return 0;

    let count = 0;
    for (const key of keys) {
      if (this.delete(key)) {
        count++;
      }
    }

    this.emit('invalidate', tag, count);
    logger.info(`Cache invalidated by tag '${tag}': ${count} entries removed`);
    return count;
  }

  // Invalidate entries by multiple tags
  invalidateByTags(tags: string[]): number {
    let totalCount = 0;
    for (const tag of tags) {
      totalCount += this.invalidateByTag(tag);
    }
    return totalCount;
  }

  // Get entries by tag
  getByTag<T>(tag: string): T[] {
    const keys = this.tagIndex.get(tag);
    if (!keys) return [];

    const results: T[] = [];
    for (const key of keys) {
      const data = this.get<T>(key);
      if (data !== null) {
        results.push(data);
      }
    }

    return results;
  }

  // Get all keys
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  // Get all keys by tag
  keysByTag(tag: string): string[] {
    const keys = this.tagIndex.get(tag);
    return keys ? Array.from(keys) : [];
  }

  // Get cache statistics
  getStats(): CacheStats {
    if (this.config.enableStats) {
      this.updateStats();
    }
    return { ...this.stats };
  }

  // Refresh cache entry (extend TTL)
  refresh(key: string, newTTL?: number): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    entry.timestamp = now;
    entry.lastAccessed = now;
    
    if (newTTL !== undefined) {
      entry.ttl = newTTL;
    }

    logger.debug(`Cache refreshed: ${key}`);
    return true;
  }

  // Get or set pattern (cache-aside)
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: {
      ttl?: number;
      tags?: string[];
    } = {}
  ): Promise<T> {
    // Try to get from cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Not in cache, fetch data
    try {
      const data = await factory();
      this.set(key, data, options);
      return data;
    } catch (error) {
      logger.error(`Error in cache factory for key ${key}:`, error);
      throw error;
    }
  }

  // Batch operations
  setMany<T>(entries: Array<{
    key: string;
    data: T;
    ttl?: number;
    tags?: string[];
  }>): void {
    for (const entry of entries) {
      this.set(entry.key, entry.data, {
        ttl: entry.ttl,
        tags: entry.tags
      });
    }
  }

  getMany<T>(keys: string[]): Record<string, T | null> {
    const result: Record<string, T | null> = {};
    for (const key of keys) {
      result[key] = this.get<T>(key);
    }
    return result;
  }

  deleteMany(keys: string[]): number {
    let count = 0;
    for (const key of keys) {
      if (this.delete(key)) {
        count++;
      }
    }
    return count;
  }

  // Private methods
  private addToTagIndex(key: string, tags: string[]): void {
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    }
  }

  private removeFromTagIndex(key: string): void {
    const entry = this.cache.get(key);
    if (!entry) return;

    for (const tag of entry.tags) {
      const keys = this.tagIndex.get(tag);
      if (keys) {
        keys.delete(key);
        if (keys.size === 0) {
          this.tagIndex.delete(tag);
        }
      }
    }
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
      logger.debug(`Cache LRU eviction: ${oldestKey}`);
    }
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    if (expiredKeys.length > 0) {
      for (const key of expiredKeys) {
        this.delete(key);
      }
      logger.debug(`Cache cleanup: ${expiredKeys.length} expired entries removed`);
    }
  }

  private updateStats(): void {
    this.stats.totalEntries = this.cache.size;
    this.updateHitRate();
    this.updateMemoryUsage();
    this.updateTimestamps();
  }

  private updateHitRate(): void {
    const total = this.stats.totalHits + this.stats.totalMisses;
    this.stats.hitRate = total > 0 ? this.stats.totalHits / total : 0;
  }

  private updateMemoryUsage(): void {
    // Rough estimation of memory usage
    let size = 0;
    for (const entry of this.cache.values()) {
      size += JSON.stringify(entry).length;
    }
    this.stats.memoryUsage = size;
  }

  private updateTimestamps(): void {
    let oldest = Date.now();
    let newest = 0;

    for (const entry of this.cache.values()) {
      if (entry.timestamp < oldest) oldest = entry.timestamp;
      if (entry.timestamp > newest) newest = entry.timestamp;
    }

    this.stats.oldestEntry = oldest;
    this.stats.newestEntry = newest;
  }

  // Shutdown
  shutdown(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
    logger.info('Cache service shut down');
  }
}

// Predefined cache instances for different data types
export class ApplicationCache {
  private static instances: Map<string, CacheService> = new Map();

  static getMarketDataCache(): CacheService {
    if (!this.instances.has('market_data')) {
      this.instances.set('market_data', new CacheService({
        defaultTTL: 30000, // 30 seconds for market data
        maxSize: 1000,
        cleanupInterval: 60000
      }));
    }
    return this.instances.get('market_data')!;
  }

  static getUserDataCache(): CacheService {
    if (!this.instances.has('user_data')) {
      this.instances.set('user_data', new CacheService({
        defaultTTL: 60000, // 1 minute for user data
        maxSize: 5000,
        cleanupInterval: 120000
      }));
    }
    return this.instances.get('user_data')!;
  }

  static getContractDataCache(): CacheService {
    if (!this.instances.has('contract_data')) {
      this.instances.set('contract_data', new CacheService({
        defaultTTL: 120000, // 2 minutes for contract data
        maxSize: 2000,
        cleanupInterval: 180000
      }));
    }
    return this.instances.get('contract_data')!;
  }

  static getSystemCache(): CacheService {
    if (!this.instances.has('system')) {
      this.instances.set('system', new CacheService({
        defaultTTL: 300000, // 5 minutes for system data
        maxSize: 500,
        cleanupInterval: 300000
      }));
    }
    return this.instances.get('system')!;
  }

  static getAllCaches(): Map<string, CacheService> {
    return new Map(this.instances);
  }

  static clearAllCaches(): void {
    for (const cache of this.instances.values()) {
      cache.clear();
    }
  }

  static shutdownAllCaches(): void {
    for (const cache of this.instances.values()) {
      cache.shutdown();
    }
    this.instances.clear();
  }
}

// Export singleton instance
export const globalCache = new CacheService();