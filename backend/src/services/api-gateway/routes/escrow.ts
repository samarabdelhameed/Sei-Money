export async function escrowRoutes(fastify: any): Promise<void> {
  // TODO: Implement escrow API endpoints
  fastify.get('/', async (_request: any, reply: any) => {
    reply.send({ ok: true, message: 'Escrow API - Coming soon' });
  });
}
