import type { PolicyResult } from "../types";

export async function amountAnomaly(raw?: {denom: string; amount: string}): Promise<PolicyResult> {
  if (!raw) return { score: 0, reason: "no-amount" };

  const amt = Number(raw.amount);
  
  // TODO: z-score vs user median from indexer; here simple caps
  if (amt >= 1_000_000_000) return { score: 90, reason: "extreme-amount" };
  if (amt >= 100_000_000)  return { score: 60, reason: "very-high-amount" };
  if (amt >= 10_000_000)   return { score: 35, reason: "high-amount" };
  if (amt <= 0)            return { score: 50, reason: "invalid-amount" };
  
  return { score: 15, reason: "normal-amount" };
}