import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { logger } from '../../../lib/logger';

const connectWalletSchema = z.object({
  provider: z.enum(['metamask', 'keplr', 'leap']),
  address: z.string().min(1),
  publicKey: z.string().optional(),
  signature: z.string().optional()
});

const signTransactionSchema = z.object({
  transaction: z.any(),
  walletAddress: z.string().min(1)
});

export async function walletRoutes(app: FastifyInstance): Promise<void> {
  
  // POST /wallet/connect - Connect wallet
  app.post('/connect', async (req, reply) => {
    try {
      const { provider, address, publicKey, signature } = connectWalletSchema.parse(req.body);
      
      logger.info('Wallet connection request', { provider, address: address.slice(0, 10) + '...' });

      // In a real implementation, you would:
      // 1. Validate the signature
      // 2. Store user session in database
      // 3. Generate JWT token
      // 4. Check if user exists, create if not

      // For now, return mock wallet data
      const walletData = {
        address,
        provider,
        balance: Math.random() * 1000, // Mock balance
        isConnected: true,
        network: 'sei-testnet',
        chainId: 'atlantic-2'
      };

      // Store in session (in production, use proper session management)
      (req as any).session = {
        userId: `user_${address}`,
        walletAddress: address,
        provider,
        connectedAt: new Date().toISOString()
      };

      return reply.send({
        ok: true,
        wallet: walletData,
        message: 'Wallet connected successfully'
      });

    } catch (error) {
      logger.error('Error connecting wallet:', error);
      return reply.status(400).send({
        ok: false,
        error: 'Failed to connect wallet',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POST /wallet/disconnect - Disconnect wallet
  app.post('/disconnect', async (req, reply) => {
    try {
      // Clear session
      (req as any).session = null;

      return reply.send({
        ok: true,
        message: 'Wallet disconnected successfully'
      });

    } catch (error) {
      logger.error('Error disconnecting wallet:', error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to disconnect wallet'
      });
    }
  });

  // GET /wallet/balance/:address - Get wallet balance
  app.get('/balance/:address', async (req, reply) => {
    try {
      const params = z.object({ address: z.string() }).parse(req.params);
      
      // In a real implementation, query the blockchain for actual balance
      // For now, return mock data
      const balance = {
        address: params.address,
        balance: Math.random() * 1000,
        denom: 'usei',
        formatted: `${(Math.random() * 1000).toFixed(2)} SEI`,
        lastUpdated: new Date().toISOString()
      };

      return reply.send({
        ok: true,
        balance
      });

    } catch (error) {
      logger.error('Error getting balance:', error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to get balance'
      });
    }
  });

  // POST /wallet/sign - Sign transaction
  app.post('/sign', async (req, reply) => {
    try {
      const { transaction, walletAddress } = signTransactionSchema.parse(req.body);
      
      logger.info('Transaction signing request', { 
        walletAddress: walletAddress.slice(0, 10) + '...',
        transactionType: transaction.type || 'unknown'
      });

      // In a real implementation:
      // 1. Validate the transaction
      // 2. Prepare for signing
      // 3. Return signing data

      const signingData = {
        transactionId: `tx_${Date.now()}`,
        transaction,
        walletAddress,
        status: 'ready_for_signing',
        createdAt: new Date().toISOString()
      };

      return reply.send({
        ok: true,
        signingData,
        message: 'Transaction prepared for signing'
      });

    } catch (error) {
      logger.error('Error preparing transaction for signing:', error);
      return reply.status(400).send({
        ok: false,
        error: 'Failed to prepare transaction for signing',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // GET /wallet/session - Get current session
  app.get('/session', async (req, reply) => {
    try {
      const session = (req as any).session;
      
      if (!session) {
        return reply.status(401).send({
          ok: false,
          error: 'No active session'
        });
      }

      return reply.send({
        ok: true,
        session: {
          userId: session.userId,
          walletAddress: session.walletAddress,
          provider: session.provider,
          connectedAt: session.connectedAt,
          isActive: true
        }
      });

    } catch (error) {
      logger.error('Error getting session:', error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to get session'
      });
    }
  });

  // GET /wallet/supported - Get supported wallets
  app.get('/supported', async (req, reply) => {
    try {
      const supportedWallets = [
        {
          id: 'metamask',
          name: 'MetaMask',
          description: 'Connect your Ethereum wallet to Sei Network with full Cosmos support',
          icon: '🦊',
          features: ['Full Cosmos Support', 'Sei Network Ready', 'Professional Integration'],
          downloadUrl: 'https://metamask.io/',
          isRecommended: true
        }
      ];

      return reply.send({
        ok: true,
        wallets: supportedWallets,
        total: supportedWallets.length
      });

    } catch (error) {
      logger.error('Error getting supported wallets:', error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to get supported wallets'
      });
    }
  });
}