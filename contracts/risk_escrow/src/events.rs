use cosmwasm_std::{Event, Coin};

pub fn evt_open_case(id: u64, parties: &[String], amount: &Coin, model: &str) -> Event {
    Event::new("seimoney.open_case")
        .add_attribute("id", id.to_string())
        .add_attribute("parties", parties.join(","))
        .add_attribute("amount", amount.amount.to_string())
        .add_attribute("denom", amount.denom.clone())
        .add_attribute("model", model.to_string())
}

pub fn evt_approve(case_id: u64, approver: &str) -> Event {
    Event::new("seimoney.approve")
        .add_attribute("case_id", case_id.to_string())
        .add_attribute("approver", approver.to_string())
}

pub fn evt_dispute(case_id: u64, disputer: &str, reason: Option<&str>) -> Event {
    let mut event = Event::new("seimoney.dispute")
        .add_attribute("case_id", case_id.to_string())
        .add_attribute("disputer", disputer.to_string());
    
    if let Some(reason) = reason {
        event = event.add_attribute("reason", reason.to_string());
    }
    
    event
}

pub fn evt_resolve(case_id: u64, resolver: &str, decision: &str) -> Event {
    Event::new("seimoney.resolve")
        .add_attribute("case_id", case_id.to_string())
        .add_attribute("resolver", resolver.to_string())
        .add_attribute("decision", decision.to_string())
}

pub fn evt_release(case_id: u64, to: &str, amount: &Coin) -> Event {
    Event::new("seimoney.release")
        .add_attribute("case_id", case_id.to_string())
        .add_attribute("to", to.to_string())
        .add_attribute("amount", amount.amount.to_string())
        .add_attribute("denom", amount.denom.clone())
}

pub fn evt_refund(case_id: u64, to: &str, amount: &Coin) -> Event {
    Event::new("seimoney.refund")
        .add_attribute("case_id", case_id.to_string())
        .add_attribute("to", to.to_string())
        .add_attribute("amount", amount.amount.to_string())
        .add_attribute("denom", amount.denom.clone())
}
