#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;

use cosmwasm_std::{
    ensure, to_json_binary, BankMsg, Binary, Coin, Deps, DepsMut, Env, MessageInfo, Response,
    StdResult, Uint128, Order,
};
use cw2::set_contract_version;
use cw_storage_plus::Bound;

use crate::error::ContractError::*;
use crate::error::ContractError;
use crate::events::*;
use crate::msg::*;
use crate::state::*;

const CONTRACT_NAME: &str = "crates.io:seimoney-vaults";
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
        max_fee_bps: msg.max_fee_bps.unwrap_or(500), // Default 5%
    };
    CONFIG.save(deps.storage, &cfg)?;
    NEXT_VAULT_ID.save(deps.storage, &1u64)?;
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    Ok(Response::new().add_attribute("action", "instantiate"))
}

#[entry_point]
pub fn execute(deps: DepsMut, env: Env, info: MessageInfo, msg: ExecuteMsg) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::CreateVault { label, denom, strategy, fee_bps } => {
            exec_create_vault(deps, env, info, label, denom, strategy, fee_bps)
        },
        ExecuteMsg::Deposit { vault_id, amount } => exec_deposit(deps, env, info, vault_id, amount),
        ExecuteMsg::Withdraw { vault_id, shares } => exec_withdraw(deps, env, info, vault_id, shares),
        ExecuteMsg::Harvest { vault_id } => exec_harvest(deps, env, info, vault_id),
        ExecuteMsg::Rebalance { vault_id, plan } => exec_rebalance(deps, env, info, vault_id, plan),
    }
}

fn exec_create_vault(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    label: String,
    denom: String,
    strategy: StrategyConfig,
    fee_bps: Option<u16>,
) -> Result<Response, ContractError> {
    let cfg = CONFIG.load(deps.storage)?;
    
    // Check if sender is admin
    ensure!(info.sender == cfg.admin, Unauthorized);
    
    // Validate fee
    let fee = fee_bps.unwrap_or(100); // Default 1%
    ensure!(fee <= cfg.max_fee_bps, InvalidFee);
    
    // Validate strategy
    validate_strategy(&strategy)?;
    
    let mut id = NEXT_VAULT_ID.load(deps.storage)?;
    let vault = Vault {
        id,
        label: label.clone(),
        denom: denom.clone(),
        strategy: strategy.clone(),
        fee_bps: fee,
        tvl: Uint128::zero(),
        total_shares: Uint128::zero(),
        created_at: env.block.time.seconds(),
        allocations: vec![],
    };
    
    VAULTS.save(deps.storage, id, &vault)?;
    id += 1;
    NEXT_VAULT_ID.save(deps.storage, &id)?;

    let strategy_str = match &strategy {
        StrategyConfig::Conservative => "Conservative",
        StrategyConfig::Balanced => "Balanced",
        StrategyConfig::Aggressive => "Aggressive",
        StrategyConfig::Custom { .. } => "Custom",
    };

    Ok(Response::new()
        .add_event(evt_create_vault(vault.id, &label, &denom, strategy_str))
        .add_attribute("action", "create_vault"))
}

fn exec_deposit(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    vault_id: u64,
    amount: Coin,
) -> Result<Response, ContractError> {
    let mut vault = VAULTS.load(deps.storage, vault_id).map_err(|_| VaultNotFound)?;
    
    // Validate denom
    ensure!(amount.denom == vault.denom, InvalidDenom);
    ensure!(amount.amount > Uint128::zero(), InvalidAmount);
    
    // Calculate shares to mint
    let shares = if vault.total_shares == Uint128::zero() {
        amount.amount
    } else {
        amount.amount * vault.total_shares / vault.tvl
    };
    
    // Update vault
    vault.tvl += amount.amount;
    vault.total_shares += shares;
    VAULTS.save(deps.storage, vault_id, &vault)?;
    
    // Update user position
    let user_pos = UserPosition {
        vault_id,
        address: info.sender.clone(),
        shares,
        deposited_at: _env.block.time.seconds(),
    };
    USER_POSITIONS.save(deps.storage, (vault_id, info.sender.clone()), &user_pos)?;
    
    // Update vault shares
    let current_shares = VAULT_SHARES.load(deps.storage, (vault_id, info.sender.clone())).unwrap_or_default();
    VAULT_SHARES.save(deps.storage, (vault_id, info.sender.clone()), &(current_shares + shares))?;

    Ok(Response::new()
        .add_event(evt_deposit_vault(vault_id, info.sender.as_str(), &amount, &shares))
        .add_attribute("action", "deposit_vault"))
}

fn exec_withdraw(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    vault_id: u64,
    shares: String,
) -> Result<Response, ContractError> {
    let mut vault = VAULTS.load(deps.storage, vault_id).map_err(|_| VaultNotFound)?;
    
    let shares_to_withdraw = shares.parse::<Uint128>().map_err(|_| InvalidAmount)?;
    ensure!(shares_to_withdraw > Uint128::zero(), InvalidAmount);
    
    // Check user shares
    let user_shares = VAULT_SHARES.load(deps.storage, (vault_id, info.sender.clone()))
        .map_err(|_| InsufficientShares)?;
    ensure!(user_shares >= shares_to_withdraw, InsufficientShares);
    
    // Calculate withdrawal amount
    let withdrawal_amount = shares_to_withdraw * vault.tvl / vault.total_shares;
    
    // Update vault
    vault.tvl -= withdrawal_amount;
    vault.total_shares -= shares_to_withdraw;
    VAULTS.save(deps.storage, vault_id, &vault)?;
    
    // Update user shares
    let new_shares = user_shares - shares_to_withdraw;
    if new_shares == Uint128::zero() {
        VAULT_SHARES.remove(deps.storage, (vault_id, info.sender.clone()));
        USER_POSITIONS.remove(deps.storage, (vault_id, info.sender.clone()));
    } else {
        VAULT_SHARES.save(deps.storage, (vault_id, info.sender.clone()), &new_shares)?;
    }
    
    // Send funds to user
    let bank = BankMsg::Send { 
        to_address: info.sender.to_string(), 
        amount: vec![Coin::new(withdrawal_amount.u128(), vault.denom.clone())] 
    };

    Ok(Response::new()
        .add_message(bank)
        .add_event(evt_withdraw_vault(vault_id, info.sender.as_str(), &shares_to_withdraw, &Coin::new(withdrawal_amount.u128(), vault.denom.clone())))
        .add_attribute("action", "withdraw_vault"))
}

