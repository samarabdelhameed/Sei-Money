use cosmwasm_std::Coin;
use cosmwasm_schema::{cw_serde, QueryResponses};

#[cw_serde]
pub struct InstantiateMsg {
    pub admin: Option<String>,
    pub default_denom: String,
    pub min_approval_threshold: Option<u32>,
}

#[cw_serde]
pub enum ExecuteMsg {
    OpenCase {
        parties: Vec<String>,
        amount: Coin,
        model: EscrowModel,
        expiry_ts: Option<u64>,
        remark: Option<String>,
    },
    Approve {
        case_id: u64,
    },
    Dispute {
        case_id: u64,
        reason: Option<String>,
    },
    Resolve {
        case_id: u64,
        decision: Resolution,
    },
    Release {
        case_id: u64,
        to: String,
        share_bps: Option<u16>,
    },
    Refund {
        case_id: u64,
    },
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(ConfigResp)]
    Config {},
    #[returns(CaseResp)]
    GetCase { id: u64 },
    #[returns(Vec<CaseResp>)]
    ListCases { start_after: Option<u64>, limit: Option<u32> },
    #[returns(u64)]
    GetReputation { address: String },
}

#[cw_serde]
pub struct ConfigResp {
    pub admin: String,
    pub default_denom: String,
    pub min_approval_threshold: u32,
}

#[cw_serde]
pub struct CaseResp {
    pub id: u64,
    pub parties: Vec<String>,
    pub amount: Coin,
    pub model: EscrowModel,
    pub expiry_ts: Option<u64>,
    pub remark: Option<String>,
    pub created_at: u64,
    pub status: CaseStatus,
    pub approvals: Vec<String>,
    pub dispute_reason: Option<String>,
    pub resolution: Option<Resolution>,
}

#[cw_serde]
pub enum EscrowModel {
    MultiSig { threshold: u32 },
    TimeTiered { stages: Vec<TimeStage> },
    Milestones { steps: Vec<Milestone> },
}

#[cw_serde]
pub struct TimeStage {
    pub duration: u64,
    pub required_approvals: u32,
}

#[cw_serde]
pub struct Milestone {
    pub description: String,
    pub required_approvals: u32,
    pub completed: bool,
}

#[cw_serde]
pub enum CaseStatus {
    Open,
    Approved,
    Disputed,
    Resolved,
    Expired,
}

#[cw_serde]
pub enum Resolution {
    Release { to: String, share_bps: u16 },
    Refund,
    Split { shares: Vec<(String, u16)> },
}
