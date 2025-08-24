#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;

use cosmwasm_std::{
    ensure, to_json_binary, BankMsg, Binary, Coin, Deps, DepsMut, Env, MessageInfo, Response,
    StdResult, Timestamp, Uint128, Order, Addr,
};
use cw2::set_contract_version;
use cw_storage_plus::Bound;

use crate::error::ContractError::*;
use crate::error::ContractError;
use crate::events::*;
use crate::msg::*;
use crate::state::*;

const CONTRACT_NAME: &str = "crates.io:seimoney-risk-escrow";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[entry_point]
pub fn instantiate(deps: DepsMut, _env: Env, info: MessageInfo, msg: InstantiateMsg) -> StdResult<Response> {
    let admin = match msg.admin {
        Some(a) => deps.api.addr_validate(&a)?,
        None => info.sender.clone(),
    };
    let cfg = Config { 
        admin, 
        default_denom: msg.default_denom,
        min_approval_threshold: msg.min_approval_threshold.unwrap_or(2),
    };
    CONFIG.save(deps.storage, &cfg)?;
    NEXT_CASE_ID.save(deps.storage, &1u64)?;
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    Ok(Response::new().add_attribute("action", "instantiate"))
}

#[entry_point]
pub fn execute(deps: DepsMut, env: Env, info: MessageInfo, msg: ExecuteMsg) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::OpenCase { parties, amount, model, expiry_ts, remark } => {
            exec_open_case(deps, env, info, parties, amount, model, expiry_ts, remark)
        },
        ExecuteMsg::Approve { case_id } => exec_approve(deps, env, info, case_id),
        ExecuteMsg::Dispute { case_id, reason } => exec_dispute(deps, env, info, case_id, reason),
        ExecuteMsg::Resolve { case_id, decision } => exec_resolve(deps, env, info, case_id, decision),
        ExecuteMsg::Release { case_id, to, share_bps } => exec_release(deps, env, info, case_id, to, share_bps),
        ExecuteMsg::Refund { case_id } => exec_refund(deps, env, info, case_id),
    }
}

fn exec_open_case(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    parties: Vec<String>,
    amount: Coin,
    model: EscrowModel,
    expiry_ts: Option<u64>,
    remark: Option<String>,
) -> Result<Response, ContractError> {
    let cfg = CONFIG.load(deps.storage)?;
    
    // Validate denom
    ensure!(amount.denom == cfg.default_denom, InvalidDenom);
    ensure!(amount.amount > Uint128::zero(), InvalidAmount);
    
    // Validate parties
    ensure!(parties.len() >= 2, InvalidParty);
    let validated_parties: Vec<Addr> = parties.iter()
        .map(|p| deps.api.addr_validate(p))
        .collect::<Result<Vec<_>, _>>()?;
    
    // Validate expiry
    if let Some(ts) = expiry_ts {
        ensure!(Timestamp::from_seconds(ts) > env.block.time, CaseExpired);
    }
    
    let mut id = NEXT_CASE_ID.load(deps.storage)?;
    let case = Case {
        id,
        parties: validated_parties.clone(),
        amount: amount.clone(),
        model: model.clone(),
        expiry_ts,
        remark,
        created_at: env.block.time.seconds(),
        status: CaseStatus::Open,
        approvals: vec![],
        dispute_reason: None,
        resolution: None,
    };
    
    CASES.save(deps.storage, id, &case)?;
    id += 1;
    NEXT_CASE_ID.save(deps.storage, &id)?;

    let model_str = match &model {
        EscrowModel::MultiSig { threshold } => format!("MultiSig({})", threshold),
        EscrowModel::TimeTiered { stages } => format!("TimeTiered({})", stages.len()),
        EscrowModel::Milestones { steps } => format!("Milestones({})", steps.len()),
    };

    Ok(Response::new()
        .add_event(evt_open_case(case.id, &parties, &amount, &model_str))
        .add_attribute("action", "open_case"))
}

fn exec_approve(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    case_id: u64,
) -> Result<Response, ContractError> {
    let mut case = CASES.load(deps.storage, case_id).map_err(|_| CaseNotFound)?;
    
    // Validate case state
    ensure!(matches!(case.status, CaseStatus::Open), InvalidEscrowModel);
    
    // Check if sender is a party
    ensure!(case.parties.contains(&info.sender), InvalidParty);
    
    // Check if already approved
    if case.approvals.contains(&info.sender) {
        return Ok(Response::new().add_attribute("action", "already_approved"));
    }
    
    // Add approval
    case.approvals.push(info.sender.clone());
    
    // Check if enough approvals
    let required = match &case.model {
        EscrowModel::MultiSig { threshold } => *threshold,
        EscrowModel::TimeTiered { stages } => stages[0].required_approvals,
        EscrowModel::Milestones { steps } => steps[0].required_approvals,
    };
    
    if case.approvals.len() >= required as usize {
        case.status = CaseStatus::Approved;
    }
    
    CASES.save(deps.storage, case_id, &case)?;

    Ok(Response::new()
        .add_event(evt_approve(case_id, info.sender.as_str()))
        .add_attribute("action", "approve"))
}

fn exec_dispute(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    case_id: u64,
    reason: Option<String>,
) -> Result<Response, ContractError> {
    let mut case = CASES.load(deps.storage, case_id).map_err(|_| CaseNotFound)?;
    
    // Check if sender is a party
    ensure!(case.parties.contains(&info.sender), InvalidParty);
    
    // Validate case state
    ensure!(matches!(case.status, CaseStatus::Open | CaseStatus::Approved), InvalidEscrowModel);
    
    // Set dispute status
    case.status = CaseStatus::Disputed;
    case.dispute_reason = reason.clone();
    CASES.save(deps.storage, case_id, &case)?;

    Ok(Response::new()
        .add_event(evt_dispute(case_id, info.sender.as_str(), reason.as_deref()))
        .add_attribute("action", "dispute"))
}

