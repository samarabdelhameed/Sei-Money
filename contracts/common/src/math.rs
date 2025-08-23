use cosmwasm_std::{Decimal, Uint128};

pub const BASIS_POINTS: u16 = 10_000;

pub fn calculate_fee(amount: Uint128, fee_bps: u16) -> Uint128 {
    if fee_bps == 0 {
        return Uint128::zero();
    }
    
    amount * Decimal::from_ratio(fee_bps, BASIS_POINTS)
}

pub fn calculate_shares(
    deposit_amount: Uint128,
    total_shares: Uint128,
    total_assets: Uint128,
) -> Uint128 {
    if total_shares.is_zero() || total_assets.is_zero() {
        return deposit_amount;
    }
    
    deposit_amount * total_shares / total_assets
}

pub fn calculate_assets_from_shares(
    shares: Uint128,
    total_shares: Uint128,
    total_assets: Uint128,
) -> Uint128 {
    if total_shares.is_zero() {
        return Uint128::zero();
    }
    
    shares * total_assets / total_shares
}

pub fn validate_allocation_weights(weights: &[u16]) -> bool {
    let total: u16 = weights.iter().sum();
    total == BASIS_POINTS
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_fee() {
        let amount = Uint128::new(1000);
        let fee = calculate_fee(amount, 100); // 1%
        assert_eq!(fee, Uint128::new(10));
    }

    #[test]
    fn test_calculate_shares() {
        let deposit = Uint128::new(100);
        let total_shares = Uint128::new(1000);
        let total_assets = Uint128::new(2000);
        
        let shares = calculate_shares(deposit, total_shares, total_assets);
        assert_eq!(shares, Uint128::new(50));
    }

    #[test]
    fn test_validate_allocation_weights() {
        assert!(validate_allocation_weights(&[5000, 3000, 2000]));
        assert!(!validate_allocation_weights(&[5000, 3000, 1000]));
    }
}