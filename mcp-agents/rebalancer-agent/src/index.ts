import Fastify from "fastify";
import cors from "@fastify/cors";
import { cfg } from "./config";
import { optimize } from "./optimizer";
import { runRebalance, runBatchRebalance, dryRunRebalance } from "./run";
import type { RebalanceRequest, Signals } from "./types";

const app = Fastify({ logger: true });

// Register CORS
app.register(cors, {
  origin: true,
  credentials: true,
});

// Health check
app.get("/health", async () => ({ 
  ok: true, 
  service: "rebalancer-agent",
  timestamp: new Date().toISOString()
}));

// Generate allocation plan without execution
app.post("/rebalance/plan", async (req, reply) => {
  try {
    const { signals, model = "rl", constraints } = req.body as {
      signals: Signals;
      model?: string;
      constraints?: RebalanceRequest["constraints"];
    };
    
    const plan = optimize(signals, model, constraints);
    
    return reply.send({
      plan,
      model,
      signals,
      constraints,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    app.log.error(error);
    return reply.code(500).send({ error: "plan-generation-failed" });
  }
});

// Execute rebalance
app.post("/rebalance/execute", async (req, reply) => {
  try {
    const request = req.body as RebalanceRequest;
    const result = await runRebalance(request);
    
    return reply.send(result);
  } catch (error) {
    app.log.error(error);
    return reply.code(500).send({ error: "rebalance-execution-failed" });
  }
});

// Dry run rebalance
app.post("/rebalance/dry-run", async (req, reply) => {
  try {
    const request = req.body as RebalanceRequest;
    const result = await dryRunRebalance(request);
    
    return reply.send(result);
  } catch (error) {
    app.log.error(error);
    return reply.code(500).send({ error: "dry-run-failed" });
  }
});

// Batch rebalance
app.post("/rebalance/batch", async (req, reply) => {
  try {
    const requests = req.body as RebalanceRequest[];
    const results = await runBatchRebalance(requests);
    
    return reply.send({
      results,
      summary: {
        total: requests.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });
  } catch (error) {
    app.log.error(error);
    return reply.code(500).send({ error: "batch-rebalance-failed" });
  }
});

// Compare different models
app.post("/rebalance/compare", async (req, reply) => {
  try {
    const { signals, constraints } = req.body as {
      signals: Signals;
      constraints?: RebalanceRequest["constraints"];
    };
    
    const models = ["markowitz", "bandit", "rl"];
    const comparisons = models.map(model => ({
      model,
      plan: optimize(signals, model, constraints)
    }));
    
    return reply.send({
      comparisons,
      signals,
      constraints,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    app.log.error(error);
    return reply.code(500).send({ error: "model-comparison-failed" });
  }
});

// Get model configurations
app.get("/models/config", async (req, reply) => {
  return reply.send({
    available: ["markowitz", "bandit", "rl"],
    default: "rl",
    configurations: cfg.models,
    constraints: cfg.constraints
  });
});

// Update model configuration (for tuning)
app.post("/models/config", async (req, reply) => {
  try {
    const { model, config } = req.body as { model: string; config: any };
    
    if (!cfg.models[model as keyof typeof cfg.models]) {
      return reply.code(400).send({ error: "unknown-model" });
    }
    
    // In production, this would persist to database
    Object.assign(cfg.models[model as keyof typeof cfg.models], config);
    
    return reply.send({
      updated: true,
      model,
      newConfig: cfg.models[model as keyof typeof cfg.models]
    });
  } catch (error) {
    app.log.error(error);
    return reply.code(500).send({ error: "config-update-failed" });
  }
});

// Start server
const start = async () => {
  try {
    await app.listen({ 
      port: cfg.server.port, 
      host: cfg.server.host 
    });
    console.log(`📈 Rebalancer Agent running on http://${cfg.server.host}:${cfg.server.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();