use cosmwasm_std::{Event, Coin, Uint128};

pub fn evt_create_pool(id: u64, creator: &str, target: &Coin, memo: Option<&str>) -> Event {
    let mut event = Event::new("seimoney.create_pool")
        .add_attribute("id", id.to_string())
        .add_attribute("creator", creator.to_string())
        .add_attribute("target_amount", target.amount.to_string())
        .add_attribute("target_denom", target.denom.clone());
    
    if let Some(memo) = memo {
        event = event.add_attribute("memo", memo.to_string());
    }
    
    event
}

pub fn evt_contribute(pool_id: u64, contributor: &str, amount: &Uint128, denom: &str) -> Event {
    Event::new("seimoney.contribute")
        .add_attribute("pool_id", pool_id.to_string())
        .add_attribute("contributor", contributor.to_string())
        .add_attribute("amount", amount.to_string())
        .add_attribute("denom", denom.to_string())
}

pub fn evt_distribute(pool_id: u64, creator: &str, total_amount: &Uint128, denom: &str) -> Event {
    Event::new("seimoney.distribute")
        .add_attribute("pool_id", pool_id.to_string())
        .add_attribute("creator", creator.to_string())
        .add_attribute("total_amount", total_amount.to_string())
        .add_attribute("denom", denom.to_string())
}

pub fn evt_cancel_pool(pool_id: u64, creator: &str) -> Event {
    Event::new("seimoney.cancel_pool")
        .add_attribute("pool_id", pool_id.to_string())
        .add_attribute("creator", creator.to_string())
}

pub fn evt_refund_contribution(pool_id: u64, contributor: &str, amount: &Uint128, denom: &str) -> Event {
    Event::new("seimoney.refund_contribution")
        .add_attribute("pool_id", pool_id.to_string())
        .add_attribute("contributor", contributor.to_string())
        .add_attribute("amount", amount.to_string())
        .add_attribute("denom", denom.to_string())
}
