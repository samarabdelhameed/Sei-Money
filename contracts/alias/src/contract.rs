#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;

use cosmwasm_std::{
    ensure, to_json_binary, Binary, Deps, DepsMut, Env, MessageInfo, Order, Response, StdResult,
};
use cw2::set_contract_version;

use crate::error::ContractError;
use crate::error::ContractError::*;
use crate::events::*;
use crate::msg::*;
use crate::state::*;

const CONTRACT_NAME: &str = "crates.io:seimoney-alias";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

fn validate_username(username: &str, min_len: u32, max_len: u32) -> Result<(), ContractError> {
    let len = username.len() as u32;
    ensure!(len >= min_len, UsernameTooShort);
    ensure!(len <= max_len, UsernameTooLong);

    // Check for valid characters (alphanumeric and underscore only)
    for c in username.chars() {
        if !c.is_alphanumeric() && c != '_' {
            return Err(UsernameInvalidChars);
        }
    }

    Ok(())
}

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
        min_username_length: msg.min_username_length.unwrap_or(3),
        max_username_length: msg.max_username_length.unwrap_or(20),
    };
    CONFIG.save(deps.storage, &cfg)?;
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    Ok(Response::new().add_attribute("action", "instantiate"))
}

#[entry_point]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::Register { username } => exec_register(deps, env, info, username),
        ExecuteMsg::Update { username } => exec_update(deps, env, info, username),
        ExecuteMsg::Unregister {} => exec_unregister(deps, env, info),
    }
}

fn exec_register(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    username: String,
) -> Result<Response, ContractError> {
    let cfg = CONFIG.load(deps.storage)?;

    // Validate username format
    validate_username(&username, cfg.min_username_length, cfg.max_username_length)?;

    // Check if username is already taken
    if NAME_TO_ADDR.has(deps.storage, username.as_str()) {
        return Err(UsernameTaken);
    }

    // Check if address already has a username
    if ADDR_TO_NAME.has(deps.storage, &info.sender) {
        return Err(AddressHasUsername);
    }

    // Register the username
    NAME_TO_ADDR.save(deps.storage, username.as_str(), &info.sender)?;
    ADDR_TO_NAME.save(deps.storage, &info.sender, &username)?;

    Ok(Response::new()
        .add_event(evt_register_alias(&username, info.sender.as_str()))
        .add_attribute("action", "register_alias"))
}

fn exec_update(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    username: String,
) -> Result<Response, ContractError> {
    let cfg = CONFIG.load(deps.storage)?;

    // Check if address has a username
    let old_username = ADDR_TO_NAME
        .load(deps.storage, &info.sender)
        .map_err(|_| NoUsernameRegistered)?;

    // Validate new username format
    validate_username(&username, cfg.min_username_length, cfg.max_username_length)?;

    // Check if new username is already taken
    if NAME_TO_ADDR.has(deps.storage, username.as_str()) {
        return Err(UsernameTaken);
    }

    // Remove old username
    NAME_TO_ADDR.remove(deps.storage, old_username.as_str());

    // Register new username
    NAME_TO_ADDR.save(deps.storage, username.as_str(), &info.sender)?;
    ADDR_TO_NAME.save(deps.storage, &info.sender, &username)?;

    Ok(Response::new()
        .add_event(evt_update_alias(&username, info.sender.as_str()))
        .add_attribute("action", "update_alias"))
}

fn exec_unregister(deps: DepsMut, _env: Env, info: MessageInfo) -> Result<Response, ContractError> {
    // Check if address has a username
    let username = ADDR_TO_NAME
        .load(deps.storage, &info.sender)
        .map_err(|_| NoUsernameRegistered)?;

    // Remove the username
    NAME_TO_ADDR.remove(deps.storage, username.as_str());
    ADDR_TO_NAME.remove(deps.storage, &info.sender);

    Ok(Response::new()
        .add_event(evt_unregister_alias(&username, info.sender.as_str()))
        .add_attribute("action", "unregister_alias"))
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::Config {} => {
            let c = CONFIG.load(deps.storage)?;
            to_json_binary(&ConfigResp {
                admin: c.admin.to_string(),
                min_username_length: c.min_username_length,
                max_username_length: c.max_username_length,
            })
        }
        QueryMsg::Resolve { username } => {
            let addr = NAME_TO_ADDR
                .load(deps.storage, username.as_str())
                .map_err(|_| cosmwasm_std::StdError::not_found("Username not found"))?;

            to_json_binary(&UsernameResp {
                username,
                address: addr.to_string(),
                registered_at: 0, // TODO: Add timestamp tracking
            })
        }
        QueryMsg::ReverseLookup { address } => {
            let addr = deps.api.addr_validate(&address)?;
            let username = ADDR_TO_NAME
                .load(deps.storage, &addr)
                .map_err(|_| cosmwasm_std::StdError::not_found("No username registered"))?;

            to_json_binary(&AddressResp {
                address,
                username,
                registered_at: 0, // TODO: Add timestamp tracking
            })
        }
        QueryMsg::ListUsernames {
            start_after: _,
            limit,
        } => {
            let limit = limit.unwrap_or(30) as usize;

            // Simple implementation without pagination for now
            let usernames: StdResult<Vec<_>> = ADDR_TO_NAME
                .range(deps.storage, None, None, Order::Ascending)
                .take(limit)
                .map(|item| {
                    let (_, username) = item?;
                    Ok(username)
                })
                .collect();

            to_json_binary(&usernames?)
        }
    }
}
