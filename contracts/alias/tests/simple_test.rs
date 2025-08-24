use cosmwasm_std::Addr;
use cw_multi_test::{App, ContractWrapper, Executor};
use seimoney_alias::{
    contract::{execute, instantiate, query},
    msg::{ExecuteMsg, InstantiateMsg, QueryMsg, UsernameResp, AddressResp},
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
        min_username_length: Some(3),
        max_username_length: Some(20),
    };
    
    app.instantiate_contract(
        code_id,
        Addr::unchecked(ADMIN),
        &msg,
        &[],
        "SeiMoney Alias",
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
fn test_register_username() {
    let mut app = mock_app();
    let contract_addr = setup_contract(&mut app);
    
    let msg = ExecuteMsg::Register {
        username: "alice".to_string(),
    };
    
    let result = app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &msg,
        &[],
    );
    
    assert!(result.is_ok());
    
    // Query the registered username
    let query_msg = QueryMsg::Resolve { username: "alice".to_string() };
    let result: UsernameResp = app
        .wrap()
        .query_wasm_smart(contract_addr, &query_msg)
        .unwrap();
    
    assert_eq!(result.username, "alice");
    assert_eq!(result.address, USER1);
}

#[test]
fn test_get_username_by_address() {
    let mut app = mock_app();
    let contract_addr = setup_contract(&mut app);
    
    // Register username first
    let register_msg = ExecuteMsg::Register {
        username: "alice".to_string(),
    };
    
    app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &register_msg,
        &[],
    ).unwrap();
    
    // Get username by address
    let query_msg = QueryMsg::ReverseLookup { address: USER1.to_string() };
    let result: AddressResp = app
        .wrap()
        .query_wasm_smart(contract_addr, &query_msg)
        .unwrap();
    
    assert_eq!(result.username, "alice");
}
