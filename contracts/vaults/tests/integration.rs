use cosmwasm_std::{Addr, Coin, Timestamp};
use cw_multi_test::{App, Contract, ContractWrapper, Executor};
use seimoney_vaults::{
    contract::{execute, instantiate, query},
    msg::{ExecuteMsg, InstantiateMsg, QueryMsg, VaultResp, UserPositionResp, ListVaultsResp},
    state::{Vault, UserPosition, StrategyConfig, ProtocolType},
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
        fee_bps: Some(50), // 0.5%
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
    
    let strategy_config = StrategyConfig {
        name: "Conservative".to_string(),
        description: "Low risk strategy".to_string(),
        target_apy: 500, // 5%
        max_drawdown: 1000, // 10%
        rebalance_frequency: 86400, // Daily
        protocols: vec![
            ProtocolType::Lending { platform: "Aave".to_string() },
            ProtocolType::Staking { validator: "Sei Validator".to_string() },
        ],
    };
    
    let msg = ExecuteMsg::CreateVault {
        name: "Conservative Vault".to_string(),
        description: "A conservative yield vault".to_string(),
        strategy: strategy_config,
        min_deposit: Coin::new(100, "usei"),
        max_deposit: Coin::new(1000000, "usei"),
        fee_bps: 100, // 1%
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
    
    assert_eq!(result.vault.name, "Conservative Vault");
    assert_eq!(result.vault.strategy.name, "Conservative");
    assert_eq!(result.vault.min_deposit, Coin::new(100, "usei"));
}

#[test]
fn test_deposit() {
    let mut app = mock_app();
    let contract_addr = setup_contract(&mut app);
    
    // Create a vault first
    let strategy_config = StrategyConfig {
        name: "Conservative".to_string(),
        description: "Low risk strategy".to_string(),
        target_apy: 500,
        max_drawdown: 1000,
        rebalance_frequency: 86400,
        protocols: vec![
            ProtocolType::Lending { platform: "Aave".to_string() },
        ],
    };
    
    let create_msg = ExecuteMsg::CreateVault {
        name: "Conservative Vault".to_string(),
        description: "A conservative yield vault".to_string(),
        strategy: strategy_config,
        min_deposit: Coin::new(100, "usei"),
        max_deposit: Coin::new(1000000, "usei"),
        fee_bps: 100,
    };
    
    app.execute_contract(
        Addr::unchecked(ADMIN),
        contract_addr.clone(),
        &create_msg,
        &[],
    ).unwrap();
    
    // Deposit into the vault
    let deposit_msg = ExecuteMsg::Deposit { vault_id: 1 };
    let result = app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &deposit_msg,
        &[Coin::new(1000, "usei")],
    );
    
    assert!(result.is_ok());
    
    // Query user position
    let query_msg = QueryMsg::GetUserPosition { vault_id: 1, user: USER1.to_string() };
    let result: UserPositionResp = app
        .wrap()
        .query_wasm_smart(contract_addr, &query_msg)
        .unwrap();
    
    assert_eq!(result.position.deposited_amount, "1000");
    assert_eq!(result.position.shares, "1000");
}

#[test]
fn test_withdraw() {
    let mut app = mock_app();
    let contract_addr = setup_contract(&mut app);
    
    // Create a vault first
    let strategy_config = StrategyConfig {
        name: "Conservative".to_string(),
        description: "Low risk strategy".to_string(),
        target_apy: 500,
        max_drawdown: 1000,
        rebalance_frequency: 86400,
        protocols: vec![
            ProtocolType::Lending { platform: "Aave".to_string() },
        ],
    };
    
    let create_msg = ExecuteMsg::CreateVault {
        name: "Conservative Vault".to_string(),
        description: "A conservative yield vault".to_string(),
        strategy: strategy_config,
        min_deposit: Coin::new(100, "usei"),
        max_deposit: Coin::new(1000000, "usei"),
        fee_bps: 100,
    };
    
    app.execute_contract(
        Addr::unchecked(ADMIN),
        contract_addr.clone(),
        &create_msg,
        &[],
    ).unwrap();
    
    // Deposit into the vault
    app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &ExecuteMsg::Deposit { vault_id: 1 },
        &[Coin::new(1000, "usei")],
    ).unwrap();
    
    // Withdraw from the vault
    let withdraw_msg = ExecuteMsg::Withdraw { 
        vault_id: 1,
        shares: "500".to_string(),
    };
    let result = app.execute_contract(
        Addr::unchecked(USER1),
        contract_addr.clone(),
        &withdraw_msg,
        &[],
    );
    
    assert!(result.is_ok());
    
    // Query user position
    let query_msg = QueryMsg::GetUserPosition { vault_id: 1, user: USER1.to_string() };
    let result: UserPositionResp = app
        .wrap()
        .query_wasm_smart(contract_addr, &query_msg)
        .unwrap();
    
    assert_eq!(result.position.shares, "500");
}

