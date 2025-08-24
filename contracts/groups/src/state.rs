use cosmwasm_std::{Addr, Coin, Uint128};
use cw_storage_plus::{Item, Map};

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug, PartialEq, schemars::JsonSchema)]
pub struct Config {
    pub admin: Addr,
    pub default_denom: String,
    pub max_participants: u32,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug, PartialEq, schemars::JsonSchema)]
pub struct Pool {
    pub id: u64,
    pub creator: Addr,
    pub target: Coin,
    pub current: Uint128,
    pub participants: Vec<Addr>,
    pub memo: Option<String>,
    pub created_at: u64,
    pub expiry_ts: Option<u64>,
    pub distributed: bool,
    pub cancelled: bool,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug, PartialEq, schemars::JsonSchema)]
pub struct Contribution {
    pub contributor: Addr,
    pub amount: Uint128,
    pub contributed_at: u64,
}

pub const CONFIG: Item<Config> = Item::new("config");
pub const NEXT_POOL_ID: Item<u64> = Item::new("next_pool_id");
pub const POOLS: Map<u64, Pool> = Map::new("pools");
pub const CONTRIBUTIONS: Map<(u64, Addr), Contribution> = Map::new("contributions");
