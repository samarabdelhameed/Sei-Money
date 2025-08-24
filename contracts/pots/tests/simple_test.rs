use cosmwasm_std::{Addr, Coin};
use cw_multi_test::{App, ContractWrapper, Executor};
use seimoney_pots::{
    contract::{execute, instantiate, query},
    msg::{ExecuteMsg, InstantiateMsg, QueryMsg, PotResp},
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
