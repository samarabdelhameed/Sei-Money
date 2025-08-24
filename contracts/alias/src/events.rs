use cosmwasm_std::Event;

pub fn evt_register_alias(username: &str, address: &str) -> Event {
    Event::new("seimoney.register_alias")
        .add_attribute("username", username.to_string())
        .add_attribute("address", address.to_string())
}

pub fn evt_update_alias(username: &str, address: &str) -> Event {
    Event::new("seimoney.update_alias")
        .add_attribute("username", username.to_string())
        .add_attribute("address", address.to_string())
}

pub fn evt_unregister_alias(username: &str, address: &str) -> Event {
    Event::new("seimoney.unregister_alias")
        .add_attribute("username", username.to_string())
        .add_attribute("address", address.to_string())
}
