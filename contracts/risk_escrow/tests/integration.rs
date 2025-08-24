use cosmwasm_std::{Addr, Coin, Timestamp};
use cw_multi_test::{App, Contract, ContractWrapper, Executor};
use seimoney_risk_escrow::{
    contract::{execute, instantiate, query},
    msg::{ExecuteMsg, InstantiateMsg, QueryMsg, CaseResp, EscrowModel, CaseStatus, Resolution},
    state::Case,
};

const ADMIN: &str = "sei1admin";
const USER1: &str = "sei1user1";
const USER2: &str = "sei1user2";
const ARBITRATOR: &str = "sei1arbitrator";

fn mock_app() -> App {
    App::default()
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
        expiry_ts: Some(1000000),
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
        expiry_ts: Some(1000000),
        remark: Some("Test escrow case".to_string()),
    };
    
    app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &open_msg,
        &[Coin::new(1000, "usei")],
    ).unwrap();
    
    // Approve the case
    let approve_msg = ExecuteMsg::Approve { case_id: 1 };
    let result = app.execute_contract(
        Addr::unchecked(USER2),
        contract_addr.clone(),
        &approve_msg,
        &[],
    );
    
    assert!(result.is_ok());
    
    // Check case status
    let query_msg = QueryMsg::GetCase { id: 1 };
    let result: CaseResp = app
        .wrap()
        .query_wasm_smart(contract_addr, &query_msg)
        .unwrap();
    
    assert_eq!(result.status, CaseStatus::Approved);
}

#[test]
fn test_dispute_case() {
    let mut app = mock_app();
    let contract_addr = setup_contract(&mut app);
    
    // Create a case first
    let open_msg = ExecuteMsg::OpenCase {
        parties: vec![USER1.to_string(), USER2.to_string()],
        amount: Coin::new(1000, "usei"),
        model: EscrowModel::MultiSig { threshold: 2 },
        expiry_ts: Some(1000000),
        remark: Some("Test escrow case".to_string()),
    };
    
    app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &open_msg,
        &[Coin::new(1000, "usei")],
    ).unwrap();
    
    // Dispute the case
    let dispute_msg = ExecuteMsg::Dispute { 
        case_id: 1,
        reason: Some("Item not as described".to_string()),
    };
    let result = app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &dispute_msg,
        &[],
    );
    
    assert!(result.is_ok());
    
    // Check case status
    let query_msg = QueryMsg::GetCase { id: 1 };
    let result: CaseResp = app
        .wrap()
        .query_wasm_smart(contract_addr, &query_msg)
        .unwrap();
    
    assert_eq!(result.status, CaseStatus::Disputed);
}

#[test]
fn test_resolve_case() {
    let mut app = mock_app();
    let contract_addr = setup_contract(&mut app);
    
    // Create a case first
    let open_msg = ExecuteMsg::OpenCase {
        parties: vec![USER1.to_string(), USER2.to_string()],
        amount: Coin::new(1000, "usei"),
        model: EscrowModel::MultiSig { threshold: 2 },
        expiry_ts: Some(1000000),
        remark: Some("Test escrow case".to_string()),
    };
    
    app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &open_msg,
        &[Coin::new(1000, "usei")],
    ).unwrap();
    
    // Dispute the case
    app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &ExecuteMsg::Dispute { 
            case_id: 1,
            reason: Some("Item not as described".to_string()),
        },
        &[],
    ).unwrap();
    
    // Resolve the case
    let resolve_msg = ExecuteMsg::Resolve { 
        case_id: 1,
        decision: Resolution::Refund,
    };
    let result = app.execute_contract(
        Addr::unchecked(ARBITRATOR),
        contract_addr.clone(),
        &resolve_msg,
        &[],
    );
    
    assert!(result.is_ok());
    
    // Check case status
    let query_msg = QueryMsg::GetCase { id: 1 };
    let result: CaseResp = app
        .wrap()
        .query_wasm_smart(contract_addr, &query_msg)
        .unwrap();
    
    assert_eq!(result.status, CaseStatus::Resolved);
}

#[test]
fn test_release_funds() {
    let mut app = mock_app();
    let contract_addr = setup_contract(&mut app);
    
    // Create a case first
    let open_msg = ExecuteMsg::OpenCase {
        parties: vec![USER1.to_string(), USER2.to_string()],
        amount: Coin::new(1000, "usei"),
        model: EscrowModel::MultiSig { threshold: 2 },
        expiry_ts: Some(1000000),
        remark: Some("Test escrow case".to_string()),
    };
    
    app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &open_msg,
        &[Coin::new(1000, "usei")],
    ).unwrap();
    
    // Approve the case
    app.execute_contract(
        Addr::unchecked(USER2),
        contract_addr.clone(),
        &ExecuteMsg::Approve { case_id: 1 },
        &[],
    ).unwrap();
    
    // Release funds to seller
    let release_msg = ExecuteMsg::Release { 
        case_id: 1,
        to: USER2.to_string(),
        share_bps: Some(10000), // 100%
    };
    let result = app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &release_msg,
        &[],
    );
    
    assert!(result.is_ok());
    
    // Check case status
    let query_msg = QueryMsg::GetCase { id: 1 };
    let result: CaseResp = app
        .wrap()
        .query_wasm_smart(contract_addr, &query_msg)
        .unwrap();
    
    assert_eq!(result.status, CaseStatus::Open); // Status remains Open after release
}

#[test]
fn test_refund_funds() {
    let mut app = mock_app();
    let contract_addr = setup_contract(&mut app);
    
    // Create a case first
    let open_msg = ExecuteMsg::OpenCase {
        parties: vec![USER1.to_string(), USER2.to_string()],
        amount: Coin::new(1000, "usei"),
        model: EscrowModel::MultiSig { threshold: 2 },
        expiry_ts: Some(1000000),
        remark: Some("Test escrow case".to_string()),
    };
    
    app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &open_msg,
        &[Coin::new(1000, "usei")],
    ).unwrap();
    
    // Refund funds to buyer
    let refund_msg = ExecuteMsg::Refund { case_id: 1 };
    let result = app.execute_contract(
        Addr::unchecked(USER2),
        contract_addr.clone(),
        &refund_msg,
        &[],
    );
    
    assert!(result.is_ok());
    
    // Check case status
    let query_msg = QueryMsg::GetCase { id: 1 };
    let result: CaseResp = app
        .wrap()
        .query_wasm_smart(contract_addr, &query_msg)
        .unwrap();
    
    assert_eq!(result.status, CaseStatus::Open); // Status remains Open after refund
}

#[test]
fn test_list_cases() {
    let mut app = mock_app();
    let contract_addr = setup_contract(&mut app);
    
    // Create multiple cases
    for i in 1..=3 {
        let open_msg = ExecuteMsg::OpenCase {
            parties: vec![USER1.to_string(), USER2.to_string()],
            amount: Coin::new(1000 * i as u128, "usei"),
            model: EscrowModel::MultiSig { threshold: 2 },
            expiry_ts: Some(1000000),
            remark: Some(format!("Test case {}", i)),
        };
        
        app.execute_contract(
            Addr::unchecked(USER1),
            contract_addr.clone(),
            &open_msg,
            &[Coin::new(1000 * i as u128, "usei")],
        ).unwrap();
    }
    
    // List all cases
    let query_msg = QueryMsg::ListCases { start_after: None, limit: None };
    let result: Vec<CaseResp> = app
        .wrap()
        .query_wasm_smart(contract_addr, &query_msg)
        .unwrap();
    
    assert_eq!(result.len(), 3);
}
