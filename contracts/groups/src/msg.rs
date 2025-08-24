use cosmwasm_std::Coin;
use cosmwasm_schema::{cw_serde, QueryResponses};

#[cw_serde]
pub struct InstantiateMsg {
    pub admin: Option<String>,
    pub default_denom: String,
    pub max_participants: Option<u32>,
}

#[cw_serde]
pub enum ExecuteMsg {
    CreatePool {
        target: Coin,
        max_participants: Option<u32>,
        memo: Option<String>,
        expiry_ts: Option<u64>,
    },
    Contribute {
        pool_id: u64,
        amount: Coin,
    },
    Distribute {
        pool_id: u64,
    },
    CancelPool {
        pool_id: u64,
    },
    RefundContribution {
        pool_id: u64,
    },
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(ConfigResp)]
    Config {},
    #[returns(PoolResp)]
    GetPool { id: u64 },
    #[returns(Vec<ContributionResp>)]
    ListContributions { pool_id: u64, start_after: Option<String>, limit: Option<u32> },
    #[returns(Vec<PoolResp>)]
    ListPools { start_after: Option<u64>, limit: Option<u32> },
}

#[cw_serde]
pub struct ConfigResp {
    pub admin: String,
    pub default_denom: String,
    pub max_participants: u32,
}

#[cw_serde]
pub struct PoolResp {
    pub id: u64,
    pub creator: String,
    pub target: Coin,
    pub current: String,
    pub participants: Vec<String>,
    pub memo: Option<String>,
    pub created_at: u64,
    pub expiry_ts: Option<u64>,
    pub distributed: bool,
    pub cancelled: bool,
}

#[cw_serde]
pub struct ContributionResp {
    pub contributor: String,
    pub amount: String,
    pub contributed_at: u64,
}
