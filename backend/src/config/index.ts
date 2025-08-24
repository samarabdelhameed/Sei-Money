import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Network configuration
  chainId: process.env['CHAIN_ID'] || 'atlantic-2',
  rpcUrl: process.env['RPC_URL'] || 'https://sei-testnet-rpc.polkachu.com',
  restUrl: process.env['REST_URL'] || 'https://sei-testnet-rest.polkachu.com',
  denom: process.env['DENOM'] || 'usei',

  // Smart contract addresses
  contracts: {
    payments: process.env['CONTRACT_PAYMENTS'] || 'sei1placeholder123456789',
    groups: process.env['CONTRACT_GROUPS'] || 'sei1placeholder123456789',
    pots: process.env['CONTRACT_POTS'] || 'sei1placeholder123456789',
    vaults: process.env['CONTRACT_VAULTS'] || 'sei1placeholder123456789',
    escrow: process.env['CONTRACT_ESCROW'] || 'sei1placeholder123456789',
  },

  // Database
  database: {
    url: process.env['DATABASE_URL'] || 'postgresql://localhost:5432/seimoney',
  },

  // Redis
  redis: {
    url: process.env['REDIS_URL'] || 'redis://localhost:6379',
  },

  // Security
  security: {
    internalSecret: process.env['INTERNAL_SHARED_SECRET'] || 'dev-internal-secret-key-123',
    jwtSecret: process.env['JWT_SECRET'] || 'dev-jwt-secret-key-123',
  },

  // Notification services
  notifications: {
    telegram: {
      botToken: process.env['TELEGRAM_BOT_TOKEN'] || '',
      chatId: process.env['TELEGRAM_CHAT_ID'] || '',
    },
    email: {
      host: process.env['SMTP_HOST'] || '',
      port: parseInt(process.env['SMTP_PORT'] || '587'),
      user: process.env['SMTP_USER'] || '',
      pass: process.env['SMTP_PASS'] || '',
    },
    webPush: {
      publicKey: process.env['VAPID_PUBLIC_KEY'] || '',
      privateKey: process.env['VAPID_PRIVATE_KEY'] || '',
    },
  },

  // External APIs
  external: {
    rivalz: {
      apiKey: process.env['RIVALZ_API_KEY'] || '',
      baseUrl: process.env['RIVALZ_BASE_URL'] || 'https://api.rivalz.io',
    },
  },

  // Logging
  logging: {
    level: process.env['LOG_LEVEL'] || 'info',
  },

  // Environment
  env: process.env['NODE_ENV'] || 'development',

  // Server
  server: {
    port: parseInt(process.env['PORT'] || '3000'),
    host: process.env['HOST'] || '0.0.0.0',
  },
} as const;

// Validation
export function validateConfig(): void {
  // In development mode, be more lenient
  if (process.env['NODE_ENV'] === 'development' || !process.env['NODE_ENV']) {
    console.log('🔧 Development mode detected - using default values');
    
    // Set default values for development if not present
    if (!process.env['INTERNAL_SHARED_SECRET']) {
      process.env['INTERNAL_SHARED_SECRET'] = 'dev-internal-secret-key-123';
    }
    if (!process.env['JWT_SECRET']) {
      process.env['JWT_SECRET'] = 'dev-jwt-secret-key-123';
    }
    
    console.log('✅ Development configuration validated');
    return;
  }

  // In production, require all variables
  const required = [
    'CONTRACT_PAYMENTS',
    'CONTRACT_GROUPS', 
    'CONTRACT_POTS',
    'CONTRACT_VAULTS',
    'CONTRACT_ESCROW',
    'DATABASE_URL',
    'INTERNAL_SHARED_SECRET',
    'JWT_SECRET',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Export types
export type Config = typeof config;
