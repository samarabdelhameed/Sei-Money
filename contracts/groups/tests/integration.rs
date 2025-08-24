use cosmwasm_std::{Addr, Coin, Timestamp};
use cw_multi_test::{App, Contract, ContractWrapper, Executor};
use seimoney_groups::{
    contract::{execute, instantiate, query},
    msg::{ExecuteMsg, InstantiateMsg, QueryMsg, PoolResp, ContributionResp, ListPoolsResp, ListContributionsResp},
    state::{Pool, Contribution, PoolStatus},
};

const ADMIN: &str = "sei1admin";
const USER1: &str = "sei1user1";
const USER2: &str = "sei1user2";
const USER3: &str = "sei1user3";

fn mock_app() -> App {
    App::default()
}

fn setup_contract(app: &mut App) -> Addr {
    let code = ContractWrapper::new(execute, instantiate, query);
    let code_id = app.store_code(Box::new(code));
    
    let msg = InstantiateMsg {
        admin: Some(ADMIN.to_string()),
        fee_bps: Some(50), // 0.5%
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
        name: "Test Pool".to_string(),
        description: "A test pool".to_string(),
        target_amount: Coin::new(1000, "usei"),
        expiry_ts: Some(1000000),
        max_participants: Some(10),
        min_contribution: Some(Coin::new(10, "usei")),
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
    
    assert_eq!(result.pool.name, "Test Pool");
    assert_eq!(result.pool.creator, USER1);
    assert_eq!(result.pool.target_amount, Coin::new(1000, "usei"));
    assert_eq!(result.pool.status, PoolStatus::Open);
}

#[test]
fn test_contribute() {
    let mut app = mock_app();
    let contract_addr = setup_contract(&mut app);
    
    // Create a pool first
    let create_msg = ExecuteMsg::CreatePool {
        name: "Test Pool".to_string(),
        description: "A test pool".to_string(),
        target_amount: Coin::new(1000, "usei"),
        expiry_ts: Some(1000000),
        max_participants: Some(10),
        min_contribution: Some(Coin::new(10, "usei")),
    };
    
    app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &create_msg,
        &[],
    ).unwrap();
    
    // Contribute to the pool
    let contribute_msg = ExecuteMsg::Contribute { pool_id: 1 };
    let result = app.execute_contract(
        Addr::unchecked(USER2),
        contract_addr.clone(),
        &contribute_msg,
        &[Coin::new(100, "usei")],
    );
    
    assert!(result.is_ok());
    
    // Query the contribution
    let query_msg = QueryMsg::GetContribution { pool_id: 1, contributor: USER2.to_string() };
    let result: ContributionResp = app
        .wrap()
        .query_wasm_smart(contract_addr, &query_msg)
        .unwrap();
    
    assert_eq!(result.contribution.amount, Coin::new(100, "usei"));
    assert_eq!(result.contribution.contributor, USER2);
}

#[test]
fn test_distribute() {
    let mut app = mock_app();
    let contract_addr = setup_contract(&mut app);
    
    // Create a pool
    let create_msg = ExecuteMsg::CreatePool {
        name: "Test Pool".to_string(),
        description: "A test pool".to_string(),
        target_amount: Coin::new(1000, "usei"),
        expiry_ts: Some(1000000),
        max_participants: Some(10),
        min_contribution: Some(Coin::new(10, "usei")),
    };
    
    app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &create_msg,
        &[],
    ).unwrap();
    
    // Contribute to reach target
    app.execute_contract(
        Addr::unchecked(USER2),
        contract_addr.clone(),
        &ExecuteMsg::Contribute { pool_id: 1 },
        &[Coin::new(1000, "usei")],
    ).unwrap();
    
    // Distribute the pool
    let distribute_msg = ExecuteMsg::Distribute { pool_id: 1 };
    let result = app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &distribute_msg,
        &[],
    );
    
    assert!(result.is_ok());
    
    // Check pool status
    let query_msg = QueryMsg::GetPool { id: 1 };
    let result: PoolResp = app
        .wrap()
        .query_wasm_smart(contract_addr, &query_msg)
        .unwrap();
    
    assert_eq!(result.pool.status, PoolStatus::Distributed);
}

