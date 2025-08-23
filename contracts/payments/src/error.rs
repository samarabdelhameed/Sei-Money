use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Unauthorized")]
    Unauthorized,

    #[error("Invalid funds")]
    InvalidFunds,

    #[error("Transfer not found")]
    NotFound,

    #[error("Already claimed or refunded")]
    AlreadyFinalized,

    #[error("Not recipient")]
    NotRecipient,

    #[error("Not sender")]
    NotSender,

    #[error("Expired")]
    Expired,

    #[error("Not yet expired")]
    NotExpired,
}