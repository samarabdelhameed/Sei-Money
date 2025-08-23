use cosmwasm_std::{Addr, Coin, Timestamp};
use cw_storage_plus::{Item, Map};

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug, PartialEq, schemars::JsonSchema)]
pub struct Config {
    pub admin: Addr,
    pub default_denom: String,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug, PartialEq, schemars::JsonSchema)]
pub enum TransferStatus {
    Open,
    Claimed,
    Refunded,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug, PartialEq, schemars::JsonSchema)]
pub struct Transfer {
    pub id: u64,
    pub sender: Addr,
    pub recipient: Addr,
    pub amount: Coin,
    pub remark: Option<String>,
    pub expiry_ts: Option<u64>,
    pub status: TransferStatus,
}

pub const CONFIG: Item<Config> = Item::new("config");
pub const NEXT_ID: Item<u64> = Item::new("next_id");
pub const TRANSFERS: Map<u64, Transfer> = Map::new("transfers");