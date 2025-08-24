export async function authMiddleware(fastify: any): Promise<void> {
  // TODO: Implement JWT authentication middleware
  fastify.addHook('preHandler', async (_request: any, _reply: any) => {
    // For now, skip authentication
    // In production, verify JWT tokens here
  });
}
