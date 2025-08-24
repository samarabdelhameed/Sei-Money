import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getSdk } from '../../lib/sdk-simple';
import { rateLimit } from '../middleware/rateLimit';
import { auth } from '../middleware/auth';
import { logger } from '../../lib/logger';

export async function vaultsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', rateLimit());
  app.addHook('preHandler', auth());

  // GET /vaults/:id
  app.get('/:id', async (req, reply) => {
    const params = z.object({ id: z.string().regex(/^\d+$/) }).parse(req.params);

    try {
      const sdk = await getSdk();
      const vault = await sdk.getVault(params.id);

      if (!vault) {
        return reply.status(404).send({ error: 'Vault not found' });
      }

      return reply.send({ ok: true, vault });
    } catch (error) {
      logger.error('Error getting vault:', error);
      return reply.status(500).send({ error: 'Failed to get vault' });
    }
  });

  // GET /vaults
  app.get('/', async (req, reply) => {
    const query = z.object({
      strategy: z.string().optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0)
    }).parse(req.query);

    try {
      const sdk = await getSdk();
      const vaults = await sdk.listVaults();

      // Apply filters
      let filteredVaults = vaults;
      if (query.strategy) {
        filteredVaults = vaults.filter((v: any) => v.strategy === query.strategy);
      }

      // Apply pagination
      const paginatedVaults = filteredVaults.slice(query.offset, query.offset + query.limit);

      return reply.send({ 
        ok: true, 
        vaults: paginatedVaults, 
        total: filteredVaults.length,
        page: Math.floor(query.offset / query.limit) + 1,
        totalPages: Math.ceil(filteredVaults.length / query.limit)
      });
    } catch (error) {
      logger.error('Error listing vaults:', error);
      return reply.status(500).send({ error: 'Failed to list vaults' });
    }
  });

  // GET /vaults/:id/position?addr=
  app.get('/:id/position', async (req, reply) => {
    const params = z.object({ id: z.string().regex(/^\d+$/) }).parse(req.params);
    const query = z.object({ addr: z.string() }).parse(req.query);

    try {
      // For now, return mock position data
      // In the future, this would query the vault contract for actual position data
      const position = {
        vaultId: params.id,
        address: query.addr,
        shares: '0',
        percentage: '0',
        value: '0'
      };

      return reply.send({ ok: true, position });
    } catch (error) {
      logger.error('Error getting position:', error);
      return reply.status(500).send({ error: 'Failed to get position' });
    }
  });

  // Health check endpoint
  app.get('/health', async (req, reply) => {
    try {
      const sdk = await getSdk();
      const health = await sdk.healthCheck();
      
      return reply.send({
        ok: true,
        service: 'vaults',
        healthy: health.healthy,
        contracts: health.contracts,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      logger.error('Vaults health check failed:', error);
      return reply.status(500).send({
        ok: false,
        service: 'vaults',
        healthy: false,
        error: error.message
      });
    }
  });
}