#[test]
fn test_cancel_pool() {
    let mut app = mock_app();
    let contract_addr = setup_contract(&mut app);
    
    // Create a pool
    let create_msg = ExecuteMsg::CreatePool {
        name: "Test Pool".to_string(),
        description: "A test pool".to_string(),
        target_amount: Coin::new(1000, "usei"),
        expiry_ts: Some(1000000),
        max_participants: Some(10),
        min_contribution: Some(Coin::new(10, "usei")),
    };
    
    app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &create_msg,
        &[],
    ).unwrap();
    
    // Cancel the pool
    let cancel_msg = ExecuteMsg::CancelPool { pool_id: 1 };
    let result = app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &cancel_msg,
        &[],
    );
    
    assert!(result.is_ok());
    
    // Check pool status
    let query_msg = QueryMsg::GetPool { id: 1 };
    let result: PoolResp = app
        .wrap()
        .query_wasm_smart(contract_addr, &query_msg)
        .unwrap();
    
    assert_eq!(result.pool.status, PoolStatus::Cancelled);
}

#[test]
fn test_refund_contribution() {
    let mut app = mock_app();
    let contract_addr = setup_contract(&mut app);
    
    // Create a pool
    let create_msg = ExecuteMsg::CreatePool {
        name: "Test Pool".to_string(),
        description: "A test pool".to_string(),
        target_amount: Coin::new(1000, "usei"),
        expiry_ts: Some(1000000),
        max_participants: Some(10),
        min_contribution: Some(Coin::new(10, "usei")),
    };
    
    app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &create_msg,
        &[],
    ).unwrap();
    
    // Contribute to the pool
    app.execute_contract(
        Addr::unchecked(USER2),
        contract_addr.clone(),
        &ExecuteMsg::Contribute { pool_id: 1 },
        &[Coin::new(100, "usei")],
    ).unwrap();
    
    // Cancel the pool first
    app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &ExecuteMsg::CancelPool { pool_id: 1 },
        &[],
    ).unwrap();
    
    // Refund contribution
    let refund_msg = ExecuteMsg::RefundContribution { pool_id: 1 };
    let result = app.execute_contract(
        Addr::unchecked(USER2),
        contract_addr.clone(),
        &refund_msg,
        &[],
    );
    
    assert!(result.is_ok());
}

#[test]
fn test_list_pools() {
    let mut app = mock_app();
    let contract_addr = setup_contract(&mut app);
    
    // Create multiple pools
    for i in 1..=3 {
        let create_msg = ExecuteMsg::CreatePool {
            name: format!("Pool {}", i),
            description: format!("Pool {} description", i),
            target_amount: Coin::new(1000 * i as u128, "usei"),
            expiry_ts: Some(1000000),
            max_participants: Some(10),
            min_contribution: Some(Coin::new(10, "usei")),
        };
        
        app.execute_contract(
            Addr::unchecked(USER1),
            contract_addr.clone(),
            &create_msg,
            &[],
        ).unwrap();
    }
    
    // List all pools
    let query_msg = QueryMsg::ListPools { start_after: None, limit: None };
    let result: ListPoolsResp = app
        .wrap()
        .query_wasm_smart(contract_addr, &query_msg)
        .unwrap();
    
    assert_eq!(result.pools.len(), 3);
}

#[test]
fn test_list_contributions() {
    let mut app = mock_app();
    let contract_addr = setup_contract(&mut app);
    
    // Create a pool
    let create_msg = ExecuteMsg::CreatePool {
        name: "Test Pool".to_string(),
        description: "A test pool".to_string(),
        target_amount: Coin::new(1000, "usei"),
        expiry_ts: Some(1000000),
        max_participants: Some(10),
        min_contribution: Some(Coin::new(10, "usei")),
    };
    
    app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &create_msg,
        &[],
    ).unwrap();
    
    // Multiple contributions
    for i in 1..=3 {
        app.execute_contract(
            Addr::unchecked(&format!("sei1user{}", i)),
            contract_addr.clone(),
            &ExecuteMsg::Contribute { pool_id: 1 },
            &[Coin::new(100 * i as u128, "usei")],
        ).unwrap();
    }
    
    // List contributions
    let query_msg = QueryMsg::ListContributions { pool_id: 1, start_after: None, limit: None };
    let result: ListContributionsResp = app
        .wrap()
        .query_wasm_smart(contract_addr, &query_msg)
        .unwrap();
    
    assert_eq!(result.contributions.len(), 3);
}
