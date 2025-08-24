/**
 * Configuration for Sei Money SDK
 */

import { NetworkConfig, ContractAddresses, ClientConfig } from './types';

// Default network configurations
export const NETWORKS = {
  TESTNET: {
    chainId: 'sei-testnet-1',
    rpcUrl: 'https://rpc.testnet.sei.io',
    restUrl: 'https://rest.testnet.sei.io',
    gasPrice: '0.1usei',
    gasAdjustment: 1.3,
  },
  MAINNET: {
    chainId: 'sei-1',
    rpcUrl: 'https://rpc.sei.io',
    restUrl: 'https://rest.sei.io',
    gasPrice: '0.1usei',
    gasAdjustment: 1.3,
  },
  LOCAL: {
    chainId: 'sei-local',
    rpcUrl: 'http://localhost:26657',
    restUrl: 'http://localhost:1317',
    gasPrice: '0.1usei',
    gasAdjustment: 1.3,
  },
} as const;

// Default contract addresses (testnet)
export const DEFAULT_CONTRACTS: ContractAddresses = {
  payments: 'sei1xxxxxx...', // Replace with actual address
  groups: 'sei1yyyyyy...',   // Replace with actual address
  pots: 'sei1zzzzzz...',     // Replace with actual address
  alias: 'sei1aaaaaa...',    // Replace with actual address
  riskEscrow: 'sei1bbbbbb...', // Replace with actual address
  vaults: 'sei1cccccc...',   // Replace with actual address
};

// Default client configuration
export const DEFAULT_CONFIG: ClientConfig = {
  network: NETWORKS.TESTNET,
  contracts: DEFAULT_CONTRACTS,
  gasPrice: '0.1usei',
  gasAdjustment: 1.3,
};

// Environment-based configuration
export function getConfig(environment: 'testnet' | 'mainnet' | 'local' = 'testnet'): ClientConfig {
  const network = NETWORKS[environment.toUpperCase() as keyof typeof NETWORKS];
  
  return {
    network,
    contracts: DEFAULT_CONTRACTS, // In production, load from environment
    gasPrice: network.gasPrice,
    gasAdjustment: network.gasAdjustment,
  };
}

// Load configuration from environment variables
export function loadConfigFromEnv(): ClientConfig {
  const chainId = process.env.SEI_CHAIN_ID || 'sei-testnet-1';
  const rpcUrl = process.env.SEI_RPC_URL || NETWORKS.TESTNET.rpcUrl;
  const gasPrice = process.env.SEI_GAS_PRICE || '0.1usei';
  const gasAdjustment = parseFloat(process.env.SEI_GAS_ADJUSTMENT || '1.3');

  const network: NetworkConfig = {
    chainId,
    rpcUrl,
    gasPrice,
    gasAdjustment,
  };

  const contracts: ContractAddresses = {
    payments: process.env.SEI_PAYMENTS_CONTRACT || DEFAULT_CONTRACTS.payments,
    groups: process.env.SEI_GROUPS_CONTRACT || DEFAULT_CONTRACTS.groups,
    pots: process.env.SEI_POTS_CONTRACT || DEFAULT_CONTRACTS.pots,
    alias: process.env.SEI_ALIAS_CONTRACT || DEFAULT_CONTRACTS.alias,
    riskEscrow: process.env.SEI_RISK_ESCROW_CONTRACT || DEFAULT_CONTRACTS.riskEscrow,
    vaults: process.env.SEI_VAULTS_CONTRACT || DEFAULT_CONTRACTS.vaults,
  };

  return {
    network,
    contracts,
    gasPrice,
    gasAdjustment,
  };
}
