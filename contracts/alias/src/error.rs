use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Unauthorized")]
    Unauthorized,

    #[error("Username already taken")]
    UsernameTaken,

    #[error("Username not found")]
    UsernameNotFound,

    #[error("Address already has username")]
    AddressHasUsername,

    #[error("Invalid username format")]
    InvalidUsernameFormat,

    #[error("Username too short")]
    UsernameTooShort,

    #[error("Username too long")]
    UsernameTooLong,

    #[error("Username contains invalid characters")]
    UsernameInvalidChars,

    #[error("No username registered for address")]
    NoUsernameRegistered,
}
