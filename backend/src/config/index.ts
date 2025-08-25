import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Network configuration
  chainId: process.env['CHAIN_ID'] || 'atlantic-2',
  rpcUrl: process.env['RPC_URL'] || 'https://rpc.atlantic-2.seinetwork.io:443',
  restUrl: process.env['REST_URL'] || 'https://rest.atlantic-2.seinetwork.io:443',
  denom: process.env['DENOM'] || 'usei',

  // Smart contract addresses (REAL DEPLOYED CONTRACTS on Sei testnet atlantic-2)
  contracts: {
    payments: process.env['CONTRACT_PAYMENTS'] || 'sei1kfpm92hs5gsmp84098wc3jpy2a440l50cq2ycsxlkpnlaygl9azqdhsygg',
    groups: process.env['CONTRACT_GROUPS'] || 'sei1vq3ncyvf4k22lc0xhm7x6dtkn6jyxkexa2xy6uk2sj33dysnyy2syn73qt',
    pots: process.env['CONTRACT_POTS'] || 'sei1c5d4flfqv3zjms0g894z82hnhv62h2vjr9hgd05c6xh456q8xjfq8f3qmj',
    vaults: process.env['CONTRACT_VAULTS'] || 'sei12k2yxf3cyec8p89qtgm5w30m4g2775tn7j8wx4jpuallygu45r9qs68u2h',
    escrow: process.env['CONTRACT_ESCROW'] || 'sei1q3gqr9ywvma6j6kja67n4h7fxz790x5lhj4v5phv2za0v7wsp5qqkrz0pj',
    alias: process.env['CONTRACT_ALIAS'] || 'sei1thjuavd70uq7txe79uj8pfy2vfyl3zvmenkyxh6ew4vag9mckq4qrtjav4',
  },

  // RPC endpoints with fallbacks for connection pooling
  rpcEndpoints: [
    process.env['RPC_URL'] || 'https://rpc.atlantic-2.seinetwork.io:443',
    'https://rpc.atlantic-2.seinetwork.io',
    'https://sei-testnet-rpc.polkachu.com',
  ],

  // Connection settings
  connection: {
    maxRetries: parseInt(process.env['MAX_RETRIES'] || '3'),
    retryDelay: parseInt(process.env['RETRY_DELAY'] || '1000'),
    timeout: parseInt(process.env['RPC_TIMEOUT'] || '30000'),
    poolSize: parseInt(process.env['CONNECTION_POOL_SIZE'] || '3'),
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
    internalApiKey: process.env['INTERNAL_API_KEY'] || 'dev-internal-api-key-123',
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
    port: parseInt(process.env['PORT'] || '3001'),
    host: process.env['HOST'] || '0.0.0.0',
  },
} as const;

// Contract address validation
function validateContractAddress(address: string, contractName: string): boolean {
  // Sei addresses start with 'sei1' and are between 58-70 characters long
  const seiAddressRegex = /^sei1[a-z0-9]{58,70}$/;
  
  if (!seiAddressRegex.test(address)) {
    console.warn(`⚠️  Invalid ${contractName} contract address format: ${address}`);
    return false;
  }
  
  return true;
}

// Validation
export function validateConfig(): void {
  // Validate contract addresses regardless of environment
  const contractValidation = [
    { name: 'PAYMENTS', address: config.contracts.payments },
    { name: 'GROUPS', address: config.contracts.groups },
    { name: 'POTS', address: config.contracts.pots },
    { name: 'VAULTS', address: config.contracts.vaults },
    { name: 'ESCROW', address: config.contracts.escrow },
    { name: 'ALIAS', address: config.contracts.alias },
  ];

  let validContracts = 0;
  for (const contract of contractValidation) {
    if (validateContractAddress(contract.address, contract.name)) {
      validContracts++;
    }
  }

  console.log(`📋 Contract validation: ${validContracts}/${contractValidation.length} contracts have valid addresses`);

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
    if (!process.env['INTERNAL_API_KEY']) {
      process.env['INTERNAL_API_KEY'] = 'dev-internal-api-key-123';
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
    'INTERNAL_API_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // In production, all contracts must have valid addresses
  if (validContracts !== contractValidation.length) {
    throw new Error('All contract addresses must be valid in production environment');
  }
}

// Export types
export type Config = typeof config;
