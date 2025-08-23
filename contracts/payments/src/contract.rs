use cosmwasm_std::{
    entry_point, to_json_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult,
    Addr, Coin, Order, StdError, BankMsg,
};
use cw2::set_contract_version;

use crate::error::ContractError;
use crate::msg::{ExecuteMsg, InstantiateMsg, QueryMsg, ConfigResponse, TransferResponse, TransfersResponse};
use crate::state::{Config, CONFIG, NEXT_ID, TRANSFERS, TRANSFERS_BY_SENDER, TRANSFERS_BY_RECIPIENT};
use seimoney_common::{
    TransferInfo,
    events::{create_transfer_event, claim_transfer_event, refund_transfer_event},
    validation::{validate_denom, validate_non_zero_amount, validate_fee_bps, validate_different_addresses},
    time::is_expired,
};

const CONTRACT_NAME: &str = "seimoney-payments";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;

    let admin = deps.api.addr_validate(&msg.admin)?;
    let fee_bps = msg.fee_bps.unwrap_or(0);
    
    validate_fee_bps(fee_bps)?;

    let config = Config {
        admin,
        default_denom: msg.default_denom,
        fee_bps,
    };

    CONFIG.save(deps.storage, &config)?;
    NEXT_ID.save(deps.storage, &1u64)?;

    Ok(Response::new()
        .add_attribute("method", "instantiate")
        .add_attribute("admin", config.admin)
        .add_attribute("default_denom", config.default_denom)
        .add_attribute("fee_bps", fee_bps.to_string()))
}

#[entry_point]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::CreateTransfer { recipient, amount, remark, expiry_ts } => {
            execute_create_transfer(deps, env, info, recipient, amount, remark, expiry_ts)
        }
        ExecuteMsg::ClaimTransfer { id } => {
            execute_claim_transfer(deps, env, info, id)
        }
        ExecuteMsg::RefundTransfer { id } => {
            execute_refund_transfer(deps, env, info, id)
        }
        ExecuteMsg::UpdateConfig { admin, default_denom, fee_bps } => {
            execute_update_config(deps, info, admin, default_denom, fee_bps)
        }
    }
}

pub fn execute_create_transfer(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    recipient: String,
    amount: Coin,
    remark: Option<String>,
    expiry_ts: Option<cosmwasm_std::Timestamp>,
) -> Result<Response, ContractError> {
    let config = CONFIG.load(deps.storage)?;
    let recipient_addr = deps.api.addr_validate(&recipient)?;
    
    // Validate inputs
    validate_denom(&amount, &config.default_denom)?;
    validate_non_zero_amount(&amount.amount)?;
    validate_different_addresses(&info.sender, &recipient_addr)?;

    // Check if sender sent the exact amount
    let sent_amount = info.funds.iter()
        .find(|coin| coin.denom == config.default_denom)
        .ok_or(ContractError::Common(seimoney_common::errors::ContractError::InsufficientFunds {
            required: amount.to_string(),
            available: "0".to_string(),
        }))?;

    if sent_amount.amount != amount.amount {
        return Err(ContractError::Common(seimoney_common::errors::ContractError::InsufficientFunds {
            required: amount.to_string(),
            available: sent_amount.to_string(),
        }));
    }

    // Get next ID and increment
    let id = NEXT_ID.load(deps.storage)?;
    NEXT_ID.save(deps.storage, &(id + 1))?;

    // Create transfer info
    let transfer = TransferInfo {
        id,
        sender: info.sender.clone(),
        recipient: recipient_addr.clone(),
        amount: amount.clone(),
        remark: remark.clone(),
        created_at: env.block.time,
        expiry_ts,
        claimed: false,
        refunded: false,
    };

    // Save transfer and indexes
    TRANSFERS.save(deps.storage, id, &transfer)?;
    TRANSFERS_BY_SENDER.save(deps.storage, (&info.sender, id), &())?;
    TRANSFERS_BY_RECIPIENT.save(deps.storage, (&recipient_addr, id), &())?;

    let event = create_transfer_event(id, &info.sender, &recipient_addr, &amount, &remark);

    Ok(Response::new()
        .add_event(event)
        .add_attribute("method", "create_transfer")
        .add_attribute("id", id.to_string())
        .add_attribute("sender", info.sender)
        .add_attribute("recipient", recipient_addr)
        .add_attribute("amount", amount.to_string()))
}

