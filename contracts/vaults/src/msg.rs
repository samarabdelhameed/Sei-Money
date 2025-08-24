use cosmwasm_std::Coin;
use cosmwasm_schema::{cw_serde, QueryResponses};

#[cw_serde]
pub struct InstantiateMsg {
    pub admin: Option<String>,
    pub default_denom: String,
    pub max_fee_bps: Option<u16>,
}

#[cw_serde]
pub enum ExecuteMsg {
    CreateVault {
        label: String,
        denom: String,
        strategy: StrategyConfig,
        fee_bps: Option<u16>,
    },
    Deposit {
        vault_id: u64,
        amount: Coin,
    },
    Withdraw {
        vault_id: u64,
        shares: String,
    },
    Harvest {
        vault_id: u64,
    },
    Rebalance {
        vault_id: u64,
        plan: AllocationPlan,
    },
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(ConfigResp)]
    Config {},
    #[returns(VaultResp)]
    GetVault { id: u64 },
    #[returns(UserPositionResp)]
    UserPosition { vault_id: u64, address: String },
    #[returns(Vec<VaultResp>)]
    ListVaults { start_after: Option<u64>, limit: Option<u32> },
}

#[cw_serde]
pub struct ConfigResp {
    pub admin: String,
    pub default_denom: String,
    pub max_fee_bps: u16,
}

#[cw_serde]
pub struct VaultResp {
    pub id: u64,
    pub label: String,
    pub denom: String,
    pub strategy: StrategyConfig,
    pub fee_bps: u16,
    pub tvl: String,
    pub total_shares: String,
    pub created_at: u64,
    pub allocations: Vec<AllocationLegResp>,
}

#[cw_serde]
pub struct UserPositionResp {
    pub vault_id: u64,
    pub address: String,
    pub shares: String,
    pub value: String,
    pub deposited_at: u64,
}

#[cw_serde]
pub enum StrategyConfig {
    Conservative,
    Balanced,
    Aggressive,
    Custom { allocations: AllocationPlan },
}

#[cw_serde]
pub struct AllocationPlan {
    pub legs: Vec<AllocationLeg>,
}

#[cw_serde]
pub struct AllocationLeg {
    pub protocol: ProtocolType,
    pub weight_bps: u16,
    pub target_amount: String,
}

#[cw_serde]
pub struct AllocationLegResp {
    pub protocol: ProtocolType,
    pub weight_bps: u16,
    pub current_amount: String,
    pub target_amount: String,
}

#[cw_serde]
pub enum ProtocolType {
    Staking,
    Lending,
    LiquidityPool,
    PerpsHedge,
    Cash,
}
