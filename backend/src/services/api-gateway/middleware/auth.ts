import { FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../../../config';

export async function auth(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      return reply.status(401).send({ error: 'Authorization header required' });
    }

    // Check for API key first (for internal services)
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Check if it's an API key
      if (token === config.security.internalApiKey) {
        (request as any).user = { type: 'internal', address: 'system' };
        return;
      }

      // TODO: Implement JWT verification
      // const decoded = jwt.verify(token, config.security.jwtSecret);
      // (request as any).user = decoded;
      
      // For now, mock user
      (request as any).user = { 
        type: 'user', 
        address: 'sei1...',
        id: 'mock-user-id'
      };
      return;
    }

    // Check for HMAC signature (for agent calls)
    if (authHeader.startsWith('HMAC ')) {
      const signature = authHeader.substring(6);
      const body = JSON.stringify(request.body || {});
      const expectedSignature = createHmac('sha256', config.security.internalSecret)
        .update(body)
        .digest('hex');
      
      if (signature === expectedSignature) {
        (request as any).user = { type: 'agent', address: 'agent' };
        return;
      }
    }

    return reply.status(401).send({ error: 'Invalid authorization' });
  } catch (error) {
    return reply.status(401).send({ error: 'Authentication failed' });
  }
}

function createHmac(algorithm: string, secret: string) {
  // Simple HMAC implementation for demo
  // In production, use crypto.createHmac
  return {
    update: (data: string) => ({
      digest: (encoding: string) => {
        // Mock implementation
        return Buffer.from(data + secret).toString('hex').substring(0, 64);
      }
    })
  };
}
