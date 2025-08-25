import { FastifyRequest, FastifyReply } from 'fastify';

export function auth() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Simple auth middleware - for development
    // In production, implement proper JWT validation

    const authHeader = request.headers.authorization;

    if (!authHeader) {
      // For development, allow requests without auth
      (request as any).user = {
        id: 'dev-user',
        address: 'sei1devuser123...'
      };
      return;
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.split(' ')[1];

    if (!token) {
      return reply.status(401).send({ error: 'Invalid authorization header' });
    }

    // For development, accept any token
    (request as any).user = {
      id: 'authenticated-user',
      address: 'sei1authuser123...'
    };
  };
}