fn exec_resolve(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    case_id: u64,
    decision: Resolution,
) -> Result<Response, ContractError> {
    let mut case = CASES.load(deps.storage, case_id).map_err(|_| CaseNotFound)?;
    
    // Check if sender is admin or a party
    let cfg = CONFIG.load(deps.storage)?;
    let is_admin = info.sender == cfg.admin;
    let is_party = case.parties.contains(&info.sender);
    ensure!(is_admin || is_party, Unauthorized);
    
    // Validate case state
    ensure!(matches!(case.status, CaseStatus::Disputed), CaseNotInDispute);
    
    // Set resolution
    case.status = CaseStatus::Resolved;
    case.resolution = Some(decision.clone());
    CASES.save(deps.storage, case_id, &case)?;

    let decision_str = match &decision {
        Resolution::Release { to, share_bps } => format!("Release({}, {}%)", to, share_bps),
        Resolution::Refund => "Refund".to_string(),
        Resolution::Split { shares } => format!("Split({} parts)", shares.len()),
    };

    Ok(Response::new()
        .add_event(evt_resolve(case_id, info.sender.as_str(), &decision_str))
        .add_attribute("action", "resolve"))
}

fn exec_release(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    case_id: u64,
    to: String,
    share_bps: Option<u16>,
) -> Result<Response, ContractError> {
    let case = CASES.load(deps.storage, case_id).map_err(|_| CaseNotFound)?;
    
    // Check if sender is admin
    let cfg = CONFIG.load(deps.storage)?;
    ensure!(info.sender == cfg.admin, Unauthorized);
    
    // Validate case state
    ensure!(matches!(case.status, CaseStatus::Resolved), InvalidEscrowModel);
    
    let to_addr = deps.api.addr_validate(&to)?;
    let share = share_bps.unwrap_or(10000); // Default to 100%
    ensure!(share <= 10000, InvalidAmount);
    
    let amount = case.amount.amount * Uint128::from(share) / Uint128::from(10000u16);
    let release_coin = Coin::new(amount.u128(), case.amount.denom.clone());
    
    // Send funds
    let bank = BankMsg::Send { 
        to_address: to_addr.to_string(), 
        amount: vec![release_coin.clone()] 
    };

    Ok(Response::new()
        .add_message(bank)
        .add_event(evt_release(case_id, &to, &release_coin))
        .add_attribute("action", "release"))
}

fn exec_refund(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    case_id: u64,
) -> Result<Response, ContractError> {
    let case = CASES.load(deps.storage, case_id).map_err(|_| CaseNotFound)?;
    
    // Check if sender is admin
    let cfg = CONFIG.load(deps.storage)?;
    ensure!(info.sender == cfg.admin, Unauthorized);
    
    // Validate case state
    ensure!(matches!(case.status, CaseStatus::Resolved), InvalidEscrowModel);
    
    // Refund to first party (simplified)
    let refund_to = case.parties[0].clone();
    let bank = BankMsg::Send { 
        to_address: refund_to.to_string(), 
        amount: vec![case.amount.clone()] 
    };

    Ok(Response::new()
        .add_message(bank)
        .add_event(evt_refund(case_id, refund_to.as_str(), &case.amount))
        .add_attribute("action", "refund"))
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::Config {} => {
            let c = CONFIG.load(deps.storage)?;
            to_json_binary(&ConfigResp { 
                admin: c.admin.to_string(), 
                default_denom: c.default_denom,
                min_approval_threshold: c.min_approval_threshold,
            })
        }
        QueryMsg::GetCase { id } => {
            let c = CASES.load(deps.storage, id)?;
            to_json_binary(&CaseResp {
                id: c.id,
                parties: c.parties.iter().map(|addr| addr.to_string()).collect(),
                amount: c.amount,
                model: c.model,
                expiry_ts: c.expiry_ts,
                remark: c.remark,
                created_at: c.created_at,
                status: c.status,
                approvals: c.approvals.iter().map(|addr| addr.to_string()).collect(),
                dispute_reason: c.dispute_reason,
                resolution: c.resolution,
            })
        }
        QueryMsg::ListCases { start_after, limit } => {
            let start = start_after.map(|id| Bound::<u64>::exclusive(id));
            let limit = limit.unwrap_or(30) as usize;
            
            let cases: StdResult<Vec<_>> = CASES
                .range(deps.storage, start, None, Order::Ascending)
                .take(limit)
                .map(|item| {
                    let (id, c) = item?;
                    Ok(CaseResp {
                        id,
                        parties: c.parties.iter().map(|addr| addr.to_string()).collect(),
                        amount: c.amount,
                        model: c.model,
                        expiry_ts: c.expiry_ts,
                        remark: c.remark,
                        created_at: c.created_at,
                        status: c.status,
                        approvals: c.approvals.iter().map(|addr| addr.to_string()).collect(),
                        dispute_reason: c.dispute_reason,
                        resolution: c.resolution,
                    })
                })
                .collect();
            
            to_json_binary(&cases?)
        }
        QueryMsg::GetReputation { address } => {
            let addr = deps.api.addr_validate(&address)?;
            let reputation = REPUTATION.load(deps.storage, addr).unwrap_or(0);
            to_json_binary(&reputation)
        }
    }
}
