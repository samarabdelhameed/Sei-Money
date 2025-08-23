use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Unauthorized")]
    Unauthorized {},

    #[error("Invalid denom: expected {expected}, got {actual}")]
    InvalidDenom { expected: String, actual: String },

    #[error("Insufficient funds: required {required}, available {available}")]
    InsufficientFunds { required: String, available: String },

    #[error("Transfer not found: {id}")]
    TransferNotFound { id: u64 },

    #[error("Transfer already claimed: {id}")]
    TransferAlreadyClaimed { id: u64 },

    #[error("Transfer already refunded: {id}")]
    TransferAlreadyRefunded { id: u64 },

    #[error("Transfer expired: {id}")]
    TransferExpired { id: u64 },

    #[error("Transfer not expired: {id}")]
    TransferNotExpired { id: u64 },

    #[error("Pool not found: {id}")]
    PoolNotFound { id: u64 },

    #[error("Pool already distributed: {id}")]
    PoolAlreadyDistributed { id: u64 },

    #[error("Pool target not reached: {id}")]
    PoolTargetNotReached { id: u64 },

    #[error("Pot not found: {id}")]
    PotNotFound { id: u64 },

    #[error("Pot already closed: {id}")]
    PotAlreadyClosed { id: u64 },

    #[error("Vault not found: {id}")]
    VaultNotFound { id: u64 },

    #[error("Invalid allocation: total weight must be 10000 bps")]
    InvalidAllocation {},

    #[error("Invalid fee: must be between 0 and 1000 bps")]
    InvalidFee {},

    #[error("Rebalance in progress")]
    RebalanceInProgress {},
}