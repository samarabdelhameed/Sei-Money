use cosmwasm_std::{Addr, Coin};
use cw_multi_test::{App, ContractWrapper, Executor};
use seimoney_vaults::{
    contract::{execute, instantiate, query},
    msg::{ExecuteMsg, InstantiateMsg, QueryMsg, VaultResp, UserPositionResp, StrategyConfig, ProtocolType},
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
        max_fee_bps: Some(1000),
    };
    
    app.instantiate_contract(
        code_id,
        Addr::unchecked(ADMIN),
        &msg,
        &[],
        "SeiMoney Vaults",
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
fn test_create_vault() {
    let mut app = mock_app();
    let contract_addr = setup_contract(&mut app);
    
    let strategy_config = StrategyConfig::Conservative;
    
    let msg = ExecuteMsg::CreateVault {
        label: "Conservative Vault".to_string(),
        denom: "usei".to_string(),
        strategy: strategy_config,
        fee_bps: Some(100),
    };
    
    let result = app.execute_contract(
        Addr::unchecked(ADMIN),
        contract_addr.clone(),
        &msg,
        &[],
    );
    
    assert!(result.is_ok());
    
    // Query the created vault
    let query_msg = QueryMsg::GetVault { id: 1 };
    let result: VaultResp = app
        .wrap()
        .query_wasm_smart(contract_addr, &query_msg)
        .unwrap();
    
    assert_eq!(result.label, "Conservative Vault");
    assert_eq!(result.denom, "usei");
    assert_eq!(result.fee_bps, 100);
}

#[test]
fn test_deposit() {
    let mut app = mock_app();
    let contract_addr = setup_contract(&mut app);
    
    // Create a vault first
    let strategy_config = StrategyConfig::Conservative;
    
    let create_msg = ExecuteMsg::CreateVault {
        label: "Conservative Vault".to_string(),
        denom: "usei".to_string(),
        strategy: strategy_config,
        fee_bps: Some(100),
    };
    
    app.execute_contract(
        Addr::unchecked(ADMIN),
        contract_addr.clone(),
        &create_msg,
        &[],
    ).unwrap();
    
    // Deposit into the vault
    let deposit_msg = ExecuteMsg::Deposit { 
        vault_id: 1,
        amount: Coin::new(1000, "usei"),
    };
    let result = app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &deposit_msg,
        &[Coin::new(1000, "usei")],
    );
    
    assert!(result.is_ok());
    
    // Query user position
    let query_msg = QueryMsg::UserPosition { vault_id: 1, address: USER1.to_string() };
    let result: UserPositionResp = app
        .wrap()
        .query_wasm_smart(contract_addr, &query_msg)
        .unwrap();
    
    assert_eq!(result.shares, "1000");
}
