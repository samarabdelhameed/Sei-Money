// Test Configuration for SeiMoney Frontend Comprehensive Testing

import { TestConfig, BrowserConfig, ScreenTestConfig, TestCase, DataValidation, UserInteraction, PerformanceThreshold, TestCategory } from './types';

export const DEFAULT_TEST_CONFIG: TestConfig = {
  environment: 'development',
  baseUrl: 'http://localhost:5173',
  apiUrl: 'http://localhost:3001',
  timeout: 30000,
  retryAttempts: 3,
  screenshotOnFailure: true,
  performanceMonitoring: true,
  realDataValidation: true,
  crossBrowserTesting: false,
  mobileTestingEnabled: true
};

export const BROWSER_CONFIGS: BrowserConfig[] = [
  {
    name: 'Chrome',
    headless: false,
    viewport: { width: 1920, height: 1080 }
  },
  {
    name: 'Safari',
    headless: false,
    viewport: { width: 1920, height: 1080 }
  },
  {
    name: 'Firefox',
    headless: false,
    viewport: { width: 1920, height: 1080 }
  },
  {
    name: 'Chrome Mobile',
    headless: false,
    viewport: { width: 375, height: 667 },
    deviceEmulation: {
      name: 'iPhone SE',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X)',
      viewport: { width: 375, height: 667 }
    }
  }
];

// Home Screen Test Configuration
export const HOME_SCREEN_CONFIG: ScreenTestConfig = {
  screenName: 'Home',
  testCases: [
    {
      name: 'Market Statistics Display',
      description: 'Verify that market statistics are loaded and displayed correctly',
      preconditions: ['Application is loaded', 'API is accessible'],
      steps: [
        'Navigate to home screen',
        'Wait for market statistics to load',
        'Verify TVL value is displayed',
        'Verify active users count is displayed',
        'Verify success rate is displayed',
        'Verify average APY is displayed'
      ],
      expectedResults: [
        'All statistics show real numerical values',
        'Loading states are handled gracefully',
        'Error states show appropriate messages'
      ],
      priority: 'high',
      category: TestCategory.DATA
    },
    {
      name: 'Navigation Functionality',
      description: 'Test all navigation buttons and links work correctly',
      preconditions: ['Home screen is loaded'],
      steps: [
        'Click "Get Started" button',
        'Verify navigation to dashboard',
        'Return to home',
        'Click "Learn More" button',
        'Verify navigation to help page',
        'Test feature card navigation'
      ],
      expectedResults: [
        'All navigation buttons work correctly',
        'Page transitions are smooth',
        'URLs update appropriately'
      ],
      priority: 'high',
      category: TestCategory.UI
    },
    {
      name: 'TVL Chart Display',
      description: 'Verify TVL chart loads and displays historical data',
      preconditions: ['Home screen is loaded', 'Chart data is available'],
      steps: [
        'Locate TVL chart section',
        'Wait for chart to load',
        'Verify chart displays data points',
        'Check chart responsiveness'
      ],
      expectedResults: [
        'Chart displays historical TVL data',
        'Chart is responsive to screen size',
        'Loading states are handled'
      ],
      priority: 'medium',
      category: TestCategory.DATA
    }
  ],
  dataValidations: [
    {
      elementSelector: '[data-testid="tvl-value"]',
      dataSource: 'API:/api/v1/market/stats',
      validationType: 'format',
      expectedValue: /^\$[\d,]+\.?\d*[KMB]?$/
    },
    {
      elementSelector: '[data-testid="active-users"]',
      dataSource: 'API:/api/v1/market/stats',
      validationType: 'format',
      expectedValue: /^[\d,]+$/
    },
    {
      elementSelector: '[data-testid="success-rate"]',
      dataSource: 'API:/api/v1/market/stats',
      validationType: 'format',
      expectedValue: /^\d+\.\d+%$/
    },
    {
      elementSelector: '[data-testid="avg-apy"]',
      dataSource: 'API:/api/v1/market/stats',
      validationType: 'format',
      expectedValue: /^\d+\.\d+%$/
    }
  ],
  userInteractions: [
    {
      action: 'click',
      target: '[data-testid="get-started-btn"]',
      expectedResponse: 'Navigation to dashboard',
      timeout: 5000,
      waitForElement: '[data-testid="dashboard-header"]'
    },
    {
      action: 'click',
      target: '[data-testid="learn-more-btn"]',
      expectedResponse: 'Navigation to help page',
      timeout: 5000,
      waitForElement: '[data-testid="help-header"]'
    }
  ],
  performanceThresholds: [
    {
      metric: 'loadTime',
      threshold: 3000,
      unit: 'ms'
    },
    {
      metric: 'responseTime',
      threshold: 1000,
      unit: 'ms'
    }
  ]
};

