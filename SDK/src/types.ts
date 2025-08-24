/**
 * Common types for Sei Money SDK
 */

export type Address = string;
export type Denom = string;
export type Amount = string;
export type Uint128 = string;
export type Uint64 = string;
export type Timestamp = string;

/**
 * Coin representation
 */
export interface Coin {
  denom: Denom;
  amount: Amount;
}

/**
 * Transaction result
 */
export interface TxResult {
  txHash: string;
  height: number;
  gasUsed: number;
  success: boolean;
  code?: number;
  rawLog?: string;
}

/**
 * Pagination parameters
 */
export interface Pagination {
  start_after?: string;
  limit?: number;
}

/**
 * Pagination response
 */
export interface PaginationResponse {
  next_key?: string;
  total?: string;
}

/**
 * Transfer information
 */
export interface Transfer {
  id: number;
  sender: Address;
  recipient: Address;
  amount: Coin;
  remark?: string;
  expiry_ts?: number;
  claimed: boolean;
  refunded: boolean;
  created_at: number;
}

/**
 * Group information
 */
export interface Group {
  id: number;
  name: string;
  description?: string;
  members: Address[];
  admin: Address;
  created_at: number;
  updated_at: number;
}

/**
 * Pot information
 */
export interface Pot {
  id: number;
  name: string;
  description?: string;
  owner: Address;
  members: Address[];
  balance: Coin[];
  created_at: number;
  updated_at: number;
}

/**
 * Alias information
 */
export interface Alias {
  id: number;
  name: string;
  owner: Address;
  target: Address;
  created_at: number;
  updated_at: number;
}

/**
 * Risk Escrow Case
 */
export interface RiskCase {
  id: number;
  parties: Address[];
  amount: Coin;
  model: string;
  status: 'open' | 'resolved' | 'disputed';
  created_at: number;
  resolved_at?: number;
  resolution?: string;
}

/**
 * Vault information
 */
export interface VaultInfo {
  id: number;
  label: string;
  denom: Denom;
  tvl: Uint128;
  apr: Uint128;
  strategy: string;
  risk_level: 'low' | 'medium' | 'high';
  created_at: number;
  updated_at: number;
}

/**
 * Vault position
 */
export interface VaultPosition {
  vault_id: number;
  user: Address;
  shares: Uint128;
  deposited_at: number;
  last_harvest: number;
}

/**
 * Configuration
 */
export interface Config {
  admin: Address;
  fee_collector: Address;
  fee_rate: Uint128;
  max_fee_rate: Uint128;
  min_transfer_amount: Uint128;
}

/**
 * Error types
 */
export class SeiMoneyError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'SeiMoneyError';
  }
}

/**
 * Network configuration
 */
export interface NetworkConfig {
  chainId: string;
  rpcUrl: string;
  restUrl?: string;
  gasPrice?: string;
  gasAdjustment?: number;
}

/**
 * Contract addresses
 */
export interface ContractAddresses {
  payments: Address;
  groups: Address;
  pots: Address;
  alias: Address;
  riskEscrow: Address;
  vaults: Address;
}

/**
 * Client configuration
 */
export interface ClientConfig {
  network: NetworkConfig;
  contracts: ContractAddresses;
  gasPrice?: string;
  gasAdjustment?: number;
}

/**
 * Query options
 */
export interface QueryOptions {
  height?: number;
  timeout?: number;
}

/**
 * Execute options
 */
export interface ExecuteOptions {
  gas?: string;
  gasPrice?: string;
  gasAdjustment?: number;
  memo?: string;
  timeout?: number;
}

/**
 * Event types
 */
export interface TransferEvent {
  type: 'transfer_created' | 'transfer_claimed' | 'transfer_refunded';
  transfer_id: number;
  sender: Address;
  recipient: Address;
  amount: Coin;
  timestamp: number;
}

export interface VaultEvent {
  type: 'deposit' | 'withdraw' | 'harvest' | 'rebalance';
  vault_id: number;
  user: Address;
  amount?: Coin;
  shares?: Uint128;
  timestamp: number;
}

export type SeiMoneyEvent = TransferEvent | VaultEvent;

/**
 * Utility types
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
