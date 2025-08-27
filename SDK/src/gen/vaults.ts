// Generated types for Vaults contract
export interface VaultsQueryClient {
  getVault: (vaultId: string) => Promise<any>;
  getUserVaults: (address: string) => Promise<any>;
  getVaultPerformance: (vaultId: string) => Promise<any>;
}

export interface VaultsExecuteMsg {
  create_vault: {
    name: string;
    strategy: string;
    risk_level: string;
    min_deposit: string;
    denom: string;
  };
  deposit: {
    vault_id: string;
    amount: string;
  };
  withdraw: {
    vault_id: string;
    amount: string;
  };
  rebalance: {
    vault_id: string;
  };
}

export interface VaultsQueryMsg {
  get_vault: {
    vault_id: string;
  };
  get_user_vaults: {
    address: string;
    limit?: number;
    start_after?: string;
  };
  get_vault_performance: {
    vault_id: string;
    period?: string;
  };
}

export interface Vault {
  id: string;
  name: string;
  manager: string;
  strategy: string;
  risk_level: string;
  total_deposits: string;
  total_yield: string;
  denom: string;
  status: string;
  created_at: number;
  performance: {
    apy: string;
    total_return: string;
    sharpe_ratio: string;
  };
}