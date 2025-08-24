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

const CONTRACT_NAME: &str = "crates.io:seimoney-groups";
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
        max_participants: msg.max_participants.unwrap_or(100),
    };
    CONFIG.save(deps.storage, &cfg)?;
    NEXT_POOL_ID.save(deps.storage, &1u64)?;
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    Ok(Response::new().add_attribute("action", "instantiate"))
}

#[entry_point]
pub fn execute(deps: DepsMut, env: Env, info: MessageInfo, msg: ExecuteMsg) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::CreatePool { target, max_participants, memo, expiry_ts } => {
            exec_create_pool(deps, env, info, target, max_participants, memo, expiry_ts)
        },
        ExecuteMsg::Contribute { pool_id, amount } => exec_contribute(deps, env, info, pool_id, amount),
        ExecuteMsg::Distribute { pool_id } => exec_distribute(deps, env, info, pool_id),
        ExecuteMsg::CancelPool { pool_id } => exec_cancel_pool(deps, env, info, pool_id),
        ExecuteMsg::RefundContribution { pool_id } => exec_refund_contribution(deps, env, info, pool_id),
    }
}

fn exec_create_pool(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    target: Coin,
    max_participants: Option<u32>,
    memo: Option<String>,
    expiry_ts: Option<u64>,
) -> Result<Response, ContractError> {
    let cfg = CONFIG.load(deps.storage)?;
    
    // Validate denom
    ensure!(target.denom == cfg.default_denom, InvalidContribution);
    ensure!(target.amount > Uint128::zero(), InvalidContribution);
    
    // Validate expiry
    if let Some(ts) = expiry_ts {
        ensure!(Timestamp::from_seconds(ts) > env.block.time, PoolExpired);
    }
    
    let mut id = NEXT_POOL_ID.load(deps.storage)?;
    let pool = Pool {
        id,
        creator: info.sender.clone(),
        target: target.clone(),
        current: Uint128::zero(),
        participants: vec![],
        memo,
        created_at: env.block.time.seconds(),
        expiry_ts,
        distributed: false,
        cancelled: false,
    };
    
    POOLS.save(deps.storage, id, &pool)?;
    id += 1;
    NEXT_POOL_ID.save(deps.storage, &id)?;

    Ok(Response::new()
        .add_event(evt_create_pool(pool.id, pool.creator.as_str(), &target, pool.memo.as_deref()))
        .add_attribute("action", "create_pool"))
}

fn exec_contribute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    pool_id: u64,
    amount: Coin,
) -> Result<Response, ContractError> {
    let cfg = CONFIG.load(deps.storage)?;
    let mut pool = POOLS.load(deps.storage, pool_id).map_err(|_| PoolNotFound)?;
    
    // Validate pool state
    ensure!(!pool.distributed, PoolAlreadyDistributed);
    ensure!(!pool.cancelled, PoolAlreadyCancelled);
    
    // Validate expiry
    if let Some(ts) = pool.expiry_ts {
        ensure!(Timestamp::from_seconds(ts) > env.block.time, PoolExpired);
    }
    
    // Validate denom
    ensure!(amount.denom == cfg.default_denom, InvalidContribution);
    ensure!(amount.amount > Uint128::zero(), InvalidContribution);
    
    // Check if target reached
    ensure!(pool.current < pool.target.amount, TargetReached);
    
    // Check max participants
    ensure!(pool.participants.len() < cfg.max_participants as usize, PoolFull);
    
    // Add contribution
    let contribution = Contribution {
        contributor: info.sender.clone(),
        amount: amount.amount,
        contributed_at: env.block.time.seconds(),
    };
    
    CONTRIBUTIONS.save(deps.storage, (pool_id, info.sender.clone()), &contribution)?;
    
    // Update pool
    if !pool.participants.contains(&info.sender) {
        pool.participants.push(info.sender.clone());
    }
    pool.current += amount.amount;
    POOLS.save(deps.storage, pool_id, &pool)?;

    Ok(Response::new()
        .add_event(evt_contribute(pool_id, info.sender.as_str(), &amount.amount, &amount.denom))
        .add_attribute("action", "contribute"))
}

fn exec_distribute(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    pool_id: u64,
) -> Result<Response, ContractError> {
    let mut pool = POOLS.load(deps.storage, pool_id).map_err(|_| PoolNotFound)?;
    
    // Only creator can distribute
    ensure!(info.sender == pool.creator, Unauthorized);
    
    // Validate pool state
    ensure!(!pool.distributed, PoolAlreadyDistributed);
    ensure!(!pool.cancelled, PoolAlreadyCancelled);
    
    // Check if target reached
    ensure!(pool.current >= pool.target.amount, InvalidPoolState);
    
    // Mark as distributed
    pool.distributed = true;
    POOLS.save(deps.storage, pool_id, &pool)?;
    
    // Send funds to creator
    let bank = BankMsg::Send { 
        to_address: pool.creator.to_string(), 
        amount: vec![Coin::new(pool.current.u128(), pool.target.denom.clone())] 
    };

    Ok(Response::new()
        .add_message(bank)
        .add_event(evt_distribute(pool_id, pool.creator.as_str(), &pool.current, &pool.target.denom))
        .add_attribute("action", "distribute"))
}

