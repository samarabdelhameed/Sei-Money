import { FastifyInstance } from 'fastify';
import { SDKFactory } from '../../../lib/sdk-factory';
import { getRealDataService } from '../../../services/realDataService';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  // Basic health check
  app.get('/health', async (req, reply) => {
    reply.send({
      ok: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'seimoney-backend',
    });
  });

  // Enhanced health check with real contract data
  app.get('/health/contracts', async (req, reply) => {
    try {
      const health = await SDKFactory.healthCheck();
      
      reply.send({
        ok: health.readOnlySDK && health.enhancedSDK,
        data: {
          readOnlySDK: health.readOnlySDK,
          enhancedSDK: health.enhancedSDK,
          contracts: health.contractsHealth,
          timestamp: new Date().toISOString(),
        }
      });
    } catch (error) {
      reply.status(500).send({
        ok: false,
        error: 'Health check failed',
        details: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Wallet balance endpoint
  app.get('/health/wallet/:address', async (req, reply) => {
    try {
      const { address } = req.params as { address: string };
      const { getWalletService } = await import('../../../services/walletService');
      const walletService = getWalletService();
      
      const validation = walletService.validateWalletAddress(address);
      if (!validation.valid) {
        reply.status(400).send({
          ok: false,
          error: 'Invalid wallet address',
          details: validation.error,
        });
        return;
      }
      
      const balance = await walletService.getWalletBalance(address);
      
      reply.send({
        ok: true,
        data: balance
      });
    } catch (error) {
      reply.status(500).send({
        ok: false,
        error: 'Failed to get wallet balance',
        details: (error as Error).message,
      });
    }
  });

  // Network status endpoint
  app.get('/health/network', async (req, reply) => {
    try {
      const { getNetworkService } = await import('../../../services/networkService');
      const networkService = getNetworkService();
      
      const networkHealth = await networkService.getNetworkHealth();
      
      reply.send({
        ok: networkHealth.healthy,
        data: networkHealth
      });
    } catch (error) {
      reply.status(500).send({
        ok: false,
        error: 'Failed to get network status',
        details: (error as Error).message,
      });
    }
  });

  // Real data service health check
  app.get('/health/data-service', async (req, reply) => {
    try {
      const realDataService = await getRealDataService();
      const systemHealth = await realDataService.getSystemHealth();
      
      reply.send({
        ok: systemHealth.healthy,
        data: {
          ...systemHealth,
          timestamp: new Date().toISOString(),
        }
      });
    } catch (error) {
      reply.status(500).send({
        ok: false,
        error: 'Data service health check failed',
        details: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Market stats endpoint using real data
  app.get('/health/market-stats', async (req, reply) => {
    try {
      const realDataService = await getRealDataService();
      const marketStats = await realDataService.getMarketStats();
      
      reply.send({
        ok: true,
        data: marketStats
      });
    } catch (error) {
      reply.status(500).send({
        ok: false,
        error: 'Failed to fetch market stats',
        details: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
    }
  });
}