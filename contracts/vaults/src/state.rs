use cosmwasm_std::{Addr, Coin, Uint128};
use cw_storage_plus::{Item, Map};

use crate::msg::{StrategyConfig, AllocationPlan, AllocationLeg};

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug, PartialEq, schemars::JsonSchema)]
pub struct Config {
    pub admin: Addr,
    pub default_denom: String,
    pub max_fee_bps: u16,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug, PartialEq, schemars::JsonSchema)]
pub struct Vault {
    pub id: u64,
    pub label: String,
    pub denom: String,
    pub strategy: StrategyConfig,
    pub fee_bps: u16,
    pub tvl: Uint128,
    pub total_shares: Uint128,
    pub created_at: u64,
    pub allocations: Vec<AllocationLeg>,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug, PartialEq, schemars::JsonSchema)]
pub struct UserPosition {
    pub vault_id: u64,
    pub address: Addr,
    pub shares: Uint128,
    pub deposited_at: u64,
}

pub const CONFIG: Item<Config> = Item::new("config");
pub const NEXT_VAULT_ID: Item<u64> = Item::new("next_vault_id");
pub const VAULTS: Map<u64, Vault> = Map::new("vaults");
pub const USER_POSITIONS: Map<(u64, Addr), UserPosition> = Map::new("user_positions");
pub const VAULT_SHARES: Map<(u64, Addr), Uint128> = Map::new("vault_shares");
