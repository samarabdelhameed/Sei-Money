import { ApiResponse } from '../../types';

// Error Types
export interface BlockchainError {
  type: 'network' | 'rpc' | 'contract' | 'transaction' | 'validation' | 'timeout';
  code: string;
  message: string;
  details?: any;
  timestamp: number;
  retryable: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export interface ErrorRecoveryStrategy {
  type: 'retry' | 'fallback' | 'alternative_endpoint' | 'cache' | 'manual';
  config: any;
  priority: number;
}

export interface ErrorHandlerConfig {
  enableRetry: boolean;
  enableFallback: boolean;
  enableAlternativeEndpoints: boolean;
  enableErrorReporting: boolean;
  retryConfig: RetryConfig;
  fallbackStrategies: ErrorRecoveryStrategy[];
  alternativeEndpoints: {
    rpc: string[];
    api: string[];
  };
}

export interface ErrorHandlerService {
  // Core error handling
  handleError<T>(error: any, context: string, operation: () => Promise<ApiResponse<T>>): Promise<ApiResponse<T>>;
  handleBlockchainError<T>(error: any, operation: () => Promise<ApiResponse<T>>): Promise<ApiResponse<T>>;
  handleApiError<T>(error: any, operation: () => Promise<ApiResponse<T>>): Promise<ApiResponse<T>>;
  
  // Retry mechanisms
  retryOperation<T>(operation: () => Promise<ApiResponse<T>>, config?: Partial<RetryConfig>): Promise<ApiResponse<T>>;
  
  // Fallback strategies
  executeWithFallback<T>(
    primary: () => Promise<ApiResponse<T>>,
    fallbacks: (() => Promise<ApiResponse<T>>)[]
  ): Promise<ApiResponse<T>>;
  
  // Alternative endpoints
  tryAlternativeEndpoints<T>(
    operation: (endpoint: string) => Promise<ApiResponse<T>>,
    endpoints: string[]
  ): Promise<ApiResponse<T>>;
  
  // Error classification
  classifyError(error: any): BlockchainError;
  isRetryableError(error: any): boolean;
  
  // Configuration
  updateConfig(config: Partial<ErrorHandlerConfig>): void;
  getConfig(): ErrorHandlerConfig;
  
  // Monitoring
  getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    retrySuccessRate: number;
    averageRetryAttempts: number;
  };
  
  // Health monitoring
  checkEndpointHealth(endpoint: string): Promise<boolean>;
  getHealthyEndpoints(endpoints: string[]): Promise<string[]>;
}

class ErrorHandlerServiceImpl implements ErrorHandlerService {
  private config: ErrorHandlerConfig = {
    enableRetry: true,
    enableFallback: true,
    enableAlternativeEndpoints: true,
    enableErrorReporting: true,
    retryConfig: {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      retryableErrors: [
        'NETWORK_ERROR',
        'TIMEOUT_ERROR',
        'RPC_ERROR',
        'RATE_LIMIT_ERROR',
        'TEMPORARY_ERROR'
      ]
    },
    fallbackStrategies: [
      { type: 'alternative_endpoint', config: {}, priority: 1 },
      { type: 'cache', config: { maxAge: 300000 }, priority: 2 },
      { type: 'retry', config: { maxAttempts: 2 }, priority: 3 }
    ],
    alternativeEndpoints: {
      rpc: [
        'https://rpc.sei-apis.com',
        'https://sei-rpc.polkachu.com',
        'https://sei-rpc.brocha.in'
      ],
      api: [
        'https://api.coingecko.com/api/v3',
        'https://pro-api.coinmarketcap.com/v1'
      ]
    }
  };

  private errorStats = {
    totalErrors: 0,
    errorsByType: {} as Record<string, number>,
    retryAttempts: 0,
    retrySuccesses: 0
  };

  private endpointHealth: Map<string, { isHealthy: boolean; lastCheck: number }> = new Map();
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

  async handleError<T>(error: any, context: string, operation: () => Promise<ApiResponse<T>>): Promise<ApiResponse<T>> {
    const classifiedError = this.classifyError(error);
    this.recordError(classifiedError);

    console.error(`Error in ${context}:`, classifiedError);

    // Try recovery strategies based on error type
    if (classifiedError.type === 'network' || classifiedError.type === 'rpc') {
      return this.handleBlockchainError(error, operation);
    } else if (classifiedError.type === 'timeout' || classifiedError.code === 'RATE_LIMIT') {
      return this.handleApiError(error, operation);
    }

    // Default retry if error is retryable
    if (this.config.enableRetry && classifiedError.retryable) {
      return this.retryOperation(operation);
    }

    return {
      success: false,
      error: classifiedError.message,
      timestamp: Date.now()
    };
  }

