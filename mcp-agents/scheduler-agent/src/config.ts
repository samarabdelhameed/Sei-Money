export const cfg = {
  server: {
    port: parseInt(process.env.SCHEDULER_AGENT_PORT || "7002"),
    host: "0.0.0.0",
  },
  gas: {
    maxWaitSec: 3600, // 1 hour max wait
    thresholds: {
      low: 0.01,    // 0.01 USEI
      normal: 0.05, // 0.05 USEI  
      high: 0.1,    // 0.1 USEI
    },
  },
  urgency: {
    low: { maxDelaySec: 1800, gasMultiplier: 0.8 },
    normal: { maxDelaySec: 300, gasMultiplier: 1.0 },
    high: { maxDelaySec: 30, gasMultiplier: 1.5 },
  },
};