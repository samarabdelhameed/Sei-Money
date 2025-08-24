use cosmwasm_std::{Event, Coin, Uint128};

pub fn evt_open_pot(id: u64, owner: &str, goal: &Coin, label: Option<&str>) -> Event {
    let mut event = Event::new("seimoney.open_pot")
        .add_attribute("id", id.to_string())
        .add_attribute("owner", owner.to_string())
        .add_attribute("goal_amount", goal.amount.to_string())
        .add_attribute("goal_denom", goal.denom.clone());
    
    if let Some(label) = label {
        event = event.add_attribute("label", label.to_string());
    }
    
    event
}

pub fn evt_deposit_pot(pot_id: u64, owner: &str, amount: &Uint128, denom: &str) -> Event {
    Event::new("seimoney.deposit_pot")
        .add_attribute("pot_id", pot_id.to_string())
        .add_attribute("owner", owner.to_string())
        .add_attribute("amount", amount.to_string())
        .add_attribute("denom", denom.to_string())
}

pub fn evt_break_pot(pot_id: u64, owner: &str, total_amount: &Uint128, denom: &str) -> Event {
    Event::new("seimoney.break_pot")
        .add_attribute("pot_id", pot_id.to_string())
        .add_attribute("owner", owner.to_string())
        .add_attribute("total_amount", total_amount.to_string())
        .add_attribute("denom", denom.to_string())
}

pub fn evt_close_pot(pot_id: u64, owner: &str, total_amount: &Uint128, denom: &str) -> Event {
    Event::new("seimoney.close_pot")
        .add_attribute("pot_id", pot_id.to_string())
        .add_attribute("owner", owner.to_string())
        .add_attribute("total_amount", total_amount.to_string())
        .add_attribute("denom", denom.to_string())
}
