export const cfg = {
  weights: {
    reputation: 0.45,
    anomaly: 0.35,
    velocity: 0.20,
  },
  thresholds: {
    allow: 25,
    hold: 50,
    escalate: 70,
    deny: 85,
  },
  server: {
    port: parseInt(process.env.RISK_AGENT_PORT || "7001"),
    host: "0.0.0.0",
  },
};