import { UserFriendlyError } from '../lib/blockchain-error-handler';
import { logger } from '../lib/logger';

export interface ErrorTranslation {
  title: string;
  message: string;
  suggestion: string;
  actions: ErrorAction[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'network' | 'wallet' | 'contract' | 'user' | 'system';
}

export interface ErrorAction {
  label: string;
  type: 'retry' | 'navigate' | 'external' | 'contact';
  url?: string;
  data?: any;
}

export class ErrorTranslationService {
  private static readonly ERROR_TRANSLATIONS: Record<string, ErrorTranslation> = {
    // Insufficient funds errors
    'INSUFFICIENT_FUNDS': {
      title: 'Insufficient Balance',
      message: 'You don\'t have enough SEI tokens to complete this transaction.',
      suggestion: 'Add more SEI to your wallet or reduce the transaction amount.',
      actions: [
        {
          label: 'Get SEI from Faucet',
          type: 'external',
          url: 'https://faucet.sei-apis.com/'
        },
        {
          label: 'Check Balance',
          type: 'navigate',
          url: '/wallet'
        },
        {
          label: 'Retry with Lower Amount',
          type: 'retry'
        }
      ],
      severity: 'medium',
      category: 'wallet'
    },

    // Transfer not found errors
    'TRANSFER_NOT_FOUND': {
      title: 'Transfer Not Found',
      message: 'The transfer you\'re looking for doesn\'t exist or has been removed.',
      suggestion: 'Please check the transfer ID and try again, or contact the sender.',
      actions: [
        {
          label: 'View All Transfers',
          type: 'navigate',
          url: '/payments'
        },
        {
          label: 'Contact Sender',
          type: 'contact'
        },
        {
          label: 'Refresh Data',
          type: 'retry'
        }
      ],
      severity: 'low',
      category: 'user'
    },

    // Transfer expired errors
    'TRANSFER_EXPIRED': {
      title: 'Transfer Expired',
      message: 'This transfer has passed its expiration date and can no longer be claimed.',
      suggestion: 'Contact the sender to create a new transfer for you.',
      actions: [
        {
          label: 'Contact Sender',
          type: 'contact'
        },
        {
          label: 'View Transfer History',
          type: 'navigate',
          url: '/payments'
        }
      ],
      severity: 'medium',
      category: 'user'
    },

    // Already claimed errors
    'TRANSFER_ALREADY_CLAIMED': {
      title: 'Transfer Already Claimed',
      message: 'This transfer has already been processed and claimed.',
      suggestion: 'Check your transaction history to see when it was claimed.',
      actions: [
        {
          label: 'View Transaction History',
          type: 'navigate',
          url: '/payments'
        },
        {
          label: 'Check Wallet Balance',
          type: 'navigate',
          url: '/wallet'
        }
      ],
      severity: 'low',
      category: 'user'
    },

    // Unauthorized errors
    'UNAUTHORIZED': {
      title: 'Access Denied',
      message: 'You don\'t have permission to perform this action.',
      suggestion: 'Make sure you\'re using the correct wallet address and try again.',
      actions: [
        {
          label: 'Check Wallet Connection',
          type: 'navigate',
          url: '/wallet'
        },
        {
          label: 'Reconnect Wallet',
          type: 'retry'
        }
      ],
      severity: 'medium',
      category: 'wallet'
    },

    // Gas estimation failed
    'GAS_ESTIMATION_FAILED': {
      title: 'Transaction Failed',
      message: 'Unable to estimate transaction fees due to network congestion.',
      suggestion: 'The network is busy. Try again in a few moments or increase gas fees.',
      actions: [
        {
          label: 'Retry Transaction',
          type: 'retry'
        },
        {
          label: 'Check Network Status',
          type: 'external',
          url: 'https://status.sei-apis.com/'
        }
      ],
      severity: 'medium',
      category: 'network'
    },

    // Contract execution failed
    'CONTRACT_EXECUTION_FAILED': {
      title: 'Smart Contract Error',
      message: 'The smart contract couldn\'t process your request.',
      suggestion: 'There may be a temporary issue with the contract. Please try again.',
      actions: [
        {
          label: 'Retry Transaction',
          type: 'retry'
        },
        {
          label: 'Contact Support',
          type: 'contact'
        },
        {
          label: 'Check System Status',
          type: 'navigate',
          url: '/health'
        }
      ],
      severity: 'high',
      category: 'contract'
    },

    // Invalid address
    'INVALID_ADDRESS': {
      title: 'Invalid Address',
      message: 'The wallet address format is incorrect.',
      suggestion: 'Please check the address format. Sei addresses start with "sei1".',
      actions: [
        {
          label: 'Address Format Guide',
          type: 'external',
          url: 'https://docs.sei.io/user-guides/wallet-setup'
        },
        {
          label: 'Try Again',
          type: 'retry'
        }
      ],
      severity: 'low',
      category: 'user'
    },

    // Sequence mismatch
    'SEQUENCE_MISMATCH': {
      title: 'Transaction Ordering Issue',
      message: 'Multiple transactions were sent too quickly.',
      suggestion: 'Please wait a moment and try again. Transactions need to be processed in order.',
      actions: [
        {
          label: 'Wait and Retry',
          type: 'retry'
        },
        {
          label: 'Check Pending Transactions',
          type: 'navigate',
          url: '/payments'
        }
      ],
      severity: 'low',
      category: 'user'
    },

    // Network timeout
    'NETWORK_TIMEOUT': {
      title: 'Network Timeout',
      message: 'The request took too long to complete.',
      suggestion: 'The network may be slow. Please try again in a moment.',
      actions: [
        {
          label: 'Retry Request',
          type: 'retry'
        },
        {
          label: 'Check Network Status',
          type: 'external',
          url: 'https://status.sei-apis.com/'
        },
        {
          label: 'Use Different Network',
          type: 'navigate',
          url: '/settings'
        }
      ],
      severity: 'medium',
      category: 'network'
    },

    // Connection refused
    'CONNECTION_REFUSED': {
      title: 'Connection Failed',
      message: 'Unable to connect to the blockchain network.',
      suggestion: 'The network may be temporarily unavailable. Please try again later.',
      actions: [
        {
          label: 'Retry Connection',
          type: 'retry'
        },
        {
          label: 'Check Network Status',
          type: 'external',
          url: 'https://status.sei-apis.com/'
        },
        {
          label: 'Contact Support',
          type: 'contact'
        }
      ],
      severity: 'high',
      category: 'network'
    },

    // DNS resolution failed
    'DNS_RESOLUTION_FAILED': {
      title: 'Network Connection Issue',
      message: 'Unable to resolve network address.',
      suggestion: 'Please check your internet connection and try again.',
      actions: [
        {
          label: 'Check Internet Connection',
          type: 'external',
          url: 'https://www.google.com'
        },
        {
          label: 'Retry Connection',
          type: 'retry'
        },
        {
          label: 'Use Mobile Data',
          type: 'retry'
        }
      ],
      severity: 'medium',
      category: 'network'
    },

    // Rate limited
    'RATE_LIMITED': {
      title: 'Too Many Requests',
      message: 'You\'ve made too many requests in a short time.',
      suggestion: 'Please wait a moment before trying again.',
      actions: [
        {
          label: 'Wait 30 Seconds',
          type: 'retry'
        },
        {
          label: 'Check Rate Limits',
          type: 'external',
          url: 'https://docs.sei.io/api/rate-limits'
        }
      ],
      severity: 'low',
      category: 'network'
    },

    // Wallet not found
    'WALLET_NOT_FOUND': {
      title: 'Wallet Extension Missing',
      message: 'No compatible wallet extension was found.',
      suggestion: 'Please install Keplr or Leap wallet extension and try again.',
      actions: [
        {
          label: 'Install Keplr',
          type: 'external',
          url: 'https://www.keplr.app/download'
        },
        {
          label: 'Install Leap',
          type: 'external',
          url: 'https://www.leapwallet.io/download'
        },
        {
          label: 'Wallet Setup Guide',
          type: 'external',
          url: 'https://docs.sei.io/user-guides/wallet-setup'
        }
      ],
      severity: 'high',
      category: 'wallet'
    },

    // Wallet locked
    'WALLET_LOCKED': {
      title: 'Wallet Locked',
      message: 'Your wallet is currently locked.',
      suggestion: 'Please unlock your wallet extension and try again.',
      actions: [
        {
          label: 'Unlock Wallet',
          type: 'retry'
        },
        {
          label: 'Wallet Help',
          type: 'external',
          url: 'https://docs.sei.io/user-guides/wallet-setup'
        }
      ],
      severity: 'medium',
      category: 'wallet'
    },

    // User rejected
    'USER_REJECTED': {
      title: 'Transaction Rejected',
      message: 'You rejected the transaction in your wallet.',
      suggestion: 'Please try again and approve the transaction when prompted.',
      actions: [
        {
          label: 'Try Again',
          type: 'retry'
        },
        {
          label: 'Transaction Help',
          type: 'external',
          url: 'https://docs.sei.io/user-guides/transactions'
        }
      ],
      severity: 'low',
      category: 'user'
    },

    // Chain not found
    'CHAIN_NOT_FOUND': {
      title: 'Network Not Added',
      message: 'The Sei network is not configured in your wallet.',
      suggestion: 'Please add the Sei network to your wallet and try again.',
      actions: [
        {
          label: 'Add Sei Network',
          type: 'retry'
        },
        {
          label: 'Network Setup Guide',
          type: 'external',
          url: 'https://docs.sei.io/user-guides/wallet-setup'
        }
      ],
      severity: 'medium',
      category: 'wallet'
    }
  };

