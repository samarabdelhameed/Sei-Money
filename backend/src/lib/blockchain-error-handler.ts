import { logger } from './logger';

export interface UserFriendlyError {
  type: string;
  message: string;
  suggestion: string;
  code?: string;
  retryable?: boolean;
  details?: any;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export class BlockchainErrorHandler {
  private static readonly DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  };

  /**
   * Handle contract execution errors with user-friendly messages
   */
  static handleContractError(error: any): UserFriendlyError {
    const errorMessage = error.message || error.toString();
    
    // Insufficient funds error
    if (errorMessage.includes('insufficient funds') || 
        errorMessage.includes('insufficient balance') ||
        errorMessage.includes('not enough balance')) {
      return {
        type: 'INSUFFICIENT_FUNDS',
        message: 'Insufficient balance to complete transaction',
        suggestion: 'Please add more SEI to your wallet or reduce the transaction amount',
        code: 'ERR_INSUFFICIENT_FUNDS',
        retryable: false,
        details: { originalError: errorMessage }
      };
    }

    // Transfer not found
    if (errorMessage.includes('transfer not found') || 
        errorMessage.includes('TransferNotFound')) {
      return {
        type: 'TRANSFER_NOT_FOUND',
        message: 'Transfer not found',
        suggestion: 'Please check the transfer ID and try again',
        code: 'ERR_TRANSFER_NOT_FOUND',
        retryable: false,
        details: { originalError: errorMessage }
      };
    }

    // Transfer expired
    if (errorMessage.includes('expired') || 
        errorMessage.includes('TransferExpired')) {
      return {
        type: 'TRANSFER_EXPIRED',
        message: 'Transfer has expired',
        suggestion: 'This transfer can no longer be claimed. Contact the sender for a new transfer',
        code: 'ERR_TRANSFER_EXPIRED',
        retryable: false,
        details: { originalError: errorMessage }
      };
    }

    // Already claimed
    if (errorMessage.includes('already claimed') || 
        errorMessage.includes('TransferAlreadyClaimed')) {
      return {
        type: 'TRANSFER_ALREADY_CLAIMED',
        message: 'Transfer has already been claimed',
        suggestion: 'This transfer was already processed. Check your transaction history',
        code: 'ERR_TRANSFER_ALREADY_CLAIMED',
        retryable: false,
        details: { originalError: errorMessage }
      };
    }

    // Unauthorized access
    if (errorMessage.includes('unauthorized') || 
        errorMessage.includes('Unauthorized') ||
        errorMessage.includes('permission denied')) {
      return {
        type: 'UNAUTHORIZED',
        message: 'You are not authorized to perform this action',
        suggestion: 'Make sure you are using the correct wallet address',
        code: 'ERR_UNAUTHORIZED',
        retryable: false,
        details: { originalError: errorMessage }
      };
    }

    // Gas estimation failed
    if (errorMessage.includes('gas estimation failed') || 
        errorMessage.includes('out of gas')) {
      return {
        type: 'GAS_ESTIMATION_FAILED',
        message: 'Transaction gas estimation failed',
        suggestion: 'The network is congested. Try again with higher gas or wait a moment',
        code: 'ERR_GAS_ESTIMATION_FAILED',
        retryable: true,
        details: { originalError: errorMessage }
      };
    }

    // Contract execution failed
    if (errorMessage.includes('contract execution failed') || 
        errorMessage.includes('execute contract failed')) {
      return {
        type: 'CONTRACT_EXECUTION_FAILED',
        message: 'Smart contract execution failed',
        suggestion: 'There was an issue with the contract. Please try again or contact support',
        code: 'ERR_CONTRACT_EXECUTION_FAILED',
        retryable: true,
        details: { originalError: errorMessage }
      };
    }

    // Invalid address format
    if (errorMessage.includes('invalid address') || 
        errorMessage.includes('decoding bech32 failed')) {
      return {
        type: 'INVALID_ADDRESS',
        message: 'Invalid wallet address format',
        suggestion: 'Please check the wallet address format. Sei addresses start with "sei1"',
        code: 'ERR_INVALID_ADDRESS',
        retryable: false,
        details: { originalError: errorMessage }
      };
    }

    // Sequence mismatch (transaction ordering issue)
    if (errorMessage.includes('account sequence mismatch') || 
        errorMessage.includes('sequence mismatch')) {
      return {
        type: 'SEQUENCE_MISMATCH',
        message: 'Transaction sequence error',
        suggestion: 'Please wait a moment and try again. Multiple transactions were sent too quickly',
        code: 'ERR_SEQUENCE_MISMATCH',
        retryable: true,
        details: { originalError: errorMessage }
      };
    }

    // Default unknown error
    return {
      type: 'UNKNOWN_CONTRACT_ERROR',
      message: 'An unexpected contract error occurred',
      suggestion: 'Please try again or contact support if the issue persists',
      code: 'ERR_UNKNOWN_CONTRACT',
      retryable: true,
      details: { originalError: errorMessage }
    };
  }

