import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getEnhancedSdk } from '../../../lib/sdk-enhanced-fixed';
import { getRealDataService } from '../../../services/realDataService';
import { getWalletService } from '../../../services/walletService';
import { logger } from '../../../lib/logger';

const createVaultSchema = z.object({
  label: z.string().min(1).max(100),
  strategy: z.string().min(1).max(50),
  feeBps: z.number().min(0).max(10000), // basis points (0-100%)
  minDeposit: z.string().regex(/^\d+$/),
  maxDeposit: z.string().regex(/^\d+$/).optional()
});

const depositSchema = z.object({
  amount: z.string().regex(/^\d+$/).min(1, 'Deposit amount is required')
});

const withdrawSchema = z.object({
  shares: z.string().regex(/^\d+$/).min(1, 'Shares amount is required')
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

export async function vaultsRoutes(app: FastifyInstance): Promise<void> {
  // GET /vaults - List all vaults with real data
  app.get('/', async (request: AuthenticatedRequest, reply) => {
    try {
      const query = z.object({
        strategy: z.string().optional(),
        limit: z.string().transform(val => parseInt(val) || 20).pipe(z.number().min(1).max(100)).default("20"),
        offset: z.string().transform(val => parseInt(val) || 0).pipe(z.number().min(0)).default("0")
      }).parse(request.query);

      const realDataService = await getRealDataService();
      
      // Get real vaults from contract
      const allVaults = await realDataService.getVaults();
      
      // Apply strategy filter
      let filteredVaults = allVaults;
      if (query.strategy) {
        filteredVaults = allVaults.filter((v: any) => v.strategy === query.strategy);
      }

      // Apply pagination
      const paginatedVaults = filteredVaults.slice(query.offset, query.offset + query.limit);
      
      logger.info(`Retrieved ${paginatedVaults.length}/${filteredVaults.length} vaults${query.strategy ? ` with strategy ${query.strategy}` : ''}`);
      
      reply.send({
        ok: true,
        data: {
          vaults: paginatedVaults,
          total: filteredVaults.length,
          page: Math.floor(query.offset / query.limit) + 1,
          totalPages: Math.ceil(filteredVaults.length / query.limit),
          strategy: query.strategy || null,
          lastUpdated: new Date().toISOString(),
        }
      });
    } catch (error) {
      logger.error('Error listing vaults:', error);
      reply.status(500).send({
        ok: false,
        error: 'Failed to list vaults',
        details: (error as Error).message,
      });
    }
  });

  // GET /vaults/:id - Get specific vault with real data
  app.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      if (!id) {
        reply.status(400).send({
          ok: false,
          error: 'Vault ID is required',
        });
        return;
      }

      // Get real vault from contract via real data service
      const realDataService = await getRealDataService();
      const vault = await realDataService.getVault(id);
      
      if (!vault) {
        reply.status(404).send({
          ok: false,
          error: 'Vault not found',
          message: `Vault with ID ${id} does not exist`
        });
        return;
      }

      logger.info(`Retrieved vault ${id} with real data`);
      
      reply.send({
        ok: true,
        data: {
          vault: {
            ...vault,
            id,
            retrievedAt: new Date().toISOString(),
          }
        }
      });
    } catch (error) {
      logger.error('Error getting vault:', error);
      reply.status(500).send({
        ok: false,
        error: 'Failed to get vault',
        details: (error as Error).message,
      });
    }
  });

  // POST /vaults - Create real vault
  app.post('/', async (request: AuthenticatedRequest, reply) => {
    try {
      const body = createVaultSchema.parse(request.body);
      
      // Get creator address from authenticated user
      const creator = request.user?.address;
      if (!creator) {
        reply.status(401).send({
          ok: false,
          error: 'Authentication required',
          message: 'Please connect your wallet to create vaults'
        });
        return;
      }

      // Validate fee percentage
      if (body.feeBps > 1000) { // Max 10% fee
        reply.status(400).send({
          ok: false,
          error: 'Fee too high',
          message: 'Maximum fee is 10% (1000 basis points)'
        });
        return;
      }

      // Validate deposit amounts
      const minDeposit = parseInt(body.minDeposit);
      const maxDeposit = body.maxDeposit ? parseInt(body.maxDeposit) : null;
      
      if (isNaN(minDeposit) || minDeposit <= 0) {
        reply.status(400).send({
          ok: false,
          error: 'Invalid minimum deposit',
          message: 'Minimum deposit must be a positive number'
        });
        return;
      }

      if (maxDeposit && (isNaN(maxDeposit) || maxDeposit <= minDeposit)) {
        reply.status(400).send({
          ok: false,
          error: 'Invalid maximum deposit',
          message: 'Maximum deposit must be greater than minimum deposit'
        });
        return;
      }

      // Create real vault using SDK
      const sdk = await getEnhancedSdk();
      
      const vaultData = {
        label: body.label,
        strategy: body.strategy,
        fee_bps: body.feeBps,
        min_deposit: body.minDeposit,
        max_deposit: body.maxDeposit,
      };

      // Execute real vault creation transaction
      // Note: This requires a signing client which would be provided by the frontend
      // For now, we'll return a structured response that indicates the transaction would be executed
      const result = await sdk.createVault(creator, vaultData);
      const vaultId = extractVaultIdFromEvents(result.events);
      
      logger.info(`Vault created: ${vaultId}, TX: ${result.transactionHash}`);
      
      reply.send({
        ok: true,
        data: {
          vaultId,
          txHash: result.transactionHash,
          blockHeight: result.height,
          gasUsed: result.gasUsed,
          status: 'active',
          creator,
          label: body.label,
          strategy: body.strategy,
          feeBps: body.feeBps,
          minDeposit: body.minDeposit,
          maxDeposit: body.maxDeposit,
          tvl: '0',
          apr: 0,
          createdAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error creating vault:', error);
      reply.status(500).send({
        ok: false,
        error: 'Failed to create vault',
        details: (error as Error).message,
      });
    }
  });

  // POST /vaults/:id/deposit - Deposit to real vault
  app.post('/:id/deposit', async (request: AuthenticatedRequest, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = depositSchema.parse(request.body);
      
      // Get depositor address from authenticated user
      const depositor = request.user?.address;
      if (!depositor) {
        reply.status(401).send({
          ok: false,
          error: 'Authentication required',
          message: 'Please connect your wallet to deposit'
        });
        return;
      }

      // Validate deposit amount
      const amount = parseInt(body.amount);
      if (isNaN(amount) || amount <= 0) {
        reply.status(400).send({
          ok: false,
          error: 'Invalid deposit amount',
          message: 'Amount must be a positive number'
        });
        return;
      }

      // Check depositor balance
      const walletService = getWalletService();
      const depositorBalance = await walletService.getWalletBalance(depositor);
      const seiBalance = depositorBalance.balances.find(b => b.denom === 'usei');
      const availableBalance = seiBalance ? parseInt(seiBalance.amount) : 0;
      
      if (availableBalance < amount) {
        reply.status(400).send({
          ok: false,
          error: 'Insufficient balance',
          message: `Available: ${availableBalance} usei, Required: ${amount} usei`
        });
        return;
      }

      // Get vault details first to verify
      const realDataService = await getRealDataService();
      const vault = await realDataService.getVault(id);
      
      if (!vault) {
        reply.status(404).send({
          ok: false,
          error: 'Vault not found',
          message: `Vault with ID ${id} does not exist`
        });
        return;
      }

      // Check deposit limits
      const minDeposit = parseInt(vault.min_deposit || '0');
      const maxDeposit = vault.max_deposit ? parseInt(vault.max_deposit) : null;
      
      if (amount < minDeposit) {
        reply.status(400).send({
          ok: false,
          error: 'Deposit below minimum',
          message: `Minimum deposit: ${minDeposit} usei, Attempted: ${amount} usei`
        });
        return;
      }

      if (maxDeposit && amount > maxDeposit) {
        reply.status(400).send({
          ok: false,
          error: 'Deposit above maximum',
          message: `Maximum deposit: ${maxDeposit} usei, Attempted: ${amount} usei`
        });
        return;
      }

      // Execute real deposit transaction
      const sdk = await getEnhancedSdk();
      const depositAmount = { amount: amount.toString(), denom: 'usei' };
      const result = await sdk.depositToVault(depositor, id, depositAmount);

      // Extract shares received from transaction events
      const sharesReceived = extractSharesFromEvents(result.events);
      
      logger.info(`Deposit made to vault ${id}, TX: ${result.transactionHash}`);
      
      reply.send({
        ok: true,
        data: {
          vaultId: id,
          txHash: result.transactionHash,
          blockHeight: result.height,
          gasUsed: result.gasUsed,
          depositor,
          amount: body.amount,
          sharesReceived: sharesReceived || '0',
          depositedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error depositing to vault:', error);
      reply.status(500).send({
        ok: false,
        error: 'Failed to deposit to vault',
        details: (error as Error).message,
      });
    }
  });

  // POST /vaults/:id/withdraw - Withdraw from real vault
  app.post('/:id/withdraw', async (request: AuthenticatedRequest, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = withdrawSchema.parse(request.body);
      
      // Get withdrawer address from authenticated user
      const withdrawer = request.user?.address;
      if (!withdrawer) {
        reply.status(401).send({
          ok: false,
          error: 'Authentication required',
          message: 'Please connect your wallet to withdraw'
        });
        return;
      }

      // Validate shares amount
      const shares = parseInt(body.shares);
      if (isNaN(shares) || shares <= 0) {
        reply.status(400).send({
          ok: false,
          error: 'Invalid shares amount',
          message: 'Shares must be a positive number'
        });
        return;
      }

      // Get vault details and user position
      const realDataService = await getRealDataService();
      const vault = await realDataService.getVault(id);
      
      if (!vault) {
        reply.status(404).send({
          ok: false,
          error: 'Vault not found',
          message: `Vault with ID ${id} does not exist`
        });
        return;
      }

      // Check user's share balance from real contract data
      const userPosition = await realDataService.getUserVaultPosition(id, withdrawer);
      const userShares = userPosition ? parseInt(userPosition.shares || '0') : 0;
      
      if (shares > userShares) {
        reply.status(400).send({
          ok: false,
          error: 'Insufficient shares',
          message: `Available shares: ${userShares}, Requested: ${shares}`
        });
        return;
      }

      // Execute real withdrawal transaction
      const sdk = await getEnhancedSdk();
      const result = await sdk.withdrawFromVault(withdrawer, id, shares.toString());

      // Extract withdrawal amount from transaction events
      const withdrawalAmount = extractWithdrawalAmountFromEvents(result.events);
      
      logger.info(`Withdrawal from vault ${id}, TX: ${result.transactionHash}`);
      
      reply.send({
        ok: true,
        data: {
          vaultId: id,
          txHash: result.transactionHash,
          blockHeight: result.height,
          gasUsed: result.gasUsed,
          withdrawer,
          sharesRedeemed: body.shares,
          amountReceived: withdrawalAmount || '0',
          withdrawnAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error withdrawing from vault:', error);
      reply.status(500).send({
        ok: false,
        error: 'Failed to withdraw from vault',
        details: (error as Error).message,
      });
    }
  });

  // GET /vaults/:id/position - Get user position in vault
  app.get('/:id/position', async (request: AuthenticatedRequest, reply) => {
    try {
      const { id } = request.params as { id: string };
      const address = request.query?.addr || request.user?.address;
      
      if (!address) {
        reply.status(400).send({
          ok: false,
          error: 'Address is required',
          message: 'Please provide an address parameter or authenticate'
        });
        return;
      }

      // Validate address format
      const walletService = getWalletService();
      const validation = walletService.validateWalletAddress(address);
      if (!validation.valid) {
        reply.status(400).send({
          ok: false,
          error: 'Invalid address format',
          details: validation.error
        });
        return;
      }

      // Get real user position from contract
      const realDataService = await getRealDataService();
      const position = await realDataService.getUserVaultPosition(id, address);
      
      if (!position) {
        reply.send({
          ok: true,
          data: {
            position: {
              vaultId: id,
              address,
              shares: '0',
              percentage: '0.0000',
              value: '0',
              shareValue: 0,
              shareValueFormatted: '0 SEI',
              sharesFormatted: '0',
              vault: null,
              retrievedAt: new Date().toISOString(),
            }
          }
        });
        return;
      }

      logger.info(`Retrieved real position for ${address} in vault ${id}`);
      
      reply.send({
        ok: true,
        data: {
          position: {
            vaultId: id,
            address,
            shares: position.shares || '0',
            percentage: position.percentage?.toFixed(4) || '0.0000',
            value: position.shareValue?.toString() || '0',
            shareValue: position.shareValue || 0,
            shareValueFormatted: position.shareValueFormatted || '0 SEI',
            sharesFormatted: position.sharesFormatted || '0',
            vault: position.vault ? {
              label: position.vault.label,
              strategy: position.vault.strategy,
              tvl: position.vault.tvl,
              apr: position.vault.apr,
            } : null,
            retrievedAt: position.lastUpdated || new Date().toISOString(),
          }
        }
      });
    } catch (error) {
      logger.error('Error getting vault position:', error);
      reply.status(500).send({
        ok: false,
        error: 'Failed to get vault position',
        details: (error as Error).message,
      });
    }
  });

  // POST /vaults/:id/harvest - Harvest vault rewards
  app.post('/:id/harvest', async (request: AuthenticatedRequest, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      // Get harvester address from authenticated user
      const harvester = request.user?.address;
      if (!harvester) {
        reply.status(401).send({
          ok: false,
          error: 'Authentication required',
          message: 'Please connect your wallet to harvest'
        });
        return;
      }

      // Get vault details first to verify
      const realDataService = await getRealDataService();
      const vault = await realDataService.getVault(id);
      
      if (!vault) {
        reply.status(404).send({
          ok: false,
          error: 'Vault not found',
          message: `Vault with ID ${id} does not exist`
        });
        return;
      }

      // Execute real harvest transaction
      const sdk = await getEnhancedSdk();
      const result = await sdk.harvestVault(harvester, id);

      // Extract rewards from transaction events
      const rewardsHarvested = extractRewardsFromEvents(result.events);
      
      logger.info(`Vault ${id} harvested, TX: ${result.transactionHash}`);
      
      reply.send({
        ok: true,
        data: {
          vaultId: id,
          txHash: result.transactionHash,
          blockHeight: result.height,
          gasUsed: result.gasUsed,
          harvester,
          rewardsHarvested: rewardsHarvested || '0',
          harvestedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error harvesting vault:', error);
      reply.status(500).send({
        ok: false,
        error: 'Failed to harvest vault',
        details: (error as Error).message,
      });
    }
  });

  // Health check endpoint
  app.get('/health', async (request, reply) => {
    try {
      const sdk = await getEnhancedSdk();
      const health = await sdk.healthCheck();
      
      reply.send({
        ok: true,
        service: 'vaults',
        healthy: health.healthy,
        contracts: health.contracts,
        rpcHealth: health.rpcHealth,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Vaults health check failed:', error);
      reply.status(500).send({
        ok: false,
        service: 'vaults',
        healthy: false,
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      });
    }
  });
}

// Helper functions to extract data from transaction events
function extractVaultIdFromEvents(events: readonly any[]): string {
  try {
    for (const event of events) {
      if (event.type === 'wasm') {
        for (const attr of event.attributes) {
          if (attr.key === 'vault_id') {
            return attr.value;
          }
        }
      }
    }
    // Fallback to timestamp-based ID if not found in events
    return `vault_${Date.now()}`;
  } catch (error) {
    logger.warn('Failed to extract vault ID from events:', error);
    return `vault_${Date.now()}`;
  }
}

function extractSharesFromEvents(events: readonly any[]): string | null {
  try {
    for (const event of events) {
      if (event.type === 'wasm') {
        for (const attr of event.attributes) {
          if (attr.key === 'shares_received' || attr.key === 'shares') {
            return attr.value;
          }
        }
      }
    }
    return null;
  } catch (error) {
    logger.warn('Failed to extract shares from events:', error);
    return null;
  }
}

function extractWithdrawalAmountFromEvents(events: readonly any[]): string | null {
  try {
    for (const event of events) {
      if (event.type === 'wasm') {
        for (const attr of event.attributes) {
          if (attr.key === 'amount_withdrawn' || attr.key === 'amount') {
            return attr.value;
          }
        }
      }
    }
    return null;
  } catch (error) {
    logger.warn('Failed to extract withdrawal amount from events:', error);
    return null;
  }
}

function extractRewardsFromEvents(events: readonly any[]): string | null {
  try {
    for (const event of events) {
      if (event.type === 'wasm') {
        for (const attr of event.attributes) {
          if (attr.key === 'rewards_harvested' || attr.key === 'rewards') {
            return attr.value;
          }
        }
      }
    }
    return null;
  } catch (error) {
    logger.warn('Failed to extract rewards from events:', error);
    return null;
  }
}