  /**
   * Translate a blockchain error into user-friendly format
   */
  static translateError(error: UserFriendlyError): ErrorTranslation {
    const translation = this.ERROR_TRANSLATIONS[error.type];
    
    if (translation) {
      return translation;
    }

    // Default translation for unknown errors
    return {
      title: 'Unexpected Error',
      message: error.message || 'An unexpected error occurred.',
      suggestion: error.suggestion || 'Please try again or contact support if the issue persists.',
      actions: [
        {
          label: 'Try Again',
          type: 'retry'
        },
        {
          label: 'Contact Support',
          type: 'contact'
        },
        {
          label: 'Check System Status',
          type: 'navigate',
          url: '/health'
        }
      ],
      severity: 'medium',
      category: 'system'
    };
  }

  /**
   * Get suggested actions based on error type
   */
  static getSuggestedActions(errorType: string): ErrorAction[] {
    const translation = this.ERROR_TRANSLATIONS[errorType];
    return translation?.actions || [
      {
        label: 'Try Again',
        type: 'retry'
      },
      {
        label: 'Contact Support',
        type: 'contact'
      }
    ];
  }

  /**
   * Log error with translation for debugging
   */
  static logTranslatedError(error: UserFriendlyError, context: string): void {
    const translation = this.translateError(error);
    
    logger.error(`Translated error in ${context}`, {
      errorType: error.type,
      errorCode: error.code,
      title: translation.title,
      message: translation.message,
      suggestion: translation.suggestion,
      severity: translation.severity,
      category: translation.category,
      actions: translation.actions.map(a => a.label),
      originalError: error.details?.originalError,
      context
    });
  }

