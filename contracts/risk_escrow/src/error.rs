use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Unauthorized")]
    Unauthorized,

    #[error("Case not found")]
    CaseNotFound,

    #[error("Case already resolved")]
    CaseAlreadyResolved,

    #[error("Case expired")]
    CaseExpired,

    #[error("Case not expired yet")]
    CaseNotExpired,

    #[error("Invalid escrow model")]
    InvalidEscrowModel,

    #[error("Insufficient approvals")]
    InsufficientApprovals,

    #[error("Invalid resolution")]
    InvalidResolution,

    #[error("Case not in dispute")]
    CaseNotInDispute,

    #[error("Invalid party")]
    InvalidParty,

    #[error("Invalid amount")]
    InvalidAmount,

    #[error("Invalid denom")]
    InvalidDenom,

    #[error("Case locked")]
    CaseLocked,
}
