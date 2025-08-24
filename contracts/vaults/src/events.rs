use cosmwasm_std::{Event, Coin, Uint128};

pub fn evt_create_vault(id: u64, label: &str, denom: &str, strategy: &str) -> Event {
    Event::new("seimoney.create_vault")
        .add_attribute("id", id.to_string())
        .add_attribute("label", label.to_string())
        .add_attribute("denom", denom.to_string())
        .add_attribute("strategy", strategy.to_string())
}

pub fn evt_deposit_vault(vault_id: u64, user: &str, amount: &Coin, shares: &Uint128) -> Event {
    Event::new("seimoney.deposit_vault")
        .add_attribute("vault_id", vault_id.to_string())
        .add_attribute("user", user.to_string())
        .add_attribute("amount", amount.amount.to_string())
        .add_attribute("denom", amount.denom.clone())
        .add_attribute("shares", shares.to_string())
}

pub fn evt_withdraw_vault(vault_id: u64, user: &str, shares: &Uint128, amount: &Coin) -> Event {
    Event::new("seimoney.withdraw_vault")
        .add_attribute("vault_id", vault_id.to_string())
        .add_attribute("user", user.to_string())
        .add_attribute("shares", shares.to_string())
        .add_attribute("amount", amount.amount.to_string())
        .add_attribute("denom", amount.denom.clone())
}

pub fn evt_harvest_vault(vault_id: u64, yield_amount: &Coin) -> Event {
    Event::new("seimoney.harvest_vault")
        .add_attribute("vault_id", vault_id.to_string())
        .add_attribute("yield_amount", yield_amount.amount.to_string())
        .add_attribute("denom", yield_amount.denom.clone())
}

pub fn evt_rebalance_vault(vault_id: u64, new_allocations: &str) -> Event {
    Event::new("seimoney.rebalance_vault")
        .add_attribute("vault_id", vault_id.to_string())
        .add_attribute("new_allocations", new_allocations.to_string())
}
