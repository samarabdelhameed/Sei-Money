use cosmwasm_std::{Addr, Coin, Timestamp};
use cw_multi_test::{App, Contract, ContractWrapper, Executor};
use seimoney_pots::{
    contract::{execute, instantiate, query},
    msg::{ExecuteMsg, InstantiateMsg, QueryMsg, PotResp},
    state::Pot,
};

const ADMIN: &str = "sei1admin";
const USER1: &str = "sei1user1";
const USER2: &str = "sei1user2";

fn mock_app() -> App {
    App::default()
}

fn setup_contract(app: &mut App) -> Addr {
    let code = ContractWrapper::new(execute, instantiate, query);
    let code_id = app.store_code(Box::new(code));
    
    let msg = InstantiateMsg {
        admin: Some(ADMIN.to_string()),
        default_denom: "usei".to_string(),
    };
    
    app.instantiate_contract(
        code_id,
        Addr::unchecked(ADMIN),
        &msg,
        &[],
        "SeiMoney Pots",
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
fn test_open_pot() {
    let mut app = mock_app();
    let contract_addr = setup_contract(&mut app);
    
    let msg = ExecuteMsg::OpenPot {
        goal: Coin::new(5000, "usei"),
        label: Some("Vacation Fund".to_string()),
    };
    
    let result = app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &msg,
        &[],
    );
    
    assert!(result.is_ok());
    
    // Query the created pot
    let query_msg = QueryMsg::GetPot { id: 1 };
    let result: PotResp = app
        .wrap()
        .query_wasm_smart(contract_addr, &query_msg)
        .unwrap();
    
    assert_eq!(result.label, Some("Vacation Fund".to_string()));
    assert_eq!(result.owner, USER1);
    assert_eq!(result.goal, Coin::new(5000, "usei"));
    assert_eq!(result.broken, false);
    assert_eq!(result.closed, false);
}

#[test]
fn test_deposit_pot() {
    let mut app = mock_app();
    let contract_addr = setup_contract(&mut app);
    
    // Create a pot first
    let open_msg = ExecuteMsg::OpenPot {
        goal: Coin::new(5000, "usei"),
        label: Some("Vacation Fund".to_string()),
    };
    
    app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &open_msg,
        &[],
    ).unwrap();
    
    // Deposit into the pot
    let deposit_msg = ExecuteMsg::DepositPot { 
        pot_id: 1,
        amount: Coin::new(1000, "usei"),
    };
    let result = app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &deposit_msg,
        &[Coin::new(1000, "usei")],
    );
    
    assert!(result.is_ok());
    
    // Query the pot to check balance
    let query_msg = QueryMsg::GetPot { id: 1 };
    let result: PotResp = app
        .wrap()
        .query_wasm_smart(contract_addr, &query_msg)
        .unwrap();
    
    assert_eq!(result.current, "1000");
}

#[test]
fn test_break_pot() {
    let mut app = mock_app();
    let contract_addr = setup_contract(&mut app);
    
    // Create a breakable pot
    let open_msg = ExecuteMsg::OpenPot {
        goal: Coin::new(5000, "usei"),
        label: Some("Vacation Fund".to_string()),
    };
    
    app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &open_msg,
        &[],
    ).unwrap();
    
    // Deposit some funds
    app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &ExecuteMsg::DepositPot { 
            pot_id: 1,
            amount: Coin::new(1000, "usei"),
        },
        &[Coin::new(1000, "usei")],
    ).unwrap();
    
    // Break the pot
    let break_msg = ExecuteMsg::BreakPot { pot_id: 1 };
    let result = app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &break_msg,
        &[],
    );
    
    assert!(result.is_ok());
    
    // Check pot status
    let query_msg = QueryMsg::GetPot { id: 1 };
    let result: PotResp = app
        .wrap()
        .query_wasm_smart(contract_addr, &query_msg)
        .unwrap();
    
    assert_eq!(result.broken, true);
}

#[test]
fn test_close_pot() {
    let mut app = mock_app();
    let contract_addr = setup_contract(&mut app);
    
    // Create a pot
    let open_msg = ExecuteMsg::OpenPot {
        goal: Coin::new(5000, "usei"),
        label: Some("Vacation Fund".to_string()),
    };
    
    app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &open_msg,
        &[],
    ).unwrap();
    
    // Deposit to reach goal
    app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &ExecuteMsg::DepositPot { 
            pot_id: 1,
            amount: Coin::new(5000, "usei"),
        },
        &[Coin::new(5000, "usei")],
    ).unwrap();
    
    // Close the pot
    let close_msg = ExecuteMsg::ClosePot { pot_id: 1 };
    let result = app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &close_msg,
        &[],
    );
    
    assert!(result.is_ok());
    
    // Check pot status
    let query_msg = QueryMsg::GetPot { id: 1 };
    let result: PotResp = app
        .wrap()
        .query_wasm_smart(contract_addr, &query_msg)
        .unwrap();
    
    assert_eq!(result.closed, true);
}

#[test]
fn test_cannot_break_unbreakable_pot() {
    let mut app = mock_app();
    let contract_addr = setup_contract(&mut app);
    
    // Create an unbreakable pot
    let open_msg = ExecuteMsg::OpenPot {
        goal: Coin::new(5000, "usei"),
        label: Some("Vacation Fund".to_string()),
    };
    
    app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &open_msg,
        &[],
    ).unwrap();
    
    // Try to break the pot
    let break_msg = ExecuteMsg::BreakPot { pot_id: 1 };
    let result = app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &break_msg,
        &[],
    );
    
    // Should fail
    assert!(result.is_err());
}

#[test]
fn test_list_pots() {
    let mut app = mock_app();
    let contract_addr = setup_contract(&mut app);
    
    // Create multiple pots
    for i in 1..=3 {
        let open_msg = ExecuteMsg::OpenPot {
            goal: Coin::new(1000 * i as u128, "usei"),
            label: Some(format!("Pot {}", i)),
        };
        
        app.execute_contract(
            Addr::unchecked(USER1),
            contract_addr.clone(),
            &open_msg,
            &[],
        ).unwrap();
    }
    
    // List all pots
    let query_msg = QueryMsg::ListAllPots { start_after: None, limit: None };
    let result: Vec<PotResp> = app
        .wrap()
        .query_wasm_smart(contract_addr, &query_msg)
        .unwrap();
    
    assert_eq!(result.len(), 3);
}

#[test]
fn test_list_owner_pots() {
    let mut app = mock_app();
    let contract_addr = setup_contract(&mut app);
    
    // Create pots for different users
    for (i, user) in [USER1, USER2].iter().enumerate() {
        let open_msg = ExecuteMsg::OpenPot {
            goal: Coin::new(1000 * (i + 1) as u128, "usei"),
            label: Some(format!("Pot for {}", user)),
        };
        
        app.execute_contract(
            Addr::unchecked(*user),
            contract_addr.clone(),
            &open_msg,
            &[],
        ).unwrap();
    }
    
    // List pots for USER1
    let query_msg = QueryMsg::ListPotsByOwner { owner: USER1.to_string(), start_after: None, limit: None };
    let result: Vec<PotResp> = app
        .wrap()
        .query_wasm_smart(contract_addr, &query_msg)
        .unwrap();
    
    assert_eq!(result.len(), 1);
    assert_eq!(result[0].owner, USER1);
}
