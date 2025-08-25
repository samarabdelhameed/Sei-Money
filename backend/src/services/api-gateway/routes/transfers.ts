import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getEnhancedSdk, BlockchainError } from '../../../lib/sdk-enhanced-fixed';
import { getRealDataService } from '../../../services/realDataService';
import { getWalletService } from '../../../services/walletService';
import { logger } from '../../../lib/logger';
import { BlockchainErrorHandler, UserFriendlyError } from '../../../lib/blockchain-error-handler';
import { ErrorTranslationService, ErrorReportingService } from '../../errorTranslationService';
import { FallbackDataService } from '../../fallbackDataService';

const CreateTransferSchema = z.object({
  recipient: z.string().min(1, 'Recipient address is required'),
  amount: z.string().min(1, 'Amount is required'),
  remark: z.string().optional(),
  expiry: z.string().optional(),
});

const ClaimTransferSchema = z.object({
  transferId: z.number(),
});

const RefundTransferSchema = z.object({
  transferId: z.number(),
});

const ListTransfersSchema = z.object({
  address: z.string().optional(),
  status: z.enum(['pending', 'claimed', 'refunded', 'expired']).optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
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

export async function transfersRoutes(app: FastifyInstance): Promise<void> {
  // Get transfers with real data and comprehensive error handling
  app.get('/', async (request: AuthenticatedRequest, reply) => {
    const context = 'get-transfers';
    
    try {
      const realDataService = await getRealDataService();
      const walletService = getWalletService();
      
      // Get address from query params or authenticated user
      const address = request.query?.address || request.user?.address;
      
      if (!address) {
        reply.status(400).send({
          ok: false,
          error: 'Address is required',
          message: 'Please provide an address parameter or authenticate',
          errorType: 'VALIDATION_ERROR',
          suggestion: 'Connect your wallet or provide an address parameter'
        });
        return;
      }

      // Validate address format
      const validation = walletService.validateWalletAddress(address);
      if (!validation.valid) {
        const userFriendlyError = BlockchainErrorHandler.categorizeError(new Error('Invalid address format'));
        const translation = ErrorTranslationService.translateError(userFriendlyError);
        
        reply.status(400).send({
          ok: false,
          error: 'Invalid address format',
          details: validation.error,
          errorType: userFriendlyError.type,
          translation
        });
        return;
      }

      // Get real transfers from contract with fallback support
      const transfers = await FallbackDataService.withFallback(
        () => realDataService.getUserTransfers(address),
        'transfers',
        context
      );
      
      // Apply filters if provided
      let filteredTransfers = transfers;
      if (request.query?.status) {
        filteredTransfers = transfers.filter(t => t.status === request.query.status);
      }

      // Apply pagination
      const limit = request.query?.limit || 20;
      const offset = request.query?.offset || 0;
      const total = filteredTransfers.length;
      const paginatedTransfers = filteredTransfers.slice(offset, offset + limit);
      
      logger.info(`Retrieved ${paginatedTransfers.length}/${total} transfers for address ${address}`);
      
      reply.send({
        ok: true,
        data: {
          transfers: paginatedTransfers,
          pagination: {
            total,
            limit,
            offset,
          },
          address,
          lastUpdated: new Date().toISOString(),
          isFallbackData: FallbackDataService.isFallbackActive() && transfers.length === 0
        },
      });
    } catch (error) {
      const userFriendlyError = BlockchainErrorHandler.categorizeError(error);
      const translation = ErrorTranslationService.translateError(userFriendlyError);
      
      // Report error for monitoring
      ErrorReportingService.reportError(userFriendlyError, context, request.user?.address);
      
      // Try to provide fallback data
      const fallbackTransfers = FallbackDataService.getFallbackData('transfers');
      
      reply.status(500).send({
        ok: false,
        error: 'Failed to fetch transfers',
        details: (error as Error).message,
        errorType: userFriendlyError.type,
        translation,
        fallbackData: fallbackTransfers,
        retryable: userFriendlyError.retryable,
        recoveryTime: ErrorTranslationService.getRecoveryTimeEstimate(userFriendlyError.type)
      });
    }
  });

  // Create real transfer with comprehensive error handling
  app.post('/', async (request: AuthenticatedRequest, reply) => {
    const context = 'create-transfer';
    
    try {
      const body = CreateTransferSchema.parse(request.body);
      const walletService = getWalletService();
      
      // Get sender address from authenticated user
      const sender = request.user?.address;
      if (!sender) {
        const userFriendlyError: UserFriendlyError = {
          type: 'UNAUTHORIZED',
          message: 'Authentication required',
          suggestion: 'Please connect your wallet to create transfers',
          code: 'ERR_NO_AUTH',
          retryable: true
        };
        const translation = ErrorTranslationService.translateError(userFriendlyError);
        
        reply.status(401).send({
          ok: false,
          error: 'Authentication required',
          message: 'Please connect your wallet to create transfers',
          errorType: userFriendlyError.type,
          translation
        });
        return;
      }

      // Validate recipient address
      const validation = walletService.validateWalletAddress(body.recipient);
      if (!validation.valid) {
        const userFriendlyError = BlockchainErrorHandler.categorizeError(new Error('Invalid recipient address'));
        const translation = ErrorTranslationService.translateError(userFriendlyError);
        
        reply.status(400).send({
          ok: false,
          error: 'Invalid recipient address',
          details: validation.error,
          errorType: userFriendlyError.type,
          translation
        });
        return;
      }

      // Validate amount
      const amount = parseInt(body.amount);
      if (isNaN(amount) || amount <= 0) {
        reply.status(400).send({
          ok: false,
          error: 'Invalid amount',
          message: 'Amount must be a positive number',
          errorType: 'VALIDATION_ERROR',
          suggestion: 'Please enter a valid positive number for the amount'
        });
        return;
      }

      // Check sender balance with error handling
      let senderBalance;
      try {
        senderBalance = await walletService.getWalletBalance(sender);
      } catch (balanceError) {
        const userFriendlyError = BlockchainErrorHandler.categorizeError(balanceError);
        const translation = ErrorTranslationService.translateError(userFriendlyError);
        
        reply.status(500).send({
          ok: false,
          error: 'Failed to check balance',
          details: (balanceError as Error).message,
          errorType: userFriendlyError.type,
          translation
        });
        return;
      }
      
      const seiBalance = senderBalance.balances.find(b => b.denom === 'usei');
      const availableBalance = seiBalance ? parseInt(seiBalance.amount) : 0;
      
      if (availableBalance < amount) {
        const userFriendlyError: UserFriendlyError = {
          type: 'INSUFFICIENT_FUNDS',
          message: 'Insufficient balance to complete transaction',
          suggestion: 'Please add more SEI to your wallet or reduce the transaction amount',
          code: 'ERR_INSUFFICIENT_FUNDS',
          retryable: false,
          details: { available: availableBalance, required: amount }
        };
        const translation = ErrorTranslationService.translateError(userFriendlyError);
        
        reply.status(400).send({
          ok: false,
          error: 'Insufficient balance',
          message: `Available: ${availableBalance} usei, Required: ${amount} usei`,
          errorType: userFriendlyError.type,
          translation,
          balanceInfo: {
            available: availableBalance,
            required: amount,
            shortfall: amount - availableBalance
          }
        });
        return;
      }

      // Create real transfer using SDK with enhanced error handling
      const sdk = await getEnhancedSdk();
      
      const transferData = {
        recipient: body.recipient,
        amount: { amount: body.amount, denom: 'usei' },
        expiry_ts: body.expiry ? Math.floor(new Date(body.expiry).getTime() / 1000) : undefined,
        remark: body.remark,
      };

      const result = await sdk.createTransfer(sender, transferData);
      
      // Extract transfer ID from transaction events
      const transferId = extractTransferIdFromEvents(result.events);
      
      logger.info(`Transfer created: ${transferId}, TX: ${result.transactionHash}`);
      
      reply.send({
        ok: true,
        data: {
          transferId,
          txHash: result.transactionHash,
          blockHeight: result.height,
          gasUsed: result.gasUsed,
          status: 'pending',
          sender,
          recipient: body.recipient,
          amount: body.amount,
          denom: 'usei',
          remark: body.remark,
          createdAt: new Date().toISOString(),
          explorerUrl: `https://seitrace.com/tx/${result.transactionHash}`
        },
      });
    } catch (error) {
      const userFriendlyError = BlockchainErrorHandler.categorizeError(error);
      const translation = ErrorTranslationService.translateError(userFriendlyError);
      
      // Report error for monitoring
      ErrorReportingService.reportError(userFriendlyError, context, request.user?.address);
      
      // Determine appropriate HTTP status code
      let statusCode = 500;
      if (userFriendlyError.type === 'INSUFFICIENT_FUNDS') statusCode = 400;
      if (userFriendlyError.type === 'UNAUTHORIZED') statusCode = 401;
      if (userFriendlyError.type === 'INVALID_ADDRESS') statusCode = 400;
      if (userFriendlyError.type === 'USER_REJECTED') statusCode = 400;
      
      reply.status(statusCode).send({
        ok: false,
        error: 'Failed to create transfer',
        details: (error as Error).message,
        errorType: userFriendlyError.type,
        translation,
        retryable: userFriendlyError.retryable,
        recoveryTime: ErrorTranslationService.getRecoveryTimeEstimate(userFriendlyError.type)
      });
    }
  });

  // Claim real transfer
  app.post('/:transferId/claim', async (request: AuthenticatedRequest, reply) => {
    try {
      const { transferId } = request.params as { transferId: string };
      const transferIdNum = parseInt(transferId);
      
      if (isNaN(transferIdNum)) {
        reply.status(400).send({
          ok: false,
          error: 'Invalid transfer ID',
          message: 'Transfer ID must be a number'
        });
        return;
      }
      
      // Get recipient address from authenticated user
      const recipient = request.user?.address;
      if (!recipient) {
        reply.status(401).send({
          ok: false,
          error: 'Authentication required',
          message: 'Please connect your wallet to claim transfers'
        });
        return;
      }

      // Get transfer details first to verify
      const sdk = await getEnhancedSdk();
      const transfer = await sdk.getTransfer(transferIdNum);
      
      if (!transfer) {
        reply.status(404).send({
          ok: false,
          error: 'Transfer not found',
          message: `Transfer with ID ${transferIdNum} does not exist`
        });
        return;
      }

      if (transfer.recipient !== recipient) {
        reply.status(403).send({
          ok: false,
          error: 'Unauthorized',
          message: 'You can only claim transfers sent to your address'
        });
        return;
      }

      if (transfer.status !== 'pending') {
        reply.status(400).send({
          ok: false,
          error: 'Transfer not claimable',
          message: `Transfer status is ${transfer.status}`
        });
        return;
      }

      // Check if transfer has expired
      if (transfer.expiry_ts && Date.now() / 1000 > transfer.expiry_ts) {
        reply.status(400).send({
          ok: false,
          error: 'Transfer expired',
          message: 'This transfer has expired and cannot be claimed'
        });
        return;
      }

      // Execute real claim transaction
      const result = await sdk.claimTransfer(recipient, transferIdNum);
      
      logger.info(`Transfer claimed: ${transferIdNum}, TX: ${result.transactionHash}`);
      
      reply.send({
        ok: true,
        data: {
          transferId: transferIdNum,
          txHash: result.transactionHash,
          blockHeight: result.height,
          gasUsed: result.gasUsed,
          status: 'claimed',
          claimedAt: new Date().toISOString(),
          recipient,
        },
      });
    } catch (error) {
      logger.error('Error claiming transfer:', error);
      reply.status(500).send({
        ok: false,
        error: 'Failed to claim transfer',
        details: (error as Error).message,
      });
    }
  });

  // Refund real transfer
  app.post('/:transferId/refund', async (request: AuthenticatedRequest, reply) => {
    try {
      const { transferId } = request.params as { transferId: string };
      const transferIdNum = parseInt(transferId);
      
      if (isNaN(transferIdNum)) {
        reply.status(400).send({
          ok: false,
          error: 'Invalid transfer ID',
          message: 'Transfer ID must be a number'
        });
        return;
      }
      
      // Get sender address from authenticated user
      const sender = request.user?.address;
      if (!sender) {
        reply.status(401).send({
          ok: false,
          error: 'Authentication required',
          message: 'Please connect your wallet to refund transfers'
        });
        return;
      }

      // Get transfer details first to verify
      const sdk = await getEnhancedSdk();
      const transfer = await sdk.getTransfer(transferIdNum);
      
      if (!transfer) {
        reply.status(404).send({
          ok: false,
          error: 'Transfer not found',
          message: `Transfer with ID ${transferIdNum} does not exist`
        });
        return;
      }

      if (transfer.sender !== sender) {
        reply.status(403).send({
          ok: false,
          error: 'Unauthorized',
          message: 'You can only refund transfers you created'
        });
        return;
      }

      if (transfer.status !== 'pending') {
        reply.status(400).send({
          ok: false,
          error: 'Transfer not refundable',
          message: `Transfer status is ${transfer.status}`
        });
        return;
      }

      // Execute real refund transaction
      const result = await sdk.refundTransfer(sender, transferIdNum);
      
      logger.info(`Transfer refunded: ${transferIdNum}, TX: ${result.transactionHash}`);
      
      reply.send({
        ok: true,
        data: {
          transferId: transferIdNum,
          txHash: result.transactionHash,
          blockHeight: result.height,
          gasUsed: result.gasUsed,
          status: 'refunded',
          refundedAt: new Date().toISOString(),
          sender,
        },
      });
    } catch (error) {
      logger.error('Error refunding transfer:', error);
      reply.status(500).send({
        ok: false,
        error: 'Failed to refund transfer',
        details: (error as Error).message,
      });
    }
  });

  // Get specific transfer with real data
  app.get('/:transferId', async (request, reply) => {
    try {
      const { transferId } = request.params as { transferId: string };
      const transferIdNum = parseInt(transferId);
      
      if (isNaN(transferIdNum)) {
        reply.status(400).send({
          ok: false,
          error: 'Invalid transfer ID',
          message: 'Transfer ID must be a number'
        });
        return;
      }

      // Get real transfer from contract
      const sdk = await getEnhancedSdk();
      const transfer = await sdk.getTransfer(transferIdNum);
      
      if (!transfer) {
        reply.status(404).send({
          ok: false,
          error: 'Transfer not found',
          message: `Transfer with ID ${transferIdNum} does not exist`
        });
        return;
      }

      logger.info(`Retrieved transfer ${transferIdNum}`);
      
      reply.send({
        ok: true,
        data: {
          ...transfer,
          id: transferIdNum,
          retrievedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error fetching transfer:', error);
      reply.status(500).send({
        ok: false,
        error: 'Failed to fetch transfer',
        details: (error as Error).message,
      });
    }
  });
}

// Helper function to extract transfer ID from transaction events
function extractTransferIdFromEvents(events: readonly any[]): string {
  try {
    for (const event of events) {
      if (event.type === 'wasm') {
        for (const attr of event.attributes) {
          if (attr.key === 'transfer_id') {
            return attr.value;
          }
        }
      }
    }
    // Fallback to timestamp-based ID if not found in events
    return `transfer_${Date.now()}`;
  } catch (error) {
    logger.warn('Failed to extract transfer ID from events:', error);
    return `transfer_${Date.now()}`;
  }
}