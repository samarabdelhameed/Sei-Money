export async function potsRoutes(fastify: any): Promise<void> {
  // TODO: Implement pots API endpoints
  fastify.get('/', async (_request: any, reply: any) => {
    reply.send({ ok: true, message: 'Pots API - Coming soon' });
  });
}
