import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getSdk } from '../lib/sdk';
import { prisma } from '../lib/prisma';
import { withIdempotency } from '../middleware/idempotency';
import { rateLimit } from '../middleware/rateLimit';
import { auth } from '../middleware/auth';

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
  app.addHook('preHandler', rateLimit());
  app.addHook('preHandler', auth());

  // POST /escrow/open
  app.post(
    '/escrow/open',
    { preHandler: withIdempotency() },
    async (req, reply) => {
      const body = openEscrowSchema.parse(req.body);
      const user = req.user as any;

      const { escrow } = await getSdk(req);
      const tx = await escrow.createEscrow({
        parties: body.parties,
        arbiter: body.arbiter,
        amount: body.amount,
        model: body.model,
        expiryTs: body.expiryTs,
        metadata: body.metadata
      });

      // Create escrow metadata
      await prisma.escrowCase.create({
        data: {
          caseId: BigInt(tx.escrowId || 0),
          parties: JSON.stringify(body.parties),
          arbiter: body.arbiter || null,
          amount: body.amount.amount,
          denom: body.amount.denom,
          model: body.model,
          status: 'pending',
          approvals: 0,
          expiryTs: body.expiryTs ? BigInt(body.expiryTs) : null
        }
      });

      return reply.send({ 
        ok: true, 
        escrowId: tx.escrowId,
        txHash: tx.txHash 
      });
    }
  );

  // POST /escrow/:caseId/approve
  app.post(
    '/escrow/:caseId/approve',
    { preHandler: withIdempotency() },
    async (req, reply) => {
      const params = z.object({ caseId: z.string().regex(/^\d+$/) }).parse(req.params);
      const body = approveSchema.parse(req.body);

      const { escrow } = await getSdk(req);
      const tx = await escrow.approve(params.caseId, body.approval);

      // Update approval count
      if (body.approval) {
        await prisma.escrowCase.updateMany({
          where: { caseId: BigInt(params.caseId) },
          data: {
            approvals: { increment: 1 }
          }
        });
      }

      return reply.send({ ok: true, txHash: tx.txHash });
    }
  );

  // POST /escrow/:caseId/dispute
  app.post(
    '/escrow/:caseId/dispute',
    { preHandler: withIdempotency() },
    async (req, reply) => {
      const params = z.object({ caseId: z.string().regex(/^\d+$/) }).parse(req.params);
      const body = disputeSchema.parse(req.body);

      const { escrow } = await getSdk(req);
      const tx = await escrow.dispute(params.caseId, body.reason);

      // Update status to disputed
      await prisma.escrowCase.updateMany({
        where: { caseId: BigInt(params.caseId) },
        data: { status: 'disputed' }
      });

      return reply.send({ ok: true, txHash: tx.txHash });
    }
  );

  // POST /escrow/:caseId/resolve
  app.post(
    '/escrow/:caseId/resolve',
    { preHandler: withIdempotency() },
    async (req, reply) => {
      const params = z.object({ caseId: z.string().regex(/^\d+$/) }).parse(req.params);
      const body = resolveSchema.parse(req.body);

      const { escrow } = await getSdk(req);
      const tx = await escrow.resolve(params.caseId, body.decision, body.reason);

      // Update status
      await prisma.escrowCase.updateMany({
        where: { caseId: BigInt(params.caseId) },
        data: { 
          status: body.decision === 'approve' ? 'approved' : 'refunded'
        }
      });

      return reply.send({ ok: true, txHash: tx.txHash });
    }
  );

  // POST /escrow/:caseId/release
  app.post(
    '/escrow/:caseId/release',
    { preHandler: withIdempotency() },
    async (req, reply) => {
      const params = z.object({ caseId: z.string().regex(/^\d+$/) }).parse(req.params);
      const body = releaseSchema.parse(req.body);

      const { escrow } = await getSdk(req);
      const tx = await escrow.release(params.caseId, body.to, body.shareBps);

      // Update status to released
      await prisma.escrowCase.updateMany({
        where: { caseId: BigInt(params.caseId) },
        data: { status: 'released' }
      });

      return reply.send({ ok: true, txHash: tx.txHash });
    }
  );

  // POST /escrow/:caseId/refund
  app.post(
    '/escrow/:caseId/refund',
    { preHandler: withIdempotency() },
    async (req, reply) => {
      const params = z.object({ caseId: z.string().regex(/^\d+$/) }).parse(req.params);

      const { escrow } = await getSdk(req);
      const tx = await escrow.refund(params.caseId);

      // Update status to refunded
      await prisma.escrowCase.updateMany({
        where: { caseId: BigInt(params.caseId) },
        data: { status: 'refunded' }
      });

      return reply.send({ ok: true, txHash: tx.txHash });
    }
  );

  // GET /escrow/:caseId
  app.get('/escrow/:caseId', async (req, reply) => {
    const params = z.object({ caseId: z.string().regex(/^\d+$/) }).parse(req.params);

    const escrow = await prisma.escrowCase.findUnique({
      where: { caseId: BigInt(params.caseId) }
    });

    if (!escrow) {
      return reply.status(404).send({ error: 'Escrow case not found' });
    }

    return reply.send({ ok: true, escrow });
  });

  // GET /escrow?party=
  app.get('/escrow', async (req, reply) => {
    const query = z.object({
      party: z.string().optional(),
      status: z.enum(['pending', 'approved', 'disputed', 'resolved', 'released', 'refunded']).optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0)
    }).parse(req.query);

    const where: any = {};
    if (query.party) {
      where.parties = { contains: query.party };
    }
    if (query.status) where.status = query.status;

    const escrows = await prisma.escrowCase.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.limit,
      skip: query.offset
    });

    return reply.send({ ok: true, escrows, total: escrows.length });
  });
}
