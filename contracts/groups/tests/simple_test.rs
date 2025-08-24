use cosmwasm_std::{Addr, Coin};
use cw_multi_test::{App, ContractWrapper, Executor};
use seimoney_groups::{
    contract::{execute, instantiate, query},
    msg::{ExecuteMsg, InstantiateMsg, QueryMsg, PoolResp, ContributionResp},
};

const ADMIN: &str = "sei1admin";
const USER1: &str = "sei1user1";
const USER2: &str = "sei1user2";

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
        max_participants: Some(10),
    };
    
    app.instantiate_contract(
        code_id,
        Addr::unchecked(ADMIN),
        &msg,
        &[],
        "SeiMoney Groups",
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
fn test_create_pool() {
    let mut app = mock_app();
    let contract_addr = setup_contract(&mut app);
    
    let msg = ExecuteMsg::CreatePool {
        target: Coin::new(1000, "usei"),
        max_participants: Some(10),
        memo: Some("Test pool".to_string()),
        expiry_ts: None,
    };
    
    let result = app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &msg,
        &[],
    );
    
    assert!(result.is_ok());
    
    // Query the created pool
    let query_msg = QueryMsg::GetPool { id: 1 };
    let result: PoolResp = app
        .wrap()
        .query_wasm_smart(contract_addr, &query_msg)
        .unwrap();
    
    println!("Pool created: target={:?}, current={:?}", result.target, result.current);
    
    assert_eq!(result.creator, USER1);
    assert_eq!(result.target, Coin::new(1000, "usei"));
    assert_eq!(result.distributed, false);
    assert_eq!(result.cancelled, false);
}

#[test]
fn test_contribute() {
    let mut app = mock_app();
    let contract_addr = setup_contract(&mut app);
    
    // Create a pool first
    let create_msg = ExecuteMsg::CreatePool {
        target: Coin::new(1000, "usei"),
        max_participants: Some(10),
        memo: Some("Test pool".to_string()),
        expiry_ts: None,
    };
    
    app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &create_msg,
        &[],
    ).unwrap();
    
    // Contribute to the pool
    let contribute_msg = ExecuteMsg::Contribute { 
        pool_id: 1,
        amount: Coin::new(10, "usei"),
    };
    let result = app.execute_contract(
        Addr::unchecked(USER2),
        contract_addr.clone(),
        &contribute_msg,
        &[Coin::new(10, "usei")],
    );
    
    if let Err(e) = &result {
        println!("Contribute error: {:?}", e);
    }
    
    assert!(result.is_ok());
    
    // Query contributions
    let query_msg = QueryMsg::ListContributions { pool_id: 1, start_after: None, limit: None };
    let result: Vec<ContributionResp> = app
        .wrap()
        .query_wasm_smart(contract_addr, &query_msg)
        .unwrap();
    
    assert_eq!(result.len(), 1);
    assert_eq!(result[0].contributor, USER2);
    assert_eq!(result[0].amount, "10");
}
