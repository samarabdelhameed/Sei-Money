use cosmwasm_std::Coin;
use cosmwasm_schema::{cw_serde, QueryResponses};

#[cw_serde]
pub struct InstantiateMsg {
    pub admin: Option<String>,
    pub default_denom: String,
}

#[cw_serde]
pub enum ExecuteMsg {
    OpenPot {
        goal: Coin,
        label: Option<String>,
    },
    DepositPot {
        pot_id: u64,
        amount: Coin,
    },
    BreakPot {
        pot_id: u64,
    },
    ClosePot {
        pot_id: u64,
    },
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(ConfigResp)]
    Config {},
    #[returns(PotResp)]
    GetPot { id: u64 },
    #[returns(Vec<PotResp>)]
    ListPotsByOwner { owner: String, start_after: Option<u64>, limit: Option<u32> },
    #[returns(Vec<PotResp>)]
    ListAllPots { start_after: Option<u64>, limit: Option<u32> },
}

#[cw_serde]
pub struct ConfigResp {
    pub admin: String,
    pub default_denom: String,
}

#[cw_serde]
pub struct PotResp {
    pub id: u64,
    pub owner: String,
    pub goal: Coin,
    pub current: String,
    pub label: Option<String>,
    pub created_at: u64,
    pub closed: bool,
    pub broken: bool,
}
