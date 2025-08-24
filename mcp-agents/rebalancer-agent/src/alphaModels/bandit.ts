import type { Signals, AllocationPlan } from "../types";
import { markowitz } from "./markowitz";

export function bandit(sig: Signals): AllocationPlan {
  // Start with Markowitz base allocation
  const base = markowitz(sig);
  
  if (base.legs.length === 0) {
    return { ...base, model: "bandit" };
  }
  
  // Multi-armed bandit: boost the best performing protocol
  const entries = Object.entries(sig.apr);
  if (entries.length === 0) return { ...base, model: "bandit" };
  
  // Find best performing protocol
  const bestProto = entries.reduce((best, [proto, apr]) => 
    apr > best.apr ? { proto, apr } : best, 
    { proto: entries[0][0], apr: entries[0][1] }
  );
  
  // Apply exploration vs exploitation
  const explorationRate = 0.1;
  const shouldExplore = Math.random() < explorationRate;
  
  if (!shouldExplore) {
    // Exploitation: boost best performer
    const bestLeg = base.legs.find(l => l.proto === bestProto.proto);
    if (bestLeg) {
      const boost = Math.min(2000, bestLeg.target_bps * 0.3); // 30% boost, max 20%
      bestLeg.target_bps = Math.min(7000, bestLeg.target_bps + boost);
      
      // Redistribute excess from other legs
      const excess = base.legs.reduce((sum, l) => sum + l.target_bps, 0) - 10000;
      if (excess > 0) {
        const otherLegs = base.legs.filter(l => l.proto !== bestProto.proto);
        const reduction = Math.floor(excess / otherLegs.length);
        otherLegs.forEach(leg => {
          leg.target_bps = Math.max(0, leg.target_bps - reduction);
        });
      }
    }
  }
  
  // Ensure total still equals 10000
  const totalBps = base.legs.reduce((a, l) => a + l.target_bps, 0);
  const diff = 10000 - totalBps;
  if (diff !== 0 && base.legs.length > 0) {
    base.legs[0].target_bps = Math.max(0, base.legs[0].target_bps + diff);
  }
  
  return { 
    ...base, 
    model: "bandit",
    confidence: Math.max(base.confidence - 10, 30) // slightly less confident due to exploration
  };
}