// Dashboard Screen Test Configuration
export const DASHBOARD_SCREEN_CONFIG: ScreenTestConfig = {
  screenName: 'Dashboard',
  testCases: [
    {
      name: 'Wallet Connection Flow',
      description: 'Test wallet connection process and UI updates',
      preconditions: ['Dashboard is loaded', 'No wallet connected'],
      steps: [
        'Verify wallet connection prompt is shown',
        'Click Keplr wallet connection',
        'Handle wallet connection flow',
        'Verify dashboard updates with wallet data'
      ],
      expectedResults: [
        'Wallet connection prompt is displayed',
        'Connection process completes successfully',
        'Dashboard shows real wallet data'
      ],
      priority: 'high',
      category: TestCategory.INTEGRATION
    },
    {
      name: 'Portfolio Value Display',
      description: 'Verify portfolio calculations and display accuracy',
      preconditions: ['Wallet is connected', 'User has portfolio data'],
      steps: [
        'Check total portfolio value',
        'Verify wallet balance display',
        'Check vault positions',
        'Verify daily P&L calculation'
      ],
      expectedResults: [
        'Portfolio value matches wallet + positions',
        'All values are formatted correctly',
        'Calculations are accurate'
      ],
      priority: 'high',
      category: TestCategory.DATA
    },
    {
      name: 'Real-time Data Updates',
      description: 'Test automatic data refresh and manual refresh',
      preconditions: ['Dashboard is loaded', 'Wallet connected'],
      steps: [
        'Wait for automatic refresh cycle',
        'Verify data updates',
        'Click manual refresh button',
        'Verify immediate data refresh'
      ],
      expectedResults: [
        'Data refreshes automatically',
        'Manual refresh works correctly',
        'Loading states are shown during refresh'
      ],
      priority: 'medium',
      category: TestCategory.PERFORMANCE
    }
  ],
  dataValidations: [
    {
      elementSelector: '[data-testid="portfolio-value"]',
      dataSource: 'Calculated from wallet + positions',
      validationType: 'calculation',
      tolerance: 0.01
    },
    {
      elementSelector: '[data-testid="wallet-balance"]',
      dataSource: 'Wallet API',
      validationType: 'exact'
    },
    {
      elementSelector: '[data-testid="daily-pnl"]',
      dataSource: 'Calculated from portfolio changes',
      validationType: 'calculation',
      tolerance: 0.02
    }
  ],
  userInteractions: [
    {
      action: 'click',
      target: '[data-testid="connect-keplr"]',
      expectedResponse: 'Wallet connection initiated',
      timeout: 10000
    },
    {
      action: 'click',
      target: '[data-testid="refresh-data"]',
      expectedResponse: 'Data refresh started',
      timeout: 5000,
      waitForElement: '[data-testid="loading-indicator"]'
    },
    {
      action: 'click',
      target: '[data-testid="new-transfer-btn"]',
      expectedResponse: 'Navigation to payments',
      timeout: 3000,
      waitForElement: '[data-testid="payments-header"]'
    }
  ],
  performanceThresholds: [
    {
      metric: 'loadTime',
      threshold: 2000,
      unit: 'ms'
    },
    {
      metric: 'responseTime',
      threshold: 800,
      unit: 'ms'
    }
  ]
};

