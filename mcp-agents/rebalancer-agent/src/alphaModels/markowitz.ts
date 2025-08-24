import type { Signals, AllocationPlan, Leg, Proto } from "../types";

export function markowitz(sig: Signals): AllocationPlan {
  // Convert APRs to weights with risk adjustment
  const entries = Object.entries(sig.apr) as [Proto, number][];
  
  if (entries.length === 0) {
    return { legs: [], totalBps: 0, confidence: 0, model: "markowitz" };
  }
  
  // Risk-adjusted returns (higher risk reduces effective APR)
  const riskAdjustedReturns = entries.map(([proto, apr]) => {
    const volatility = sig.volatility?.[proto] || 0.2; // default 20% volatility
    const riskPenalty = Math.min(volatility * sig.risk / 100, 0.5); // cap penalty at 50%
    return [proto, Math.max(apr - riskPenalty, 0)] as [Proto, number];
  });
  
  // Normalize to weights
  const sum = riskAdjustedReturns.reduce((a, [, v]) => a + v, 0) || 1;
  const legs: Leg[] = riskAdjustedReturns.map(([proto, adjustedApr]) => ({
    proto,
    target_bps: Math.max(0, Math.round((adjustedApr / sum) * 10000))
  }));
  
  // Ensure total equals 10000
  const totalBps = legs.reduce((a, l) => a + l.target_bps, 0);
  const diff = 10000 - totalBps;
  if (diff !== 0 && legs.length > 0) {
    legs[0].target_bps = Math.max(0, legs[0].target_bps + diff);
  }
  
  // Calculate confidence based on APR spread and data quality
  const aprSpread = Math.max(...entries.map(([, apr]) => apr)) - Math.min(...entries.map(([, apr]) => apr));
  const confidence = Math.min(90, 50 + aprSpread * 100); // higher spread = higher confidence
  
  return { 
    legs: legs.filter(l => l.target_bps > 0), 
    totalBps: 10000, 
    confidence: Math.round(confidence),
    model: "markowitz"
  };
}