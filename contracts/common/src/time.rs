use cosmwasm_std::{Env, Timestamp};

pub fn is_expired(expiry: Option<Timestamp>, env: &Env) -> bool {
    match expiry {
        Some(expiry_ts) => env.block.time >= expiry_ts,
        None => false,
    }
}

pub fn seconds_from_now(env: &Env, seconds: u64) -> Timestamp {
    env.block.time.plus_seconds(seconds)
}

pub fn days_from_now(env: &Env, days: u64) -> Timestamp {
    seconds_from_now(env, days * 24 * 60 * 60)
}

pub fn hours_from_now(env: &Env, hours: u64) -> Timestamp {
    seconds_from_now(env, hours * 60 * 60)
}

#[cfg(test)]
mod tests {
    use super::*;
    use cosmwasm_std::testing::mock_env;

    #[test]
    fn test_is_expired() {
        let env = mock_env();
        let future = env.block.time.plus_seconds(3600);
        let past = env.block.time.minus_seconds(3600);

        assert!(!is_expired(Some(future), &env));
        assert!(is_expired(Some(past), &env));
        assert!(!is_expired(None, &env));
    }
}