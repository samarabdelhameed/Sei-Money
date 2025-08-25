import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Wifi, 
  RefreshCw, 
  ExternalLink, 
  MessageCircle, 
  Clock,
  X,
  Info
} from 'lucide-react';
import { ErrorTranslation, UIState, UserFriendlyError } from '../../lib/error-handler';

interface ErrorDisplayProps {
  error: UserFriendlyError;
  translation: ErrorTranslation;
  uiState: UIState;
  onRetry?: () => void;
  onDismiss?: () => void;
  fallbackData?: any;
  recoveryTime?: number | null;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  translation,
  uiState,
  onRetry,
  onDismiss,
  fallbackData,
  recoveryTime,
  className = ''
}) => {
  const [countdown, setCountdown] = useState<number | null>(recoveryTime);
  const [isRetrying, setIsRetrying] = useState(false);

  // Countdown timer for recovery time
  useEffect(() => {
    if (countdown && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => prev ? prev - 1 : null);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [countdown]);

  const handleRetry = async () => {
    if (onRetry && !isRetrying) {
      setIsRetrying(true);
      try {
        await onRetry();
      } finally {
        setIsRetrying(false);
      }
    }
  };

  const handleAction = (action: any) => {
    switch (action.type) {
      case 'retry':
        handleRetry();
        break;
      case 'navigate':
        if (action.url) {
          window.location.href = action.url;
        }
        break;
      case 'external':
        if (action.url) {
          window.open(action.url, '_blank', 'noopener,noreferrer');
        }
        break;
      case 'contact':
        // Open contact modal or redirect to support
        window.open('mailto:support@seimoney.com', '_blank');
        break;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-500/10 text-red-400';
      case 'high':
        return 'border-orange-500 bg-orange-500/10 text-orange-400';
      case 'medium':
        return 'border-yellow-500 bg-yellow-500/10 text-yellow-400';
      case 'low':
        return 'border-blue-500 bg-blue-500/10 text-blue-400';
      default:
        return 'border-gray-500 bg-gray-500/10 text-gray-400';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-5 h-5" />;
      case 'medium':
        return <Info className="w-5 h-5" />;
      case 'low':
        return <Info className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'network':
        return <Wifi className="w-4 h-4" />;
      case 'wallet':
        return <MessageCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  if (!uiState.showErrorMessage) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`
          relative rounded-lg border-2 p-4 backdrop-blur-sm
          ${getSeverityColor(translation.severity)}
          ${className}
        `}
      >
        {/* Dismiss button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Error header */}
        <div className="flex items-start space-x-3 mb-3">
          <div className="flex-shrink-0 mt-0.5">
            {getSeverityIcon(translation.severity)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-lg font-semibold text-white">
                {translation.title}
              </h3>
              <div className="flex items-center space-x-1 text-xs opacity-60">
                {getCategoryIcon(translation.category)}
                <span>{translation.category}</span>
              </div>
            </div>
            <p className="text-sm opacity-90 mb-2">
              {translation.message}
            </p>
            <p className="text-xs opacity-70">
              {translation.suggestion}
            </p>
          </div>
        </div>

        {/* Recovery countdown */}
        {countdown && countdown > 0 && (
          <div className="flex items-center space-x-2 mb-3 text-sm opacity-80">
            <Clock className="w-4 h-4" />
            <span>Retry available in {countdown} seconds</span>
          </div>
        )}

        {/* Loading spinner */}
        {uiState.showLoadingSpinner && (
          <div className="flex items-center space-x-2 mb-3 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Please wait...</span>
          </div>
        )}

        {/* Error actions */}
        {translation.actions.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {translation.actions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleAction(action)}
                disabled={
                  uiState.disableInteractions || 
                  (action.type === 'retry' && (isRetrying || (countdown && countdown > 0)))
                }
                className={`
                  inline-flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium
                  transition-all duration-200
                  ${action.type === 'retry' 
                    ? 'bg-white/20 hover:bg-white/30 text-white' 
                    : 'bg-white/10 hover:bg-white/20 text-white/80'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {action.type === 'retry' && isRetrying ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : action.type === 'external' ? (
                  <ExternalLink className="w-4 h-4" />
                ) : action.type === 'contact' ? (
                  <MessageCircle className="w-4 h-4" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Fallback data notice */}
        {uiState.showFallbackData && fallbackData && (
          <div className="mt-3 p-3 rounded-md bg-white/5 border border-white/10">
            <div className="flex items-center space-x-2 text-sm text-white/80">
              <Info className="w-4 h-4" />
              <span>Showing cached data while we reconnect</span>
            </div>
          </div>
        )}

        {/* Technical details (collapsible) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-3">
            <summary className="text-xs cursor-pointer opacity-60 hover:opacity-80">
              Technical Details
            </summary>
            <div className="mt-2 p-2 rounded bg-black/20 text-xs font-mono">
              <div>Type: {error.type}</div>
              <div>Code: {error.code}</div>
              <div>Retryable: {error.retryable ? 'Yes' : 'No'}</div>
              {error.details && (
                <div>Details: {JSON.stringify(error.details, null, 2)}</div>
              )}
            </div>
          </details>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// Compact error display for inline use
export const CompactErrorDisplay: React.FC<{
  error: UserFriendlyError;
  onRetry?: () => void;
  className?: string;
}> = ({ error, onRetry, className = '' }) => {
  return (
    <div className={`
      flex items-center space-x-2 p-2 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm
      ${className}
    `}>
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1 min-w-0 truncate">{error.message}</span>
      {onRetry && error.retryable && (
        <button
          onClick={onRetry}
          className="flex-shrink-0 p-1 rounded hover:bg-red-500/20 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

// Error boundary component
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      
      if (FallbackComponent && this.state.error) {
        return <FallbackComponent error={this.state.error} />;
      }

      return (
        <div className="p-6 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Something went wrong</h3>
          </div>
          <p className="text-sm opacity-80 mb-4">
            An unexpected error occurred. Please refresh the page and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-md bg-red-500/20 hover:bg-red-500/30 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}