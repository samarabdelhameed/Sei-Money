import Fastify from "fastify";
import cors from "@fastify/cors";
import { tools, toolMetadata, type ToolName } from "./tools";

const app = Fastify({ logger: true });
const PORT = parseInt(process.env.MCP_SERVER_PORT || "7100");

// Register CORS
app.register(cors, {
  origin: true,
  credentials: true,
});

// Health check
app.get("/health", async () => ({ 
  ok: true, 
  service: "mcp-server",
  availableTools: Object.keys(tools),
  timestamp: new Date().toISOString()
}));

// List available tools (MCP standard)
app.get("/tools", async () => ({
  tools: Object.entries(toolMetadata).map(([name, meta]) => ({
    name,
    description: meta.description,
    requiredParams: meta.requiredParams,
    optionalParams: meta.optionalParams
  }))
}));

// Execute MCP tool (standard endpoint)
app.post("/mcp/tools/:name", async (req, reply) => {
  try {
    const { name } = req.params as { name: string };
    const body = (req.body ?? {}) as any;
    
    if (!tools[name as ToolName]) {
      return reply.code(404).send({ 
        error: "tool-not-found",
        available: Object.keys(tools)
      });
    }
    
    console.log(`🔧 Executing MCP tool: ${name}`, body);
    
    const result = await tools[name as ToolName](body);
    
    return reply.send({
      tool: name,
      input: body,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    app.log.error(error);
    return reply.code(500).send({ 
      error: "tool-execution-failed",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Batch tool execution
app.post("/mcp/batch", async (req, reply) => {
  try {
    const requests = req.body as Array<{ tool: string; params: any }>;
    
    const results = await Promise.allSettled(
      requests.map(async ({ tool, params }) => {
        if (!tools[tool as ToolName]) {
          throw new Error(`Tool not found: ${tool}`);
        }
        
        const result = await tools[tool as ToolName](params);
        return { tool, params, result };
      })
    );
    
    return reply.send({
      batch: true,
      results: results.map((result, index) => ({
        request: requests[index],
        success: result.status === "fulfilled",
        result: result.status === "fulfilled" ? result.value : null,
        error: result.status === "rejected" ? result.reason?.message : null
      })),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    app.log.error(error);
    return reply.code(500).send({ error: "batch-execution-failed" });
  }
});

// Tool-specific endpoints for direct HTTP access
app.post("/tools/watch-wallet", async (req, reply) => {
  const result = await tools.watchWallet(req.body as any);
  return reply.send(result);
});

app.post("/tools/track-memecoin", async (req, reply) => {
  const result = await tools.trackMemeCoin(req.body as any);
  return reply.send(result);
});

app.post("/tools/track-nft", async (req, reply) => {
  const result = await tools.trackNftLifetime(req.body as any);
  return reply.send(result);
});

app.post("/tools/rebalance-whatif", async (req, reply) => {
  const result = await tools.rebalanceWhatIf(req.body as any);
  return reply.send(result);
});

// MCP server info endpoint
app.get("/mcp/info", async () => ({
  name: "seimoney-mcp",
  version: "1.0.0",
  description: "SeiMoney MCP tools for DeFi operations",
  capabilities: {
    tools: true,
    resources: false,
    prompts: false
  },
  tools: Object.keys(tools),
  endpoints: {
    health: "/health",
    tools: "/tools",
    execute: "/mcp/tools/:name",
    batch: "/mcp/batch"
  }
}));

// Start server
const start = async () => {
  try {
    await app.listen({ 
      port: PORT, 
      host: "0.0.0.0" 
    });
    console.log(`🧰 MCP Server running on http://0.0.0.0:${PORT}`);
    console.log(`📋 Available tools: ${Object.keys(tools).join(", ")}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();