fn exec_harvest(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    vault_id: u64,
) -> Result<Response, ContractError> {
    let vault = VAULTS.load(deps.storage, vault_id).map_err(|_| VaultNotFound)?;
    
    // Check if sender is admin
    let cfg = CONFIG.load(deps.storage)?;
    ensure!(info.sender == cfg.admin, Unauthorized);
    
    // For now, just emit event (yield calculation would be implemented based on protocol integrations)
    let yield_amount = Coin::new(0u128, vault.denom.clone());

    Ok(Response::new()
        .add_event(evt_harvest_vault(vault_id, &yield_amount))
        .add_attribute("action", "harvest_vault"))
}

fn exec_rebalance(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    vault_id: u64,
    plan: AllocationPlan,
) -> Result<Response, ContractError> {
    let mut vault = VAULTS.load(deps.storage, vault_id).map_err(|_| VaultNotFound)?;
    
    // Check if sender is admin
    let cfg = CONFIG.load(deps.storage)?;
    ensure!(info.sender == cfg.admin, Unauthorized);
    
    // Validate allocation plan
    validate_allocation_plan(&plan)?;
    
    // Update allocations
    vault.allocations = plan.legs;
    VAULTS.save(deps.storage, vault_id, &vault)?;

    let allocations_str = format!("{} legs", vault.allocations.len());

    Ok(Response::new()
        .add_event(evt_rebalance_vault(vault_id, &allocations_str))
        .add_attribute("action", "rebalance_vault"))
}

fn validate_strategy(strategy: &StrategyConfig) -> Result<(), ContractError> {
    match strategy {
        StrategyConfig::Conservative | StrategyConfig::Balanced | StrategyConfig::Aggressive => Ok(()),
        StrategyConfig::Custom { allocations } => validate_allocation_plan(allocations),
    }
}

fn validate_allocation_plan(plan: &AllocationPlan) -> Result<(), ContractError> {
    let total_weight: u32 = plan.legs.iter().map(|leg| leg.weight_bps as u32).sum();
    ensure!(total_weight <= 10000, AllocationExceeds100);
    Ok(())
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::Config {} => {
            let c = CONFIG.load(deps.storage)?;
            to_json_binary(&ConfigResp { 
                admin: c.admin.to_string(), 
                default_denom: c.default_denom,
                max_fee_bps: c.max_fee_bps,
            })
        }
        QueryMsg::GetVault { id } => {
            let v = VAULTS.load(deps.storage, id)?;
            to_json_binary(&VaultResp {
                id: v.id,
                label: v.label,
                denom: v.denom,
                strategy: v.strategy,
                fee_bps: v.fee_bps,
                tvl: v.tvl.to_string(),
                total_shares: v.total_shares.to_string(),
                created_at: v.created_at,
                allocations: v.allocations.iter().map(|leg| AllocationLegResp {
                    protocol: leg.protocol.clone(),
                    weight_bps: leg.weight_bps,
                    current_amount: "0".to_string(), // TODO: Implement actual allocation tracking
                    target_amount: leg.target_amount.clone(),
                }).collect(),
            })
        }
        QueryMsg::UserPosition { vault_id, address } => {
            let addr = deps.api.addr_validate(&address)?;
            let shares = VAULT_SHARES.load(deps.storage, (vault_id, addr.clone())).unwrap_or_default();
            let vault = VAULTS.load(deps.storage, vault_id)?;
            
            let value = if vault.total_shares == Uint128::zero() {
                Uint128::zero()
            } else {
                shares * vault.tvl / vault.total_shares
            };
            
            to_json_binary(&UserPositionResp {
                vault_id,
                address: address.clone(),
                shares: shares.to_string(),
                value: value.to_string(),
                deposited_at: 0, // TODO: Track deposit time
            })
        }
        QueryMsg::ListVaults { start_after, limit } => {
            let start = start_after.map(|id| Bound::<u64>::exclusive(id));
            let limit = limit.unwrap_or(30) as usize;
            
            let vaults: StdResult<Vec<_>> = VAULTS
                .range(deps.storage, start, None, Order::Ascending)
                .take(limit)
                .map(|item| {
                    let (id, v) = item?;
                    Ok(VaultResp {
                        id,
                        label: v.label,
                        denom: v.denom,
                        strategy: v.strategy,
                        fee_bps: v.fee_bps,
                        tvl: v.tvl.to_string(),
                        total_shares: v.total_shares.to_string(),
                        created_at: v.created_at,
                        allocations: v.allocations.iter().map(|leg| AllocationLegResp {
                            protocol: leg.protocol.clone(),
                            weight_bps: leg.weight_bps,
                            current_amount: "0".to_string(),
                            target_amount: leg.target_amount.clone(),
                        }).collect(),
                    })
                })
                .collect();
            
            to_json_binary(&vaults?)
        }
    }
}
