import { optimize } from "./optimizer";
import type { Signals, RebalanceRequest } from "./types";

// Mock VaultsClient - replace with actual SDK import
interface VaultsClient {
  rebalance(vaultId: number, plan: any): Promise<any>;
  getVaultInfo(vaultId: number): Promise<any>;
}

const mockVaultsClient: VaultsClient = {
  async rebalance(vaultId: number, plan: any) {
    console.log(`⚖️  Executing rebalance for vault ${vaultId}:`, plan);
    return { 
      success: true, 
      vaultId, 
      plan,
      txHash: `0x${Math.random().toString(16).slice(2)}`,
      timestamp: new Date().toISOString()
    };
  },
  
  async getVaultInfo(vaultId: number) {
    return {
      vaultId,
      totalValue: 1000000,
      currentAllocation: {
        Staking: 4000,
        Lending: 3000,
        LP: 2000,
        PerpsHedge: 1000
      },
      lastRebalance: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    };
  }
};

export async function runRebalance(
  request: RebalanceRequest, 
  vaults: VaultsClient = mockVaultsClient
): Promise<any> {
  const { vaultId, signals, model = "rl", constraints } = request;
  
  console.log(`🎯 Starting rebalance for vault ${vaultId} using ${model} model`);
  
  // Get current vault info
  const vaultInfo = await vaults.getVaultInfo(vaultId);
  console.log(`📊 Current vault allocation:`, vaultInfo.currentAllocation);
  
  // Generate optimal allocation plan
  const plan = optimize(signals, model, constraints);
  console.log(`🧠 Generated plan with ${plan.confidence}% confidence:`, plan);
  
  // Check if rebalancing is needed (significant difference from current allocation)
  const currentAllocation = vaultInfo.currentAllocation || {};
  const significantChange = plan.legs.some(leg => {
    const currentBps = currentAllocation[leg.proto] || 0;
    const diff = Math.abs(leg.target_bps - currentBps);
    return diff > 500; // 5% threshold for significant change
  });
  
  if (!significantChange) {
    console.log(`⏭️  Skipping rebalance - no significant changes needed`);
    return {
      skipped: true,
      reason: "no-significant-change",
      currentPlan: plan,
      vaultId
    };
  }
  
  // Execute rebalance
  console.log(`🚀 Executing rebalance...`);
  const result = await vaults.rebalance(vaultId, plan);
  
  console.log(`✅ Rebalance completed successfully`);
  return result;
}

// Batch rebalancing for multiple vaults
export async function runBatchRebalance(
  requests: RebalanceRequest[],
  vaults: VaultsClient = mockVaultsClient
): Promise<any[]> {
  console.log(`🔄 Starting batch rebalance for ${requests.length} vaults`);
  
  const results = await Promise.allSettled(
    requests.map(request => runRebalance(request, vaults))
  );
  
  const summary = results.map((result, index) => ({
    vaultId: requests[index].vaultId,
    success: result.status === "fulfilled",
    result: result.status === "fulfilled" ? result.value : null,
    error: result.status === "rejected" ? result.reason?.message : null
  }));
  
  const successful = summary.filter(s => s.success).length;
  console.log(`📈 Batch rebalance completed: ${successful}/${requests.length} successful`);
  
  return summary;
}

// Dry run - generate plan without executing
export async function dryRunRebalance(
  request: RebalanceRequest
): Promise<any> {
  const { vaultId, signals, model = "rl", constraints } = request;
  
  console.log(`🧪 Dry run rebalance for vault ${vaultId} using ${model} model`);
  
  const plan = optimize(signals, model, constraints);
  
  return {
    dryRun: true,
    vaultId,
    model,
    plan,
    signals,
    constraints,
    timestamp: new Date().toISOString()
  };
}