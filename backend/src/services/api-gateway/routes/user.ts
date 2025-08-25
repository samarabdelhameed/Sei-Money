import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { logger } from '../../../lib/logger';

export async function userRoutes(app: FastifyInstance): Promise<void> {
  
  // GET /user/profile - Get user profile
  app.get('/profile', async (req, reply) => {
    try {
      // In a real implementation, get user from session/database
      // For now, return mock user profile
      const userProfile = {
        id: 'user_123',
        username: 'SeiUser',
        email: 'user@seimoney.com',
        walletAddress: 'sei1placeholder...',
        avatar: 'https://via.placeholder.com/150',
        joinDate: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        preferences: {
          theme: 'dark',
          language: 'en',
          notifications: true
        },
        stats: {
          totalTransactions: 42,
          totalVolume: 1500.50,
          memberSince: '2024-01-01'
        }
      };

      return reply.send({
        ok: true,
        user: userProfile
      });

    } catch (error) {
      logger.error('Error getting user profile:', error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to get user profile'
      });
    }
  });

  // GET /user/balance - Get user balance
  app.get('/balance', async (req, reply) => {
    try {
      // In a real implementation, query blockchain for actual balance
      // For now, return mock balance data
      const balance = {
        sei: {
          amount: '1250.75',
          denom: 'usei',
          formatted: '1,250.75 SEI',
          usdValue: 125.08
        },
        tokens: [
          {
            symbol: 'SEI',
            amount: '1250.75',
            denom: 'usei',
            usdValue: 125.08
          },
          {
            symbol: 'USDC',
            amount: '500.00',
            denom: 'uusdc',
            usdValue: 500.00
          }
        ],
        totalUsdValue: 625.08,
        lastUpdated: new Date().toISOString()
      };

      return reply.send({
        ok: true,
        balance
      });

    } catch (error) {
      logger.error('Error getting user balance:', error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to get user balance'
      });
    }
  });

  // PUT /user/profile - Update user profile
  app.put('/profile', async (req, reply) => {
    try {
      const updateSchema = z.object({
        username: z.string().optional(),
        email: z.string().email().optional(),
        preferences: z.object({
          theme: z.enum(['light', 'dark']).optional(),
          language: z.string().optional(),
          notifications: z.boolean().optional()
        }).optional()
      });

      const updates = updateSchema.parse(req.body);

      // In a real implementation, update user in database
      logger.info('User profile update request', { updates });

      return reply.send({
        ok: true,
        message: 'Profile updated successfully',
        updatedFields: Object.keys(updates)
      });

    } catch (error) {
      logger.error('Error updating user profile:', error);
      return reply.status(400).send({
        ok: false,
        error: 'Failed to update profile',
        details: error instanceof Error ? error.message : 'Invalid data'
      });
    }
  });

  // GET /user/transactions - Get user transaction history
  app.get('/transactions', async (req, reply) => {
    try {
      const querySchema = z.object({
        limit: z.string().transform(Number).default('10'),
        offset: z.string().transform(Number).default('0'),
        type: z.enum(['all', 'send', 'receive', 'swap', 'stake']).optional()
      });

      const query = querySchema.parse(req.query);

      // Mock transaction history
      const transactions = [
        {
          id: 'tx_001',
          type: 'send',
          amount: '100.00',
          denom: 'usei',
          from: 'sei1sender...',
          to: 'sei1receiver...',
          status: 'completed',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          fee: '0.01',
          hash: '0x123...abc'
        },
        {
          id: 'tx_002',
          type: 'receive',
          amount: '50.00',
          denom: 'usei',
          from: 'sei1sender2...',
          to: 'sei1receiver2...',
          status: 'completed',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          fee: '0.01',
          hash: '0x456...def'
        }
      ];

      return reply.send({
        ok: true,
        transactions: transactions.slice(query.offset, query.offset + query.limit),
        pagination: {
          total: transactions.length,
          limit: query.limit,
          offset: query.offset,
          hasMore: query.offset + query.limit < transactions.length
        }
      });

    } catch (error) {
      logger.error('Error getting user transactions:', error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to get transactions'
      });
    }
  });

  // GET /user/activity - Get user activity summary
  app.get('/activity', async (req, reply) => {
    try {
      const activity = {
        last24h: {
          transactions: 5,
          volume: 250.75,
          activeMinutes: 45
        },
        last7d: {
          transactions: 23,
          volume: 1250.50,
          activeDays: 6
        },
        last30d: {
          transactions: 89,
          volume: 5675.25,
          activeDays: 28
        },
        allTime: {
          transactions: 342,
          volume: 15678.90,
          memberSince: '2024-01-01'
        }
      };

      return reply.send({
        ok: true,
        activity
      });

    } catch (error) {
      logger.error('Error getting user activity:', error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to get activity'
      });
    }
  });
}
