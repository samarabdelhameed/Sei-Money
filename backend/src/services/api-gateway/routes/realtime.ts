import { FastifyInstance } from 'fastify';
import { getRealTimeService } from '../../../services/realTimeService';
import { ApplicationCache } from '../../../services/cacheService';
import { logger } from '../../../lib/logger';

export async function realtimeRoutes(app: FastifyInstance): Promise<void> {
  
  // GET /realtime/status - Get real-time system status
  app.get('/status', async (request, reply) => {
    try {
      const realTimeService = getRealTimeService();
      const status = realTimeService.getSystemStatus();
      
      return reply.send({
        ok: true,
        status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error getting real-time status:', error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to get real-time status',
        details: (error as Error).message
      });
    }
  });

  // GET /realtime/health - Health check for real-time services
  app.get('/health', async (request, reply) => {
    try {
      const realTimeService = getRealTimeService();
      const health = await realTimeService.healthCheck();
      
      const statusCode = health.healthy ? 200 : 503;
      
      return reply.status(statusCode).send({
        ok: health.healthy,
        health,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error checking real-time health:', error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to check real-time health',
        details: (error as Error).message
      });
    }
  });

  // POST /realtime/start - Start real-time services
  app.post('/start', async (request, reply) => {
    try {
      const realTimeService = getRealTimeService();
      await realTimeService.start();
      
      logger.info('Real-time services started via API');
      
      return reply.send({
        ok: true,
        message: 'Real-time services started successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error starting real-time services:', error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to start real-time services',
        details: (error as Error).message
      });
    }
  });

  // POST /realtime/stop - Stop real-time services
  app.post('/stop', async (request, reply) => {
    try {
      const realTimeService = getRealTimeService();
      await realTimeService.stop();
      
      logger.info('Real-time services stopped via API');
      
      return reply.send({
        ok: true,
        message: 'Real-time services stopped successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error stopping real-time services:', error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to stop real-time services',
        details: (error as Error).message
      });
    }
  });

  // POST /realtime/refresh - Refresh all real-time data
  app.post('/refresh', async (request, reply) => {
    try {
      const realTimeService = getRealTimeService();
      await realTimeService.refreshAllData();
      
      logger.info('All real-time data refreshed via API');
      
      return reply.send({
        ok: true,
        message: 'All real-time data refreshed successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error refreshing real-time data:', error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to refresh real-time data',
        details: (error as Error).message
      });
    }
  });

  // GET /realtime/events - Get recent blockchain events
  app.get('/events', async (request, reply) => {
    try {
      const { limit = 50, type, contract } = request.query as {
        limit?: number;
        type?: string;
        contract?: string;
      };

      const realTimeService = getRealTimeService();
      const eventIndexer = realTimeService.getEventIndexer();
      
      let events;
      if (type) {
        events = await eventIndexer.getEventsByType(type, limit);
      } else if (contract) {
        events = await eventIndexer.getEventsByContract(contract, limit);
      } else {
        events = await eventIndexer.getRecentEvents(limit);
      }
      
      return reply.send({
        ok: true,
        events,
        count: events.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error getting blockchain events:', error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to get blockchain events',
        details: (error as Error).message
      });
    }
  });

  // GET /realtime/polling/tasks - Get polling task status
  app.get('/polling/tasks', async (request, reply) => {
    try {
      const realTimeService = getRealTimeService();
      const pollingService = realTimeService.getPollingService();
      const tasks = pollingService.getTaskStats();
      
      return reply.send({
        ok: true,
        tasks,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error getting polling tasks:', error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to get polling tasks',
        details: (error as Error).message
      });
    }
  });

  // POST /realtime/polling/tasks/:taskId/run - Run a specific polling task
  app.post('/polling/tasks/:taskId/run', async (request, reply) => {
    try {
      const { taskId } = request.params as { taskId: string };
      
      const realTimeService = getRealTimeService();
      const pollingService = realTimeService.getPollingService();
      
      const result = await pollingService.runTaskNow(taskId);
      
      logger.info(`Polling task ${taskId} executed manually via API`);
      
      return reply.send({
        ok: true,
        message: `Task ${taskId} executed successfully`,
        result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error(`Error running polling task:`, error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to run polling task',
        details: (error as Error).message
      });
    }
  });

  // POST /realtime/polling/tasks/:taskId/enable - Enable a polling task
  app.post('/polling/tasks/:taskId/enable', async (request, reply) => {
    try {
      const { taskId } = request.params as { taskId: string };
      
      const realTimeService = getRealTimeService();
      const pollingService = realTimeService.getPollingService();
      
      const success = pollingService.enableTask(taskId);
      
      if (!success) {
        return reply.status(404).send({
          ok: false,
          error: `Task not found: ${taskId}`
        });
      }
      
      logger.info(`Polling task ${taskId} enabled via API`);
      
      return reply.send({
        ok: true,
        message: `Task ${taskId} enabled successfully`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error(`Error enabling polling task:`, error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to enable polling task',
        details: (error as Error).message
      });
    }
  });

  // POST /realtime/polling/tasks/:taskId/disable - Disable a polling task
  app.post('/polling/tasks/:taskId/disable', async (request, reply) => {
    try {
      const { taskId } = request.params as { taskId: string };
      
      const realTimeService = getRealTimeService();
      const pollingService = realTimeService.getPollingService();
      
      const success = pollingService.disableTask(taskId);
      
      if (!success) {
        return reply.status(404).send({
          ok: false,
          error: `Task not found: ${taskId}`
        });
      }
      
      logger.info(`Polling task ${taskId} disabled via API`);
      
      return reply.send({
        ok: true,
        message: `Task ${taskId} disabled successfully`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error(`Error disabling polling task:`, error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to disable polling task',
        details: (error as Error).message
      });
    }
  });

  // GET /realtime/websocket/clients - Get WebSocket client information
  app.get('/websocket/clients', async (request, reply) => {
    try {
      const realTimeService = getRealTimeService();
      const webSocketService = realTimeService.getWebSocketService();
      
      const clientCount = webSocketService.getConnectedClients();
      const subscriptions = webSocketService.getClientSubscriptions();
      
      return reply.send({
        ok: true,
        clientCount,
        subscriptions,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error getting WebSocket clients:', error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to get WebSocket clients',
        details: (error as Error).message
      });
    }
  });

  // POST /realtime/websocket/broadcast - Broadcast message to WebSocket clients
  app.post('/websocket/broadcast', async (request, reply) => {
    try {
      const { channel, data } = request.body as {
        channel: string;
        data: any;
      };

      if (!channel) {
        return reply.status(400).send({
          ok: false,
          error: 'Channel is required'
        });
      }

      const realTimeService = getRealTimeService();
      const webSocketService = realTimeService.getWebSocketService();
      
      await webSocketService.broadcastToChannel(channel, data);
      
      logger.info(`Broadcast sent to channel ${channel} via API`);
      
      return reply.send({
        ok: true,
        message: `Message broadcast to channel ${channel}`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error broadcasting WebSocket message:', error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to broadcast message',
        details: (error as Error).message
      });
    }
  });

  // GET /realtime/cache/stats - Get cache statistics
  app.get('/cache/stats', async (request, reply) => {
    try {
      const caches = ApplicationCache.getAllCaches();
      const stats: Record<string, any> = {};
      
      for (const [name, cache] of caches) {
        stats[name] = cache.getStats();
      }
      
      return reply.send({
        ok: true,
        caches: stats,
        totalCaches: caches.size,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error getting cache stats:', error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to get cache stats',
        details: (error as Error).message
      });
    }
  });

  // POST /realtime/cache/clear - Clear all caches
  app.post('/cache/clear', async (request, reply) => {
    try {
      ApplicationCache.clearAllCaches();
      
      logger.info('All caches cleared via API');
      
      return reply.send({
        ok: true,
        message: 'All caches cleared successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error clearing caches:', error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to clear caches',
        details: (error as Error).message
      });
    }
  });

  // POST /realtime/cache/:cacheName/clear - Clear specific cache
  app.post('/cache/:cacheName/clear', async (request, reply) => {
    try {
      const { cacheName } = request.params as { cacheName: string };
      
      const caches = ApplicationCache.getAllCaches();
      const cache = caches.get(cacheName);
      
      if (!cache) {
        return reply.status(404).send({
          ok: false,
          error: `Cache not found: ${cacheName}`
        });
      }
      
      cache.clear();
      
      logger.info(`Cache ${cacheName} cleared via API`);
      
      return reply.send({
        ok: true,
        message: `Cache ${cacheName} cleared successfully`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error(`Error clearing cache:`, error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to clear cache',
        details: (error as Error).message
      });
    }
  });

  // GET /realtime/config - Get real-time service configuration
  app.get('/config', async (request, reply) => {
    try {
      const realTimeService = getRealTimeService();
      const config = realTimeService.getConfig();
      
      return reply.send({
        ok: true,
        config,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error getting real-time config:', error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to get real-time config',
        details: (error as Error).message
      });
    }
  });

  // PUT /realtime/config - Update real-time service configuration
  app.put('/config', async (request, reply) => {
    try {
      const newConfig = request.body as any;
      
      const realTimeService = getRealTimeService();
      realTimeService.updateConfig(newConfig);
      
      logger.info('Real-time service configuration updated via API');
      
      return reply.send({
        ok: true,
        message: 'Configuration updated successfully',
        config: realTimeService.getConfig(),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error updating real-time config:', error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to update real-time config',
        details: (error as Error).message
      });
    }
  });
}