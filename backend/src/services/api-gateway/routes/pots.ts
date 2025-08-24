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

const createPotSchema = z.object({
  goal: coinSchema,
  label: z.string().max(100).optional()
});

const depositSchema = z.object({
  amount: coinSchema
});

export async function potsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', rateLimit());
  app.addHook('preHandler', auth());

  // POST /pots - Create new pot
  app.post(
    '/pots',
    { preHandler: withIdempotency() },
    async (req, reply) => {
      const body = createPotSchema.parse(req.body);
      const user = req.user as any;

      const { pots } = await getSdk(req);
      const tx = await pots.openPot({
        goal: body.goal.amount,
        label: body.label
      });

      // Create pot metadata
      await prisma.potMeta.create({
        data: {
          potId: BigInt(tx.potId || 0),
          owner: user.address,
          goal: body.goal.amount,
          denom: body.goal.denom,
          current: '0',
          label: body.label || null,
          closed: false
        }
      });

      return reply.send({ 
        ok: true, 
        potId: tx.potId,
        txHash: tx.txHash 
      });
    }
  );

  // POST /pots/:id/deposit
  app.post(
    '/pots/:id/deposit',
    { preHandler: withIdempotency() },
    async (req, reply) => {
      const params = z.object({ id: z.string().regex(/^\d+$/) }).parse(req.params);
      const body = depositSchema.parse(req.body);
      const user = req.user as any;

      const { pots } = await getSdk(req);
      const tx = await pots.depositPot(Number(params.id), body.amount.amount);

      // Update pot metadata
      await prisma.potMeta.updateMany({
        where: { potId: BigInt(params.id) },
        data: {
          current: { increment: body.amount.amount }
        }
      });

      // Create contribution record
      await prisma.potContribution.create({
        data: {
          potId: BigInt(params.id),
          userId: user.id,
          amount: body.amount.amount,
          denom: body.amount.denom
        }
      });

      return reply.send({ ok: true, txHash: tx.txHash });
    }
  );

  // POST /pots/:id/break
  app.post(
    '/pots/:id/break',
    { preHandler: withIdempotency() },
    async (req, reply) => {
      const params = z.object({ id: z.string().regex(/^\d+$/) }).parse(req.params);

      const { pots } = await getSdk(req);
      const tx = await pots.breakPot(Number(params.id));

      // Mark as broken
      await prisma.potMeta.updateMany({
        where: { potId: BigInt(params.id) },
        data: { closed: true }
      });

      return reply.send({ ok: true, txHash: tx.txHash });
    }
  );

  // POST /pots/:id/close
  app.post(
    '/pots/:id/close',
    { preHandler: withIdempotency() },
    async (req, reply) => {
      const params = z.object({ id: z.string().regex(/^\d+$/) }).parse(req.params);

      const { pots } = await getSdk(req);
      const tx = await pots.closePot(Number(params.id));

      // Mark as closed
      await prisma.potMeta.updateMany({
        where: { potId: BigInt(params.id) },
        data: { closed: true }
      });

      return reply.send({ ok: true, txHash: tx.txHash });
    }
  );

  // GET /pots/:id
  app.get('/pots/:id', async (req, reply) => {
    const params = z.object({ id: z.string().regex(/^\d+$/) }).parse(req.params);

    const pot = await prisma.potMeta.findUnique({
      where: { potId: BigInt(params.id) }
    });

    if (!pot) {
      return reply.status(404).send({ error: 'Pot not found' });
    }

    return reply.send({ ok: true, pot });
  });

  // GET /pots?owner=
  app.get('/pots', async (req, reply) => {
    const query = z.object({
      owner: z.string().optional(),
      status: z.enum(['active', 'closed', 'broken']).optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0)
    }).parse(req.query);

    const where: any = {};
    if (query.owner) where.owner = query.owner;
    if (query.status === 'closed') where.closed = true;
    if (query.status === 'broken') where.closed = true; // Both closed and broken are closed

    const pots = await prisma.potMeta.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.limit,
      skip: query.offset
    });

    return reply.send({ ok: true, pots, total: pots.length });
  });
}
