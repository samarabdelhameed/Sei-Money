import Fastify from "fastify";
import cors from "@fastify/cors";
import { cfg } from "./config";
import { addressReputation } from "./policies/addressReputation";
import { amountAnomaly } from "./policies/amountAnomaly";
import { velocity } from "./policies/velocity";
import type { RiskInput, RiskScore } from "./types";
import { hmac } from "./sign";

const app = Fastify({ logger: true });
const SECRET = process.env.INTERNAL_SHARED_SECRET!;

// Register CORS
app.register(cors, {
  origin: true,
  credentials: true,
});

function combine(scores: number[], weights: number[]): number {
  const s = scores.reduce((acc, v, i) => acc + v * weights[i], 0);
  const denom = weights.reduce((a,b)=>a+b,0);
  return Math.round(s/denom);
}

function decide(s: number): RiskScore["recommendation"] {
  if (s >= cfg.thresholds.deny) return "deny";
  if (s >= cfg.thresholds.escalate) return "escalate";
  if (s >= cfg.thresholds.hold) return "hold";
  return "allow";
}

// Health check
app.get("/health", async () => ({ 
  ok: true, 
  service: "risk-agent",
  timestamp: new Date().toISOString()
}));

// Main risk scoring endpoint
app.post("/risk/score", async (req, reply) => {
  try {
    const input = req.body as RiskInput;
    
    // Run all policies in parallel with real blockchain data
    const [rep, amt, vel] = await Promise.all([
      addressReputation(input.from),
      amountAnomaly(input.amount, input.from),
      velocity(input.context, input.from)
    ]);

    const score = combine(
      [rep.score, amt.score, vel.score],
      [cfg.weights.reputation, cfg.weights.anomaly, cfg.weights.velocity]
    );

    const rec = decide(score);
    
    const result: RiskScore = { 
      score, 
      reasons: [rep.reason, amt.reason, vel.reason], 
      recommendation: rec 
    };

    // Log the analysis for monitoring
    app.log.info({
      address: input.from,
      action: input.action,
      amount: input.amount,
      scores: { reputation: rep.score, anomaly: amt.score, velocity: vel.score },
      finalScore: score,
      recommendation: rec
    }, 'Risk analysis completed');

    // Optional: send decision to API with HMAC signature
    if (process.env.API_URL && SECRET) {
      const sig = hmac(result, SECRET);
      // Uncomment to enable API notifications
      // fetch(`${process.env.API_URL}/internal/risk-hook`, { 
      //   method: "POST", 
      //   headers: { 
      //     "x-internal-signature": sig,
      //     "content-type": "application/json"
      //   }, 
      //   body: JSON.stringify(result) 
      // }).catch(console.error);
    }

    return reply.send(result);
  } catch (error) {
    app.log.error(error);
    return reply.code(500).send({ error: "internal-server-error" });
  }
});

// Batch risk scoring
app.post("/risk/batch", async (req, reply) => {
  try {
    const inputs = req.body as RiskInput[];
    const results = await Promise.all(
      inputs.map(async (input) => {
        const [rep, amt, vel] = await Promise.all([
          addressReputation(input.from),
          amountAnomaly(input.amount, input.from),
          velocity(input.context, input.from)
        ]);

        const score = combine(
          [rep.score, amt.score, vel.score],
          [cfg.weights.reputation, cfg.weights.anomaly, cfg.weights.velocity]
        );

        return {
          input,
          result: {
            score,
            reasons: [rep.reason, amt.reason, vel.reason],
            recommendation: decide(score)
          }
        };
      })
    );

    app.log.info({ batchSize: inputs.length }, 'Batch risk analysis completed');
    return reply.send(results);
  } catch (error) {
    app.log.error(error);
    return reply.code(500).send({ error: "batch-processing-failed" });
  }
});

// Start server
const start = async () => {
  try {
    await app.listen({ 
      port: cfg.server.port, 
      host: cfg.server.host 
    });
    console.log(`🛡️  Risk Agent running on http://${cfg.server.host}:${cfg.server.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();