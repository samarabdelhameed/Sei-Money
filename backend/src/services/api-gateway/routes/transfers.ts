import { z } from 'zod';

// Request schemas
const CreateTransferSchema = z.object({
  recipient: z.string().min(1, 'Recipient address is required'),
  amount: z.string().min(1, 'Amount is required'),
  expiry: z.number().min(Date.now() / 1000, 'Expiry must be in the future'),
  metadata: z.string().optional(),
});

const ClaimTransferSchema = z.object({
  transferId: z.string().min(1, 'Transfer ID is required'),
});

const RefundTransferSchema = z.object({
  transferId: z.string().min(1, 'Transfer ID is required'),
});

const ListTransfersSchema = z.object({
  sender: z.string().optional(),
  recipient: z.string().optional(),
  status: z.enum(['pending', 'claimed', 'refunded', 'expired']).optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export async function transfersRoutes(fastify: any): Promise<void> {
  // Create a new transfer
  fastify.post('/', {
    schema: {
      body: CreateTransferSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                transferId: { type: 'string' },
                txHash: { type: 'string' },
              },
            },
          },
        },
      },
    },
    // TODO: Add authentication middleware when implemented
    // preHandler: [fastify.authenticate],
  }, async (request: any, reply: any) => {
    try {
      const { recipient, amount, expiry } = request.body;
      // TODO: Get user from authentication
      const user = { address: 'sei1...' }; // Mock user for now

      console.log('Creating transfer', {
        sender: user.address,
        recipient,
        amount,
        expiry,
      });

      // TODO: Implement SDK integration
      // const sdk = await getSdk();
      // const transferId = await sdk.payments.createTransfer({...});
      
      const transferId = 'mock-transfer-id';

      reply.send({
        ok: true,
        data: {
          transferId,
          txHash: transferId, // In real implementation, this would be the actual tx hash
        },
      });
    } catch (error) {
      console.error('Error creating transfer:', error);
      reply.status(500).send({
        ok: false,
        error: 'Failed to create transfer',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Claim a transfer
  fastify.post('/:transferId/claim', {
    schema: {
      params: z.object({
        transferId: z.string().min(1, 'Transfer ID is required'),
      }),
      body: ClaimTransferSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                txHash: { type: 'string' },
              },
            },
          },
        },
      },
    },
    // TODO: Add authentication middleware when implemented
    // preHandler: [fastify.authenticate],
  }, async (request: any, reply: any) => {
    try {
      const { transferId } = request.params;
      // TODO: Get user from authentication
      const user = { address: 'sei1...' }; // Mock user for now

      console.log('Claiming transfer', {
        transferId,
        recipient: user.address,
      });

      // TODO: Implement SDK integration
      // const sdk = await getSdk();
      // const txHash = await sdk.payments.claimTransfer(parseInt(transferId), user.address);
      
      const txHash = 'mock-tx-hash';

      reply.send({
        ok: true,
        data: {
          txHash,
        },
      });
    } catch (error) {
      console.error('Error claiming transfer:', error);
      reply.status(500).send({
        ok: false,
        error: 'Failed to claim transfer',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Refund a transfer
  fastify.post('/:transferId/refund', {
    schema: {
      params: z.object({
        transferId: z.string().min(1, 'Transfer ID is required'),
      }),
      body: RefundTransferSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                txHash: { type: 'string' },
              },
            },
          },
        },
      },
    },
    // TODO: Add authentication middleware when implemented
    // preHandler: [fastify.authenticate],
  }, async (request: any, reply: any) => {
    try {
      const { transferId } = request.params;
      // TODO: Get user from authentication
      const user = { address: 'sei1...' }; // Mock user for now

      console.log('Refunding transfer', {
        transferId,
        sender: user.address,
      });

      // TODO: Implement SDK integration
      // const sdk = await getSdk();
      // const txHash = await sdk.payments.refundTransfer(parseInt(transferId), user.address);
      
      const txHash = 'mock-tx-hash';

      reply.send({
        ok: true,
        data: {
          txHash,
        },
      });
    } catch (error) {
      console.error('Error refunding transfer:', error);
      reply.status(500).send({
        ok: false,
        error: 'Failed to refund transfer',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // List transfers
  fastify.get('/', {
    schema: {
      querystring: ListTransfersSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                transfers: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      sender: { type: 'string' },
                      recipient: { type: 'string' },
                      amount: { type: 'string' },
                      status: { type: 'string' },
                      createdAt: { type: 'string' },
                    },
                  },
                },
                pagination: {
                  type: 'object',
                  properties: {
                    total: { type: 'number' },
                    limit: { type: 'number' },
                    offset: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
    // TODO: Add authentication middleware when implemented
    // preHandler: [fastify.authenticate],
  }, async (request: any, reply: any) => {
    try {
      const { sender, recipient, status, limit, offset } = request.query;
      // TODO: Get user from authentication
      const user = { address: 'sei1...' }; // Mock user for now

      console.log('Listing transfers', {
        user: user.address,
        filters: { sender, recipient, status },
        pagination: { limit, offset },
      });

      // TODO: Implement SDK integration
      // const sdk = await getSdk();
      // let transfers = [];
      // if (sender) {
      //   transfers = await sdk.payments.listTransfersBySender(sender);
      // } else if (recipient) {
      //   transfers = await sdk.payments.listTransfersByRecipient(recipient);
      // }
      
      // Mock data for now
      const transfers = [
        {
          id: '1',
          sender: 'sei1...',
          recipient: 'sei1...',
          amount: '1000usei',
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
      ];

      // Apply status filter
      let filteredTransfers = transfers;
      if (status) {
        filteredTransfers = transfers.filter(t => t.status === status);
      }

      // Apply pagination
      const total = filteredTransfers.length;
      const paginatedTransfers = filteredTransfers.slice(offset, offset + limit);

      reply.send({
        ok: true,
        data: {
          transfers: paginatedTransfers,
          pagination: {
            total,
            limit,
            offset,
          },
        },
      });
    } catch (error) {
      console.error('Error listing transfers:', error);
      reply.status(500).send({
        ok: false,
        error: 'Failed to list transfers',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get transfer by ID
  fastify.get('/:transferId', {
    schema: {
      params: z.object({
        transferId: z.string().min(1, 'Transfer ID is required'),
      }),
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                transfer: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    sender: { type: 'string' },
                    recipient: { type: 'string' },
                    amount: { type: 'string' },
                    status: { type: 'string' },
                    createdAt: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    // TODO: Add authentication middleware when implemented
    // preHandler: [fastify.authenticate],
  }, async (request: any, reply: any) => {
    try {
      const { transferId } = request.params;

      console.log('Getting transfer', { transferId });

      // In a real implementation, you'd query the database or blockchain
      // For now, return a mock response
      const transfer = {
        id: transferId,
        sender: 'sei1...',
        recipient: 'sei1...',
        amount: '1000usei',
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      reply.send({
        ok: true,
        data: {
          transfer,
        },
      });
    } catch (error) {
      console.error('Error getting transfer:', error);
      reply.status(500).send({
        ok: false,
        error: 'Failed to get transfer',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
