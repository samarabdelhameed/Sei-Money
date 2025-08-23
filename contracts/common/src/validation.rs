use cosmwasm_std::{Addr, Coin, Uint128};
use crate::errors::ContractError;

pub fn validate_denom(coin: &Coin, expected_denom: &str) -> Result<(), ContractError> {
    if coin.denom != expected_denom {
        return Err(ContractError::InvalidDenom {
            expected: expected_denom.to_string(),
            actual: coin.denom.clone(),
        });
    }
    Ok(())
}

pub fn validate_non_zero_amount(amount: &Uint128) -> Result<(), ContractError> {
    if amount.is_zero() {
        return Err(ContractError::InsufficientFunds {
            required: "greater than 0".to_string(),
            available: "0".to_string(),
        });
    }
    Ok(())
}

pub fn validate_fee_bps(fee_bps: u16) -> Result<(), ContractError> {
    if fee_bps > 1000 {
        return Err(ContractError::InvalidFee {});
    }
    Ok(())
}

pub fn validate_different_addresses(addr1: &Addr, addr2: &Addr) -> Result<(), ContractError> {
    if addr1 == addr2 {
        return Err(ContractError::Std(cosmwasm_std::StdError::generic_err(
            "Sender and recipient cannot be the same",
        )));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use cosmwasm_std::testing::mock_dependencies;

    #[test]
    fn test_validate_denom() {
        let coin = Coin::new(100, "usei");
        assert!(validate_denom(&coin, "usei").is_ok());
        assert!(validate_denom(&coin, "uatom").is_err());
    }

    #[test]
    fn test_validate_non_zero_amount() {
        assert!(validate_non_zero_amount(&Uint128::new(100)).is_ok());
        assert!(validate_non_zero_amount(&Uint128::zero()).is_err());
    }

    #[test]
    fn test_validate_fee_bps() {
        assert!(validate_fee_bps(100).is_ok());
        assert!(validate_fee_bps(1000).is_ok());
        assert!(validate_fee_bps(1001).is_err());
    }
}