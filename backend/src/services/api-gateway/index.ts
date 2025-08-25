import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import helmet from 'helmet';
import { config } from '../../config';
import { logger } from '../../lib/logger';
import { healthRoutes } from './routes/health';
import { transfersRoutes } from './routes/transfers';
import { vaultsRoutes } from './routes/vaults';
import { groupsRoutes } from './routes/groups';
import { potsRoutes } from './routes/pots';
import { escrowRoutes } from './routes/escrow';
import { marketRoutes } from './routes/market';
import { walletRoutes } from './routes/wallet';
import { userRoutes } from './routes/user';

export class ApiGateway {
  private fastify: any;

  constructor() {
    this.fastify = Fastify({
      logger: false, // We'll use our custom logger
      trustProxy: true,
      keepAliveTimeout: 5000,
      connectionTimeout: 5000,
      bodyLimit: 1048576, // 1MB
      maxParamLength: 100,
    });
  }

  async start(): Promise<void> {
    try {
      // Security middleware - disabled for development
      // await this.fastify.register(helmet);

      // CORS - optimized for development
      await this.fastify.register(cors, {
        origin: [
          'http://localhost:3000', 
          'http://localhost:3001', 
          'http://localhost:5173',
          'http://localhost:5174',
          'http://localhost:5175', // Added for current frontend port
          'http://127.0.0.1:3000',
          'http://127.0.0.1:5173',
          'http://127.0.0.1:5174',
          'http://127.0.0.1:5175' // Added for current frontend port
        ],
        credentials: true,
        maxAge: 86400, // Cache preflight for 24 hours
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
      });

      // Rate limiting
      await this.fastify.register(rateLimit, {
        max: 100,
        timeWindow: '1 minute',
        allowList: ['127.0.0.1', '::1'],
        errorResponseBuilder: (_request: any, context: any) => ({
          code: 429,
          error: 'Too Many Requests',
          message: `Rate limit exceeded, retry in ${context.after}`,
          retryAfter: context.after,
        }),
      });

      // Global preHandler for logging
      this.fastify.addHook('preHandler', async (request: any, reply: any) => {
        logger.info(`${request.method} ${request.url}`, {
          ip: request.ip,
          userAgent: request.headers['user-agent'],
        });
      });

      // Routes
      await this.fastify.register(healthRoutes, { prefix: '/health' });
      await this.fastify.register(transfersRoutes, { prefix: '/api/v1/transfers' });
      await this.fastify.register(vaultsRoutes, { prefix: '/api/v1/vaults' });
      await this.fastify.register(groupsRoutes, { prefix: '/api/v1/groups' });
      await this.fastify.register(potsRoutes, { prefix: '/api/v1/pots' });
      await this.fastify.register(escrowRoutes, { prefix: '/api/v1/escrow' });
      await this.fastify.register(marketRoutes, { prefix: '/api/v1/market' });
      await this.fastify.register(walletRoutes, { prefix: '/api/v1/wallet' });
      await this.fastify.register(userRoutes, { prefix: '/api/v1/user' });

      // Quick test route
      this.fastify.get('/', async (_request: any, reply: any) => {
        return reply.send({
          message: 'SeiMoney Backend API',
          version: '1.0.0',
          status: 'running',
          timestamp: new Date().toISOString(),
          endpoints: {
            health: '/health',
            transfers: '/api/v1/transfers',
            vaults: '/api/v1/vaults',
            groups: '/api/v1/groups',
            pots: '/api/v1/pots',
            escrow: '/api/v1/escrow',
            market: '/api/v1/market',
            wallet: '/api/v1/wallet',
            user: '/api/v1/user',
          }
        });
      });

      // Global error handler
      this.fastify.setErrorHandler((error: any, request: any, reply: any) => {
        logger.error('API Error:', {
          error: error.message,
          stack: error.stack,
          url: request.url,
          method: request.method,
        });

        return reply.status(500).send({
          ok: false,
          error: 'Internal Server Error',
        });
      });

      // Start server
      await this.fastify.listen({
        port: config.server.port,
        host: config.server.host,
      });

      logger.info(`API Gateway started on ${config.server.host}:${config.server.port}`);
      logger.info('Registered routes: health, transfers, vaults, groups, pots, escrow, market, wallet, user');
    } catch (error) {
      logger.error('Failed to start API Gateway:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      await this.fastify.close();
      logger.info('API Gateway stopped');
    } catch (error) {
      logger.error('Error stopping API Gateway:', error);
    }
  }

  getInstance(): any {
    return this.fastify;
  }
}
