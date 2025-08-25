import type { Address, PolicyResult } from "../types";
import { getAddressHistory, getAddressStats } from "../services/blockchainAnalyzer";

export async function addressReputation(addr?: Address): Promise<PolicyResult> {
  if (!addr) return { score: 0, reason: "no-address" };

  // Validate Sei address format
  if (!addr.startsWith("sei1") || addr.length !== 63) {
    return { score: 75, reason: "invalid-address-format" };
  }

  try {
    // Get real transaction history and statistics
    const [history, stats] = await Promise.all([
      getAddressHistory(addr),
      getAddressStats(addr)
    ]);

    // Calculate reputation score based on real data
    let score = 0;
    let reason = "reputation-calculated";

    // Age factor (older addresses are more trusted)
    const ageInDays = stats.ageInDays || 0;
    if (ageInDays === 0) {
      score += 40; // New address
      reason = "new-address-no-history";
    } else if (ageInDays < 7) {
      score += 30; // Very new
      reason = "very-new-address";
    } else if (ageInDays < 30) {
      score += 20; // Recent
      reason = "recent-address";
    } else {
      score += 5; // Established
      reason = "established-address";
    }

    // Transaction volume factor
    const totalTransactions = stats.totalTransactions || 0;
    if (totalTransactions === 0) {
      score += 35;
      reason = "no-transaction-history";
    } else if (totalTransactions < 5) {
      score += 25;
      reason = "low-transaction-history";
    } else if (totalTransactions < 50) {
      score += 15;
      reason = "moderate-transaction-history";
    } else {
      score += 5;
      reason = "high-transaction-history";
    }

    // Failed transaction ratio
    const failureRate = stats.failureRate || 0;
    if (failureRate > 0.5) {
      score += 30;
      reason = "high-failure-rate";
    } else if (failureRate > 0.2) {
      score += 15;
      reason = "moderate-failure-rate";
    } else {
      score += 0;
      reason = "low-failure-rate";
    }

    // Suspicious patterns
    if (stats.hasUnusualPatterns) {
      score += 25;
      reason = "suspicious-transaction-patterns";
    }

    // Large transaction frequency (potential whale or exchange)
    if (stats.averageTransactionSize > 1000000000) { // > 1000 SEI
      score += 10;
      reason = "large-transaction-patterns";
    }

    // Contract interaction diversity (more diverse = more trusted)
    const contractInteractions = stats.uniqueContractsInteracted || 0;
    if (contractInteractions > 5) {
      score -= 5; // Reduce risk for diverse interactions
      reason = "diverse-contract-interactions";
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));

    return { score, reason };
  } catch (error) {
    console.error("Error analyzing address reputation:", error);
    // Fallback to conservative scoring on error
    return { score: 50, reason: "analysis-error-conservative-score" };
  }
}