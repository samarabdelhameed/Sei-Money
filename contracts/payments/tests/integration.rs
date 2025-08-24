use cosmwasm_std::{coins, Addr, Coin, Timestamp, Uint128};
use cw_multi_test::{App, ContractWrapper, Executor};

use seimoney_payments::contract::{execute, instantiate, query};
use seimoney_payments::msg::{ExecuteMsg, InstantiateMsg, QueryMsg, ConfigResp, TransferResp};

const ADMIN: &str = "admin";
const USER1: &str = "user1";
const USER2: &str = "user2";
const DENOM: &str = "usei";

fn setup_contract(app: &mut App) -> Addr {
    let code = ContractWrapper::new(execute, instantiate, query);
    let code_id = app.store_code(Box::new(code));

    let msg = InstantiateMsg {
        admin: Some(ADMIN.to_string()),
        default_denom: DENOM.to_string(),
    };

    app.instantiate_contract(
        code_id,
        Addr::unchecked(ADMIN),
        &msg,
        &[],
        "SeiMoney Payments",
        None,
    )
    .unwrap()
}

#[test]
fn test_instantiate() {
    let mut app = App::default();
    let contract_addr = setup_contract(&mut app);

    let msg = QueryMsg::Config {};
    let res: ConfigResp = app
        .wrap()
        .query_wasm_smart(contract_addr, &msg)
        .unwrap();

    assert_eq!(res.admin, ADMIN);
    assert_eq!(res.default_denom, DENOM);
}

#[test]
fn test_create_transfer() {
    let mut app = App::default();
    let contract_addr = setup_contract(&mut app);

    // Give USER1 some tokens
    app.sudo(cw_multi_test::SudoMsg::Bank(
        cw_multi_test::BankSudo::Mint {
            to_address: USER1.to_string(),
            amount: coins(1000, DENOM),
        },
    ))
    .unwrap();

    let msg = ExecuteMsg::CreateTransfer {
        recipient: USER2.to_string(),
        amount: Coin::new(100, DENOM),
        remark: Some("Test transfer".to_string()),
        expiry_ts: None,
    };

    let res = app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &msg,
        &coins(100, DENOM),
    );

    assert!(res.is_ok());

    // Query the transfer
    let query_msg = QueryMsg::GetTransfer { id: 1 };
    let res: TransferResp = app
        .wrap()
        .query_wasm_smart(contract_addr, &query_msg)
        .unwrap();

    assert_eq!(res.id, 1);
    assert_eq!(res.sender, USER1);
    assert_eq!(res.recipient, USER2);
    assert_eq!(res.amount, Coin::new(100, DENOM));
    assert_eq!(res.remark, Some("Test transfer".to_string()));
    assert_eq!(res.status, "Open");
}

#[test]
fn test_claim_transfer() {
    let mut app = App::default();
    let contract_addr = setup_contract(&mut app);

    // Give USER1 some tokens
    app.sudo(cw_multi_test::SudoMsg::Bank(
        cw_multi_test::BankSudo::Mint {
            to_address: USER1.to_string(),
            amount: coins(1000, DENOM),
        },
    ))
    .unwrap();

    // Create transfer
    let msg = ExecuteMsg::CreateTransfer {
        recipient: USER2.to_string(),
        amount: Coin::new(100, DENOM),
        remark: None,
        expiry_ts: None,
    };

    app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &msg,
        &coins(100, DENOM),
    )
    .unwrap();

    // Claim transfer
    let claim_msg = ExecuteMsg::ClaimTransfer { id: 1 };
    let res = app.execute_contract(
        Addr::unchecked(USER2),
        contract_addr.clone(),
        &claim_msg,
        &[],
    );

    assert!(res.is_ok());

    // Check USER2 balance
    let balance = app.wrap().query_balance(USER2, DENOM).unwrap();
    assert_eq!(balance.amount, Uint128::new(100));

    // Query the transfer to confirm it's claimed
    let query_msg = QueryMsg::GetTransfer { id: 1 };
    let res: TransferResp = app
        .wrap()
        .query_wasm_smart(contract_addr, &query_msg)
        .unwrap();

    assert_eq!(res.status, "Claimed");
}

#[test]
fn test_refund_transfer() {
    let mut app = App::default();
    let contract_addr = setup_contract(&mut app);

    // Give USER1 some tokens
    app.sudo(cw_multi_test::SudoMsg::Bank(
        cw_multi_test::BankSudo::Mint {
            to_address: USER1.to_string(),
            amount: coins(1000, DENOM),
        },
    ))
    .unwrap();

    // Create transfer with expiry (future time)
    let expiry = 2000u64;
    
    // Set block time to a known value before creating transfer
    app.update_block(|block| {
        block.time = Timestamp::from_seconds(1000);
    });
    
    let msg = ExecuteMsg::CreateTransfer {
        recipient: USER2.to_string(),
        amount: Coin::new(100, DENOM),
        remark: None,
        expiry_ts: Some(expiry),
    };

    app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &msg,
        &coins(100, DENOM),
    )
    .unwrap();

    // Update block time to after expiry
    app.update_block(|block| {
        block.time = Timestamp::from_seconds(2000);
    });

    // Refund transfer
    let refund_msg = ExecuteMsg::RefundTransfer { id: 1 };
    let res = app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &refund_msg,
        &[],
    );

    assert!(res.is_ok());

    // Check USER1 balance (should get refund)
    let balance = app.wrap().query_balance(USER1, DENOM).unwrap();
    assert_eq!(balance.amount, Uint128::new(1000)); // Original amount back

    // Query the transfer to confirm it's refunded
    let query_msg = QueryMsg::GetTransfer { id: 1 };
    let res: TransferResp = app
        .wrap()
        .query_wasm_smart(contract_addr, &query_msg)
        .unwrap();

    assert_eq!(res.status, "Refunded");
}

#[test]
fn test_unauthorized_claim() {
    let mut app = App::default();
    let contract_addr = setup_contract(&mut app);

    // Give USER1 some tokens
    app.sudo(cw_multi_test::SudoMsg::Bank(
        cw_multi_test::BankSudo::Mint {
            to_address: USER1.to_string(),
            amount: coins(1000, DENOM),
        },
    ))
    .unwrap();

    // Create transfer
    let msg = ExecuteMsg::CreateTransfer {
        recipient: USER2.to_string(),
        amount: Coin::new(100, DENOM),
        remark: None,
        expiry_ts: None,
    };

    app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &msg,
        &coins(100, DENOM),
    )
    .unwrap();

    // Try to claim with wrong user
    let claim_msg = ExecuteMsg::ClaimTransfer { id: 1 };
    let res = app.execute_contract(
        Addr::unchecked(USER1), // Wrong user (sender instead of recipient)
        contract_addr,
        &claim_msg,
        &[],
    );

    assert!(res.is_err());
}

#[test]
fn test_insufficient_funds() {
    let mut app = App::default();
    let contract_addr = setup_contract(&mut app);

    // Don't give USER1 enough tokens
    app.sudo(cw_multi_test::SudoMsg::Bank(
        cw_multi_test::BankSudo::Mint {
            to_address: USER1.to_string(),
            amount: coins(50, DENOM), // Less than required
        },
    ))
    .unwrap();

    let msg = ExecuteMsg::CreateTransfer {
        recipient: USER2.to_string(),
        amount: Coin::new(100, DENOM),
        remark: None,
        expiry_ts: None,
    };

    let res = app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr,
        &msg,
        &coins(50, DENOM), // Sending less than required
    );

    assert!(res.is_err());
}