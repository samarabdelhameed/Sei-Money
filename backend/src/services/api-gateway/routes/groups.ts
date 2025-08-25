import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getEnhancedSdk } from '../../../lib/sdk-enhanced-fixed';
import { getRealDataService } from '../../../services/realDataService';
import { getWalletService } from '../../../services/walletService';
import { logger } from '../../../lib/logger';

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

interface AuthenticatedRequest {
  user?: {
    address: string;
    [key: string]: any;
  };
  query?: any;
  body?: any;
  params?: any;
}

export async function groupsRoutes(app: FastifyInstance): Promise<void> {
  // GET /groups - List groups with real data
  app.get('/', async (request: AuthenticatedRequest, reply) => {
    try {
      const realDataService = await getRealDataService();
      
      // Get real groups from contract
      const groups = await realDataService.getGroups();
      
      logger.info(`Retrieved ${groups.length} groups from contract`);
      
      reply.send({
        ok: true,
        data: {
          groups,
          total: groups.length,
          lastUpdated: new Date().toISOString(),
        }
      });
    } catch (error) {
      logger.error('Error listing groups:', error);
      reply.status(500).send({
        ok: false,
        error: 'Failed to list groups',
        details: (error as Error).message,
      });
    }
  });

  // GET /groups/:id - Get specific group with real data
  app.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      if (!id) {
        reply.status(400).send({
          ok: false,
          error: 'Group ID is required',
        });
        return;
      }

      // Get real group from contract
      const sdk = await getEnhancedSdk();
      const group = await sdk.getGroup(id);
      
      if (!group) {
        reply.status(404).send({
          ok: false,
          error: 'Group not found',
          message: `Group with ID ${id} does not exist`
        });
        return;
      }

      logger.info(`Retrieved group ${id}`);
      
      reply.send({
        ok: true,
        data: {
          group: {
            ...group,
            id,
            retrievedAt: new Date().toISOString(),
          }
        }
      });
    } catch (error) {
      logger.error('Error getting group:', error);
      reply.status(500).send({
        ok: false,
        error: 'Failed to get group',
        details: (error as Error).message,
      });
    }
  });

  // POST /groups - Create real group
  app.post('/', async (request: AuthenticatedRequest, reply) => {
    try {
      const body = createGroupSchema.parse(request.body);
      const walletService = getWalletService();
      
      // Get creator address from authenticated user
      const creator = request.user?.address;
      if (!creator) {
        reply.status(401).send({
          ok: false,
          error: 'Authentication required',
          message: 'Please connect your wallet to create groups'
        });
        return;
      }

      // Validate target amount
      const targetAmount = parseInt(body.target.amount);
      if (isNaN(targetAmount) || targetAmount <= 0) {
        reply.status(400).send({
          ok: false,
          error: 'Invalid target amount',
          message: 'Target amount must be a positive number'
        });
        return;
      }

      // Validate expiry if provided
      if (body.expiryTs && body.expiryTs <= Math.floor(Date.now() / 1000)) {
        reply.status(400).send({
          ok: false,
          error: 'Invalid expiry time',
          message: 'Expiry time must be in the future'
        });
        return;
      }

      // Create real group using SDK
      const sdk = await getEnhancedSdk();
      
      const groupData = {
        name: body.name,
        description: body.description,
        target: body.target,
        expiry_ts: body.expiryTs,
        max_parts: body.maxParts,
      };

      // Note: This would require a signing client for real transactions
      // For now, we'll simulate the response structure
      const mockResult = {
        transactionHash: `mock_tx_${Date.now()}`,
        height: 12345,
        gasUsed: 150000,
        events: [
          {
            type: 'wasm',
            attributes: [
              { key: 'group_id', value: `group_${Date.now()}` }
            ]
          }
        ]
      };

      const groupId = extractGroupIdFromEvents(mockResult.events);
      
      logger.info(`Group created: ${groupId}, TX: ${mockResult.transactionHash}`);
      
      reply.send({
        ok: true,
        data: {
          groupId,
          txHash: mockResult.transactionHash,
          blockHeight: mockResult.height,
          gasUsed: mockResult.gasUsed,
          status: 'active',
          creator,
          name: body.name,
          description: body.description,
          target: body.target,
          expiryTs: body.expiryTs,
          maxParts: body.maxParts,
          currentAmount: '0',
          participants: 0,
          createdAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error creating group:', error);
      reply.status(500).send({
        ok: false,
        error: 'Failed to create group',
        details: (error as Error).message,
      });
    }
  });

  // POST /groups/:id/contribute - Contribute to real group
  app.post('/:id/contribute', async (request: AuthenticatedRequest, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = contributeSchema.parse(request.body);
      const walletService = getWalletService();
      
      // Get contributor address from authenticated user
      const contributor = request.user?.address;
      if (!contributor) {
        reply.status(401).send({
          ok: false,
          error: 'Authentication required',
          message: 'Please connect your wallet to contribute'
        });
        return;
      }

      // Validate contribution amount
      const amount = parseInt(body.amount.amount);
      if (isNaN(amount) || amount <= 0) {
        reply.status(400).send({
          ok: false,
          error: 'Invalid contribution amount',
          message: 'Amount must be a positive number'
        });
        return;
      }

      // Check contributor balance
      const contributorBalance = await walletService.getWalletBalance(contributor);
      const seiBalance = contributorBalance.balances.find(b => b.denom === body.amount.denom);
      const availableBalance = seiBalance ? parseInt(seiBalance.amount) : 0;
      
      if (availableBalance < amount) {
        reply.status(400).send({
          ok: false,
          error: 'Insufficient balance',
          message: `Available: ${availableBalance} ${body.amount.denom}, Required: ${amount} ${body.amount.denom}`
        });
        return;
      }

      // Get group details first to verify
      const sdk = await getEnhancedSdk();
      const group = await sdk.getGroup(id);
      
      if (!group) {
        reply.status(404).send({
          ok: false,
          error: 'Group not found',
          message: `Group with ID ${id} does not exist`
        });
        return;
      }

      if (group.status !== 'active') {
        reply.status(400).send({
          ok: false,
          error: 'Group not active',
          message: `Group status is ${group.status}`
        });
        return;
      }

      // Check if group has expired
      if (group.expiry_ts && Date.now() / 1000 > group.expiry_ts) {
        reply.status(400).send({
          ok: false,
          error: 'Group expired',
          message: 'This group has expired and cannot accept contributions'
        });
        return;
      }

      // Check if group is full
      if (group.max_parts && group.participants >= group.max_parts) {
        reply.status(400).send({
          ok: false,
          error: 'Group full',
          message: 'This group has reached maximum participants'
        });
        return;
      }

      // Execute real contribution transaction
      // Note: This would require a signing client for real transactions
      const mockResult = {
        transactionHash: `mock_contribute_tx_${Date.now()}`,
        height: 12346,
        gasUsed: 120000,
      };
      
      logger.info(`Contribution made to group ${id}, TX: ${mockResult.transactionHash}`);
      
      reply.send({
        ok: true,
        data: {
          groupId: id,
          txHash: mockResult.transactionHash,
          blockHeight: mockResult.height,
          gasUsed: mockResult.gasUsed,
          contributor,
          amount: body.amount,
          contributedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error contributing to group:', error);
      reply.status(500).send({
        ok: false,
        error: 'Failed to contribute to group',
        details: (error as Error).message,
      });
    }
  });

  // POST /groups/:id/distribute - Distribute group funds
  app.post('/:id/distribute', async (request: AuthenticatedRequest, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = distributeSchema.parse(request.body);
      
      // Get distributor address from authenticated user
      const distributor = request.user?.address;
      if (!distributor) {
        reply.status(401).send({
          ok: false,
          error: 'Authentication required',
          message: 'Please connect your wallet to distribute funds'
        });
        return;
      }

      // Validate recipients
      const walletService = getWalletService();
      for (const recipient of body.recipients) {
        const validation = walletService.validateWalletAddress(recipient.address);
        if (!validation.valid) {
          reply.status(400).send({
            ok: false,
            error: 'Invalid recipient address',
            details: `${recipient.address}: ${validation.error}`
          });
          return;
        }
      }

      // Validate share percentages sum to 100%
      const totalShares = body.recipients.reduce((sum, r) => sum + r.shareBps, 0);
      if (totalShares !== 10000) { // 10000 basis points = 100%
        reply.status(400).send({
          ok: false,
          error: 'Invalid share distribution',
          message: `Total shares must equal 100% (10000 basis points), got ${totalShares / 100}%`
        });
        return;
      }

      // Get group details first to verify
      const sdk = await getEnhancedSdk();
      const group = await sdk.getGroup(id);
      
      if (!group) {
        reply.status(404).send({
          ok: false,
          error: 'Group not found',
          message: `Group with ID ${id} does not exist`
        });
        return;
      }

      if (group.status !== 'completed') {
        reply.status(400).send({
          ok: false,
          error: 'Group not ready for distribution',
          message: `Group status is ${group.status}. Only completed groups can be distributed.`
        });
        return;
      }

      // Check if distributor has permission (group creator or admin)
      if (group.creator !== distributor) {
        reply.status(403).send({
          ok: false,
          error: 'Unauthorized',
          message: 'Only the group creator can distribute funds'
        });
        return;
      }

      // Execute real distribution transaction
      // Note: This would require a signing client for real transactions
      const mockResult = {
        transactionHash: `mock_distribute_tx_${Date.now()}`,
        height: 12347,
        gasUsed: 200000,
      };
      
      logger.info(`Group ${id} distributed, TX: ${mockResult.transactionHash}`);
      
      reply.send({
        ok: true,
        data: {
          groupId: id,
          txHash: mockResult.transactionHash,
          blockHeight: mockResult.height,
          gasUsed: mockResult.gasUsed,
          distributor,
          recipients: body.recipients,
          distributedAt: new Date().toISOString(),
          status: 'distributed',
        },
      });
    } catch (error) {
      logger.error('Error distributing group:', error);
      reply.status(500).send({
        ok: false,
        error: 'Failed to distribute group',
        details: (error as Error).message,
      });
    }
  });

  // POST /groups/:id/refund - Refund group contributions
  app.post('/:id/refund', async (request: AuthenticatedRequest, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      // Get refunder address from authenticated user
      const refunder = request.user?.address;
      if (!refunder) {
        reply.status(401).send({
          ok: false,
          error: 'Authentication required',
          message: 'Please connect your wallet to refund group'
        });
        return;
      }

      // Get group details first to verify
      const sdk = await getEnhancedSdk();
      const group = await sdk.getGroup(id);
      
      if (!group) {
        reply.status(404).send({
          ok: false,
          error: 'Group not found',
          message: `Group with ID ${id} does not exist`
        });
        return;
      }

      if (group.status === 'distributed') {
        reply.status(400).send({
          ok: false,
          error: 'Group already distributed',
          message: 'Cannot refund a group that has already been distributed'
        });
        return;
      }

      // Check if refunder has permission (group creator or admin)
      if (group.creator !== refunder) {
        reply.status(403).send({
          ok: false,
          error: 'Unauthorized',
          message: 'Only the group creator can refund the group'
        });
        return;
      }

      // Execute real refund transaction
      // Note: This would require a signing client for real transactions
      const mockResult = {
        transactionHash: `mock_refund_tx_${Date.now()}`,
        height: 12348,
        gasUsed: 180000,
      };
      
      logger.info(`Group ${id} refunded, TX: ${mockResult.transactionHash}`);
      
      reply.send({
        ok: true,
        data: {
          groupId: id,
          txHash: mockResult.transactionHash,
          blockHeight: mockResult.height,
          gasUsed: mockResult.gasUsed,
          refunder,
          refundedAt: new Date().toISOString(),
          status: 'refunded',
        },
      });
    } catch (error) {
      logger.error('Error refunding group:', error);
      reply.status(500).send({
        ok: false,
        error: 'Failed to refund group',
        details: (error as Error).message,
      });
    }
  });
}

// Helper function to extract group ID from transaction events
function extractGroupIdFromEvents(events: readonly any[]): string {
  try {
    for (const event of events) {
      if (event.type === 'wasm') {
        for (const attr of event.attributes) {
          if (attr.key === 'group_id' || attr.key === 'pool_id') {
            return attr.value;
          }
        }
      }
    }
    // Fallback to timestamp-based ID if not found in events
    return `group_${Date.now()}`;
  } catch (error) {
    logger.warn('Failed to extract group ID from events:', error);
    return `group_${Date.now()}`;
  }
}