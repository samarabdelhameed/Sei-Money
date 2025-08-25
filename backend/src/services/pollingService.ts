import { EventEmitter } from 'events';
import { getMarketDataService } from './marketDataService';
import { getRealDataService } from './realDataService';
import { getNetworkService } from './networkService';
import { ApplicationCache } from './cacheService';
import { getWebSocketService } from './websocketService';
import { logger } from '../lib/logger';

export interface PollingTask {
  id: string;
  name: string;
  interval: number; // milliseconds
  priority: 'high' | 'medium' | 'low';
  enabled: boolean;
  lastRun: number;
  nextRun: number;
  runCount: number;
  errorCount: number;
  maxRetries: number;
  timeout: number;
  handler: () => Promise<any>;
}

export interface PollingConfig {
  maxConcurrentTasks: number;
  defaultTimeout: number;
  retryDelay: number;
  healthCheckInterval: number;
}

export class PollingService extends EventEmitter {
  private tasks: Map<string, PollingTask> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private runningTasks: Set<string> = new Set();
  private config: PollingConfig;
  private isRunning: boolean = false;
  private healthCheckTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<PollingConfig> = {}) {
    super();
    
    this.config = {
      maxConcurrentTasks: 10,
      defaultTimeout: 30000, // 30 seconds
      retryDelay: 5000, // 5 seconds
      healthCheckInterval: 60000, // 1 minute
      ...config
    };

    this.setupDefaultTasks();
  }

  private setupDefaultTasks(): void {
    // High priority tasks - critical data that needs frequent updates
    this.addTask({
      id: 'market_stats',
      name: 'Market Statistics',
      interval: 15000, // 15 seconds
      priority: 'high',
      enabled: true,
      maxRetries: 3,
      timeout: 10000,
      handler: async () => {
        const marketDataService = await getMarketDataService();
        const stats = await marketDataService.getMarketStats();
        
        // Update cache
        const cache = ApplicationCache.getMarketDataCache();
        cache.set('market_stats', stats, {
          ttl: 30000,
          tags: ['market', 'stats']
        });

        // Broadcast to WebSocket clients
        const wsService = getWebSocketService();
        await wsService.broadcastToChannel('market_stats', stats);

        return stats;
      }
    });

    this.addTask({
      id: 'network_health',
      name: 'Network Health Check',
      interval: 30000, // 30 seconds
      priority: 'high',
      enabled: true,
      maxRetries: 2,
      timeout: 15000,
      handler: async () => {
        const networkService = getNetworkService();
        const health = await networkService.getNetworkHealth();
        
        // Update cache
        const cache = ApplicationCache.getSystemCache();
        cache.set('network_health', health, {
          ttl: 60000,
          tags: ['network', 'health']
        });

        // Emit health status change if needed
        this.emit('network_health', health);

        return health;
      }
    });

    // Medium priority tasks - important but less time-sensitive
    this.addTask({
      id: 'vault_performance',
      name: 'Vault Performance Update',
      interval: 60000, // 1 minute
      priority: 'medium',
      enabled: true,
      maxRetries: 3,
      timeout: 20000,
      handler: async () => {
        const marketDataService = await getMarketDataService();
        const performance = await marketDataService.calculateVaultPerformance();
        
        // Update cache
        const cache = ApplicationCache.getContractDataCache();
        cache.set('vault_performance', performance, {
          ttl: 120000,
          tags: ['vaults', 'performance']
        });

        // Broadcast to WebSocket clients
        const wsService = getWebSocketService();
        await wsService.broadcastToChannel('vaults', { 
          type: 'performance_update', 
          data: performance 
        });

        return performance;
      }
    });

    this.addTask({
      id: 'user_activity',
      name: 'User Activity Metrics',
      interval: 120000, // 2 minutes
      priority: 'medium',
      enabled: true,
      maxRetries: 2,
      timeout: 25000,
      handler: async () => {
        const marketDataService = await getMarketDataService();
        const activity = await marketDataService.calculateActiveUsers();
        
        // Update cache
        const cache = ApplicationCache.getMarketDataCache();
        cache.set('user_activity', activity, {
          ttl: 180000,
          tags: ['users', 'activity']
        });

        return activity;
      }
    });

    // Low priority tasks - background maintenance
    this.addTask({
      id: 'cache_cleanup',
      name: 'Cache Cleanup',
      interval: 300000, // 5 minutes
      priority: 'low',
      enabled: true,
      maxRetries: 1,
      timeout: 10000,
      handler: async () => {
        // Clean up expired cache entries
        const caches = ApplicationCache.getAllCaches();
        let totalCleaned = 0;

        for (const [name, cache] of caches) {
          const stats = cache.getStats();
          logger.debug(`Cache ${name} stats:`, stats);
          totalCleaned += stats.totalEntries;
        }

        return { totalCleaned };
      }
    });

    this.addTask({
      id: 'system_metrics',
      name: 'System Metrics Collection',
      interval: 180000, // 3 minutes
      priority: 'low',
      enabled: true,
      maxRetries: 1,
      timeout: 15000,
      handler: async () => {
        const metrics = {
          timestamp: new Date().toISOString(),
          memory: process.memoryUsage(),
          uptime: process.uptime(),
          pollingTasks: this.getTaskStats(),
          cacheStats: this.getCacheStats()
        };

        // Update cache
        const cache = ApplicationCache.getSystemCache();
        cache.set('system_metrics', metrics, {
          ttl: 300000,
          tags: ['system', 'metrics']
        });

        return metrics;
      }
    });
  }

  addTask(taskConfig: Omit<PollingTask, 'lastRun' | 'nextRun' | 'runCount' | 'errorCount'>): void {
    const task: PollingTask = {
      ...taskConfig,
      lastRun: 0,
      nextRun: Date.now() + taskConfig.interval,
      runCount: 0,
      errorCount: 0
    };

    this.tasks.set(task.id, task);
    
    if (this.isRunning && task.enabled) {
      this.scheduleTask(task);
    }

    logger.info(`Polling task added: ${task.name} (${task.interval}ms interval)`);
  }

  removeTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    // Clear timer if exists
    const timer = this.timers.get(taskId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(taskId);
    }

    this.tasks.delete(taskId);
    this.runningTasks.delete(taskId);

    logger.info(`Polling task removed: ${task.name}`);
    return true;
  }

  enableTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    task.enabled = true;
    
    if (this.isRunning) {
      this.scheduleTask(task);
    }

    logger.info(`Polling task enabled: ${task.name}`);
    return true;
  }

  disableTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    task.enabled = false;
    
    // Clear timer
    const timer = this.timers.get(taskId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(taskId);
    }

    this.runningTasks.delete(taskId);

    logger.info(`Polling task disabled: ${task.name}`);
    return true;
  }

  start(): void {
    if (this.isRunning) {
      logger.warn('Polling service is already running');
      return;
    }

    this.isRunning = true;

    // Schedule all enabled tasks
    for (const task of this.tasks.values()) {
      if (task.enabled) {
        this.scheduleTask(task);
      }
    }

    // Start health check
    this.startHealthCheck();

    logger.info('Polling service started');
    this.emit('started');
  }

  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();

    // Stop health check
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    this.runningTasks.clear();

    logger.info('Polling service stopped');
    this.emit('stopped');
  }

  private scheduleTask(task: PollingTask): void {
    if (!this.isRunning || !task.enabled) return;

    const delay = Math.max(0, task.nextRun - Date.now());
    
    const timer = setTimeout(async () => {
      await this.executeTask(task);
    }, delay);

    this.timers.set(task.id, timer);
  }

  private async executeTask(task: PollingTask): Promise<void> {
    if (this.runningTasks.has(task.id)) {
      logger.warn(`Task ${task.name} is already running, skipping`);
      return;
    }

    // Check concurrent task limit
    if (this.runningTasks.size >= this.config.maxConcurrentTasks) {
      logger.warn(`Max concurrent tasks reached, delaying ${task.name}`);
      task.nextRun = Date.now() + this.config.retryDelay;
      this.scheduleTask(task);
      return;
    }

    this.runningTasks.add(task.id);
    const startTime = Date.now();

    try {
      logger.debug(`Executing task: ${task.name}`);

      // Execute with timeout
      const result = await Promise.race([
        task.handler(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Task timeout')), task.timeout)
        )
      ]);

      // Update task statistics
      task.lastRun = Date.now();
      task.runCount++;
      task.nextRun = task.lastRun + task.interval;
      task.errorCount = 0; // Reset error count on success

      const duration = Date.now() - startTime;
      logger.debug(`Task completed: ${task.name} (${duration}ms)`);

      this.emit('task_completed', task.id, result, duration);

    } catch (error) {
      task.errorCount++;
      const duration = Date.now() - startTime;
      
      logger.error(`Task failed: ${task.name} (attempt ${task.errorCount}/${task.maxRetries})`, error);

      if (task.errorCount >= task.maxRetries) {
        logger.error(`Task ${task.name} exceeded max retries, disabling`);
        task.enabled = false;
        this.emit('task_failed', task.id, error);
      } else {
        // Retry with exponential backoff
        const retryDelay = this.config.retryDelay * Math.pow(2, task.errorCount - 1);
        task.nextRun = Date.now() + retryDelay;
        logger.info(`Retrying task ${task.name} in ${retryDelay}ms`);
      }

      this.emit('task_error', task.id, error, duration);
    } finally {
      this.runningTasks.delete(task.id);
      
      // Schedule next run if task is still enabled
      if (task.enabled && this.isRunning) {
        this.scheduleTask(task);
      }
    }
  }

  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  private performHealthCheck(): void {
    const now = Date.now();
    const stuckTasks: string[] = [];

    for (const [taskId, task] of this.tasks.entries()) {
      if (!task.enabled) continue;

      // Check if task is stuck (hasn't run in 2x its interval)
      const maxDelay = task.interval * 2;
      if (now - task.lastRun > maxDelay && task.lastRun > 0) {
        stuckTasks.push(taskId);
      }
    }

    if (stuckTasks.length > 0) {
      logger.warn(`Detected stuck tasks: ${stuckTasks.join(', ')}`);
      
      // Restart stuck tasks
      for (const taskId of stuckTasks) {
        const task = this.tasks.get(taskId);
        if (task) {
          logger.info(`Restarting stuck task: ${task.name}`);
          task.nextRun = now;
          this.scheduleTask(task);
        }
      }
    }

    this.emit('health_check', {
      totalTasks: this.tasks.size,
      enabledTasks: Array.from(this.tasks.values()).filter(t => t.enabled).length,
      runningTasks: this.runningTasks.size,
      stuckTasks: stuckTasks.length
    });
  }

  // Public query methods
  getTask(taskId: string): PollingTask | undefined {
    return this.tasks.get(taskId);
  }

  getAllTasks(): PollingTask[] {
    return Array.from(this.tasks.values());
  }

  getTaskStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [taskId, task] of this.tasks.entries()) {
      stats[taskId] = {
        name: task.name,
        enabled: task.enabled,
        priority: task.priority,
        interval: task.interval,
        lastRun: task.lastRun,
        nextRun: task.nextRun,
        runCount: task.runCount,
        errorCount: task.errorCount,
        isRunning: this.runningTasks.has(taskId)
      };
    }

    return stats;
  }

  private getCacheStats(): Record<string, any> {
    const caches = ApplicationCache.getAllCaches();
    const stats: Record<string, any> = {};

    for (const [name, cache] of caches) {
      stats[name] = cache.getStats();
    }

    return stats;
  }

  // Manual task execution
  async runTaskNow(taskId: string): Promise<any> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    logger.info(`Manually executing task: ${task.name}`);
    return await this.executeTask(task);
  }

  // Update task configuration
  updateTask(taskId: string, updates: Partial<PollingTask>): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    // Update allowed properties
    const allowedUpdates = ['interval', 'priority', 'enabled', 'maxRetries', 'timeout'];
    for (const key of allowedUpdates) {
      if (key in updates) {
        (task as any)[key] = (updates as any)[key];
      }
    }

    // Reschedule if interval changed
    if ('interval' in updates && task.enabled && this.isRunning) {
      const timer = this.timers.get(taskId);
      if (timer) {
        clearTimeout(timer);
      }
      task.nextRun = Date.now() + task.interval;
      this.scheduleTask(task);
    }

    logger.info(`Task updated: ${task.name}`);
    return true;
  }

  shutdown(): void {
    this.stop();
    this.tasks.clear();
    logger.info('Polling service shut down');
  }
}

// Singleton instance
let pollingServiceInstance: PollingService | null = null;

export function getPollingService(): PollingService {
  if (!pollingServiceInstance) {
    pollingServiceInstance = new PollingService();
  }
  return pollingServiceInstance;
}