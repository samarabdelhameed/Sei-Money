export async function groupsRoutes(fastify: any): Promise<void> {
  // TODO: Implement groups API endpoints
  fastify.get('/', async (_request: any, reply: any) => {
    reply.send({ ok: true, message: 'Groups API - Coming soon' });
  });
}
