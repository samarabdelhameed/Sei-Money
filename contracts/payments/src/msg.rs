use cosmwasm_std::Coin;
use cosmwasm_schema::{cw_serde, QueryResponses};

#[cw_serde]
pub struct InstantiateMsg {
    pub default_denom: String,
    pub admin: Option<String>,
}

#[cw_serde]
pub enum ExecuteMsg {
    CreateTransfer {
        recipient: String,
        amount: Coin,  // Added missing amount parameter
        remark: Option<String>,
        expiry_ts: Option<u64>,
    },
    ClaimTransfer { id: u64 },
    RefundTransfer { id: u64 },
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(ConfigResp)]
    Config {},
    #[returns(TransferResp)]
    GetTransfer { id: u64 },
    #[returns(Vec<TransferResp>)]
    ListBySender { sender: String, start_after: Option<u64>, limit: Option<u32> },
    #[returns(Vec<TransferResp>)]
    ListByRecipient { recipient: String, start_after: Option<u64>, limit: Option<u32> },
}

#[cw_serde]
pub struct ConfigResp {
    pub admin: String,
    pub default_denom: String,
}

#[cw_serde]
pub struct TransferResp {
    pub id: u64,
    pub sender: String,
    pub recipient: String,
    pub amount: Coin,
    pub remark: Option<String>,
    pub expiry_ts: Option<u64>,
    pub status: String,
}