use cosmwasm_std::{Addr, Coin};
use cw_storage_plus::{Item, Map};

use crate::msg::{CaseStatus, EscrowModel, Resolution};

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug, PartialEq, schemars::JsonSchema)]
pub struct Config {
    pub admin: Addr,
    pub default_denom: String,
    pub min_approval_threshold: u32,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug, PartialEq, schemars::JsonSchema)]
pub struct Case {
    pub id: u64,
    pub parties: Vec<Addr>,
    pub amount: Coin,
    pub model: EscrowModel,
    pub expiry_ts: Option<u64>,
    pub remark: Option<String>,
    pub created_at: u64,
    pub status: CaseStatus,
    pub approvals: Vec<Addr>,
    pub dispute_reason: Option<String>,
    pub resolution: Option<Resolution>,
}

pub const CONFIG: Item<Config> = Item::new("config");
pub const NEXT_CASE_ID: Item<u64> = Item::new("next_case_id");
pub const CASES: Map<u64, Case> = Map::new("cases");
pub const REPUTATION: Map<Addr, u64> = Map::new("reputation");
