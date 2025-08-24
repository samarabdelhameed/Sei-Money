export type Proto = "Staking" | "Lending" | "LP" | "PerpsHedge";

export interface Leg { 
  proto: Proto; 
  target_bps: number; // 0..10000 (basis points)
}

export interface Signals { 
  prices: Record<string, number>; 
  apr: Record<Proto, number>; 
  risk: number; // 0-100 risk score
  volatility?: Record<Proto, number>;
  liquidity?: Record<Proto, number>;
}

export interface AllocationPlan { 
  legs: Leg[];
  totalBps: number;
  confidence: number; // 0-100
  model: string;
}

export interface RebalanceRequest {
  vaultId: number;
  signals: Signals;
  model?: "markowitz" | "bandit" | "rl";
  constraints?: {
    maxSingleAllocation?: number; // max bps for single protocol
    minDiversification?: number;  // min number of protocols
    riskTolerance?: number;       // 0-100
  };
}