  async handleBlockchainError<T>(error: any, operation: () => Promise<ApiResponse<T>>): Promise<ApiResponse<T>> {
    const strategies = this.config.fallbackStrategies
      .filter(s => s.type === 'alternative_endpoint' || s.type === 'retry')
      .sort((a, b) => a.priority - b.priority);

    for (const strategy of strategies) {
      try {
        switch (strategy.type) {
          case 'alternative_endpoint':
            if (this.config.enableAlternativeEndpoints) {
              const healthyEndpoints = await this.getHealthyEndpoints(this.config.alternativeEndpoints.rpc);
              if (healthyEndpoints.length > 0) {
                // Try with alternative endpoints
                const result = await this.tryAlternativeEndpoints(
                  async (endpoint) => {
                    // This would need to be implemented to use the alternative endpoint
                    return operation();
                  },
                  healthyEndpoints
                );
                if (result.success) return result;
              }
            }
            break;

          case 'retry':
            if (this.config.enableRetry) {
              const result = await this.retryOperation(operation, strategy.config);
              if (result.success) return result;
            }
            break;
        }
      } catch (strategyError) {
        console.error(`Recovery strategy ${strategy.type} failed:`, strategyError);
      }
    }

    return {
      success: false,
      error: 'All blockchain recovery strategies failed',
      timestamp: Date.now()
    };
  }

  async handleApiError<T>(error: any, operation: () => Promise<ApiResponse<T>>): Promise<ApiResponse<T>> {
    const classifiedError = this.classifyError(error);

    // Handle rate limiting
    if (classifiedError.code === 'RATE_LIMIT') {
      const delay = this.extractRetryAfter(error) || 5000;
      console.log(`Rate limited, waiting ${delay}ms before retry`);
      await this.sleep(delay);
      return this.retryOperation(operation, { maxAttempts: 1 });
    }

    // Try cache fallback
    if (this.config.enableFallback) {
      const cacheKey = this.generateCacheKey(operation.toString());
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        console.log('Using cached data due to API error');
        return {
          success: true,
          data: cached.data,
          timestamp: Date.now()
        };
      }
    }

    // Try alternative API endpoints
    if (this.config.enableAlternativeEndpoints) {
      const healthyEndpoints = await this.getHealthyEndpoints(this.config.alternativeEndpoints.api);
      if (healthyEndpoints.length > 0) {
        return this.tryAlternativeEndpoints(
          async (endpoint) => {
            // This would need to be implemented to use the alternative endpoint
            return operation();
          },
          healthyEndpoints
        );
      }
    }