  /**
   * Handle network connectivity errors
   */
  static handleNetworkError(error: any): UserFriendlyError {
    const errorMessage = error.message || error.toString();
    const errorCode = error.code || error.errno;

    // Connection timeout
    if (errorCode === 'ETIMEDOUT' || 
        errorMessage.includes('timeout') ||
        errorMessage.includes('TIMEOUT')) {
      return {
        type: 'NETWORK_TIMEOUT',
        message: 'Network request timed out',
        suggestion: 'The network is busy. Please try again in a moment',
        code: 'ERR_NETWORK_TIMEOUT',
        retryable: true,
        details: { originalError: errorMessage, errorCode }
      };
    }

    // Connection refused
    if (errorCode === 'ECONNREFUSED' || 
        errorMessage.includes('connection refused')) {
      return {
        type: 'CONNECTION_REFUSED',
        message: 'Unable to connect to blockchain network',
        suggestion: 'The network may be down. Please try again later',
        code: 'ERR_CONNECTION_REFUSED',
        retryable: true,
        details: { originalError: errorMessage, errorCode }
      };
    }

    // DNS resolution failed
    if (errorCode === 'ENOTFOUND' || 
        errorMessage.includes('getaddrinfo ENOTFOUND')) {
      return {
        type: 'DNS_RESOLUTION_FAILED',
        message: 'Unable to resolve network address',
        suggestion: 'Please check your internet connection and try again',
        code: 'ERR_DNS_RESOLUTION_FAILED',
        retryable: true,
        details: { originalError: errorMessage, errorCode }
      };
    }

    // Network unreachable
    if (errorCode === 'ENETUNREACH' || 
        errorMessage.includes('network unreachable')) {
      return {
        type: 'NETWORK_UNREACHABLE',
        message: 'Network is unreachable',
        suggestion: 'Please check your internet connection and try again',
        code: 'ERR_NETWORK_UNREACHABLE',
        retryable: true,
        details: { originalError: errorMessage, errorCode }
      };
    }

    // Rate limiting
    if (errorMessage.includes('rate limit') || 
        errorMessage.includes('too many requests') ||
        errorMessage.includes('429')) {
      return {
        type: 'RATE_LIMITED',
        message: 'Too many requests',
        suggestion: 'Please wait a moment before trying again',
        code: 'ERR_RATE_LIMITED',
        retryable: true,
        details: { originalError: errorMessage, errorCode }
      };
    }

    // RPC endpoint error
    if (errorMessage.includes('RPC') || 
        errorMessage.includes('rpc')) {
      return {
        type: 'RPC_ERROR',
        message: 'Blockchain RPC error',
        suggestion: 'There is an issue with the blockchain connection. Please try again',
        code: 'ERR_RPC_ERROR',
        retryable: true,
        details: { originalError: errorMessage, errorCode }
      };
    }

    // Default network error
    return {
      type: 'NETWORK_ERROR',
      message: 'Network connection failed',
      suggestion: 'Please check your internet connection and try again',
      code: 'ERR_NETWORK_ERROR',
      retryable: true,
      details: { originalError: errorMessage, errorCode }
    };
  }

