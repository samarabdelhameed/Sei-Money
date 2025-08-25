import type { PolicyResult } from "../types";
import { getMarketStats, getUserTransactionStats } from "../services/marketAnalyzer";

export async function amountAnomaly(
  raw?: {denom: string; amount: string}, 
  userAddress?: string
): Promise<PolicyResult> {
  if (!raw) return { score: 0, reason: "no-amount" };

  const amt = Number(raw.amount);
  
  // Basic validation
  if (amt <= 0) return { score: 50, reason: "invalid-amount" };
  if (isNaN(amt)) return { score: 50, reason: "invalid-amount-format" };

  try {
    // Get real market statistics and user history
    const [marketStats, userStats] = await Promise.all([
      getMarketStats(),
      userAddress ? getUserTransactionStats(userAddress) : null
    ]);

    let score = 0;
    let reason = "amount-analyzed";

    // Convert to SEI for easier analysis
    const amountInSei = amt / 1_000_000; // Convert from usei to SEI

    // Market-based anomaly detection
    const avgTransactionSize = marketStats.averageTransactionSize || 10; // Default 10 SEI
    const medianTransactionSize = marketStats.medianTransactionSize || 5; // Default 5 SEI
    
    // Calculate z-score against market average
    const marketStdDev = marketStats.transactionSizeStdDev || avgTransactionSize * 0.5;
    const marketZScore = Math.abs((amountInSei - avgTransactionSize) / marketStdDev);

    // User-specific anomaly detection
    let userZScore = 0;
    if (userStats && userStats.averageTransactionSize > 0) {
      const userStdDev = userStats.transactionSizeStdDev || userStats.averageTransactionSize * 0.3;
      userZScore = Math.abs((amountInSei - userStats.averageTransactionSize) / userStdDev);
    }

    // Absolute amount thresholds (updated with real market data)
    if (amountInSei >= 10000) { // >= 10,000 SEI
      score += 85;
      reason = "extreme-amount-whale-level";
    } else if (amountInSei >= 1000) { // >= 1,000 SEI
      score += 70;
      reason = "very-high-amount";
    } else if (amountInSei >= 100) { // >= 100 SEI
      score += 45;
      reason = "high-amount";
    } else if (amountInSei >= 50) { // >= 50 SEI
      score += 25;
      reason = "moderately-high-amount";
    }

    // Market anomaly scoring
    if (marketZScore > 5) {
      score += 40;
      reason = "extreme-market-anomaly";
    } else if (marketZScore > 3) {
      score += 25;
      reason = "high-market-anomaly";
    } else if (marketZScore > 2) {
      score += 15;
      reason = "moderate-market-anomaly";
    }

    // User-specific anomaly scoring (if we have user history)
    if (userStats && userStats.totalTransactions > 5) {
      if (userZScore > 4) {
        score += 35;
        reason = "extreme-user-anomaly";
      } else if (userZScore > 2.5) {
        score += 20;
        reason = "high-user-anomaly";
      } else if (userZScore > 1.5) {
        score += 10;
        reason = "moderate-user-anomaly";
      }
    }

    // Frequency-based risk (multiple large transactions)
    if (userStats && userStats.largeTransactionCount > 0) {
      const largeTransactionRatio = userStats.largeTransactionCount / userStats.totalTransactions;
      if (largeTransactionRatio > 0.5 && amountInSei >= 100) {
        score += 20;
        reason = "frequent-large-transactions";
      }
    }

    // Round number detection (often indicates manual/suspicious activity)
    if (amountInSei >= 10 && amountInSei % 10 === 0) {
      score += 5;
      reason = "round-number-pattern";
    }

    // Very small amounts (potential spam or testing)
    if (amountInSei < 0.01) { // < 0.01 SEI
      score += 30;
      reason = "micro-transaction";
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));

    return { score, reason };
  } catch (error) {
    console.error("Error analyzing amount anomaly:", error);
    
    // Fallback to simple thresholds on error
    if (amt >= 1_000_000_000) return { score: 90, reason: "extreme-amount-fallback" };
    if (amt >= 100_000_000)  return { score: 60, reason: "very-high-amount-fallback" };
    if (amt >= 10_000_000)   return { score: 35, reason: "high-amount-fallback" };
    
    return { score: 15, reason: "normal-amount-fallback" };
  }
}