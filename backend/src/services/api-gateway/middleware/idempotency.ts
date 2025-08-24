import { FastifyRequest, FastifyReply } from 'fastify';

export function withIdempotency() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const idempotencyKey = request.headers['idempotency-key'] as string;
    
    if (!idempotencyKey) {
      return reply.status(400).send({ 
        error: 'Idempotency-Key header required for this operation' 
      });
    }

    // TODO: Implement Redis-based idempotency check
    // For now, just validate the key format
    if (idempotencyKey.length < 10 || idempotencyKey.length > 100) {
      return reply.status(400).send({ 
        error: 'Invalid Idempotency-Key format' 
      });
    }

    // TODO: Check if key was already used
    // const used = await redis.get(`idempotency:${idempotencyKey}`);
    // if (used) {
    //   return reply.status(409).send({ 
    //     error: 'Operation already processed',
    //     result: JSON.parse(used)
    //   });
    // }

    // Store the key for later use
    (request as any).idempotencyKey = idempotencyKey;
  };
}
