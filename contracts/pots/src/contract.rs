#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;

use cosmwasm_std::{
    ensure, to_json_binary, BankMsg, Binary, Coin, Deps, DepsMut, Env, MessageInfo, Order,
    Response, StdResult, Uint128,
};
use cw2::set_contract_version;
use cw_storage_plus::Bound;

use crate::error::ContractError;
use crate::error::ContractError::*;
use crate::events::*;
use crate::msg::*;
use crate::state::*;

const CONTRACT_NAME: &str = "crates.io:seimoney-pots";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> StdResult<Response> {
    let admin = match msg.admin {
        Some(a) => deps.api.addr_validate(&a)?,
        None => info.sender.clone(),
    };
    let cfg = Config {
        admin,
        default_denom: msg.default_denom,
    };
    CONFIG.save(deps.storage, &cfg)?;
    NEXT_POT_ID.save(deps.storage, &1u64)?;
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    Ok(Response::new().add_attribute("action", "instantiate"))
}

#[entry_point]
pub fn execute(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::OpenPot { goal, label } => exec_open_pot(deps, _env, info, goal, label),
        ExecuteMsg::DepositPot { pot_id, amount } => {
            exec_deposit_pot(deps, _env, info, pot_id, amount)
        }
        ExecuteMsg::BreakPot { pot_id } => exec_break_pot(deps, _env, info, pot_id),
        ExecuteMsg::ClosePot { pot_id } => exec_close_pot(deps, _env, info, pot_id),
    }
}

fn exec_open_pot(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    goal: Coin,
    label: Option<String>,
) -> Result<Response, ContractError> {
    let cfg = CONFIG.load(deps.storage)?;

    // Validate denom
    ensure!(goal.denom == cfg.default_denom, InvalidDenom);
    ensure!(goal.amount > Uint128::zero(), InvalidGoalAmount);

    let mut id = NEXT_POT_ID.load(deps.storage)?;
    let pot = Pot {
        id,
        owner: info.sender.clone(),
        goal: goal.clone(),
        current: Uint128::zero(),
        label,
        created_at: _env.block.time.seconds(),
        closed: false,
        broken: false,
    };

    POTS.save(deps.storage, id, &pot)?;

    // Update owner's pot list
    let mut owner_pots = OWNER_POTS
        .load(deps.storage, info.sender.clone())
        .unwrap_or_default();
    owner_pots.push(id);
    OWNER_POTS.save(deps.storage, info.sender.clone(), &owner_pots)?;

    id += 1;
    NEXT_POT_ID.save(deps.storage, &id)?;

    Ok(Response::new()
        .add_event(evt_open_pot(
            pot.id,
            pot.owner.as_str(),
            &goal,
            pot.label.as_deref(),
        ))
        .add_attribute("action", "open_pot"))
}

fn exec_deposit_pot(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    pot_id: u64,
    amount: Coin,
) -> Result<Response, ContractError> {
    let cfg = CONFIG.load(deps.storage)?;
    let mut pot = POTS.load(deps.storage, pot_id).map_err(|_| PotNotFound)?;

    // Validate pot state
    ensure!(!pot.closed, PotAlreadyClosed);
    ensure!(!pot.broken, PotAlreadyBroken);

    // Validate denom
    ensure!(amount.denom == cfg.default_denom, InvalidDenom);
    ensure!(amount.amount > Uint128::zero(), InvalidDepositAmount);

    // Update pot
    pot.current += amount.amount;
    POTS.save(deps.storage, pot_id, &pot)?;

    Ok(Response::new()
        .add_event(evt_deposit_pot(
            pot_id,
            pot.owner.as_str(),
            &amount.amount,
            &amount.denom,
        ))
        .add_attribute("action", "deposit_pot"))
}

