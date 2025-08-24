#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;

use cosmwasm_std::{
    ensure, to_json_binary, BankMsg, Binary, Coin, Deps, DepsMut, Env, MessageInfo, Response,
    StdResult, Timestamp, Uint128, Order,
};
use cw2::set_contract_version;
use cw_storage_plus::Bound;

use crate::error::ContractError::*;
use crate::error::ContractError;
use crate::events::*;
use crate::msg::*;
use crate::state::*;

const CONTRACT_NAME: &str = "crates.io:seimoney-payments";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[entry_point]
pub fn instantiate(deps: DepsMut, _env: Env, info: MessageInfo, msg: InstantiateMsg) -> StdResult<Response> {
    let admin = match msg.admin {
        Some(a) => deps.api.addr_validate(&a)?,
        None => info.sender.clone(),
    };
    let cfg = Config { admin, default_denom: msg.default_denom };
    CONFIG.save(deps.storage, &cfg)?;
    NEXT_ID.save(deps.storage, &1u64)?;
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    Ok(Response::new().add_attribute("action", "instantiate"))
}

#[entry_point]
pub fn execute(deps: DepsMut, env: Env, info: MessageInfo, msg: ExecuteMsg) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::CreateTransfer { recipient, amount, remark, expiry_ts } => exec_create(deps, env, info, recipient, amount, remark, expiry_ts),
        ExecuteMsg::ClaimTransfer { id } => exec_claim(deps, env, info, id),
        ExecuteMsg::RefundTransfer { id } => exec_refund(deps, env, info, id),
    }
}

fn must_one_fund(info: &MessageInfo, denom: &str) -> Result<Coin, ContractError> {
    let coin = info.funds.iter().find(|c| c.denom == denom).cloned().ok_or(InvalidFunds)?;
    // منع إرسال أكثر من Coin واحد لنفس الدالة (تبسيط)
    ensure!(info.funds.len() == 1, InvalidFunds);
    ensure!(coin.amount > Uint128::zero(), InvalidFunds);
    Ok(coin)
}

fn exec_create(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    recipient: String,
    amount: Coin,
    remark: Option<String>,
    expiry_ts: Option<u64>,
) -> Result<Response, ContractError> {
    let cfg = CONFIG.load(deps.storage)?;
    let rcpt = deps.api.addr_validate(&recipient)?;
    
    // Validate that the amount matches the funds sent
    let sent_funds = must_one_fund(&info, &amount.denom)?;
    ensure!(sent_funds.amount == amount.amount, InvalidFunds);
    ensure!(sent_funds.denom == amount.denom, InvalidFunds);

    if let Some(ts) = expiry_ts {
        ensure!(Timestamp::from_seconds(ts) > env.block.time, Expired);
    }

    let mut id = NEXT_ID.load(deps.storage)?;
    let tr = Transfer {
        id,
        sender: info.sender.clone(),
        recipient: rcpt.clone(),
        amount: amount.clone(),
        remark,
        expiry_ts,
        status: TransferStatus::Open,
    };
    TRANSFERS.save(deps.storage, id, &tr)?;
    id += 1;
    NEXT_ID.save(deps.storage, &id)?;

    Ok(Response::new()
        .add_event(evt_create(tr.id, tr.sender.as_str(), tr.recipient.as_str(), &amount))
        .add_attribute("action", "create_transfer"))
}

fn exec_claim(deps: DepsMut, env: Env, info: MessageInfo, id: u64) -> Result<Response, ContractError> {
    let mut tr = TRANSFERS.load(deps.storage, id).map_err(|_| NotFound)?;
    ensure!(matches!(tr.status, TransferStatus::Open), AlreadyFinalized);

    // expiry check
    if let Some(ts) = tr.expiry_ts {
        ensure!(Timestamp::from_seconds(ts) > env.block.time, Expired);
    }

    ensure!(info.sender == tr.recipient, NotRecipient);

    tr.status = TransferStatus::Claimed;
    TRANSFERS.save(deps.storage, id, &tr)?;

    let bank = BankMsg::Send { to_address: tr.recipient.to_string(), amount: vec![tr.amount.clone()] };

    Ok(Response::new()
        .add_message(bank)
        .add_event(evt_claim(tr.id, tr.recipient.as_str()))
        .add_attribute("action", "claim_transfer"))
}

