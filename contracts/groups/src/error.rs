use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Unauthorized")]
    Unauthorized,

    #[error("Pool not found")]
    PoolNotFound,

    #[error("Pool already distributed")]
    PoolAlreadyDistributed,

    #[error("Pool already cancelled")]
    PoolAlreadyCancelled,

    #[error("Pool expired")]
    PoolExpired,

    #[error("Pool not expired yet")]
    PoolNotExpired,

    #[error("Invalid contribution amount")]
    InvalidContribution,

    #[error("Pool is full")]
    PoolFull,

    #[error("Target amount reached")]
    TargetReached,

    #[error("No contributions to distribute")]
    NoContributions,

    #[error("Invalid pool state")]
    InvalidPoolState,
}
