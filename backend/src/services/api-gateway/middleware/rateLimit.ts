import { FastifyRequest, FastifyReply } from 'fastify';

export function rateLimit() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Simple rate limiting middleware - for development
    // In production, implement proper rate limiting with Redis
    
    const clientIp = request.ip;
    const now = Date.now();
    
    // For development, just log the request
    console.log(`Rate limit check: ${clientIp} at ${new Date(now).toISOString()}`);
    
    // Allow all requests in development
    return;
  };
}