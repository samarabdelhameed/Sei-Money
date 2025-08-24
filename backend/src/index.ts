import { config, validateConfig } from './config';
import { logger } from './lib/logger';
import { ApiGateway } from './services/api-gateway';

class SeiMoneyBackend {
  private apiGateway: ApiGateway;

  constructor() {
    this.apiGateway = new ApiGateway();
  }

  async start(): Promise<void> {
    try {
      logger.info('Starting SeiMoney Backend...');

      // Validate configuration
      validateConfig();
      logger.info('Configuration validated successfully');

      // Start only API Gateway for now
      await this.apiGateway.start();

      logger.info('API Gateway started successfully');
      logger.info(`Backend running on ${config.server.host}:${config.server.port}`);

      // Setup graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('Failed to start backend:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);

      try {
        // Stop API Gateway
        await this.apiGateway.stop();

        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    // Handle different shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2')); // For nodemon

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection:', { reason, promise });
      shutdown('unhandledRejection');
    });
  }

  async stop(): Promise<void> {
    try {
      logger.info('Stopping SeiMoney Backend...');
      await this.apiGateway.stop();
      logger.info('Backend stopped');
    } catch (error) {
      logger.error('Error stopping backend:', error);
    }
  }
}

// Start the backend
const backend = new SeiMoneyBackend();

// Handle process termination
process.on('SIGTERM', () => backend.stop());
process.on('SIGINT', () => backend.stop());

// Start the backend
backend.start().catch((error) => {
  logger.error('Failed to start backend:', error);
  process.exit(1);
});