#[test]
fn test_harvest() {
    let mut app = mock_app();
    let contract_addr = setup_contract(&mut app);
    
    // Create a vault first
    let strategy_config = StrategyConfig {
        name: "Conservative".to_string(),
        description: "Low risk strategy".to_string(),
        target_apy: 500,
        max_drawdown: 1000,
        rebalance_frequency: 86400,
        protocols: vec![
            ProtocolType::Lending { platform: "Aave".to_string() },
        ],
    };
    
    let create_msg = ExecuteMsg::CreateVault {
        name: "Conservative Vault".to_string(),
        description: "A conservative yield vault".to_string(),
        strategy: strategy_config,
        min_deposit: Coin::new(100, "usei"),
        max_deposit: Coin::new(1000000, "usei"),
        fee_bps: 100,
    };
    
    app.execute_contract(
        Addr::unchecked(ADMIN),
        contract_addr.clone(),
        &create_msg,
        &[],
    ).unwrap();
    
    // Harvest yields
    let harvest_msg = ExecuteMsg::Harvest { vault_id: 1 };
    let result = app.execute_contract(
        Addr::unchecked(ADMIN),
        contract_addr.clone(),
        &harvest_msg,
        &[],
    );
    
    assert!(result.is_ok());
}

#[test]
fn test_rebalance() {
    let mut app = mock_app();
    let contract_addr = setup_contract(&mut app);
    
    // Create a vault first
    let strategy_config = StrategyConfig {
        name: "Conservative".to_string(),
        description: "Low risk strategy".to_string(),
        target_apy: 500,
        max_drawdown: 1000,
        rebalance_frequency: 86400,
        protocols: vec![
            ProtocolType::Lending { platform: "Aave".to_string() },
            ProtocolType::Staking { validator: "Sei Validator".to_string() },
        ],
    };
    
    let create_msg = ExecuteMsg::CreateVault {
        name: "Conservative Vault".to_string(),
        description: "A conservative yield vault".to_string(),
        strategy: strategy_config,
        min_deposit: Coin::new(100, "usei"),
        max_deposit: Coin::new(1000000, "usei"),
        fee_bps: 100,
    };
    
    app.execute_contract(
        Addr::unchecked(ADMIN),
        contract_addr.clone(),
        &create_msg,
        &[],
    ).unwrap();
    
    // Rebalance the vault
    let rebalance_msg = ExecuteMsg::Rebalance { vault_id: 1 };
    let result = app.execute_contract(
        Addr::unchecked(ADMIN),
        contract_addr.clone(),
        &rebalance_msg,
        &[],
    );
    
    assert!(result.is_ok());
}

#[test]
fn test_list_vaults() {
    let mut app = mock_app();
    let contract_addr = setup_contract(&mut app);
    
    // Create multiple vaults
    for i in 1..=3 {
        let strategy_config = StrategyConfig {
            name: format!("Strategy {}", i),
            description: format!("Strategy {} description", i),
            target_apy: 500 * i,
            max_drawdown: 1000 * i,
            rebalance_frequency: 86400,
            protocols: vec![
                ProtocolType::Lending { platform: "Aave".to_string() },
            ],
        };
        
        let create_msg = ExecuteMsg::CreateVault {
            name: format!("Vault {}", i),
            description: format!("Vault {} description", i),
            strategy: strategy_config,
            min_deposit: Coin::new(100 * i as u128, "usei"),
            max_deposit: Coin::new(1000000, "usei"),
            fee_bps: 100,
        };
        
        app.execute_contract(
            Addr::unchecked(ADMIN),
            contract_addr.clone(),
            &create_msg,
            &[],
        ).unwrap();
    }
    
    // List all vaults
    let query_msg = QueryMsg::ListVaults { start_after: None, limit: None };
    let result: ListVaultsResp = app
        .wrap()
        .query_wasm_smart(contract_addr, &query_msg)
        .unwrap();
    
    assert_eq!(result.vaults.len(), 3);
}

#[test]
fn test_get_vault_shares() {
    let mut app = mock_app();
    let contract_addr = setup_contract(&mut app);
    
    // Create a vault first
    let strategy_config = StrategyConfig {
        name: "Conservative".to_string(),
        description: "Low risk strategy".to_string(),
        target_apy: 500,
        max_drawdown: 1000,
        rebalance_frequency: 86400,
        protocols: vec![
            ProtocolType::Lending { platform: "Aave".to_string() },
        ],
    };
    
    let create_msg = ExecuteMsg::CreateVault {
        name: "Conservative Vault".to_string(),
        description: "A conservative yield vault".to_string(),
        strategy: strategy_config,
        min_deposit: Coin::new(100, "usei"),
        max_deposit: Coin::new(1000000, "usei"),
        fee_bps: 100,
    };
    
    app.execute_contract(
        Addr::unchecked(ADMIN),
        contract_addr.clone(),
        &create_msg,
        &[],
    ).unwrap();
    
    // Get vault shares
    let query_msg = QueryMsg::GetVaultShares { vault_id: 1 };
    let result: u64 = app
        .wrap()
        .query_wasm_smart(contract_addr, &query_msg)
        .unwrap();
    
    assert_eq!(result, 0); // No shares initially
}
