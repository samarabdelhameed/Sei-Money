pub mod errors;
pub mod events;
pub mod math;
pub mod time;
pub mod validation;

use cosmwasm_std::{Addr, Coin, Timestamp, Uint128};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Config {
    pub admin: Addr,
    pub default_denom: String,
    pub fee_bps: u16, // basis points (100 = 1%)
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct TransferInfo {
    pub id: u64,
    pub sender: Addr,
    pub recipient: Addr,
    pub amount: Coin,
    pub remark: Option<String>,
    pub created_at: Timestamp,
    pub expiry_ts: Option<Timestamp>,
    pub claimed: bool,
    pub refunded: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct PoolInfo {
    pub id: u64,
    pub creator: Addr,
    pub target: Coin,
    pub current: Uint128,
    pub participants: Vec<Addr>,
    pub contributions: Vec<(Addr, Uint128)>,
    pub memo: Option<String>,
    pub created_at: Timestamp,
    pub expiry_ts: Option<Timestamp>,
    pub distributed: bool,
    pub cancelled: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct PotInfo {
    pub id: u64,
    pub owner: Addr,
    pub goal: Coin,
    pub current: Uint128,
    pub label: Option<String>,
    pub created_at: Timestamp,
    pub closed: bool,
    pub broken: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct VaultInfo {
    pub id: u64,
    pub label: String,
    pub denom: String,
    pub strategy: StrategyConfig,
    pub fee_bps: u16,
    pub tvl: Uint128,
    pub total_shares: Uint128,
    pub created_at: Timestamp,
    pub allocations: Vec<AllocationLeg>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub enum StrategyConfig {
    Conservative,
    Balanced,
    Aggressive,
    Custom { allocations: Vec<AllocationLeg> },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct AllocationLeg {
    pub protocol: ProtocolType,
    pub weight_bps: u16, // basis points
    pub current_amount: Uint128,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub enum ProtocolType {
    Staking,
    Lending,
    LiquidityPool,
    PerpsHedge,
    Cash, // idle funds
}