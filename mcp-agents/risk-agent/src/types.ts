export type Address = string;

export interface RiskInput {
  from?: Address;
  to?: Address;
  amount?: { denom: string; amount: string };
  action: "transfer" | "claim" | "refund" | "contribute" | "escrow.open" | "vault.deposit";
  context?: Record<string, unknown>; // e.g. velocity stats
}

export interface RiskScore {
  score: number;              // 0-100 (higher = higher risk)
  reasons: string[];
  recommendation: "allow" | "hold" | "deny" | "escalate";
}

export interface PolicyResult {
  score: number;
  reason: string;
}