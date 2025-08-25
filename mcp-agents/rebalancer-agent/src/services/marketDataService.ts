import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';

const CONTRACTS = {
  VAULTS: "sei12k2yxf3cyec8p89qtgm5w30m4g2775tn7j8wx4jpuallygu45r9qs68u2h",
} as const;

const NETWORK_CONFIG = {
  RPC_URL: "https://rpc.atlantic-2.seinetwork.io:443",
} as const;

let client: CosmWasmClient | null = null;

async function getClient(): Promise<CosmWasmClient> {
  if (!client) {
    client = await CosmWasmClient.connect(NETWORK_CONFIG.RPC_URL);
  }
  return client;
}

export async function getMarketData() {
  const cosmWasmClient = await getClient();
  const vaults = await cosmWasmClient.queryContractSmart(CONTRACTS.VAULTS, {
    list_vaults: {}
  });
  return vaults.vaults || [];
}

export async function getVaultPerformance(vaultId: string) {
  const cosmWasmClient = await getClient();
  return await cosmWasmClient.queryContractSmart(CONTRACTS.VAULTS, {
    get_performance: { vault_id: vaultId }
  });
}