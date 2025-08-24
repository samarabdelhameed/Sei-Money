// Mock optimizer function since we can't import from other agents directly
function optimize(signals: any, model: string = "rl"): any {
  const protocols = Object.keys(signals.apr);
  const totalBps = 10000;
  
  // Simple allocation based on APR
  const totalApr = Object.values(signals.apr).reduce((sum: number, apr: any) => sum + apr, 0);
  const legs = protocols.map(proto => ({
    proto,
    target_bps: Math.round((signals.apr[proto] / totalApr) * totalBps)
  }));
  
  // Ensure total equals 10000
  const currentTotal = legs.reduce((sum, leg) => sum + leg.target_bps, 0);
  if (currentTotal !== totalBps && legs.length > 0) {
    legs[0].target_bps += totalBps - currentTotal;
  }
  
  return {
    legs,
    totalBps,
    confidence: 75,
    model
  };
}

type Signals = {
  prices: Record<string, number>;
  apr: Record<string, number>;
  risk: number;
  volatility?: Record<string, number>;
  liquidity?: Record<string, number>;
};

export async function rebalanceWhatIf({ 
  signals, 
  model = "rl" 
}: { 
  signals: Signals; 
  model?: string; 
}) {
  try {
    // Validate signals
    if (!signals.prices || !signals.apr || typeof signals.risk !== "number") {
      throw new Error("Invalid signals: must include prices, apr, and risk");
    }

    // Generate allocation plan using the rebalancer optimizer
    const plan = optimize(signals, model);
    
    // Calculate additional what-if metrics
    const currentValue = 1000000; // Mock current portfolio value
    const projectedReturns = calculateProjectedReturns(plan, signals, currentValue);
    const riskMetrics = calculateRiskMetrics(plan, signals);
    
    return {
      scenario: {
        model,
        signals,
        portfolioValue: currentValue
      },
      allocation: {
        plan: plan.legs,
        totalBps: plan.totalBps,
        confidence: plan.confidence
      },
      projections: {
        ...projectedReturns,
        timeHorizon: "30d"
      },
      risk: riskMetrics,
      comparison: await generateComparison(signals),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("rebalanceWhatIf error:", error);
    return {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    };
  }
}

function calculateProjectedReturns(plan: any, signals: Signals, portfolioValue: number) {
  let weightedApr = 0;
  let projectedValue = portfolioValue;
  
  plan.legs.forEach((leg: any) => {
    const weight = leg.target_bps / 10000;
    const apr = signals.apr[leg.proto] || 0;
    weightedApr += apr * weight;
  });
  
  // Project 30-day returns (simplified)
  const monthlyReturn = weightedApr / 12;
  projectedValue = portfolioValue * (1 + monthlyReturn);
  
  return {
    weightedApr: Math.round(weightedApr * 10000) / 100, // Convert to percentage
    projectedValue: Math.round(projectedValue),
    expectedGain: Math.round(projectedValue - portfolioValue),
    monthlyReturn: Math.round(monthlyReturn * 10000) / 100
  };
}

function calculateRiskMetrics(plan: any, signals: Signals) {
  // Calculate portfolio risk based on allocation and individual protocol risks
  let portfolioRisk = 0;
  let diversificationScore = 0;
  
  // Weighted risk calculation
  plan.legs.forEach((leg: any) => {
    const weight = leg.target_bps / 10000;
    const protocolRisk = getProtocolRisk(leg.proto);
    portfolioRisk += protocolRisk * weight;
  });
  
  // Diversification score (higher is better)
  const numProtocols = plan.legs.length;
  const maxAllocation = Math.max(...plan.legs.map((l: any) => l.target_bps));
  diversificationScore = Math.min(100, (numProtocols * 25) - (maxAllocation / 100));
  
  return {
    portfolioRisk: Math.round(portfolioRisk),
    diversificationScore: Math.round(diversificationScore),
    riskLevel: portfolioRisk < 30 ? "low" : portfolioRisk < 60 ? "medium" : "high",
    maxDrawdown: Math.round(portfolioRisk * 0.8), // Simplified max drawdown estimate
    volatility: Math.round(portfolioRisk * 1.2) // Simplified volatility estimate
  };
}

function getProtocolRisk(proto: string): number {
  // Risk scores for different protocols (0-100)
  const riskMap: Record<string, number> = {
    "Staking": 20,     // Low risk
    "Lending": 35,     // Medium-low risk
    "LP": 55,          // Medium-high risk
    "PerpsHedge": 70   // High risk
  };
  
  return riskMap[proto] || 50;
}

async function generateComparison(signals: Signals) {
  // Compare all three models
  const models = ["markowitz", "bandit", "rl"];
  const comparisons = models.map(model => {
    const plan = optimize(signals, model);
    const projectedReturns = calculateProjectedReturns(plan, signals, 1000000);
    const riskMetrics = calculateRiskMetrics(plan, signals);
    
    return {
      model,
      allocation: plan.legs,
      confidence: plan.confidence,
      projectedApr: projectedReturns.weightedApr,
      riskScore: riskMetrics.portfolioRisk,
      diversification: riskMetrics.diversificationScore
    };
  });
  
  // Find best model based on risk-adjusted returns
  const bestModel = comparisons.reduce((best, current) => {
    const bestScore = best.projectedApr / (best.riskScore + 1);
    const currentScore = current.projectedApr / (current.riskScore + 1);
    return currentScore > bestScore ? current : best;
  });
  
  return {
    models: comparisons,
    recommended: bestModel.model,
    reasoning: `Best risk-adjusted return: ${bestModel.projectedApr}% APR with ${bestModel.riskScore} risk score`
  };
}