pub fn execute_claim_transfer(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    id: u64,
) -> Result<Response, ContractError> {
    let mut transfer = TRANSFERS.load(deps.storage, id)
        .map_err(|_| ContractError::Common(seimoney_common::errors::ContractError::TransferNotFound { id }))?;

    // Validate claimer
    if transfer.recipient != info.sender {
        return Err(ContractError::OnlyRecipientCanClaim {});
    }

    // Check if already claimed or refunded
    if transfer.claimed {
        return Err(ContractError::Common(seimoney_common::errors::ContractError::TransferAlreadyClaimed { id }));
    }

    if transfer.refunded {
        return Err(ContractError::Common(seimoney_common::errors::ContractError::TransferAlreadyRefunded { id }));
    }

    // Check if expired
    if is_expired(transfer.expiry_ts, &env) {
        return Err(ContractError::Common(seimoney_common::errors::ContractError::TransferExpired { id }));
    }

    // Mark as claimed
    transfer.claimed = true;
    TRANSFERS.save(deps.storage, id, &transfer)?;

    // Send funds to recipient
    let send_msg = BankMsg::Send {
        to_address: transfer.recipient.to_string(),
        amount: vec![transfer.amount.clone()],
    };

    let event = claim_transfer_event(id, &info.sender, &transfer.amount);

    Ok(Response::new()
        .add_message(send_msg)
        .add_event(event)
        .add_attribute("method", "claim_transfer")
        .add_attribute("id", id.to_string())
        .add_attribute("claimer", info.sender)
        .add_attribute("amount", transfer.amount.to_string()))
}

pub fn execute_refund_transfer(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    id: u64,
) -> Result<Response, ContractError> {
    let mut transfer = TRANSFERS.load(deps.storage, id)
        .map_err(|_| ContractError::Common(seimoney_common::errors::ContractError::TransferNotFound { id }))?;

    // Validate refunder
    if transfer.sender != info.sender {
        return Err(ContractError::OnlySenderCanRefund {});
    }

    // Check if already claimed or refunded
    if transfer.claimed {
        return Err(ContractError::Common(seimoney_common::errors::ContractError::TransferAlreadyClaimed { id }));
    }

    if transfer.refunded {
        return Err(ContractError::Common(seimoney_common::errors::ContractError::TransferAlreadyRefunded { id }));
    }

    // Check if expired (only allow refund if expired or no expiry)
    if let Some(expiry) = transfer.expiry_ts {
        if !is_expired(Some(expiry), &env) {
            return Err(ContractError::Common(seimoney_common::errors::ContractError::TransferNotExpired { id }));
        }
    }

    // Mark as refunded
    transfer.refunded = true;
    TRANSFERS.save(deps.storage, id, &transfer)?;

    // Send funds back to sender
    let send_msg = BankMsg::Send {
        to_address: transfer.sender.to_string(),
        amount: vec![transfer.amount.clone()],
    };

    let event = refund_transfer_event(id, &info.sender, &transfer.amount);

    Ok(Response::new()
        .add_message(send_msg)
        .add_event(event)
        .add_attribute("method", "refund_transfer")
        .add_attribute("id", id.to_string())
        .add_attribute("refunder", info.sender)
        .add_attribute("amount", transfer.amount.to_string()))
}

