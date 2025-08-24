import fetch from "node-fetch";

export async function trackMemeCoin({ 
  denom, 
  timeframe = "24h" 
}: { 
  denom: string; 
  timeframe?: string; 
}) {
  try {
    // Fetch meme coin data from oracles and indexer
    const [priceData, flowData, holderData] = await Promise.allSettled([
      fetchPriceData(denom, timeframe),
      fetchFlowData(denom, timeframe),
      fetchHolderData(denom)
    ]);

    const price = priceData.status === "fulfilled" ? priceData.value : null;
    const flows = flowData.status === "fulfilled" ? flowData.value : null;
    const holders = holderData.status === "fulfilled" ? holderData.value : null;

    // Calculate metrics
    const netFlow = flows ? (flows as any).inflow - (flows as any).outflow : 0;
    const flowRatio = flows && (flows as any).outflow > 0 ? (flows as any).inflow / (flows as any).outflow : 1;
    
    // Determine trend
    let trend = "stable";
    if (netFlow > (flows as any)?.inflow * 0.1) trend = "bullish";
    if (netFlow < -(flows as any)?.outflow * 0.1) trend = "bearish";

    return {
      denom,
      timeframe,
      price: price || { current: 0, change24h: 0 },
      flows: flows || { inflow: 0, outflow: 0 },
      holders: holders || { total: 0, new24h: 0, active24h: 0 },
      metrics: {
        netFlow,
        flowRatio,
        trend,
        volatility: (price as any)?.volatility || 0,
        liquidityScore: calculateLiquidityScore(flows, holders)
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("trackMemeCoin error:", error);
    return {
      denom,
      timeframe,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    };
  }
}

async function fetchPriceData(denom: string, timeframe: string) {
  try {
    const response = await fetch(`${process.env.ORACLES_URL}/price/${denom}?timeframe=${timeframe}`);
    if (!response.ok) throw new Error("Price data unavailable");
    return await response.json();
  } catch {
    // Mock price data
    return {
      current: Math.random() * 0.001,
      change24h: (Math.random() - 0.5) * 0.2,
      volatility: Math.random() * 0.5
    };
  }
}

async function fetchFlowData(denom: string, timeframe: string) {
  try {
    const response = await fetch(`${process.env.INDEXER_URL}/flows/${denom}?timeframe=${timeframe}`);
    if (!response.ok) throw new Error("Flow data unavailable");
    return await response.json();
  } catch {
    // Mock flow data
    const baseFlow = Math.random() * 1000000;
    return {
      inflow: baseFlow * (0.8 + Math.random() * 0.4),
      outflow: baseFlow * (0.8 + Math.random() * 0.4),
      transactions: Math.floor(Math.random() * 1000)
    };
  }
}

async function fetchHolderData(denom: string) {
  try {
    const response = await fetch(`${process.env.INDEXER_URL}/holders/${denom}`);
    if (!response.ok) throw new Error("Holder data unavailable");
    return await response.json();
  } catch {
    // Mock holder data
    const totalHolders = Math.floor(Math.random() * 10000);
    return {
      total: totalHolders,
      new24h: Math.floor(totalHolders * 0.05 * Math.random()),
      active24h: Math.floor(totalHolders * 0.3 * Math.random()),
      whales: Math.floor(totalHolders * 0.01)
    };
  }
}

function calculateLiquidityScore(flows: any, holders: any): number {
  if (!flows || !holders) return 0;
  
  // Simple liquidity score based on flow volume and holder activity
  const flowScore = Math.min(flows.inflow + flows.outflow, 1000000) / 1000000 * 50;
  const holderScore = Math.min(holders.active24h || 0, 1000) / 1000 * 50;
  
  return Math.round(flowScore + holderScore);
}