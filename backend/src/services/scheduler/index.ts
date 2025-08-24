import { Queue, QueueScheduler, Worker, JobsOptions } from 'bullmq';
import { prisma } from '../../lib/prisma';
import { getSdk } from '../../lib/sdk';
import { logger } from '../../lib/logger';

// Queue names
const QUEUES = {
  EXPIRED_TRANSFERS: 'expired-transfers',
  VAULT_HARVESTS: 'vault-harvests',
  ESCROW_EXPIRIES: 'escrow-expiries'
} as const;

// Redis connection
const redisConfig = {
  connection: { url: process.env.REDIS_URL || 'redis://localhost:6379' }
};

// Expired Transfers Queue
export const expiredTransfersQueue = new Queue(QUEUES.EXPIRED_TRANSFERS, redisConfig);
new QueueScheduler(QUEUES.EXPIRED_TRANSFERS, redisConfig);

// Vault Harvests Queue
export const vaultHarvestsQueue = new Queue(QUEUES.VAULT_HARVESTS, redisConfig);
new QueueScheduler(QUEUES.VAULT_HARVESTS, redisConfig);

// Escrow Expiries Queue
export const escrowExpiriesQueue = new Queue(QUEUES.ESCROW_EXPIRIES, redisConfig);
new QueueScheduler(QUEUES.ESCROW_EXPIRIES, redisConfig);

// Job scheduling functions
export async function scheduleExpiredTransfersScan() {
  const opts: JobsOptions = { 
    jobId: 'scan-expired-transfers', 
    removeOnComplete: true, 
    attempts: 3,
    repeat: { pattern: '*/5 * * * *' } // Every 5 minutes
  };
  
  await expiredTransfersQueue.add('scan', {}, opts);
}

export async function scheduleVaultHarvests() {
  const opts: JobsOptions = { 
    jobId: 'schedule-vault-harvests', 
    removeOnComplete: true, 
    attempts: 3,
    repeat: { pattern: '0 */1 * * *' } // Every hour
  };
  
  await vaultHarvestsQueue.add('schedule', {}, opts);
}

// Workers
export const expiredTransfersWorker = new Worker(
  QUEUES.EXPIRED_TRANSFERS,
  async (job) => {
    if (job.name === 'scan') {
      await scanExpiredTransfers();
    } else if (job.name === 'refund') {
      await refundExpiredTransfer(job.data.id);
    }
  },
  { ...redisConfig, concurrency: 5 }
);

export const vaultHarvestsWorker = new Worker(
  QUEUES.VAULT_HARVESTS,
  async (job) => {
    if (job.name === 'schedule') {
      await scheduleVaultHarvests();
    } else if (job.name === 'harvest') {
      await harvestVault(job.data.vaultId);
    }
  },
  { ...redisConfig, concurrency: 3 }
);

// Job implementations
async function scanExpiredTransfers() {
  const now = BigInt(Math.floor(Date.now() / 1000));
  
  const expired = await prisma.transferMeta.findMany({
    where: {
      expiryTs: { not: null, lte: now },
      status: 'created'
    },
    take: 200
  });

  if (expired.length === 0) return;

  logger.info(`Found ${expired.length} expired transfers`);

  for (const transfer of expired) {
    try {
      await expiredTransfersQueue.add(
        'refund',
        { id: transfer.transferId.toString() },
        { 
          jobId: `refund:${transfer.transferId}`, 
          removeOnComplete: true, 
          attempts: 3, 
          backoff: { type: 'exponential', delay: 5000 } 
        }
      );
    } catch (error) {
      logger.warn(`Refund job already enqueued for transfer ${transfer.transferId}`);
    }
  }
}

async function refundExpiredTransfer(transferId: string) {
  try {
    const sdk = await getSdk();
    const result = await sdk.payments.refundTransfer(Number(transferId));
    
    // Update local status
    await prisma.transferMeta.updateMany({
      where: { transferId: BigInt(transferId) },
      data: { status: 'refunded' }
    });

    logger.info(`Refunded expired transfer ${transferId}: ${result.txHash}`);
    return { txHash: result.txHash };
  } catch (error) {
    logger.error(`Failed to refund transfer ${transferId}:`, error);
    throw error;
  }
}

async function harvestVault(vaultId: string) {
  try {
    const sdk = await getSdk();
    const result = await sdk.vaults.harvest(vaultId);
    
    logger.info(`Harvested vault ${vaultId}: ${result.txHash}`);
    return { txHash: result.txHash };
  } catch (error) {
    logger.error(`Failed to harvest vault ${vaultId}:`, error);
    throw error;
  }
}

// Start all workers
export async function startScheduler() {
  logger.info('Starting scheduler service...');
  
  // Schedule recurring jobs
  await scheduleExpiredTransfersScan();
  await scheduleVaultHarvests();
  
  logger.info('Scheduler service started successfully');
}

// Graceful shutdown
export async function stopScheduler() {
  logger.info('Stopping scheduler service...');
  
  await expiredTransfersQueue.close();
  await vaultHarvestsQueue.close();
  await escrowExpiriesQueue.close();
  
  await expiredTransfersWorker.close();
  await vaultHarvestsWorker.close();
  
  logger.info('Scheduler service stopped');
}
