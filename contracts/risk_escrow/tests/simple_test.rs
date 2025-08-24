use cosmwasm_std::{Addr, Coin};
use cw_multi_test::{App, ContractWrapper, Executor};
use seimoney_risk_escrow::{
    contract::{execute, instantiate, query},
    msg::{ExecuteMsg, InstantiateMsg, QueryMsg, CaseResp, EscrowModel, CaseStatus, Resolution},
};

const ADMIN: &str = "sei1admin";
const USER1: &str = "sei1user1";
const USER2: &str = "sei1user2";
const ARBITRATOR: &str = "sei1arbitrator";

fn mock_app() -> App {
    let mut app = App::default();
    
    // Fund test users
    app.sudo(cw_multi_test::SudoMsg::Bank(cw_multi_test::BankSudo::Mint {
        to_address: USER1.to_string(),
        amount: vec![Coin::new(10000, "usei")],
    })).unwrap();
    
    app.sudo(cw_multi_test::SudoMsg::Bank(cw_multi_test::BankSudo::Mint {
        to_address: USER2.to_string(),
        amount: vec![Coin::new(10000, "usei")],
    })).unwrap();
    
    app
}

fn setup_contract(app: &mut App) -> Addr {
    let code = ContractWrapper::new(execute, instantiate, query);
    let code_id = app.store_code(Box::new(code));
    
    let msg = InstantiateMsg {
        admin: Some(ADMIN.to_string()),
        default_denom: "usei".to_string(),
        min_approval_threshold: Some(2),
    };
    
    app.instantiate_contract(
        code_id,
        Addr::unchecked(ADMIN),
        &msg,
        &[],
        "SeiMoney Risk Escrow",
        None,
    )
    .unwrap()
}

#[test]
fn test_instantiate() {
    let mut app = mock_app();
    let contract_addr = setup_contract(&mut app);
    
    // Test that contract was instantiated
    assert!(!contract_addr.as_str().is_empty());
}

#[test]
fn test_open_case() {
    let mut app = mock_app();
    let contract_addr = setup_contract(&mut app);
    
    let msg = ExecuteMsg::OpenCase {
        parties: vec![USER1.to_string(), USER2.to_string()],
        amount: Coin::new(1000, "usei"),
        model: EscrowModel::MultiSig { threshold: 2 },
        expiry_ts: None,
        remark: Some("Test escrow case".to_string()),
    };
    
    let result = app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &msg,
        &[Coin::new(1000, "usei")],
    );
    
    assert!(result.is_ok());
    
    // Query the created case
    let query_msg = QueryMsg::GetCase { id: 1 };
    let result: CaseResp = app
        .wrap()
        .query_wasm_smart(contract_addr, &query_msg)
        .unwrap();
    
    assert_eq!(result.parties[0], USER1);
    assert_eq!(result.parties[1], USER2);
    assert_eq!(result.amount, Coin::new(1000, "usei"));
    assert_eq!(result.status, CaseStatus::Open);
}

#[test]
fn test_approve_case() {
    let mut app = mock_app();
    let contract_addr = setup_contract(&mut app);
    
    // Create a case first
    let open_msg = ExecuteMsg::OpenCase {
        parties: vec![USER1.to_string(), USER2.to_string()],
        amount: Coin::new(1000, "usei"),
        model: EscrowModel::MultiSig { threshold: 2 },
        expiry_ts: None,
        remark: Some("Test escrow case".to_string()),
    };
    
    app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &open_msg,
        &[Coin::new(1000, "usei")],
    ).unwrap();
    
    // Approve the case by USER2
    let approve_msg = ExecuteMsg::Approve { case_id: 1 };
    let result = app.execute_contract(
        Addr::unchecked(USER2),
        contract_addr.clone(),
        &approve_msg,
        &[],
    );
    
    assert!(result.is_ok());
    
    // Check case status - should still be Open since only 1 approval
    let query_msg = QueryMsg::GetCase { id: 1 };
    let result: CaseResp = app
        .wrap()
        .query_wasm_smart(contract_addr.clone(), &query_msg)
        .unwrap();
    
    assert_eq!(result.status, CaseStatus::Open);
    
    // Now approve by USER1 as well
    let approve_msg2 = ExecuteMsg::Approve { case_id: 1 };
    let result2 = app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &approve_msg2,
        &[],
    );
    
    assert!(result2.is_ok());
    
    // Check case status - should now be Approved
    let query_msg2 = QueryMsg::GetCase { id: 1 };
    let result2: CaseResp = app
        .wrap()
        .query_wasm_smart(contract_addr.clone(), &query_msg2)
        .unwrap();
    
    assert_eq!(result2.status, CaseStatus::Approved);
}
