use cosmwasm_std::Addr;
use cw_storage_plus::{Item, Map};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use seimoney_common::TransferInfo;

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Config {
    pub admin: Addr,
    pub default_denom: String,
    pub fee_bps: u16,
}

pub const CONFIG: Item<Config> = Item::new("config");
pub const NEXT_ID: Item<u64> = Item::new("next_id");
pub const TRANSFERS: Map<u64, TransferInfo> = Map::new("transfers");

// Secondary indexes for efficient querying
pub const TRANSFERS_BY_SENDER: Map<(&Addr, u64), ()> = Map::new("transfers_by_sender");
pub const TRANSFERS_BY_RECIPIENT: Map<(&Addr, u64), ()> = Map::new("transfers_by_recipient");