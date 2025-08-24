/**
 * Auto-generated messages for Payments contract
 * Generated from schema: contracts/schema/raw/execute.json
 */

import { Coin, Address, Uint128, Uint64 } from '../../types';

// Execute messages
export interface ExecuteMsg {
  create_transfer?: CreateTransferMsg;
  claim_transfer?: ClaimTransferMsg;
  refund_transfer?: RefundTransferMsg;
  update_config?: UpdateConfigMsg;
  collect_fees?: CollectFeesMsg;
}

export interface CreateTransferMsg {
  recipient: Address;
  amount: Coin;
  remark?: string;
  expiry_ts?: Uint64;
}

export interface ClaimTransferMsg {
  transfer_id: Uint64;
}

export interface RefundTransferMsg {
  transfer_id: Uint64;
}

export interface UpdateConfigMsg {
  admin?: Address;
  fee_collector?: Address;
  fee_rate?: Uint128;
  max_fee_rate?: Uint128;
  min_transfer_amount?: Uint128;
}

export interface CollectFeesMsg {
  denom: string;
}

// Query messages
export interface QueryMsg {
  config?: {};
  get_transfer?: GetTransferMsg;
  list_by_sender?: ListBySenderMsg;
  list_by_recipient?: ListByRecipientMsg;
  get_fees?: GetFeesMsg;
}

export interface GetTransferMsg {
  id: Uint64;
}

export interface ListBySenderMsg {
  sender: Address;
  start_after?: Uint64;
  limit?: Uint32;
}

export interface ListByRecipientMsg {
  recipient: Address;
  start_after?: Uint64;
  limit?: Uint32;
}

export interface GetFeesMsg {
  denom: string;
}

// Response types
export interface ConfigResponse {
  admin: Address;
  fee_collector: Address;
  fee_rate: Uint128;
  max_fee_rate: Uint128;
  min_transfer_amount: Uint128;
}

export interface TransferResponse {
  id: Uint64;
  sender: Address;
  recipient: Address;
  amount: Coin;
  remark?: string;
  expiry_ts?: Uint64;
  claimed: boolean;
  refunded: boolean;
  created_at: Uint64;
}

export interface TransferListResponse {
  transfers: TransferResponse[];
}

export interface FeesResponse {
  denom: string;
  amount: Uint128;
}

// Helper types
export type Uint32 = number;
