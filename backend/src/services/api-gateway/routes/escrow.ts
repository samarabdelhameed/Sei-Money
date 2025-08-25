import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getSdk } from '../../../lib/sdk-simple';

const coinSchema = z.object({
  denom: z.string().min(1),
  amount: z.string().regex(/^\d+$/)
});

const openEscrowSchema = z.object({
  parties: z.array(z.string().min(3)).min(2),
  arbiter: z.string().min(3).optional(),
  amount: coinSchema,
  model: z.enum(['MultiSig', 'TimeTiered', 'Milestones']),
  expiryTs: z.number().int().positive().optional(),
  metadata: z.string().max(500).optional()
});

const approveSchema = z.object({
  approval: z.boolean()
});

const disputeSchema = z.object({
  reason: z.string().max(200)
});

const resolveSchema = z.object({
  decision: z.enum(['approve', 'refund']),
  reason: z.string().max(200).optional()
});

const releaseSchema = z.object({
  to: z.string().min(3),
  shareBps: z.number().min(0).max(10000).optional() // basis points
});

export async function escrowRoutes(app: FastifyInstance): Promise<void> {
  // Simplified for development
  
  // GET /escrow - List all escrows
  app.get('/', async (req, reply) => {
    try {
      const sdk = await getSdk();
      const escrows = await sdk.listEscrows();
      
      return reply.send({ 
        ok: true, 
        escrows,
        total: escrows.length 
      });
    } catch (error) {
      console.error('Error listing escrows:', error);
      return reply.status(500).send({ 
        ok: false, 
        error: 'Failed to list escrows' 
      });
    }
  });

  // GET /escrow/:id - Get specific escrow
  app.get('/:id', async (req, reply) => {
    try {
      const params = z.object({ id: z.string() }).parse(req.params);
      const sdk = await getSdk();
      const escrow = await sdk.getEscrow(params.id);
      
      return reply.send({ 
        ok: true, 
        escrow 
      });
    } catch (error) {
      console.error('Error getting escrow:', error);
      return reply.status(500).send({ 
        ok: false, 
        error: 'Failed to get escrow' 
      });
    }
  });
}
