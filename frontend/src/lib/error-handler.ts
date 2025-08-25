export interface UserFriendlyError {
  type: string;
  message: string;
  suggestion: string;
  code?: string;
  retryable?: boolean;
  details?: any;
}

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

export interface UIState {
  showRetryButton: boolean;
  showFallbackData: boolean;
  showErrorMessage: boolean;
  showLoadingSpinner: boolean;
  disableInteractions: boolean;
}

export class FrontendErrorHandler {
  private static errorCounts = new Map<string, number>();
  private static lastReported = new Map<string, number>();

  /**
   * Handle API response errors
   */
  static handleApiError(error: any, context: string): {
    userFriendlyError: UserFriendlyError;
    translation: ErrorTranslation;
    uiState: UIState;
    fallbackData?: any;
  } {
    // If error response contains structured error info, use it
    if (error.response?.data?.errorType && error.response?.data?.translation) {
      return {
        userFriendlyError: {
          type: error.response.data.errorType,
          message: error.response.data.message,
          suggestion: error.response.data.suggestion || error.response.data.translation.suggestion,
          code: error.response.data.errorCode,
          retryable: error.response.data.retryable
        },
        translation: error.response.data.translation,
        uiState: error.response.data.uiState || this.getDefaultUIState(error.response.data.errorType),
        fallbackData: error.response.data.fallbackData
      };
    }

    // Handle network errors
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
      const userFriendlyError: UserFriendlyError = {
        type: 'NETWORK_ERROR',
        message: 'Network connection failed',
        suggestion: 'Please check your internet connection and try again',
        code: 'ERR_NETWORK',
        retryable: true
      };

      return {
        userFriendlyError,
        translation: this.getErrorTranslation(userFriendlyError.type),
        uiState: this.getDefaultUIState(userFriendlyError.type)
      };
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      const userFriendlyError: UserFriendlyError = {
        type: 'NETWORK_TIMEOUT',
        message: 'Request timed out',
        suggestion: 'The network is busy. Please try again in a moment',
        code: 'ERR_TIMEOUT',
        retryable: true
      };

      return {
        userFriendlyError,
        translation: this.getErrorTranslation(userFriendlyError.type),
        uiState: this.getDefaultUIState(userFriendlyError.type)
      };
    }

    // Handle HTTP status codes
    if (error.response?.status) {
      const status = error.response.status;
      let errorType = 'UNKNOWN_ERROR';
      let message = 'An unexpected error occurred';
      let suggestion = 'Please try again or contact support';

      switch (status) {
        case 400:
          errorType = 'BAD_REQUEST';
          message = 'Invalid request';
          suggestion = 'Please check your input and try again';
          break;
        case 401:
          errorType = 'UNAUTHORIZED';
          message = 'Authentication required';
          suggestion = 'Please connect your wallet and try again';
          break;
        case 403:
          errorType = 'FORBIDDEN';
          message = 'Access denied';
          suggestion = 'You don\'t have permission to perform this action';
          break;
        case 404:
          errorType = 'NOT_FOUND';
          message = 'Resource not found';
          suggestion = 'The requested resource doesn\'t exist';
          break;
        case 429:
          errorType = 'RATE_LIMITED';
          message = 'Too many requests';
          suggestion = 'Please wait a moment before trying again';
          break;
        case 500:
          errorType = 'SERVER_ERROR';
          message = 'Server error';
          suggestion = 'There\'s a temporary issue with our servers. Please try again';
          break;
        case 503:
          errorType = 'SERVICE_UNAVAILABLE';
          message = 'Service temporarily unavailable';
          suggestion = 'Our services are temporarily down. Please try again later';
          break;
      }

      const userFriendlyError: UserFriendlyError = {
        type: errorType,
        message,
        suggestion,
        code: `ERR_HTTP_${status}`,
        retryable: status >= 500 || status === 429
      };

      return {
        userFriendlyError,
        translation: this.getErrorTranslation(userFriendlyError.type),
        uiState: this.getDefaultUIState(userFriendlyError.type)
      };
    }

    // Default error handling
    const userFriendlyError: UserFriendlyError = {
      type: 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred',
      suggestion: 'Please try again or contact support if the issue persists',
      code: 'ERR_UNKNOWN',
      retryable: true
    };

