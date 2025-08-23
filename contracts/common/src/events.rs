use cosmwasm_std::{Addr, Coin, Event, Uint128};

pub fn create_transfer_event(
    id: u64,
    sender: &Addr,
    recipient: &Addr,
    amount: &Coin,
    remark: &Option<String>,
) -> Event {
    let mut event = Event::new("create_transfer")
        .add_attribute("id", id.to_string())
        .add_attribute("sender", sender.to_string())
        .add_attribute("recipient", recipient.to_string())
        .add_attribute("amount", amount.to_string());

    if let Some(remark) = remark {
        event = event.add_attribute("remark", remark);
    }

    event
}

pub fn claim_transfer_event(id: u64, claimer: &Addr, amount: &Coin) -> Event {
    Event::new("claim_transfer")
        .add_attribute("id", id.to_string())
        .add_attribute("claimer", claimer.to_string())
        .add_attribute("amount", amount.to_string())
}

pub fn refund_transfer_event(id: u64, sender: &Addr, amount: &Coin) -> Event {
    Event::new("refund_transfer")
        .add_attribute("id", id.to_string())
        .add_attribute("sender", sender.to_string())
        .add_attribute("amount", amount.to_string())
}

pub fn create_pool_event(
    id: u64,
    creator: &Addr,
    target: &Coin,
    memo: &Option<String>,
) -> Event {
    let mut event = Event::new("create_pool")
        .add_attribute("id", id.to_string())
        .add_attribute("creator", creator.to_string())
        .add_attribute("target", target.to_string());

    if let Some(memo) = memo {
        event = event.add_attribute("memo", memo);
    }

    event
}

pub fn contribute_pool_event(
    id: u64,
    contributor: &Addr,
    amount: &Uint128,
    total: &Uint128,
) -> Event {
    Event::new("contribute_pool")
        .add_attribute("id", id.to_string())
        .add_attribute("contributor", contributor.to_string())
        .add_attribute("amount", amount.to_string())
        .add_attribute("total", total.to_string())
}

pub fn create_vault_event(
    id: u64,
    creator: &Addr,
    label: &str,
    denom: &str,
) -> Event {
    Event::new("create_vault")
        .add_attribute("id", id.to_string())
        .add_attribute("creator", creator.to_string())
        .add_attribute("label", label)
        .add_attribute("denom", denom)
}

pub fn deposit_vault_event(
    id: u64,
    depositor: &Addr,
    amount: &Uint128,
    shares: &Uint128,
) -> Event {
    Event::new("deposit_vault")
        .add_attribute("id", id.to_string())
        .add_attribute("depositor", depositor.to_string())
        .add_attribute("amount", amount.to_string())
        .add_attribute("shares", shares.to_string())
}

pub fn rebalance_vault_event(
    id: u64,
    rebalancer: &Addr,
    old_tvl: &Uint128,
    new_tvl: &Uint128,
) -> Event {
    Event::new("rebalance_vault")
        .add_attribute("id", id.to_string())
        .add_attribute("rebalancer", rebalancer.to_string())
        .add_attribute("old_tvl", old_tvl.to_string())
        .add_attribute("new_tvl", new_tvl.to_string())
}