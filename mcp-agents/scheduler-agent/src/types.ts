export interface ScheduleRequest {
  action: "harvest" | "rebalance" | "refund" | "distribute";
  targetId: number;
  urgency: "low" | "normal" | "high";
  gasCeiling?: number; // micro-USEI
  plan?: any; // for rebalance actions
}

export interface SchedulePlan {
  etaSec: number;
  reason: string;
  estimatedGas?: number;
  optimalTime?: string;
}

export interface GasInfo {
  current: number;
  average24h: number;
  trend: "rising" | "falling" | "stable";
}