fn exec_break_pot(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    pot_id: u64,
) -> Result<Response, ContractError> {
    let mut pot = POTS.load(deps.storage, pot_id).map_err(|_| PotNotFound)?;

    // Only owner can break pot
    ensure!(info.sender == pot.owner, Unauthorized);

    // Validate pot state
    ensure!(!pot.closed, PotAlreadyClosed);
    ensure!(!pot.broken, PotAlreadyBroken);

    // Check if pot has funds
    ensure!(pot.current > Uint128::zero(), PotEmpty);

    // Mark as broken
    pot.broken = true;
    POTS.save(deps.storage, pot_id, &pot)?;

    // Send funds back to owner
    let bank = BankMsg::Send {
        to_address: pot.owner.to_string(),
        amount: vec![Coin::new(pot.current.u128(), pot.goal.denom.clone())],
    };

    Ok(Response::new()
        .add_message(bank)
        .add_event(evt_break_pot(
            pot_id,
            pot.owner.as_str(),
            &pot.current,
            &pot.goal.denom,
        ))
        .add_attribute("action", "break_pot"))
}

fn exec_close_pot(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    pot_id: u64,
) -> Result<Response, ContractError> {
    let mut pot = POTS.load(deps.storage, pot_id).map_err(|_| PotNotFound)?;

    // Only owner can close pot
    ensure!(info.sender == pot.owner, Unauthorized);

    // Validate pot state
    ensure!(!pot.closed, PotAlreadyClosed);
    ensure!(!pot.broken, PotAlreadyBroken);

    // Check if goal reached
    ensure!(pot.current >= pot.goal.amount, GoalNotReached);

    // Mark as closed
    pot.closed = true;
    POTS.save(deps.storage, pot_id, &pot)?;

    // Send funds to owner
    let bank = BankMsg::Send {
        to_address: pot.owner.to_string(),
        amount: vec![Coin::new(pot.current.u128(), pot.goal.denom.clone())],
    };

    Ok(Response::new()
        .add_message(bank)
        .add_event(evt_close_pot(
            pot_id,
            pot.owner.as_str(),
            &pot.current,
            &pot.goal.denom,
        ))
        .add_attribute("action", "close_pot"))
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::Config {} => {
            let c = CONFIG.load(deps.storage)?;
            to_json_binary(&ConfigResp {
                admin: c.admin.to_string(),
                default_denom: c.default_denom,
            })
        }
        QueryMsg::GetPot { id } => {
            let p = POTS.load(deps.storage, id)?;
            to_json_binary(&PotResp {
                id: p.id,
                owner: p.owner.to_string(),
                goal: p.goal,
                current: p.current.to_string(),
                label: p.label,
                created_at: p.created_at,
                closed: p.closed,
                broken: p.broken,
            })
        }
        QueryMsg::ListPotsByOwner {
            owner,
            start_after,
            limit,
        } => {
            let owner_addr = deps.api.addr_validate(&owner)?;
            let owner_pots = OWNER_POTS
                .load(deps.storage, owner_addr)
                .unwrap_or_default();

            let limit = limit.unwrap_or(30) as usize;

            let pots: StdResult<Vec<_>> = owner_pots
                .iter()
                .filter(|&&id| {
                    if let Some(start_id) = start_after {
                        id > start_id
                    } else {
                        true
                    }
                })
                .take(limit)
                .map(|&id| {
                    let p = POTS.load(deps.storage, id)?;
                    Ok(PotResp {
                        id: p.id,
                        owner: p.owner.to_string(),
                        goal: p.goal,
                        current: p.current.to_string(),
                        label: p.label,
                        created_at: p.created_at,
                        closed: p.closed,
                        broken: p.broken,
                    })
                })
                .collect();

            to_json_binary(&pots?)
        }
        QueryMsg::ListAllPots { start_after, limit } => {
            let start = start_after.map(|id| Bound::<u64>::exclusive(id));
            let limit = limit.unwrap_or(30) as usize;

            let pots: StdResult<Vec<_>> = POTS
                .range(deps.storage, start, None, Order::Ascending)
                .take(limit)
                .map(|item| {
                    let (id, p) = item?;
                    Ok(PotResp {
                        id,
                        owner: p.owner.to_string(),
                        goal: p.goal,
                        current: p.current.to_string(),
                        label: p.label,
                        created_at: p.created_at,
                        closed: p.closed,
                        broken: p.broken,
                    })
                })
                .collect();

            to_json_binary(&pots?)
        }
    }
}
