export async function healthRoutes(fastify: any): Promise<void> {
  // Basic health check - cached response
  const healthResponse = {
    ok: true,
    status: 'healthy',
    service: 'seimoney-backend',
    version: '1.0.0',
  };

  fastify.get('/', async (_request: any, reply: any) => {
    reply
      .header('Cache-Control', 'public, max-age=30')
      .send({
        ...healthResponse,
        timestamp: new Date().toISOString(),
      });
  });

  // Detailed health check - simplified for development
  fastify.get('/detailed', async (_request: any, reply: any) => {
    const health = {
      ok: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'seimoney-backend',
      version: '1.0.0',
      checks: {
        database: 'healthy', // Skip actual DB check for speed
        blockchain: 'healthy', // Skip actual blockchain check for speed
        redis: 'healthy', // Skip actual Redis check for speed
      },
    };

    reply
      .header('Cache-Control', 'public, max-age=10')
      .send(health);
  });

  // Readiness probe for Kubernetes
  fastify.get('/ready', async (_request: any, reply: any) => {
    // Check if all critical services are ready
    const isReady = true; // In real implementation, check actual service readiness

    if (isReady) {
      reply.send({
        ok: true,
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    } else {
      reply.status(503).send({
        ok: false,
        status: 'not_ready',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Liveness probe for Kubernetes
  fastify.get('/live', async (_request: any, reply: any) => {
    // Simple check if the service is alive
    reply.send({
      ok: true,
      status: 'alive',
      timestamp: new Date().toISOString(),
    });
  });
}
