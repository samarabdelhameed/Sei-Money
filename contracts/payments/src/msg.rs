use cosmwasm_std::{Addr, Coin, Timestamp};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use seimoney_common::TransferInfo;

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct InstantiateMsg {
    pub admin: String,
    pub default_denom: String,
    pub fee_bps: Option<u16>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    CreateTransfer {
        recipient: String,
        amount: Coin,
        remark: Option<String>,
        expiry_ts: Option<Timestamp>,
    },
    ClaimTransfer {
        id: u64,
    },
    RefundTransfer {
        id: u64,
    },
    UpdateConfig {
        admin: Option<String>,
        default_denom: Option<String>,
        fee_bps: Option<u16>,
    },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    Config {},
    GetTransfer { id: u64 },
    ListBySender {
        sender: String,
        start_after: Option<u64>,
        limit: Option<u32>,
    },
    ListByRecipient {
        recipient: String,
        start_after: Option<u64>,
        limit: Option<u32>,
    },
    ListAll {
        start_after: Option<u64>,
        limit: Option<u32>,
    },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct ConfigResponse {
    pub admin: Addr,
    pub default_denom: String,
    pub fee_bps: u16,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct TransferResponse {
    pub transfer: TransferInfo,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct TransfersResponse {
    pub transfers: Vec<TransferInfo>,
}