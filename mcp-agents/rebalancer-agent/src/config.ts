export const cfg = {
  server: {
    port: parseInt(process.env.REBALANCER_AGENT_PORT || "7003"),
    host: "0.0.0.0",
  },
  constraints: {
    maxSingleAllocation: 7000, // 70% max in single protocol
    minDiversification: 2,     // at least 2 protocols
    defaultRiskTolerance: 50,  // moderate risk
  },
  models: {
    markowitz: {
      riskAversion: 0.5,
      lookbackDays: 30,
    },
    bandit: {
      explorationRate: 0.1,
      decayFactor: 0.95,
    },
    rl: {
      learningRate: 0.01,
      discountFactor: 0.99,
    },
  },
};