fn exec_cancel_pool(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    pool_id: u64,
) -> Result<Response, ContractError> {
    let mut pool = POOLS.load(deps.storage, pool_id).map_err(|_| PoolNotFound)?;
    
    // Only creator can cancel
    ensure!(info.sender == pool.creator, Unauthorized);
    
    // Validate pool state
    ensure!(!pool.distributed, PoolAlreadyDistributed);
    ensure!(!pool.cancelled, PoolAlreadyCancelled);
    
    // Check if expired
    if let Some(ts) = pool.expiry_ts {
        ensure!(Timestamp::from_seconds(ts) <= env.block.time, PoolNotExpired);
    }
    
    // Mark as cancelled
    pool.cancelled = true;
    POOLS.save(deps.storage, pool_id, &pool)?;

    Ok(Response::new()
        .add_event(evt_cancel_pool(pool_id, pool.creator.as_str()))
        .add_attribute("action", "cancel_pool"))
}

fn exec_refund_contribution(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    pool_id: u64,
) -> Result<Response, ContractError> {
    let pool = POOLS.load(deps.storage, pool_id).map_err(|_| PoolNotFound)?;
    
    // Pool must be cancelled to refund
    ensure!(pool.cancelled, InvalidPoolState);
    
    // Get contribution
    let contribution = CONTRIBUTIONS.load(deps.storage, (pool_id, info.sender.clone()))
        .map_err(|_| InvalidContribution)?;
    
    // Remove contribution
    CONTRIBUTIONS.remove(deps.storage, (pool_id, info.sender.clone()));
    
    // Send refund
    let bank = BankMsg::Send { 
        to_address: info.sender.to_string(), 
        amount: vec![Coin::new(contribution.amount.u128(), pool.target.denom.clone())] 
    };

    Ok(Response::new()
        .add_message(bank)
        .add_event(evt_refund_contribution(pool_id, info.sender.as_str(), &contribution.amount, &pool.target.denom))
        .add_attribute("action", "refund_contribution"))
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::Config {} => {
            let c = CONFIG.load(deps.storage)?;
            to_json_binary(&ConfigResp { 
                admin: c.admin.to_string(), 
                default_denom: c.default_denom,
                max_participants: c.max_participants,
            })
        }
        QueryMsg::GetPool { id } => {
            let p = POOLS.load(deps.storage, id)?;
            to_json_binary(&PoolResp {
                id: p.id,
                creator: p.creator.to_string(),
                target: p.target,
                current: p.current.to_string(),
                participants: p.participants.iter().map(|addr| addr.to_string()).collect(),
                memo: p.memo,
                created_at: p.created_at,
                expiry_ts: p.expiry_ts,
                distributed: p.distributed,
                cancelled: p.cancelled,
            })
        }
        QueryMsg::ListContributions { pool_id, start_after, limit } => {
            let start = if let Some(addr) = start_after {
                let validated_addr = deps.api.addr_validate(&addr)?;
                Some(Bound::exclusive((pool_id, validated_addr)))
            } else {
                None
            };
            let limit = limit.unwrap_or(30) as usize;
            
            let contributions: StdResult<Vec<_>> = CONTRIBUTIONS
                .range(deps.storage, start, None, Order::Ascending)
                .take(limit)
                .map(|item| {
                    let ((_, addr), contrib) = item?;
                    Ok(ContributionResp {
                        contributor: addr.to_string(),
                        amount: contrib.amount.to_string(),
                        contributed_at: contrib.contributed_at,
                    })
                })
                .collect();
            
            to_json_binary(&contributions?)
        }
        QueryMsg::ListPools { start_after, limit } => {
            let start = start_after.map(|id| Bound::exclusive(id));
            let limit = limit.unwrap_or(30) as usize;
            
            let pools: StdResult<Vec<_>> = POOLS
                .range(deps.storage, start, None, Order::Ascending)
                .take(limit)
                .map(|item| {
                    let (id, p) = item?;
                    Ok(PoolResp {
                        id,
                        creator: p.creator.to_string(),
                        target: p.target,
                        current: p.current.to_string(),
                        participants: p.participants.iter().map(|addr| addr.to_string()).collect(),
                        memo: p.memo,
                        created_at: p.created_at,
                        expiry_ts: p.expiry_ts,
                        distributed: p.distributed,
                        cancelled: p.cancelled,
                    })
                })
                .collect();
            
            to_json_binary(&pools?)
        }
    }
}
