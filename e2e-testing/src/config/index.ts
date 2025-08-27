import * as dotenv from 'dotenv';
import * as Joi from 'joi';
import { TestConfig } from '../types';

// Load environment variables
dotenv.config();

// Configuration validation schema
const configSchema = Joi.object({
  environment: Joi.object({
    frontendUrl: Joi.string().uri().required(),
    backendUrl: Joi.string().uri().required(),
    blockchainNetwork: Joi.string().required(),
    blockchainRpcUrl: Joi.string().uri().required(),
    contractAddress: Joi.string().required(),
    testWalletAddress: Joi.string().required(),
    testWalletPrivateKey: Joi.string().required(),
    testWalletMnemonic: Joi.string().required(),
  }).required(),
  
  browser: Joi.object({
    headless: Joi.boolean().default(true),
    timeout: Joi.number().positive().default(30000),
    screenshotOnFailure: Joi.boolean().default(true),
  }).required(),
  
  api: Joi.object({
    timeout: Joi.number().positive().default(10000),
    retryAttempts: Joi.number().integer().min(0).default(3),
  }).required(),
  
  validation: Joi.object({
    timeouts: Joi.object({
      uiInteraction: Joi.number().positive().default(15000),
      apiCall: Joi.number().positive().default(10000),
      blockchainConfirmation: Joi.number().positive().default(30000),
      dataConsistency: Joi.number().positive().default(5000),
    }).required(),
    retryAttempts: Joi.number().integer().min(0).default(3),
    screenshotOnFailure: Joi.boolean().default(true),
  }).required(),
  
  logging: Joi.object({
    level: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
    file: Joi.string().optional(),
  }).required(),
  
  database: Joi.object({
    url: Joi.string().uri().optional(),
  }).optional(),
});

/**
 * Load and validate configuration from environment variables
 */
export function loadConfig(): TestConfig {
  const rawConfig: TestConfig = {
    environment: {
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
      backendUrl: process.env.BACKEND_URL || 'http://localhost:3001',
      blockchainNetwork: process.env.BLOCKCHAIN_NETWORK || 'sei-testnet',
      blockchainRpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'https://rpc.sei-apis.com',
      contractAddress: process.env.CONTRACT_ADDRESS || '',
      testWalletAddress: process.env.TEST_WALLET_ADDRESS || '',
      testWalletPrivateKey: process.env.TEST_WALLET_PRIVATE_KEY || '',
      testWalletMnemonic: process.env.TEST_WALLET_MNEMONIC || '',
    },
    
    browser: {
      headless: process.env.HEADLESS_BROWSER === 'true',
      timeout: parseInt(process.env.FRONTEND_TIMEOUT || '30000'),
      screenshotOnFailure: process.env.SCREENSHOT_ON_FAILURE !== 'false',
    },
    
    api: {
      timeout: parseInt(process.env.BACKEND_TIMEOUT || '10000'),
      retryAttempts: parseInt(process.env.RETRY_ATTEMPTS || '3'),
    },
    
    validation: {
      timeouts: {
        uiInteraction: parseInt(process.env.DEFAULT_TIMEOUT || '15000'),
        apiCall: parseInt(process.env.BACKEND_TIMEOUT || '10000'),
        blockchainConfirmation: 30000,
        dataConsistency: 5000,
      },
      retryAttempts: parseInt(process.env.RETRY_ATTEMPTS || '3'),
      screenshotOnFailure: process.env.SCREENSHOT_ON_FAILURE !== 'false',
    },
    
    logging: {
      level: (process.env.LOG_LEVEL as any) || 'info',
      file: process.env.LOG_FILE || undefined,
    },
  };

  // Add database config if provided
  if (process.env.DATABASE_URL) {
    rawConfig.database = {
      url: process.env.DATABASE_URL,
    };
  } else {
    rawConfig.database = undefined;
  }

  // Validate configuration
  const { error, value } = configSchema.validate(rawConfig, {
    allowUnknown: false,
    stripUnknown: true,
  });

  if (error) {
    throw new Error(`Configuration validation failed: ${error.message}`);
  }

  return value as TestConfig;
}

/**
 * Get configuration with validation
 */
export function getConfig(): TestConfig {
  try {
    return loadConfig();
  } catch (error) {
    console.error('Failed to load configuration:', error);
    throw error;
  }
}

/**
 * Validate that all required environment variables are set
 */
export function validateEnvironment(): { isValid: boolean; missingVars: string[] } {
  const requiredVars = [
    'FRONTEND_URL',
    'BACKEND_URL',
    'BLOCKCHAIN_NETWORK',
    'BLOCKCHAIN_RPC_URL',
    'CONTRACT_ADDRESS',
    'TEST_WALLET_ADDRESS',
    'TEST_WALLET_PRIVATE_KEY',
    'TEST_WALLET_MNEMONIC',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  return {
    isValid: missingVars.length === 0,
    missingVars,
  };
}

/**
 * Create a test-specific configuration override
 */
export function createTestConfig(overrides: Partial<TestConfig> = {}): TestConfig {
  const baseConfig = getConfig();
  
  return {
    ...baseConfig,
    ...overrides,
    environment: {
      ...baseConfig.environment,
      ...overrides.environment,
    },
    browser: {
      ...baseConfig.browser,
      ...overrides.browser,
    },
    api: {
      ...baseConfig.api,
      ...overrides.api,
    },
    validation: {
      ...baseConfig.validation,
      ...overrides.validation,
      timeouts: {
        ...baseConfig.validation.timeouts,
        ...overrides.validation?.timeouts,
      },
    },
    logging: {
      ...baseConfig.logging,
      ...overrides.logging,
    },
    database: overrides.database || baseConfig.database,
  };
}