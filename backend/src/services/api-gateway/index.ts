import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from '../../config';
import { logger } from '../../lib/logger';
import { healthRoutes } from './routes/health';

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
      // CORS - optimized for development
      await this.fastify.register(cors, {
        origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
        credentials: true,
        maxAge: 86400, // Cache preflight for 24 hours
      });

      // Routes - only health for now
      await this.fastify.register(healthRoutes, { prefix: '/health' });

      // Quick test route
      this.fastify.get('/', async (_request: any, reply: any) => {
        return reply.send({
          message: 'SeiMoney Backend API',
          version: '1.0.0',
          status: 'running',
          timestamp: new Date().toISOString(),
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
