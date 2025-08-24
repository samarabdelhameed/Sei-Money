import Fastify from "fastify";
import cors from "@fastify/cors";
import { cfg } from "./config";
import { plan } from "./planner";
import { run, runBatch } from "./run";
import type { ScheduleRequest } from "./types";

const app = Fastify({ logger: true });

// Register CORS
app.register(cors, {
  origin: true,
  credentials: true,
});

// Mock SDK clients - replace with actual SDK initialization
const mockClients = {
  vaults: {
    async harvest(vaultId: number) {
      console.log(`🌾 Harvesting vault ${vaultId}`);
      return { success: true, vaultId, action: "harvest" };
    },
    async rebalance(vaultId: number, plan: any) {
      console.log(`⚖️  Rebalancing vault ${vaultId}`, plan);
      return { success: true, vaultId, action: "rebalance", plan };
    }
  },
  payments: {
    async refundTransfer(transferId: number) {
      console.log(`💸 Refunding transfer ${transferId}`);
      return { success: true, transferId, action: "refund" };
    }
  },
  groups: {
    async distribute(groupId: number) {
      console.log(`🎯 Distributing to group ${groupId}`);
      return { success: true, groupId, action: "distribute" };
    }
  }
};

// Health check
app.get("/health", async () => ({ 
  ok: true, 
  service: "scheduler-agent",
  timestamp: new Date().toISOString()
}));

// Get scheduling plan without execution
app.post("/schedule/plan", async (req, reply) => {
  try {
    const request = req.body as ScheduleRequest;
    const schedulePlan = await plan(request);
    
    return reply.send({
      request,
      plan: schedulePlan,
      optimalTime: new Date(Date.now() + schedulePlan.etaSec * 1000).toISOString()
    });
  } catch (error) {
    app.log.error(error);
    return reply.code(500).send({ error: "planning-failed" });
  }
});

// Schedule and execute operation
app.post("/schedule/execute", async (req, reply) => {
  try {
    const request = req.body as ScheduleRequest;
    
    // Execute in background
    run(request, mockClients)
      .then(result => {
        console.log(`✅ Scheduled execution completed:`, result);
      })
      .catch(error => {
        console.error(`❌ Scheduled execution failed:`, error);
      });
    
    const schedulePlan = await plan(request);
    
    return reply.send({
      scheduled: true,
      request,
      plan: schedulePlan,
      executionTime: new Date(Date.now() + schedulePlan.etaSec * 1000).toISOString()
    });
  } catch (error) {
    app.log.error(error);
    return reply.code(500).send({ error: "scheduling-failed" });
  }
});

// Batch scheduling
app.post("/schedule/batch", async (req, reply) => {
  try {
    const requests = req.body as ScheduleRequest[];
    
    // Get plans for all requests
    const plans = await Promise.all(
      requests.map(async (request) => ({
        request,
        plan: await plan(request),
      }))
    );
    
    // Execute batch in background
    runBatch(requests, mockClients)
      .then(results => {
        console.log(`✅ Batch execution completed:`, results);
      })
      .catch(error => {
        console.error(`❌ Batch execution failed:`, error);
      });
    
    return reply.send({
      scheduled: true,
      count: requests.length,
      plans: plans.map(p => ({
        ...p,
        executionTime: new Date(Date.now() + p.plan.etaSec * 1000).toISOString()
      }))
    });
  } catch (error) {
    app.log.error(error);
    return reply.code(500).send({ error: "batch-scheduling-failed" });
  }
});

// Get current gas information
app.get("/gas/info", async (req, reply) => {
  try {
    // Mock gas info - replace with actual gas oracle
    const gasInfo = {
      current: 0.025,
      average24h: 0.03,
      trend: "stable" as const,
      thresholds: cfg.gas.thresholds,
      timestamp: new Date().toISOString()
    };
    
    return reply.send(gasInfo);
  } catch (error) {
    app.log.error(error);
    return reply.code(500).send({ error: "gas-info-unavailable" });
  }
});

// Start server
const start = async () => {
  try {
    await app.listen({ 
      port: cfg.server.port, 
      host: cfg.server.host 
    });
    console.log(`⏰ Scheduler Agent running on http://${cfg.server.host}:${cfg.server.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();