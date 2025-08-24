use cosmwasm_schema::{cw_serde, QueryResponses};

#[cw_serde]
pub struct InstantiateMsg {
    pub admin: Option<String>,
    pub min_username_length: Option<u32>,
    pub max_username_length: Option<u32>,
}

#[cw_serde]
pub enum ExecuteMsg {
    Register {
        username: String,
    },
    Update {
        username: String,
    },
    Unregister {},
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(ConfigResp)]
    Config {},
    #[returns(UsernameResp)]
    Resolve { username: String },
    #[returns(AddressResp)]
    ReverseLookup { address: String },
    #[returns(Vec<String>)]
    ListUsernames { start_after: Option<String>, limit: Option<u32> },
}

#[cw_serde]
pub struct ConfigResp {
    pub admin: String,
    pub min_username_length: u32,
    pub max_username_length: u32,
}

#[cw_serde]
pub struct UsernameResp {
    pub username: String,
    pub address: String,
    pub registered_at: u64,
}

#[cw_serde]
pub struct AddressResp {
    pub address: String,
    pub username: String,
    pub registered_at: u64,
}