  /**
   * Handle wallet-related errors
   */
  static handleWalletError(error: any): UserFriendlyError {
    const errorMessage = error.message || error.toString();

    // Wallet not found
    if (errorMessage.includes('wallet not found') || 
        errorMessage.includes('extension not found')) {
      return {
        type: 'WALLET_NOT_FOUND',
        message: 'Wallet extension not found',
        suggestion: 'Please install Keplr or Leap wallet extension and try again',
        code: 'ERR_WALLET_NOT_FOUND',
        retryable: false,
        details: { originalError: errorMessage }
      };
    }

    // Wallet locked
    if (errorMessage.includes('wallet is locked') || 
        errorMessage.includes('unlock wallet')) {
      return {
        type: 'WALLET_LOCKED',
        message: 'Wallet is locked',
        suggestion: 'Please unlock your wallet and try again',
        code: 'ERR_WALLET_LOCKED',
        retryable: true,
        details: { originalError: errorMessage }
      };
    }

    // User rejected transaction
    if (errorMessage.includes('user rejected') || 
        errorMessage.includes('user denied') ||
        errorMessage.includes('rejected by user')) {
      return {
        type: 'USER_REJECTED',
        message: 'Transaction was rejected',
        suggestion: 'You rejected the transaction. Please try again and approve it',
        code: 'ERR_USER_REJECTED',
        retryable: true,
        details: { originalError: errorMessage }
      };
    }

    // Chain not added
    if (errorMessage.includes('chain not found') || 
        errorMessage.includes('unknown chain')) {
      return {
        type: 'CHAIN_NOT_FOUND',
        message: 'Sei network not found in wallet',
        suggestion: 'Please add the Sei network to your wallet and try again',
        code: 'ERR_CHAIN_NOT_FOUND',
        retryable: false,
        details: { originalError: errorMessage }
      };
    }

    return {
      type: 'WALLET_ERROR',
      message: 'Wallet error occurred',
      suggestion: 'Please check your wallet connection and try again',
      code: 'ERR_WALLET_ERROR',
      retryable: true,
      details: { originalError: errorMessage }
    };
  }

  /**
   * Retry mechanism with exponential backoff
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const retryConfig = { ...this.DEFAULT_RETRY_CONFIG, ...config };
    let lastError: any;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry on the last attempt
        if (attempt === retryConfig.maxRetries) {
          break;
        }

        // Check if error is retryable
        const userFriendlyError = this.categorizeError(error);
        if (!userFriendlyError.retryable) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt),
          retryConfig.maxDelay
        );

        logger.warn(`Operation failed, retrying in ${delay}ms (attempt ${attempt + 1}/${retryConfig.maxRetries + 1})`, {
          error: error.message,
          attempt: attempt + 1,
          delay
        });

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Categorize any error into a user-friendly format
   */
  static categorizeError(error: any): UserFriendlyError {
    // Try contract error first
    if (error.message && (
      error.message.includes('contract') ||
      error.message.includes('execute') ||
      error.message.includes('insufficient') ||
      error.message.includes('unauthorized')
    )) {
      return this.handleContractError(error);
    }

    // Try wallet error
    if (error.message && (
      error.message.includes('wallet') ||
      error.message.includes('extension') ||
      error.message.includes('rejected') ||
      error.message.includes('chain')
    )) {
      return this.handleWalletError(error);
    }

    // Try network error
    if (error.code || 
        (error.message && (
          error.message.includes('network') ||
          error.message.includes('timeout') ||
          error.message.includes('connection') ||
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('ETIMEDOUT')
        ))) {
      return this.handleNetworkError(error);
    }

    // Default to contract error handling
    return this.handleContractError(error);
  }

  /**
   * Log error with context for debugging
   */
  static logError(error: any, context: string, additionalData?: any): void {
    const userFriendlyError = this.categorizeError(error);
    
    logger.error(`Blockchain error in ${context}`, {
      errorType: userFriendlyError.type,
      errorCode: userFriendlyError.code,
      message: userFriendlyError.message,
      suggestion: userFriendlyError.suggestion,
      retryable: userFriendlyError.retryable,
      originalError: error.message || error.toString(),
      stack: error.stack,
      context,
      additionalData
    });
  }
}