// Payments Screen Test Configuration
export const PAYMENTS_SCREEN_CONFIG: ScreenTestConfig = {
  screenName: 'Payments',
  testCases: [
    {
      name: 'Payment Form Validation',
      description: 'Test all form validation rules and error handling',
      preconditions: ['Payments screen is loaded', 'Wallet connected'],
      steps: [
        'Test empty form submission',
        'Test invalid recipient address',
        'Test invalid amount values',
        'Test past expiry date',
        'Test valid form submission'
      ],
      expectedResults: [
        'Appropriate validation errors are shown',
        'Valid form submits successfully',
        'Error messages are clear and helpful'
      ],
      priority: 'high',
      category: TestCategory.UI
    },
    {
      name: 'Smart Contract Integration',
      description: 'Test payment creation with smart contract interaction',
      preconditions: ['Valid form data', 'Sufficient wallet balance'],
      steps: [
        'Fill payment form with valid data',
        'Submit payment creation',
        'Handle wallet signing prompt',
        'Verify contract interaction',
        'Check payment status'
      ],
      expectedResults: [
        'Contract interaction succeeds',
        'Payment is created on blockchain',
        'Status is tracked correctly'
      ],
      priority: 'high',
      category: TestCategory.INTEGRATION
    },
    {
      name: 'Payment Management',
      description: 'Test payment claiming, cancellation, and status updates',
      preconditions: ['Payments exist in different states'],
      steps: [
        'Test claiming received payment',
        'Test cancelling sent payment',
        'Verify status updates',
        'Check transaction history'
      ],
      expectedResults: [
        'Payment actions work correctly',
        'Status updates are reflected',
        'History is accurate'
      ],
      priority: 'high',
      category: TestCategory.WORKFLOW
    }
  ],
  dataValidations: [
    {
      elementSelector: '[data-testid="wallet-balance"]',
      dataSource: 'Wallet API',
      validationType: 'exact'
    },
    {
      elementSelector: '[data-testid="total-sent"]',
      dataSource: 'Calculated from user transfers',
      validationType: 'calculation'
    },
    {
      elementSelector: '[data-testid="success-rate"]',
      dataSource: 'Calculated from transfer statuses',
      validationType: 'calculation',
      tolerance: 0.1
    }
  ],
  userInteractions: [
    {
      action: 'input',
      target: '[data-testid="recipient-input"]',
      value: 'sei1invalidaddress',
      expectedResponse: 'Validation error shown',
      timeout: 1000
    },
    {
      action: 'input',
      target: '[data-testid="amount-input"]',
      value: '10.5',
      expectedResponse: 'Amount accepted',
      timeout: 1000
    },
    {
      action: 'click',
      target: '[data-testid="create-transfer-btn"]',
      expectedResponse: 'Form submission or validation',
      timeout: 5000
    }
  ],
  performanceThresholds: [
    {
      metric: 'loadTime',
      threshold: 2500,
      unit: 'ms'
    },
    {
      metric: 'responseTime',
      threshold: 1000,
      unit: 'ms'
    }
  ]
};

// AI Agent Screen Test Configuration
export const AI_AGENT_SCREEN_CONFIG: ScreenTestConfig = {
  screenName: 'AI Agent',
  testCases: [
    {
      name: 'AI Service Connectivity',
      description: 'Test connection to AI agent services',
      preconditions: ['AI Agent screen is loaded'],
      steps: [
        'Check AI service status',
        'Verify connection indicators',
        'Test service availability'
      ],
      expectedResults: [
        'AI service is accessible',
        'Connection status is displayed',
        'Fallback handling for unavailable service'
      ],
      priority: 'high',
      category: TestCategory.INTEGRATION
    },
    {
      name: 'Query and Response Flow',
      description: 'Test AI query submission and response handling',
      preconditions: ['AI service is available'],
      steps: [
        'Submit test query to AI',
        'Wait for response',
        'Verify response quality',
        'Test conversation history'
      ],
      expectedResults: [
        'Queries are processed correctly',
        'Responses are relevant and helpful',
        'Conversation history is maintained'
      ],
      priority: 'high',
      category: TestCategory.WORKFLOW
    }
  ],
  dataValidations: [
    {
      elementSelector: '[data-testid="ai-status"]',
      dataSource: 'AI Service Health Check',
      validationType: 'presence'
    }
  ],
  userInteractions: [
    {
      action: 'input',
      target: '[data-testid="ai-query-input"]',
      value: 'What is the current TVL?',
      expectedResponse: 'Query accepted',
      timeout: 1000
    },
    {
      action: 'click',
      target: '[data-testid="send-query-btn"]',
      expectedResponse: 'Query submitted',
      timeout: 5000,
      waitForElement: '[data-testid="ai-response"]'
    }
  ],
  performanceThresholds: [
    {
      metric: 'responseTime',
      threshold: 3000,
      unit: 'ms'
    }
  ]
};

