use cosmwasm_std::Addr;
use cw_storage_plus::{Item, Map};

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug, PartialEq, schemars::JsonSchema)]
pub struct Config {
    pub admin: Addr,
    pub min_username_length: u32,
    pub max_username_length: u32,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug, PartialEq, schemars::JsonSchema)]
pub struct UsernameInfo {
    pub username: String,
    pub address: Addr,
    pub registered_at: u64,
}

pub const CONFIG: Item<Config> = Item::new("config");
pub const NAME_TO_ADDR: Map<&str, Addr> = Map::new("name_to_addr");
pub const ADDR_TO_NAME: Map<&Addr, String> = Map::new("addr_to_name");