    return {
      userFriendlyError,
      translation: this.getErrorTranslation(userFriendlyError.type),
      uiState: this.getDefaultUIState(userFriendlyError.type)
    };
  }

  /**
   * Handle wallet connection errors
   */
  static handleWalletError(error: any): {
    userFriendlyError: UserFriendlyError;
    translation: ErrorTranslation;
    uiState: UIState;
  } {
    let errorType = 'WALLET_ERROR';
    let message = 'Wallet error occurred';
    let suggestion = 'Please check your wallet and try again';

    if (error.message?.includes('User rejected') || error.message?.includes('rejected')) {
      errorType = 'USER_REJECTED';
      message = 'Transaction was rejected';
      suggestion = 'You rejected the transaction. Please try again and approve it';
    } else if (error.message?.includes('wallet not found') || error.message?.includes('extension not found')) {
      errorType = 'WALLET_NOT_FOUND';
      message = 'Wallet extension not found';
      suggestion = 'Please install Keplr or Leap wallet extension';
    } else if (error.message?.includes('locked')) {
      errorType = 'WALLET_LOCKED';
      message = 'Wallet is locked';
      suggestion = 'Please unlock your wallet and try again';
    } else if (error.message?.includes('chain not found')) {
      errorType = 'CHAIN_NOT_FOUND';
      message = 'Sei network not found in wallet';
      suggestion = 'Please add the Sei network to your wallet';
    }

    const userFriendlyError: UserFriendlyError = {
      type: errorType,
      message,
      suggestion,
      code: `ERR_${errorType}`,
      retryable: errorType !== 'WALLET_NOT_FOUND'
    };

    return {
      userFriendlyError,
      translation: this.getErrorTranslation(userFriendlyError.type),
      uiState: this.getDefaultUIState(userFriendlyError.type)
    };
  }

  /**
   * Get error translation for display
   */
  private static getErrorTranslation(errorType: string): ErrorTranslation {
    const translations: Record<string, ErrorTranslation> = {
      'NETWORK_ERROR': {
        title: 'Connection Failed',
        message: 'Unable to connect to the network',
        suggestion: 'Please check your internet connection and try again',
        actions: [
          { label: 'Retry', type: 'retry' },
          { label: 'Check Network Status', type: 'external', url: 'https://status.sei-apis.com/' }
        ],
        severity: 'medium',
        category: 'network'
      },
      'NETWORK_TIMEOUT': {
        title: 'Request Timeout',
        message: 'The request took too long to complete',
        suggestion: 'The network may be slow. Please try again',
        actions: [
          { label: 'Try Again', type: 'retry' },
          { label: 'Check Network Status', type: 'external', url: 'https://status.sei-apis.com/' }
        ],
        severity: 'medium',
        category: 'network'
      },
      'INSUFFICIENT_FUNDS': {
        title: 'Insufficient Balance',
        message: 'You don\'t have enough SEI tokens',
        suggestion: 'Add more SEI to your wallet or reduce the amount',
        actions: [
          { label: 'Get SEI from Faucet', type: 'external', url: 'https://faucet.sei-apis.com/' },
          { label: 'Check Balance', type: 'navigate', url: '/wallet' }
        ],
        severity: 'medium',
        category: 'wallet'
      },
      'UNAUTHORIZED': {
        title: 'Authentication Required',
        message: 'Please connect your wallet',
        suggestion: 'Connect your wallet to continue',
        actions: [
          { label: 'Connect Wallet', type: 'retry' }
        ],
        severity: 'medium',
        category: 'wallet'
      },
      'WALLET_NOT_FOUND': {
        title: 'Wallet Extension Missing',
        message: 'No compatible wallet extension found',
        suggestion: 'Please install a supported wallet extension',
        actions: [
          { label: 'Install Keplr', type: 'external', url: 'https://www.keplr.app/download' },
          { label: 'Install Leap', type: 'external', url: 'https://www.leapwallet.io/download' }
        ],
        severity: 'high',
        category: 'wallet'
      },
      'USER_REJECTED': {
        title: 'Transaction Rejected',
        message: 'You rejected the transaction',
        suggestion: 'Please try again and approve the transaction',
        actions: [
          { label: 'Try Again', type: 'retry' }
        ],
        severity: 'low',
        category: 'user'
      },
      'RATE_LIMITED': {
        title: 'Too Many Requests',
        message: 'You\'ve made too many requests',
        suggestion: 'Please wait a moment before trying again',
        actions: [
          { label: 'Wait and Retry', type: 'retry' }
        ],
        severity: 'low',
        category: 'network'
      }
    };

    return translations[errorType] || {
      title: 'Unexpected Error',
      message: 'An unexpected error occurred',
      suggestion: 'Please try again or contact support',
      actions: [
        { label: 'Try Again', type: 'retry' },
        { label: 'Contact Support', type: 'contact' }
      ],
      severity: 'medium',
      category: 'system'
    };
  }

  /**
   * Get default UI state for error type
   */
  private static getDefaultUIState(errorType: string): UIState {
    const states: Record<string, UIState> = {
      'NETWORK_ERROR': {
        showRetryButton: true,
        showFallbackData: true,
        showErrorMessage: true,
        showLoadingSpinner: false,
        disableInteractions: false
      },
      'NETWORK_TIMEOUT': {
        showRetryButton: true,
        showFallbackData: true,
        showErrorMessage: true,
        showLoadingSpinner: false,
        disableInteractions: false
      },
      'RATE_LIMITED': {
        showRetryButton: false,
        showFallbackData: false,
        showErrorMessage: true,
        showLoadingSpinner: true,
        disableInteractions: true
      },
      'INSUFFICIENT_FUNDS': {
        showRetryButton: false,
        showFallbackData: false,
        showErrorMessage: true,
        showLoadingSpinner: false,
        disableInteractions: false
      },
      'WALLET_NOT_FOUND': {
        showRetryButton: false,
        showFallbackData: false,
        showErrorMessage: true,
        showLoadingSpinner: false,
        disableInteractions: true
      },
      'USER_REJECTED': {
        showRetryButton: true,
        showFallbackData: false,
        showErrorMessage: false,
        showLoadingSpinner: false,
        disableInteractions: false
      }
    };

    return states[errorType] || {
      showRetryButton: true,
      showFallbackData: false,
      showErrorMessage: true,
      showLoadingSpinner: false,
      disableInteractions: false
    };
  }

  /**
   * Report error for analytics
   */
  static reportError(error: UserFriendlyError, context: string, userId?: string): void {
    const errorKey = `${error.type}-${context}`;
    const now = Date.now();
    
    // Increment error count
    const currentCount = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, currentCount + 1);
    
    // Check if we should report this error
    const lastReportTime = this.lastReported.get(errorKey) || 0;
    const shouldReport = currentCount >= 3 || now - lastReportTime > 300000; // 5 minutes
    
    if (shouldReport) {
      // In a real implementation, this would send to analytics service
      console.warn('Error reported:', {
        errorType: error.type,
        errorCode: error.code,
        context,
        count: currentCount,
        userId,
        timestamp: new Date().toISOString()
      });
      
      this.lastReported.set(errorKey, now);
      this.errorCounts.set(errorKey, 0); // Reset counter
    }
  }

  /**
   * Get recovery time estimate
   */
  static getRecoveryTimeEstimate(errorType: string): number | null {
    const recoveryTimes: Record<string, number> = {
      'NETWORK_TIMEOUT': 30,
      'RATE_LIMITED': 60,
      'CONNECTION_REFUSED': 120
    };
    
    return recoveryTimes[errorType] || null;
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(errorType: string): boolean {
    const nonRetryableErrors = [
      'INSUFFICIENT_FUNDS',
      'WALLET_NOT_FOUND',
      'INVALID_ADDRESS',
      'TRANSFER_EXPIRED',
      'TRANSFER_ALREADY_CLAIMED'
    ];
    
    return !nonRetryableErrors.includes(errorType);
  }
}

// Error boundary hook for React components
export function useErrorHandler() {
  const handleError = (error: any, context: string) => {
    const result = FrontendErrorHandler.handleApiError(error, context);
    FrontendErrorHandler.reportError(result.userFriendlyError, context);
    return result;
  };

  const handleWalletError = (error: any) => {
    const result = FrontendErrorHandler.handleWalletError(error);
    FrontendErrorHandler.reportError(result.userFriendlyError, 'wallet');
    return result;
  };

  return {
    handleError,
    handleWalletError,
    isRetryable: FrontendErrorHandler.isRetryable,
    getRecoveryTime: FrontendErrorHandler.getRecoveryTimeEstimate
  };
}