import type { Signals, AllocationPlan } from "../types";
import { bandit } from "./bandit";

// Simplified RL model - in production this would use actual RL algorithms
export function rl(sig: Signals): AllocationPlan {
  // For now, use bandit as base with RL-inspired adjustments
  const base = bandit(sig);
  
  if (base.legs.length === 0) {
    return { ...base, model: "rl" };
  }
  
  // RL-inspired adjustments based on market conditions
  const marketVolatility = sig.risk / 100; // normalize risk to 0-1
  
  // In high volatility, prefer more conservative allocations
  if (marketVolatility > 0.7) {
    // Reduce concentration, increase diversification
    const maxAllocation = 4000; // 40% max in high volatility
    base.legs.forEach(leg => {
      if (leg.target_bps > maxAllocation) {
        leg.target_bps = maxAllocation;
      }
    });
    
    // Redistribute excess more evenly
    const totalBps = base.legs.reduce((a, l) => a + l.target_bps, 0);
    const excess = 10000 - totalBps;
    if (excess > 0) {
      const perLeg = Math.floor(excess / base.legs.length);
      base.legs.forEach((leg, i) => {
        leg.target_bps += perLeg;
        if (i === 0) leg.target_bps += excess % base.legs.length; // handle remainder
      });
    }
  }
  
  // In low volatility, allow more concentration
  if (marketVolatility < 0.3) {
    // Sort by APR and concentrate more in top performers
    const sortedLegs = [...base.legs].sort((a, b) => 
      (sig.apr[b.proto] || 0) - (sig.apr[a.proto] || 0)
    );
    
    if (sortedLegs.length > 0) {
      const topLeg = sortedLegs[0];
      const boost = Math.min(1500, topLeg.target_bps * 0.2); // 20% boost
      topLeg.target_bps = Math.min(6500, topLeg.target_bps + boost);
      
      // Reduce others proportionally
      const otherLegs = base.legs.filter(l => l.proto !== topLeg.proto);
      const totalOther = otherLegs.reduce((sum, l) => sum + l.target_bps, 0);
      const targetOther = 10000 - topLeg.target_bps;
      
      if (totalOther > 0) {
        otherLegs.forEach(leg => {
          leg.target_bps = Math.round((leg.target_bps / totalOther) * targetOther);
        });
      }
    }
  }
  
  // Final normalization
  const finalTotal = base.legs.reduce((a, l) => a + l.target_bps, 0);
  const finalDiff = 10000 - finalTotal;
  if (finalDiff !== 0 && base.legs.length > 0) {
    base.legs[0].target_bps = Math.max(0, base.legs[0].target_bps + finalDiff);
  }
  
  return { 
    ...base, 
    model: "rl",
    confidence: Math.min(base.confidence + 5, 95) // slightly more confident with RL adjustments
  };
}