    return {
      success: false,
      error: classifiedError.message,
      timestamp: Date.now()
    };
  }

  async retryOperation<T>(operation: () => Promise<ApiResponse<T>>, config?: Partial<RetryConfig>): Promise<ApiResponse<T>> {
    const retryConfig = { ...this.config.retryConfig, ...config };
    let lastError: any;

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        this.errorStats.retryAttempts++;
        
        const result = await operation();
        
        if (result.success) {
          if (attempt > 1) {
            this.errorStats.retrySuccesses++;
            console.log(`Operation succeeded on attempt ${attempt}`);
          }
          return result;
        }
        
        lastError = result.error;
        
        // Don't retry if error is not retryable
        if (!this.isRetryableError(result.error)) {
          break;
        }

      } catch (error) {
        lastError = error;
        
        if (!this.isRetryableError(error)) {
          break;
        }
      }

      // Calculate delay for next attempt
      if (attempt < retryConfig.maxAttempts) {
        const delay = Math.min(
          retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt - 1),
          retryConfig.maxDelay
        );
        
        console.log(`Retrying operation in ${delay}ms (attempt ${attempt + 1}/${retryConfig.maxAttempts})`);
        await this.sleep(delay);
      }
    }

    return {
      success: false,
      error: lastError instanceof Error ? lastError.message : lastError || 'Operation failed after retries',
      timestamp: Date.now()
    };
  }

  async executeWithFallback<T>(
    primary: () => Promise<ApiResponse<T>>,
    fallbacks: (() => Promise<ApiResponse<T>>)[]
  ): Promise<ApiResponse<T>> {
    try {
      const result = await primary();
      if (result.success) return result;
    } catch (error) {
      console.error('Primary operation failed:', error);
    }

    for (let i = 0; i < fallbacks.length; i++) {
      try {
        console.log(`Trying fallback ${i + 1}/${fallbacks.length}`);
        const result = await fallbacks[i]();
        if (result.success) {
          console.log(`Fallback ${i + 1} succeeded`);
          return result;
        }
      } catch (error) {
        console.error(`Fallback ${i + 1} failed:`, error);
      }
    }

    return {
      success: false,
      error: 'All operations failed including fallbacks',
      timestamp: Date.now()
    };
  }

  async tryAlternativeEndpoints<T>(
    operation: (endpoint: string) => Promise<ApiResponse<T>>,
    endpoints: string[]
  ): Promise<ApiResponse<T>> {
    let lastError: any;

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying alternative endpoint: ${endpoint}`);
        const result = await operation(endpoint);
        
        if (result.success) {
          console.log(`Alternative endpoint succeeded: ${endpoint}`);
          this.updateEndpointHealth(endpoint, true);
          return result;
        }
        
        lastError = result.error;
        this.updateEndpointHealth(endpoint, false);
        
      } catch (error) {
        console.error(`Alternative endpoint failed: ${endpoint}`, error);
        lastError = error;
        this.updateEndpointHealth(endpoint, false);
      }
    }

    return {
      success: false,
      error: lastError instanceof Error ? lastError.message : lastError || 'All alternative endpoints failed',
      timestamp: Date.now()
    };
  }

  classifyError(error: any): BlockchainError {
    let type: BlockchainError['type'] = 'network';
    let code = 'UNKNOWN_ERROR';
    let message = 'An unknown error occurred';
    let retryable = false;
    let severity: BlockchainError['severity'] = 'medium';

    if (error instanceof Error) {
      message = error.message;
      
      // Network errors
      if (error.message.includes('fetch') || error.message.includes('network')) {
        type = 'network';
        code = 'NETWORK_ERROR';
        retryable = true;
        severity = 'high';
      }
      // Timeout errors
      else if (error.message.includes('timeout')) {
        type = 'timeout';
        code = 'TIMEOUT_ERROR';
        retryable = true;
        severity = 'medium';
      }
      // RPC errors
      else if (error.message.includes('RPC') || error.message.includes('rpc')) {
        type = 'rpc';
        code = 'RPC_ERROR';
        retryable = true;
        severity = 'high';
      }
      // Contract errors
      else if (error.message.includes('contract') || error.message.includes('execution')) {
        type = 'contract';
        code = 'CONTRACT_ERROR';
        retryable = false;
        severity = 'high';
      }
      // Transaction errors
      else if (error.message.includes('transaction') || error.message.includes('tx')) {
        type = 'transaction';
        code = 'TRANSACTION_ERROR';
        retryable = false;
        severity = 'medium';
      }
      // Validation errors
      else if (error.message.includes('validation') || error.message.includes('invalid')) {
        type = 'validation';
        code = 'VALIDATION_ERROR';
        retryable = false;
        severity = 'low';
      }
    }
    
    // Handle HTTP errors
    if (typeof error === 'object' && error.status) {
      if (error.status === 429) {
        code = 'RATE_LIMIT_ERROR';
        retryable = true;
        severity = 'medium';
      } else if (error.status >= 500) {
        code = 'SERVER_ERROR';
        retryable = true;
        severity = 'high';
      } else if (error.status >= 400) {
        code = 'CLIENT_ERROR';
        retryable = false;
        severity = 'low';
      }
    }

    return {
      type,
      code,
      message,
      details: error,
      timestamp: Date.now(),
      retryable,
      severity
    };
  }

  isRetryableError(error: any): boolean {
    const classified = this.classifyError(error);
    return classified.retryable && this.config.retryConfig.retryableErrors.includes(classified.code);
  }

  updateConfig(config: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): ErrorHandlerConfig {
    return { ...this.config };
  }

  getErrorStats() {
    const retrySuccessRate = this.errorStats.retryAttempts > 0 
      ? (this.errorStats.retrySuccesses / this.errorStats.retryAttempts) * 100 
      : 0;

    return {
      totalErrors: this.errorStats.totalErrors,
      errorsByType: { ...this.errorStats.errorsByType },
      retrySuccessRate,
      averageRetryAttempts: this.errorStats.retryAttempts / Math.max(this.errorStats.totalErrors, 1)
    };
  }

  async checkEndpointHealth(endpoint: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(endpoint, {
        method: 'HEAD',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      const isHealthy = response.ok;
      this.updateEndpointHealth(endpoint, isHealthy);
      
      return isHealthy;
    } catch (error) {
      this.updateEndpointHealth(endpoint, false);
      return false;
    }
  }

  async getHealthyEndpoints(endpoints: string[]): Promise<string[]> {
    const healthChecks = await Promise.allSettled(
      endpoints.map(async (endpoint) => {
        const cached = this.endpointHealth.get(endpoint);
        
        // Use cached health status if recent (within 5 minutes)
        if (cached && Date.now() - cached.lastCheck < 300000) {
          return { endpoint, isHealthy: cached.isHealthy };
        }
        
        const isHealthy = await this.checkEndpointHealth(endpoint);
        return { endpoint, isHealthy };
      })
    );

    return healthChecks
      .filter((result): result is PromiseFulfilledResult<{ endpoint: string; isHealthy: boolean }> => 
        result.status === 'fulfilled' && result.value.isHealthy
      )
      .map(result => result.value.endpoint);
  }

  // Private helper methods
  private recordError(error: BlockchainError): void {
    this.errorStats.totalErrors++;
    this.errorStats.errorsByType[error.type] = (this.errorStats.errorsByType[error.type] || 0) + 1;
  }

  private updateEndpointHealth(endpoint: string, isHealthy: boolean): void {
    this.endpointHealth.set(endpoint, {
      isHealthy,
      lastCheck: Date.now()
    });
  }

  private extractRetryAfter(error: any): number | null {
    if (error.headers && error.headers['retry-after']) {
      return parseInt(error.headers['retry-after']) * 1000;
    }
    return null;
  }

  private generateCacheKey(operation: string): string {
    // Simple hash function for cache key
    let hash = 0;
    for (let i = 0; i < operation.length; i++) {
      const char = operation.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `cache_${Math.abs(hash)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const errorHandlerService = new ErrorHandlerServiceImpl();
export default errorHandlerService;