/**
 * Professional formatting utilities for SeiMoney
 * Handles proper number formatting, currency display, and localization
 */

// Constants for SEI conversion
export const USEI_TO_SEI_RATIO = 1_000_000;
export const SEI_DECIMAL_PLACES = 6;

/**
 * Convert microSEI (usei) to SEI
 */
export function useiToSei(amount: string | number): number {
  const numAmount = typeof amount === 'string' ? parseInt(amount) : amount;
  return numAmount / USEI_TO_SEI_RATIO;
}

/**
 * Convert SEI to microSEI (usei)
 */
export function seiToUsei(amount: number): number {
  return Math.floor(amount * USEI_TO_SEI_RATIO);
}

/**
 * Format SEI amounts for professional display
 */
export function formatSeiAmount(
  amount: string | number,
  options: {
    fromUsei?: boolean;
    showSymbol?: boolean;
    decimals?: number;
    locale?: string;
    compact?: boolean;
  } = {}
): string {
  const {
    fromUsei = false,
    showSymbol = true,
    decimals = 2,
    locale = 'en-US',
    compact = false,
  } = options;

  let numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Convert from usei if needed
  if (fromUsei) {
    numAmount = useiToSei(numAmount);
  }

  // Handle invalid amounts
  if (isNaN(numAmount) || !isFinite(numAmount)) {
    return showSymbol ? '0.00 SEI' : '0.00';
  }

  // Format based on amount size
  let formatted: string;
  
  if (compact && numAmount >= 1_000_000) {
    // Format as millions
    formatted = (numAmount / 1_000_000).toLocaleString(locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }) + 'M';
  } else if (compact && numAmount >= 1_000) {
    // Format as thousands
    formatted = (numAmount / 1_000).toLocaleString(locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }) + 'K';
  } else {
    // Regular formatting
    formatted = numAmount.toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  return showSymbol ? `${formatted} SEI` : formatted;
}

/**
 * Format percentage values
 */
export function formatPercentage(
  value: number,
  options: {
    decimals?: number;
    showSign?: boolean;
    locale?: string;
  } = {}
): string {
  const { decimals = 1, showSign = false, locale = 'en-US' } = options;

  if (isNaN(value) || !isFinite(value)) {
    return '0.0%';
  }

  const sign = showSign && value > 0 ? '+' : '';
  const formatted = value.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${sign}${formatted}%`;
}

/**
 * Format transaction amounts with proper signs and colors
 */
export function formatTransactionAmount(
  amount: string | number,
  type: 'sent' | 'received' | 'deposit' | 'withdrawal',
  options: {
    fromUsei?: boolean;
    decimals?: number;
    locale?: string;
  } = {}
): {
  formatted: string;
  sign: '+' | '-' | '';
  colorClass: string;
} {
  const { fromUsei = false, decimals = 2, locale = 'en-US' } = options;

  let numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (fromUsei) {
    numAmount = useiToSei(numAmount);
  }

  // Determine sign and color based on transaction type
  let sign: '+' | '-' | '' = '';
  let colorClass = 'text-white';

  switch (type) {
    case 'received':
    case 'deposit':
      sign = '+';
      colorClass = 'text-green-400';
      break;
    case 'sent':
    case 'withdrawal':
      sign = '-';
      colorClass = 'text-red-400';
      break;
  }

  const formatted = formatSeiAmount(numAmount, {
    showSymbol: true,
    decimals,
    locale,
  });

  return {
    formatted: `${sign}${formatted}`,
    sign,
    colorClass,
  };
}

/**
 * Format time with relative and absolute options
 */
export function formatTime(
  timestamp: string | Date,
  options: {
    relative?: boolean;
    includeTime?: boolean;
    locale?: string;
  } = {}
): string {
  const { relative = false, includeTime = true, locale = 'en-US' } = options;

  const date = new Date(timestamp);
  
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }

  if (relative) {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }

  // Absolute formatting
  const options_obj: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  if (includeTime) {
    options_obj.hour = '2-digit';
    options_obj.minute = '2-digit';
  }

  return date.toLocaleDateString(locale, options_obj);
}

/**
 * Format large numbers with appropriate suffixes
 */
export function formatLargeNumber(
  value: number,
  options: {
    decimals?: number;
    locale?: string;
  } = {}
): string {
  const { decimals = 1, locale = 'en-US' } = options;

  if (isNaN(value) || !isFinite(value)) {
    return '0';
  }

  if (value >= 1_000_000_000) {
    return (value / 1_000_000_000).toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) + 'B';
  }

  if (value >= 1_000_000) {
    return (value / 1_000_000).toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) + 'M';
  }

  if (value >= 1_000) {
    return (value / 1_000).toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) + 'K';
  }

  return value.toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format status with appropriate styling
 */
export function formatStatus(
  status: string,
  type: 'transaction' | 'general' = 'general'
): {
  text: string;
  colorClass: string;
  bgClass: string;
} {
  const normalizedStatus = status.toLowerCase();

  const statusMappings = {
    // Transaction statuses
    completed: {
      text: 'Completed',
      colorClass: 'text-green-400',
      bgClass: 'bg-green-500/10',
    },
    pending: {
      text: 'Pending',
      colorClass: 'text-yellow-400',
      bgClass: 'bg-yellow-500/10',
    },
    failed: {
      text: 'Failed',
      colorClass: 'text-red-400',
      bgClass: 'bg-red-500/10',
    },
    expired: {
      text: 'Expired',
      colorClass: 'text-gray-400',
      bgClass: 'bg-gray-500/10',
    },
    claimed: {
      text: 'Claimed',
      colorClass: 'text-green-400',
      bgClass: 'bg-green-500/10',
    },
    refunded: {
      text: 'Refunded',
      colorClass: 'text-blue-400',
      bgClass: 'bg-blue-500/10',
    },
    // General statuses
    active: {
      text: 'Active',
      colorClass: 'text-green-400',
      bgClass: 'bg-green-500/10',
    },
    inactive: {
      text: 'Inactive',
      colorClass: 'text-gray-400',
      bgClass: 'bg-gray-500/10',
    },
    running: {
      text: 'Running',
      colorClass: 'text-blue-400',
      bgClass: 'bg-blue-500/10',
    },
  };

  return statusMappings[normalizedStatus] || {
    text: status,
    colorClass: 'text-gray-400',
    bgClass: 'bg-gray-500/10',
  };
}

/**
 * Format balance display with proper decimal handling
 */
export function formatBalance(
  balance: string | number | undefined | null,
  options: {
    fromUsei?: boolean;
    showSymbol?: boolean;
    minDecimals?: number;
    maxDecimals?: number;
    locale?: string;
  } = {}
): string {
  const {
    fromUsei = false,
    showSymbol = true,
    minDecimals = 2,
    maxDecimals = 6,
    locale = 'en-US',
  } = options;

  // Handle null/undefined
  if (balance === null || balance === undefined) {
    return showSymbol ? '0.00 SEI' : '0.00';
  }

  let numBalance = typeof balance === 'string' ? parseFloat(balance) : balance;
  
  // Handle NaN
  if (isNaN(numBalance)) {
    return showSymbol ? '0.00 SEI' : '0.00';
  }

  // Convert from usei if needed
  if (fromUsei) {
    numBalance = useiToSei(numBalance);
  }

  // Dynamic decimal places based on amount
  let decimals = minDecimals;
  if (numBalance < 1 && numBalance > 0) {
    decimals = maxDecimals;
  } else if (numBalance < 100) {
    decimals = Math.min(4, maxDecimals);
  }

  const formatted = numBalance.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return showSymbol ? `${formatted} SEI` : formatted;
}
