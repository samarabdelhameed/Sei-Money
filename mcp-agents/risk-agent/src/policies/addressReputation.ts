import type { Address, PolicyResult } from "../types";

export async function addressReputation(addr?: Address): Promise<PolicyResult> {
  if (!addr) return { score: 0, reason: "no-address" };

  // TODO: fetch reputation from backend/indexer (payments history, disputes, K-steps)
  // Placeholder heuristic:
  if (addr.endsWith("...bad")) return { score: 80, reason: "blacklist-hit" };
  if (addr.endsWith("...new")) return { score: 40, reason: "new-address-low-history" };
  if (addr.startsWith("sei1") && addr.length === 63) {
    // Valid Sei address format
    return { score: 10, reason: "reputation-ok" };
  }
  
  return { score: 25, reason: "unknown-address-format" };
}