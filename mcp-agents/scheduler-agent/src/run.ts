import { plan } from "./planner";
import { setTimeout as sleep } from "timers/promises";
import type { ScheduleRequest } from "./types";

// Mock SDK clients - replace with actual SDK imports
interface VaultsClient {
  harvest(vaultId: number): Promise<any>;
  rebalance(vaultId: number, plan: any): Promise<any>;
}

interface PaymentsClient {
  refundTransfer(transferId: number): Promise<any>;
}

interface GroupsClient {
  distribute(groupId: number): Promise<any>;
}

interface SDKClients {
  vaults: VaultsClient;
  payments: PaymentsClient;
  groups: GroupsClient;
}

export async function run(
  request: ScheduleRequest, 
  clients: SDKClients
): Promise<any> {
  const schedulePlan = await plan(request);
  
  console.log(`⏳ Scheduling ${request.action} for target ${request.targetId} in ${schedulePlan.etaSec}s`);
  console.log(`📊 Reason: ${schedulePlan.reason}`);
  console.log(`⛽ Estimated gas: ${schedulePlan.estimatedGas} USEI`);
  
  // Wait for optimal execution time
  await sleep(schedulePlan.etaSec * 1000);
  
  console.log(`🚀 Executing ${request.action} for target ${request.targetId}`);
  
  // Execute the scheduled action
  switch (request.action) {
    case "harvest":
      return clients.vaults.harvest(request.targetId);
      
    case "rebalance":
      if (!request.plan) {
        throw new Error("Rebalance action requires a plan");
      }
      return clients.vaults.rebalance(request.targetId, request.plan);
      
    case "refund":
      return clients.payments.refundTransfer(request.targetId);
      
    case "distribute":
      return clients.groups.distribute(request.targetId);
      
    default:
      throw new Error(`Unknown action: ${request.action}`);
  }
}

// Batch execution for multiple scheduled operations
export async function runBatch(
  requests: ScheduleRequest[],
  clients: SDKClients
): Promise<any[]> {
  const results = await Promise.allSettled(
    requests.map(req => run(req, clients))
  );
  
  return results.map((result, index) => ({
    request: requests[index],
    success: result.status === "fulfilled",
    result: result.status === "fulfilled" ? result.value : null,
    error: result.status === "rejected" ? result.reason : null
  }));
}