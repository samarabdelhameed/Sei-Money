import { FastifyRequest, FastifyReply } from 'fastify';

export function withIdempotency() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Simple idempotency middleware - for development
    // In production, implement proper idempotency with Redis/Database
    
    const idempotencyKey = request.headers['idempotency-key'] as string;
    
    if (idempotencyKey) {
      console.log(`Idempotency key: ${idempotencyKey}`);
      // In production, check if this key was already processed
      // and return cached result if found
    }
    
    // For development, just continue
    return;
  };
}