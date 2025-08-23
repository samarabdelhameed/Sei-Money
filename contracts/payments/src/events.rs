use cosmwasm_std::{Event, Coin};

pub fn evt_create(id: u64, sender: &str, recipient: &str, amount: &Coin) -> Event {
    Event::new("seimoney.create_transfer")
        .add_attribute("id", id.to_string())
        .add_attribute("sender", sender.to_string())
        .add_attribute("recipient", recipient.to_string())
        .add_attribute("amount", format!("{}{}", amount.amount, amount.denom))
}

pub fn evt_claim(id: u64, recipient: &str) -> Event {
    Event::new("seimoney.claim_transfer")
        .add_attribute("id", id.to_string())
        .add_attribute("recipient", recipient.to_string())
}

pub fn evt_refund(id: u64, sender: &str) -> Event {
    Event::new("seimoney.refund_transfer")
        .add_attribute("id", id.to_string())
        .add_attribute("sender", sender.to_string())
}