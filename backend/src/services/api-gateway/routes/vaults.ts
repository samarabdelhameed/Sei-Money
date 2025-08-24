export async function vaultsRoutes(fastify: any): Promise<void> {
  // TODO: Implement vaults API endpoints
  fastify.get('/', async (_request: any, reply: any) => {
    reply.send({ ok: true, message: 'Vaults API - Coming soon' });
  });
}
