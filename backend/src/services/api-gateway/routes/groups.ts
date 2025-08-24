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

const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  target: coinSchema,
  expiryTs: z.number().int().positive().optional(),
  maxParts: z.number().int().positive().optional()
});

const contributeSchema = z.object({
  amount: coinSchema
});

const distributeSchema = z.object({
  recipients: z.array(z.object({
    address: z.string().min(3),
    shareBps: z.number().min(0).max(10000) // basis points (0-100%)
  })).min(1)
});

export async function groupsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', rateLimit());
  app.addHook('preHandler', auth());

  // POST /groups - Create new group
  app.post(
    '/groups',
    { preHandler: withIdempotency() },
    async (req, reply) => {
      const body = createGroupSchema.parse(req.body);
      const user = req.user as any;

      const { groups } = await getSdk(req);
      const tx = await groups.createGroup({
        name: body.name,
        description: body.description,
        target: body.target,
        expiryTs: body.expiryTs,
        maxParts: body.maxParts
      });

      // Create group metadata
      await prisma.poolMeta.create({
        data: {
          poolId: BigInt(tx.groupId || 0),
          owner: user.address,
          target: body.target.amount,
          denom: body.target.denom,
          current: '0',
          maxParts: body.maxParts || null,
          expiryTs: body.expiryTs ? BigInt(body.expiryTs) : null,
          distributed: false
        }
      });

      return reply.send({ 
        ok: true, 
        groupId: tx.groupId,
        txHash: tx.txHash 
      });
    }
  );

  // POST /groups/:id/contribute
  app.post(
    '/groups/:id/contribute',
    { preHandler: withIdempotency() },
    async (req, reply) => {
      const params = z.object({ id: z.string().regex(/^\d+$/) }).parse(req.params);
      const body = contributeSchema.parse(req.body);
      const user = req.user as any;

      const { groups } = await getSdk(req);
      const tx = await groups.contribute(params.id, body.amount.amount);

      // Update pool metadata
      await prisma.poolMeta.updateMany({
        where: { poolId: BigInt(params.id) },
        data: {
          current: { increment: body.amount.amount }
        }
      });

      return reply.send({ ok: true, txHash: tx.txHash });
    }
  );

  // POST /groups/:id/distribute
  app.post(
    '/groups/:id/distribute',
    { preHandler: withIdempotency() },
    async (req, reply) => {
      const params = z.object({ id: z.string().regex(/^\d+$/) }).parse(req.params);
      const body = distributeSchema.parse(req.body);

      const { groups } = await getSdk(req);
      const tx = await groups.distribute(params.id, body.recipients);

      // Mark as distributed
      await prisma.poolMeta.updateMany({
        where: { poolId: BigInt(params.id) },
        data: { distributed: true }
      });

      return reply.send({ ok: true, txHash: tx.txHash });
    }
  );

  // POST /groups/:id/refund
  app.post(
    '/groups/:id/refund',
    { preHandler: withIdempotency() },
    async (req, reply) => {
      const params = z.object({ id: z.string().regex(/^\d+$/) }).parse(req.params);

      const { groups } = await getSdk(req);
      const tx = await groups.refund(params.id);

      return reply.send({ ok: true, txHash: tx.txHash });
    }
  );

  // GET /groups/:id
  app.get('/groups/:id', async (req, reply) => {
    const params = z.object({ id: z.string().regex(/^\d+$/) }).parse(req.params);

    const group = await prisma.poolMeta.findUnique({
      where: { poolId: BigInt(params.id) }
    });

    if (!group) {
      return reply.status(404).send({ error: 'Group not found' });
    }

    return reply.send({ ok: true, group });
  });

  // GET /groups?owner=
  app.get('/groups', async (req, reply) => {
    const query = z.object({
      owner: z.string().optional(),
      status: z.enum(['active', 'completed', 'expired']).optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0)
    }).parse(req.query);

    const where: any = {};
    if (query.owner) where.owner = query.owner;
    if (query.status === 'completed') where.distributed = true;
    if (query.status === 'expired') {
      where.expiryTs = { not: null, lte: BigInt(Math.floor(Date.now() / 1000)) };
    }

    const groups = await prisma.poolMeta.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.limit,
      skip: query.offset
    });

    return reply.send({ ok: true, groups, total: groups.length });
  });
}
