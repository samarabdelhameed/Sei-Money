import { FastifyInstance, FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import { logger } from '../../../lib/logger';
import { BlockchainErrorHandler, UserFriendlyError } from '../../../lib/blockchain-error-handler';
import { ErrorTranslationService, ErrorReportingService } from '../../errorTranslationService';
import { FallbackDataService, UIStateService } from '../../fallbackDataService';

export interface EnhancedError extends Error {
  statusCode?: number;
  code?: string;
  validation?: any[];
  userFriendly?: UserFriendlyError;
  context?: string;
  userId?: string;
}

export async function registerErrorHandler(app: FastifyInstance): Promise<void> {
  // Global error handler
  app.setErrorHandler(async (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    const context = `${request.method} ${request.url}`;
    const userId = (request as any).user?.address;
    
    // Handle validation errors
    if (error.validation) {
      const validationError: UserFriendlyError = {
        type: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        suggestion: 'Please check your input and try again',
        code: 'ERR_VALIDATION',
        retryable: true,
        details: { validation: error.validation }
      };
      
      const translation = ErrorTranslationService.translateError(validationError);
      
      reply.status(400).send({
        ok: false,
        error: 'Validation failed',
        details: error.validation,
        errorType: validationError.type,
        translation
      });
      return;
    }

    // Handle blockchain-specific errors
    const userFriendlyError = BlockchainErrorHandler.categorizeError(error);
    const translation = ErrorTranslationService.translateError(userFriendlyError);
    const uiState = UIStateService.getUIState(userFriendlyError.type);
    
    // Report error for monitoring
    ErrorReportingService.reportError(userFriendlyError, context, userId);
    
    // Determine status code
    let statusCode = error.statusCode || 500;
    
    // Override status code based on error type
    switch (userFriendlyError.type) {
      case 'INSUFFICIENT_FUNDS':
      case 'INVALID_ADDRESS':
      case 'TRANSFER_EXPIRED':
      case 'TRANSFER_ALREADY_CLAIMED':
        statusCode = 400;
        break;
      case 'UNAUTHORIZED':
      case 'WALLET_LOCKED':
        statusCode = 401;
        break;
      case 'TRANSFER_NOT_FOUND':
        statusCode = 404;
        break;
      case 'NETWORK_TIMEOUT':
      case 'CONNECTION_REFUSED':
      case 'RPC_ERROR':
        statusCode = 503;
        break;
      case 'RATE_LIMITED':
        statusCode = 429;
        break;
    }

    // Try to provide fallback data for certain endpoints
    let fallbackData = null;
    if (uiState.showFallbackData) {
      try {
        if (request.url.includes('/transfers')) {
          fallbackData = FallbackDataService.getFallbackData('transfers');
        } else if (request.url.includes('/vaults')) {
          fallbackData = FallbackDataService.getFallbackData('vaults');
        } else if (request.url.includes('/groups')) {
          fallbackData = FallbackDataService.getFallbackData('groups');
        } else if (request.url.includes('/pots')) {
          fallbackData = FallbackDataService.getFallbackData('pots');
        } else if (request.url.includes('/market')) {
          fallbackData = FallbackDataService.getFallbackData('marketStats');
        }
      } catch (fallbackError) {
        logger.warn('Failed to get fallback data:', fallbackError);
      }
    }

    // Log error with appropriate level
    const severity = ErrorTranslationService.getErrorSeverity(userFriendlyError.type);
    const logData = {
      errorType: userFriendlyError.type,
      errorCode: userFriendlyError.code,
      statusCode,
      context,
      userId,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      severity,
      retryable: userFriendlyError.retryable,
      originalError: error.message,
      stack: error.stack
    };

    switch (severity) {
      case 'critical':
        logger.error('Critical error occurred', logData);
        break;
      case 'high':
        logger.error('High severity error', logData);
        break;
      case 'medium':
        logger.warn('Medium severity error', logData);
        break;
      case 'low':
        logger.info('Low severity error', logData);
        break;
    }

    // Send error response
    reply.status(statusCode).send({
      ok: false,
      error: translation.title,
      message: translation.message,
      suggestion: translation.suggestion,
      errorType: userFriendlyError.type,
      errorCode: userFriendlyError.code,
      translation,
      uiState,
      retryable: userFriendlyError.retryable,
      recoveryTime: ErrorTranslationService.getRecoveryTimeEstimate(userFriendlyError.type),
      fallbackData,
      timestamp: new Date().toISOString(),
      requestId: request.id
    });
  });

  // Not found handler
  app.setNotFoundHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const userFriendlyError: UserFriendlyError = {
      type: 'NOT_FOUND',
      message: 'The requested resource was not found',
      suggestion: 'Please check the URL and try again',
      code: 'ERR_NOT_FOUND',
      retryable: false
    };
    
    const translation = ErrorTranslationService.translateError(userFriendlyError);
    
    reply.status(404).send({
      ok: false,
      error: 'Not Found',
      message: `Route ${request.method} ${request.url} not found`,
      errorType: userFriendlyError.type,
      translation,
      timestamp: new Date().toISOString(),
      requestId: request.id
    });
  });
}