  /**
   * Get error severity level
   */
  static getErrorSeverity(errorType: string): 'low' | 'medium' | 'high' | 'critical' {
    const translation = this.ERROR_TRANSLATIONS[errorType];
    return translation?.severity || 'medium';
  }

  /**
   * Check if error is user-recoverable
   */
  static isRecoverable(errorType: string): boolean {
    const nonRecoverableErrors = [
      'TRANSFER_EXPIRED',
      'TRANSFER_ALREADY_CLAIMED',
      'INVALID_ADDRESS'
    ];
    
    return !nonRecoverableErrors.includes(errorType);
  }

  /**
   * Get recovery time estimate in seconds
   */
  static getRecoveryTimeEstimate(errorType: string): number | null {
    const recoveryTimes: Record<string, number> = {
      'NETWORK_TIMEOUT': 30,
      'RATE_LIMITED': 60,
      'SEQUENCE_MISMATCH': 10,
      'GAS_ESTIMATION_FAILED': 30,
      'CONNECTION_REFUSED': 120
    };
    
    return recoveryTimes[errorType] || null;
  }
}

// Error reporting service for debugging and monitoring
export class ErrorReportingService {
  private static errorCounts = new Map<string, number>();
  private static lastReported = new Map<string, number>();
  private static readonly REPORT_THRESHOLD = 5;
  private static readonly REPORT_INTERVAL = 300000; // 5 minutes

  /**
   * Report error for monitoring and debugging
   */
  static reportError(error: UserFriendlyError, context: string, userId?: string): void {
    const errorKey = `${error.type}-${context}`;
    const now = Date.now();
    
    // Increment error count
    const currentCount = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, currentCount + 1);
    
    // Check if we should report this error
    const lastReportTime = this.lastReported.get(errorKey) || 0;
    const shouldReport = (
      currentCount >= this.REPORT_THRESHOLD ||
      now - lastReportTime > this.REPORT_INTERVAL
    );
    
    if (shouldReport) {
      this.sendErrorReport(error, context, currentCount, userId);
      this.lastReported.set(errorKey, now);
      this.errorCounts.set(errorKey, 0); // Reset counter
    }
    
    // Log for immediate debugging
    ErrorTranslationService.logTranslatedError(error, context);
  }

  /**
   * Send error report to monitoring system
   */
  private static sendErrorReport(
    error: UserFriendlyError,
    context: string,
    count: number,
    userId?: string
  ): void {
    const translation = ErrorTranslationService.translateError(error);
    
    // In a real implementation, this would send to a monitoring service
    logger.warn('Error report generated', {
      errorType: error.type,
      errorCode: error.code,
      context,
      count,
      userId,
      severity: translation.severity,
      category: translation.category,
      isRecoverable: ErrorTranslationService.isRecoverable(error.type),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get error statistics for monitoring
   */
  static getErrorStats(): Record<string, number> {
    return Object.fromEntries(this.errorCounts);
  }

  /**
   * Reset error statistics
   */
  static resetStats(): void {
    this.errorCounts.clear();
    this.lastReported.clear();
  }
}