// Test Selectors Configuration
export const TEST_SELECTORS = {
  // Home Screen
  HOME: {
    TVL_VALUE: '[data-testid="tvl-value"]',
    ACTIVE_USERS: '[data-testid="active-users"]',
    SUCCESS_RATE: '[data-testid="success-rate"]',
    AVG_APY: '[data-testid="avg-apy"]',
    GET_STARTED_BTN: '[data-testid="get-started-btn"]',
    LEARN_MORE_BTN: '[data-testid="learn-more-btn"]',
    TVL_CHART: '[data-testid="tvl-chart"]',
    FEATURE_CARDS: '[data-testid="feature-card"]'
  },
  
  // Dashboard Screen
  DASHBOARD: {
    HEADER: '[data-testid="dashboard-header"]',
    PORTFOLIO_VALUE: '[data-testid="portfolio-value"]',
    WALLET_BALANCE: '[data-testid="wallet-balance"]',
    DAILY_PNL: '[data-testid="daily-pnl"]',
    CONNECT_KEPLR: '[data-testid="connect-keplr"]',
    CONNECT_LEAP: '[data-testid="connect-leap"]',
    CONNECT_METAMASK: '[data-testid="connect-metamask"]',
    REFRESH_DATA: '[data-testid="refresh-data"]',
    NEW_TRANSFER_BTN: '[data-testid="new-transfer-btn"]',
    LOADING_INDICATOR: '[data-testid="loading-indicator"]'
  },
  
  // Payments Screen
  PAYMENTS: {
    HEADER: '[data-testid="payments-header"]',
    RECIPIENT_INPUT: '[data-testid="recipient-input"]',
    AMOUNT_INPUT: '[data-testid="amount-input"]',
    EXPIRY_INPUT: '[data-testid="expiry-input"]',
    REMARK_INPUT: '[data-testid="remark-input"]',
    CREATE_TRANSFER_BTN: '[data-testid="create-transfer-btn"]',
    TOTAL_SENT: '[data-testid="total-sent"]',
    TOTAL_RECEIVED: '[data-testid="total-received"]',
    PENDING_COUNT: '[data-testid="pending-count"]',
    TRANSFER_LIST: '[data-testid="transfer-list"]'
  },
  
  // AI Agent Screen
  AI_AGENT: {
    HEADER: '[data-testid="ai-agent-header"]',
    STATUS: '[data-testid="ai-status"]',
    QUERY_INPUT: '[data-testid="ai-query-input"]',
    SEND_QUERY_BTN: '[data-testid="send-query-btn"]',
    RESPONSE: '[data-testid="ai-response"]',
    CONVERSATION_HISTORY: '[data-testid="conversation-history"]'
  },
  
  // Common Elements
  COMMON: {
    NAVBAR: '[data-testid="navbar"]',
    LOADING_SPINNER: '[data-testid="loading-spinner"]',
    ERROR_MESSAGE: '[data-testid="error-message"]',
    SUCCESS_MESSAGE: '[data-testid="success-message"]',
    MODAL: '[data-testid="modal"]',
    MODAL_CLOSE: '[data-testid="modal-close"]'
  }
};

// API Endpoints for Testing
export const API_ENDPOINTS = {
  HEALTH: '/health',
  MARKET_STATS: '/api/v1/market/stats',
  TVL_HISTORY: '/api/v1/market/tvl-history',
  TRANSFERS: '/api/v1/transfers',
  VAULTS: '/api/v1/vaults',
  GROUPS: '/api/v1/groups',
  USER_PROFILE: '/api/v1/user/profile',
  WALLET_BALANCE: '/api/v1/wallet/balance'
};

// Test Data Templates
export const TEST_DATA = {
  VALID_SEI_ADDRESS: 'sei1qy352eufqy352eufqy352eufqy352eufqy352euf',
  INVALID_SEI_ADDRESS: 'invalid_address_format',
  TEST_AMOUNTS: [0.1, 1.0, 10.5, 100.0],
  FUTURE_DATE: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  PAST_DATE: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  TEST_QUERIES: [
    'What is the current TVL?',
    'Show me the best performing vaults',
    'How can I optimize my portfolio?',
    'What are the risks of DeFi investing?'
  ]
};

export default {
  DEFAULT_TEST_CONFIG,
  BROWSER_CONFIGS,
  HOME_SCREEN_CONFIG,
  DASHBOARD_SCREEN_CONFIG,
  PAYMENTS_SCREEN_CONFIG,
  AI_AGENT_SCREEN_CONFIG,
  TEST_SELECTORS,
  API_ENDPOINTS,
  TEST_DATA
};