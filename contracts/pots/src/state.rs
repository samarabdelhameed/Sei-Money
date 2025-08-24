use cosmwasm_std::{Addr, Coin, Uint128};
use cw_storage_plus::{Item, Map};

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug, PartialEq, schemars::JsonSchema)]
pub struct Config {
    pub admin: Addr,
    pub default_denom: String,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug, PartialEq, schemars::JsonSchema)]
pub struct Pot {
    pub id: u64,
    pub owner: Addr,
    pub goal: Coin,
    pub current: Uint128,
    pub label: Option<String>,
    pub created_at: u64,
    pub closed: bool,
    pub broken: bool,
}

pub const CONFIG: Item<Config> = Item::new("config");
pub const NEXT_POT_ID: Item<u64> = Item::new("next_pot_id");
pub const POTS: Map<u64, Pot> = Map::new("pots");
pub const OWNER_POTS: Map<Addr, Vec<u64>> = Map::new("owner_pots");