fn exec_refund(deps: DepsMut, env: Env, info: MessageInfo, id: u64) -> Result<Response, ContractError> {
    let mut tr = TRANSFERS.load(deps.storage, id).map_err(|_| NotFound)?;
    ensure!(matches!(tr.status, TransferStatus::Open), AlreadyFinalized);

    // لو فيه expiry لازم يكون عدى
    if let Some(ts) = tr.expiry_ts {
        ensure!(Timestamp::from_seconds(ts) <= env.block.time, NotExpired);
    }
    // لازم المرسل هو اللي يرجّع
    ensure!(info.sender == tr.sender, NotSender);

    tr.status = TransferStatus::Refunded;
    TRANSFERS.save(deps.storage, id, &tr)?;

    let bank = BankMsg::Send { to_address: tr.sender.to_string(), amount: vec![tr.amount.clone()] };

    Ok(Response::new()
        .add_message(bank)
        .add_event(evt_refund(tr.id, tr.sender.as_str()))
        .add_attribute("action", "refund_transfer"))
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::Config {} => {
            let c = CONFIG.load(deps.storage)?;
            to_json_binary(&ConfigResp { admin: c.admin.to_string(), default_denom: c.default_denom })
        }
        QueryMsg::GetTransfer { id } => {
            let t = TRANSFERS.load(deps.storage, id)?;
            to_json_binary(&super::msg::TransferResp{
                id: t.id,
                sender: t.sender.to_string(),
                recipient: t.recipient.to_string(),
                amount: t.amount,
                remark: t.remark,
                expiry_ts: t.expiry_ts,
                status: format!("{:?}", t.status),
            })
        }
        QueryMsg::ListBySender { sender, start_after, limit } => {
            let sender_addr = deps.api.addr_validate(&sender)?;
            let limit = limit.unwrap_or(10).min(30) as usize;
            let start = start_after.map(Bound::exclusive);
            
            let transfers: StdResult<Vec<_>> = TRANSFERS
                .range(deps.storage, start, None, Order::Ascending)
                .filter(|item| {
                    if let Ok((_, transfer)) = item {
                        transfer.sender == sender_addr
                    } else {
                        false
                    }
                })
                .take(limit)
                .map(|item| {
                    let (_, transfer) = item?;
                    Ok(super::msg::TransferResp {
                        id: transfer.id,
                        sender: transfer.sender.to_string(),
                        recipient: transfer.recipient.to_string(),
                        amount: transfer.amount,
                        remark: transfer.remark,
                        expiry_ts: transfer.expiry_ts,
                        status: format!("{:?}", transfer.status),
                    })
                })
                .collect();
            
            to_json_binary(&transfers?)
        }
        QueryMsg::ListByRecipient { recipient, start_after, limit } => {
            let recipient_addr = deps.api.addr_validate(&recipient)?;
            let limit = limit.unwrap_or(10).min(30) as usize;
            let start = start_after.map(Bound::exclusive);
            
            let transfers: StdResult<Vec<_>> = TRANSFERS
                .range(deps.storage, start, None, Order::Ascending)
                .filter(|item| {
                    if let Ok((_, transfer)) = item {
                        transfer.recipient == recipient_addr
                    } else {
                        false
                    }
                })
                .take(limit)
                .map(|item| {
                    let (_, transfer) = item?;
                    Ok(super::msg::TransferResp {
                        id: transfer.id,
                        sender: transfer.sender.to_string(),
                        recipient: transfer.recipient.to_string(),
                        amount: transfer.amount,
                        remark: transfer.remark,
                        expiry_ts: transfer.expiry_ts,
                        status: format!("{:?}", transfer.status),
                    })
                })
                .collect();
            
            to_json_binary(&transfers?)
        }
    }
}