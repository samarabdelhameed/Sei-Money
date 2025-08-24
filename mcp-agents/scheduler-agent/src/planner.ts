import fetch from "node-fetch";
import type { ScheduleRequest, SchedulePlan, GasInfo } from "./types";
import { cfg } from "./config";

async function getApr(protocol: string): Promise<number> {
  try {
    const response = await fetch(`${process.env.ORACLES_URL}/apr/${protocol}`);
    if (!response.ok) return 0.1; // fallback APR
    const data = await response.json() as any;
    return data.apr || 0.1;
  } catch {
    return 0.1; // fallback
  }
}

async function getGasInfo(): Promise<GasInfo> {
  try {
    const response = await fetch(`${process.env.API_URL}/gas/info`);
    if (!response.ok) throw new Error("Gas info unavailable");
    return await response.json() as GasInfo;
  } catch {
    // Fallback gas info
    return {
      current: 0.02,
      average24h: 0.025,
      trend: "stable"
    };
  }
}

function calculateOptimalDelay(gasInfo: GasInfo, urgency: keyof typeof cfg.urgency): number {
  const urgencyConfig = cfg.urgency[urgency];
  
  if (urgency === "high") return 5; // Execute ASAP for high urgency
  
  // For low/normal urgency, consider gas trends
  if (gasInfo.trend === "falling" && gasInfo.current > cfg.gas.thresholds.normal) {
    return Math.min(300, urgencyConfig.maxDelaySec); // Wait for gas to drop
  }
  
  if (gasInfo.trend === "rising" && gasInfo.current < cfg.gas.thresholds.high) {
    return 30; // Execute soon before gas rises more
  }
  
  return urgency === "low" ? 120 : 60; // Default delays
}

export async function plan(req: ScheduleRequest): Promise<SchedulePlan> {
  const gasInfo = await getGasInfo();
  
  // Action-specific logic
  if (req.action === "refund") {
    return { 
      etaSec: 5, 
      reason: "time-sensitive-refund",
      estimatedGas: gasInfo.current * 1.2 // Slightly higher for priority
    };
  }
  
  if (req.action === "distribute") {
    return { 
      etaSec: 10, 
      reason: "target-met-distribution",
      estimatedGas: gasInfo.current
    };
  }
  
  if (req.action === "harvest") {
    const apr = await getApr("Staking");
    const delay = apr > 0.15 ? 60 : calculateOptimalDelay(gasInfo, req.urgency);
    return { 
      etaSec: delay, 
      reason: `harvest-apr=${apr.toFixed(3)}`,
      estimatedGas: gasInfo.current * cfg.urgency[req.urgency].gasMultiplier
    };
  }
  
  if (req.action === "rebalance") {
    const delay = calculateOptimalDelay(gasInfo, req.urgency);
    return { 
      etaSec: delay, 
      reason: "market-shift-rebalance",
      estimatedGas: gasInfo.current * 1.1 // Rebalancing typically costs more
    };
  }
  
  return { 
    etaSec: 60, 
    reason: "default-schedule",
    estimatedGas: gasInfo.current
  };
}