// Async error wrapper for route handlers
export function asyncErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args);
    } catch (error) {
      // Re-throw to let the global error handler catch it
      throw error;
    }
  };
}

// Error boundary for critical operations
export async function withErrorBoundary<T>(
  operation: () => Promise<T>,
  context: string,
  fallbackValue?: T
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const userFriendlyError = BlockchainErrorHandler.categorizeError(error);
    
    logger.error(`Error boundary caught error in ${context}`, {
      errorType: userFriendlyError.type,
      errorCode: userFriendlyError.code,
      message: userFriendlyError.message,
      context,
      originalError: error
    });

    // Return fallback value if provided and error is recoverable
    if (fallbackValue !== undefined && userFriendlyError.retryable) {
      logger.info(`Using fallback value for ${context}`);
      return fallbackValue;
    }

    // Re-throw if no fallback or error is not recoverable
    throw error;
  }
}

// Health check error handler
export function createHealthCheckHandler() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Check various system components
      const healthChecks = await Promise.allSettled([
        checkDatabaseHealth(),
        checkBlockchainHealth(),
        checkCacheHealth(),
        checkExternalServicesHealth()
      ]);

      const results = {
        database: getHealthResult(healthChecks[0]),
        blockchain: getHealthResult(healthChecks[1]),
        cache: getHealthResult(healthChecks[2]),
        externalServices: getHealthResult(healthChecks[3])
      };

      const overallHealth = Object.values(results).every(r => r.status === 'healthy');
      const statusCode = overallHealth ? 200 : 503;

      reply.status(statusCode).send({
        ok: overallHealth,
        status: overallHealth ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: results,
        version: process.env['npm_package_version'] || '1.0.0',
        uptime: process.uptime(),
        environment: process.env['NODE_ENV'] || 'development'
      });
    } catch (error) {
      const userFriendlyError = BlockchainErrorHandler.categorizeError(error);
      const translation = ErrorTranslationService.translateError(userFriendlyError);
      
      reply.status(503).send({
        ok: false,
        status: 'unhealthy',
        error: 'Health check failed',
        errorType: userFriendlyError.type,
        translation,
        timestamp: new Date().toISOString()
      });
    }
  };
}

// Helper functions for health checks
async function checkDatabaseHealth(): Promise<{ status: string; responseTime: number }> {
  const start = Date.now();
  // Add actual database health check here
  return {
    status: 'healthy',
    responseTime: Date.now() - start
  };
}

async function checkBlockchainHealth(): Promise<{ status: string; responseTime: number }> {
  const start = Date.now();
  try {
    // Use the network fallback service to check blockchain health
    const { networkFallbackService } = await import('../../networkFallbackService');
    const status = networkFallbackService.getNetworkStatus();
    
    return {
      status: status.healthyCount > 0 ? 'healthy' : 'unhealthy',
      responseTime: Date.now() - start
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - start
    };
  }
}

async function checkCacheHealth(): Promise<{ status: string; responseTime: number }> {
  const start = Date.now();
  // Add actual cache health check here
  return {
    status: 'healthy',
    responseTime: Date.now() - start
  };
}

async function checkExternalServicesHealth(): Promise<{ status: string; responseTime: number }> {
  const start = Date.now();
  // Add external services health check here
  return {
    status: 'healthy',
    responseTime: Date.now() - start
  };
}

function getHealthResult(result: PromiseSettledResult<any>): any {
  if (result.status === 'fulfilled') {
    return result.value;
  } else {
    return {
      status: 'unhealthy',
      error: result.reason?.message || 'Unknown error',
      responseTime: 0
    };
  }
}