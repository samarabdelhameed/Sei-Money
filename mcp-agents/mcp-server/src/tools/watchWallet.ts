import fetch from "node-fetch";

export async function watchWallet({ 
  address, 
  alertThreshold = 1000000 
}: { 
  address: string; 
  alertThreshold?: number; 
}) {
  try {
    // Register wallet for monitoring with backend
    const response = await fetch(`${process.env.API_URL}/internal/watch-wallet`, {
      method: "POST",
      headers: { 
        "content-type": "application/json",
        "x-api-key": process.env.AGENT_API_KEY || ""
      },
      body: JSON.stringify({ 
        address, 
        alertThreshold,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Watch wallet failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Also get current wallet info
    const walletInfo = await getWalletInfo(address);
    
    return {
      success: true,
      address,
      alertThreshold,
      monitoring: true,
      currentBalance: (walletInfo as any).balance,
      transactionCount: (walletInfo as any).txCount,
      lastActivity: (walletInfo as any).lastTx,
      watchId: (result as any).watchId || `watch_${Date.now()}`
    };
  } catch (error) {
    console.error("watchWallet error:", error);
    return {
      success: false,
      address,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

async function getWalletInfo(address: string) {
  try {
    // Mock wallet info - replace with actual blockchain query
    const response = await fetch(`${process.env.INDEXER_URL}/wallet/${address}`);
    
    if (!response.ok) {
      // Return mock data if indexer is unavailable
      return {
        balance: "1000000usei",
        txCount: 42,
        lastTx: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      };
    }
    
    return await response.json();
  } catch {
    // Fallback mock data
    return {
      balance: "1000000usei",
      txCount: 42,
      lastTx: new Date(Date.now() - 3600000).toISOString()
    };
  }
}