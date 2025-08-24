import type { Signals, AllocationPlan, RebalanceRequest } from "./types";
import { rl } from "./alphaModels/rl";
import { markowitz } from "./alphaModels/markowitz";
import { bandit } from "./alphaModels/bandit";
import { cfg } from "./config";

export function optimize(sig: Signals, model: string = "rl", constraints?: RebalanceRequest["constraints"]): AllocationPlan {
  // Select the appropriate model
  let plan: AllocationPlan;
  
  switch (model) {
    case "markowitz":
      plan = markowitz(sig);
      break;
    case "bandit":
      plan = bandit(sig);
      break;
    case "rl":
    default:
      plan = rl(sig);
      break;
  }
  
  // Apply constraints
  const maxSingleAllocation = constraints?.maxSingleAllocation || cfg.constraints.maxSingleAllocation;
  const minDiversification = constraints?.minDiversification || cfg.constraints.minDiversification;
  
  // Enforce maximum single allocation
  let totalReduction = 0;
  plan.legs.forEach(leg => {
    if (leg.target_bps > maxSingleAllocation) {
      totalReduction += leg.target_bps - maxSingleAllocation;
      leg.target_bps = maxSingleAllocation;
    }
  });
  
  // Redistribute reduced allocation to other legs
  if (totalReduction > 0) {
    const eligibleLegs = plan.legs.filter(l => l.target_bps < maxSingleAllocation);
    if (eligibleLegs.length > 0) {
      const redistributionPerLeg = Math.floor(totalReduction / eligibleLegs.length);
      let remainder = totalReduction % eligibleLegs.length;
      
      eligibleLegs.forEach(leg => {
        const canAdd = Math.min(redistributionPerLeg, maxSingleAllocation - leg.target_bps);
        leg.target_bps += canAdd;
        if (remainder > 0 && leg.target_bps < maxSingleAllocation) {
          leg.target_bps += 1;
          remainder--;
        }
      });
    }
  }
  
  // Enforce minimum diversification
  if (plan.legs.length < minDiversification) {
    // Add protocols with minimal allocation if available
    const allProtocols: (keyof typeof sig.apr)[] = ["Staking", "Lending", "LP", "PerpsHedge"];
    const usedProtocols = new Set(plan.legs.map(l => l.proto));
    const unusedProtocols = allProtocols.filter(p => !usedProtocols.has(p) && sig.apr[p] > 0);
    
    while (plan.legs.length < minDiversification && unusedProtocols.length > 0) {
      const proto = unusedProtocols.shift()!;
      plan.legs.push({ proto, target_bps: 100 }); // minimal 1% allocation
    }
  }
  
  // Final normalization to ensure total = 10000
  const currentTotal = plan.legs.reduce((sum, leg) => sum + leg.target_bps, 0);
  if (currentTotal !== 10000 && plan.legs.length > 0) {
    const diff = 10000 - currentTotal;
    // Distribute difference proportionally
    plan.legs.forEach((leg, index) => {
      const proportion = leg.target_bps / currentTotal;
      const adjustment = Math.round(diff * proportion);
      leg.target_bps += adjustment;
      
      // Handle rounding errors on the first leg
      if (index === 0) {
        const finalTotal = plan.legs.reduce((sum, l) => sum + l.target_bps, 0);
        leg.target_bps += 10000 - finalTotal;
      }
    });
  }
  
  // Remove legs with zero allocation
  plan.legs = plan.legs.filter(leg => leg.target_bps > 0);
  
  // Update total and confidence based on constraints applied
  plan.totalBps = plan.legs.reduce((sum, leg) => sum + leg.target_bps, 0);
  
  // Adjust confidence based on how much we had to constrain the original plan
  if (totalReduction > 0) {
    plan.confidence = Math.max(plan.confidence - 15, 20);
  }
  
  return plan;
}