import type { PolicyResult } from "../types";
import { getVelocityStats } from "../services/velocityAnalyzer";
import type { Address } from "../types";

export async function velocity(
  ctx?: Record<string,unknown>, 
  address?: Address
): Promise<PolicyResult> {
  try {
    // Get real velocity statistics from blockchain data
    const velocityStats = address 
      ? await getVelocityStats(address)
      : null;

    let score = 0;
    let reason = "velocity-analyzed";

    if (!velocityStats) {
      // Fallback to context data if provided
      const txPerHour = Number((ctx?.["txPerHour"] as string) ?? "0");
      const txPerDay = Number((ctx?.["txPerDay"] as string) ?? "0");
      
      if (txPerHour > 400) return { score: 85, reason: "tx-burst-from-context" };
      if (txPerHour > 50)  return { score: 55, reason: "high-velocity-from-context" };
      if (txPerDay > 1000) return { score: 70, reason: "daily-limit-exceeded-from-context" };
      if (txPerDay > 100)  return { score: 30, reason: "active-user-from-context" };
      
      return { score: 10, reason: "low-velocity-no-data" };
    }

    // Analyze real velocity data
    const {
      transactionsLastHour,
      transactionsLastDay,
      transactionsLastWeek,
      averageHourlyRate,
      averageDailyRate,
      peakHourlyRate,
      burstDetected,
      velocityTrend,
      unusualPatterns
    } = velocityStats;

    // Hourly velocity scoring
    if (transactionsLastHour > 100) {
      score += 90;
      reason = "extreme-hourly-burst";
    } else if (transactionsLastHour > 50) {
      score += 70;
      reason = "high-hourly-velocity";
    } else if (transactionsLastHour > 20) {
      score += 45;
      reason = "moderate-hourly-velocity";
    } else if (transactionsLastHour > 10) {
      score += 25;
      reason = "elevated-hourly-velocity";
    }

    // Daily velocity scoring
    if (transactionsLastDay > 500) {
      score += 80;
      reason = "extreme-daily-volume";
    } else if (transactionsLastDay > 200) {
      score += 60;
      reason = "very-high-daily-volume";
    } else if (transactionsLastDay > 100) {
      score += 40;
      reason = "high-daily-volume";
    } else if (transactionsLastDay > 50) {
      score += 20;
      reason = "moderate-daily-volume";
    }

    // Burst detection
    if (burstDetected) {
      score += 35;
      reason = "transaction-burst-detected";
    }

    // Peak rate analysis
    if (peakHourlyRate > averageHourlyRate * 10) {
      score += 30;
      reason = "extreme-peak-velocity";
    } else if (peakHourlyRate > averageHourlyRate * 5) {
      score += 20;
      reason = "high-peak-velocity";
    }

    // Velocity trend analysis
    if (velocityTrend === 'rapidly_increasing') {
      score += 25;
      reason = "rapidly-increasing-velocity";
    } else if (velocityTrend === 'increasing') {
      score += 15;
      reason = "increasing-velocity";
    }

    // Unusual pattern detection
    if (unusualPatterns.length > 0) {
      score += 20;
      reason = `unusual-patterns-detected: ${unusualPatterns.join(', ')}`;
    }

    // Weekly context for normalization
    if (transactionsLastWeek > 0) {
      const dailyAverage = transactionsLastWeek / 7;
      const dailyRatio = transactionsLastDay / dailyAverage;
      
      if (dailyRatio > 5) {
        score += 25;
        reason = "daily-volume-anomaly";
      } else if (dailyRatio > 3) {
        score += 15;
        reason = "elevated-daily-volume";
      }
    }

    // Account for very low activity (could indicate account compromise)
    if (averageDailyRate > 10 && transactionsLastDay === 0 && transactionsLastHour > 5) {
      score += 20;
      reason = "sudden-activity-after-dormancy";
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));

    return { score, reason };
  } catch (error) {
    console.error("Error analyzing velocity:", error);
    
    // Fallback to context data on error
    const txPerHour = Number((ctx?.["txPerHour"] as string) ?? "0");
    const txPerDay = Number((ctx?.["txPerDay"] as string) ?? "0");
    
    if (txPerHour > 400) return { score: 85, reason: "tx-burst-fallback" };
    if (txPerHour > 50)  return { score: 55, reason: "high-velocity-fallback" };
    if (txPerDay > 1000) return { score: 70, reason: "daily-limit-exceeded-fallback" };
    if (txPerDay > 100)  return { score: 30, reason: "active-user-fallback" };
    
    return { score: 10, reason: "low-velocity-error-fallback" };
  }
}