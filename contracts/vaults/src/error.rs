use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Unauthorized")]
    Unauthorized,

    #[error("Vault not found")]
    VaultNotFound,

    #[error("Invalid strategy")]
    InvalidStrategy,

    #[error("Invalid allocation")]
    InvalidAllocation,

    #[error("Insufficient shares")]
    InsufficientShares,

    #[error("Vault is locked")]
    VaultLocked,

    #[error("Invalid denom")]
    InvalidDenom,

    #[error("Invalid amount")]
    InvalidAmount,

    #[error("Invalid fee")]
    InvalidFee,

    #[error("Allocation exceeds 100%")]
    AllocationExceeds100,

    #[error("Strategy not supported")]
    StrategyNotSupported,

    #[error("Vault is full")]
    VaultFull,

    #[error("No yield to harvest")]
    NoYieldToHarvest,

    #[error("Rebalance failed")]
    RebalanceFailed,
}
