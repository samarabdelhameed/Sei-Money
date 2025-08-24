use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Unauthorized")]
    Unauthorized,

    #[error("Pot not found")]
    PotNotFound,

    #[error("Pot already closed")]
    PotAlreadyClosed,

    #[error("Pot already broken")]
    PotAlreadyBroken,

    #[error("Invalid goal amount")]
    InvalidGoalAmount,

    #[error("Invalid deposit amount")]
    InvalidDepositAmount,

    #[error("Goal not reached")]
    GoalNotReached,

    #[error("Pot is empty")]
    PotEmpty,

    #[error("Invalid denom")]
    InvalidDenom,

    #[error("Pot is locked")]
    PotLocked,
}