pub fn execute_update_config(
    deps: DepsMut,
    info: MessageInfo,
    admin: Option<String>,
    default_denom: Option<String>,
    fee_bps: Option<u16>,
) -> Result<Response, ContractError> {
    let mut config = CONFIG.load(deps.storage)?;

    // Only admin can update config
    if config.admin != info.sender {
        return Err(ContractError::Unauthorized {});
    }

    if let Some(new_admin) = admin {
        config.admin = deps.api.addr_validate(&new_admin)?;
    }

    if let Some(new_denom) = default_denom {
        config.default_denom = new_denom;
    }

    if let Some(new_fee_bps) = fee_bps {
        validate_fee_bps(new_fee_bps)?;
        config.fee_bps = new_fee_bps;
    }

    CONFIG.save(deps.storage, &config)?;

    Ok(Response::new()
        .add_attribute("method", "update_config")
        .add_attribute("admin", config.admin)
        .add_attribute("default_denom", config.default_denom)
        .add_attribute("fee_bps", config.fee_bps.to_string()))
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::Config {} => to_json_binary(&query_config(deps)?),
        QueryMsg::GetTransfer { id } => to_json_binary(&query_transfer(deps, id)?),
        QueryMsg::ListBySender { sender, start_after, limit } => {
            to_json_binary(&query_transfers_by_sender(deps, sender, start_after, limit)?)
        }
        QueryMsg::ListByRecipient { recipient, start_after, limit } => {
            to_json_binary(&query_transfers_by_recipient(deps, recipient, start_after, limit)?)
        }
        QueryMsg::ListAll { start_after, limit } => {
            to_json_binary(&query_all_transfers(deps, start_after, limit)?)
        }
    }
}

fn query_config(deps: Deps) -> StdResult<ConfigResponse> {
    let config = CONFIG.load(deps.storage)?;
    Ok(ConfigResponse {
        admin: config.admin,
        default_denom: config.default_denom,
        fee_bps: config.fee_bps,
    })
}

fn query_transfer(deps: Deps, id: u64) -> StdResult<TransferResponse> {
    let transfer = TRANSFERS.load(deps.storage, id)?;
    Ok(TransferResponse { transfer })
}

fn query_transfers_by_sender(
    deps: Deps,
    sender: String,
    start_after: Option<u64>,
    limit: Option<u32>,
) -> StdResult<TransfersResponse> {
    let sender_addr = deps.api.addr_validate(&sender)?;
    let limit = limit.unwrap_or(10).min(30) as usize;
    let start = start_after.map(|id| ((&sender_addr, id), ()));

    let transfers: Result<Vec<_>, _> = TRANSFERS_BY_SENDER
        .range(deps.storage, start, None, Order::Ascending)
        .take(limit)
        .map(|item| {
            let ((_, id), _) = item?;
            TRANSFERS.load(deps.storage, id)
        })
        .collect();

    Ok(TransfersResponse {
        transfers: transfers?,
    })
}

fn query_transfers_by_recipient(
    deps: Deps,
    recipient: String,
    start_after: Option<u64>,
    limit: Option<u32>,
) -> StdResult<TransfersResponse> {
    let recipient_addr = deps.api.addr_validate(&recipient)?;
    let limit = limit.unwrap_or(10).min(30) as usize;
    let start = start_after.map(|id| ((&recipient_addr, id), ()));

    let transfers: Result<Vec<_>, _> = TRANSFERS_BY_RECIPIENT
        .range(deps.storage, start, None, Order::Ascending)
        .take(limit)
        .map(|item| {
            let ((_, id), _) = item?;
            TRANSFERS.load(deps.storage, id)
        })
        .collect();

    Ok(TransfersResponse {
        transfers: transfers?,
    })
}

fn query_all_transfers(
    deps: Deps,
    start_after: Option<u64>,
    limit: Option<u32>,
) -> StdResult<TransfersResponse> {
    let limit = limit.unwrap_or(10).min(30) as usize;
    let start = start_after.map(|id| (id, ()));

    let transfers: Result<Vec<_>, _> = TRANSFERS
        .range(deps.storage, start, None, Order::Ascending)
        .take(limit)
        .map(|item| {
            let (_, transfer) = item?;
            Ok(transfer)
        })
        .collect();

    Ok(TransfersResponse {
        transfers: transfers?,
    })
}