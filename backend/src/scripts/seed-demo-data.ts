#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';
import { logger } from '../lib/logger';

const prisma = new PrismaClient();

interface DemoUser {
  address: string;
  username: string;
  balance: number;
}

interface DemoTransfer {
  fromAddress: string;
  toAddress: string;
  amount: number;
  denom: string;
  status: 'completed' | 'pending' | 'failed';
  remark?: string;
}

interface DemoGroup {
  name: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  creator: string;
  participants: string[];
  maxParticipants: number;
  status: 'active' | 'completed' | 'cancelled';
}

interface DemoPot {
  name: string;
  targetAmount: number;
  currentAmount: number;
  owner: string;
  category: 'vacation' | 'car' | 'house' | 'investment' | 'other';
  autoSaveEnabled: boolean;
  autoSaveAmount?: number;
}

interface DemoVault {
  name: string;
  description: string;
  strategy: string;
  depositedAmount: number;
  owner: string;
  apy: number;
  riskLevel: 'low' | 'medium' | 'high';
}

// Demo data
const demoUsers: DemoUser[] = [
  { address: 'sei1qy352euf3kfn4w3jz2g7nvtf5jl3tqvl7wy2lx', username: 'alice_crypto', balance: 1250.75 },
  { address: 'sei1r4v9z5f7zx8y6m2k3n8s9t4w5e1r2q3a5b7c9', username: 'bob_trader', balance: 2500.50 },
  { address: 'sei1s5w0z6g8a9b1k4n5s9t6w7e2r3q4a6b8c0d2f', username: 'charlie_defi', balance: 3750.25 },
  { address: 'sei1t6x1a7h9b2k5n6s0t7w8e3r4q5a7b9c1d3f5g', username: 'diana_vault', balance: 1875.80 },
  { address: 'sei1u7y2b8i0c3k6n7s1t8w9e4r5q6a8b0c2d4f6h', username: 'evan_saver', balance: 950.40 }
];

const demoTransfers: DemoTransfer[] = [
  {
    fromAddress: 'sei1qy352euf3kfn4w3jz2g7nvtf5jl3tqvl7wy2lx',
    toAddress: 'sei1r4v9z5f7zx8y6m2k3n8s9t4w5e1r2q3a5b7c9',
    amount: 125.50,
    denom: 'usei',
    status: 'completed',
    remark: 'Payment for services'
  },
  {
    fromAddress: 'sei1r4v9z5f7zx8y6m2k3n8s9t4w5e1r2q3a5b7c9',
    toAddress: 'sei1s5w0z6g8a9b1k4n5s9t6w7e2r3q4a6b8c0d2f',
    amount: 250.00,
    denom: 'usei',
    status: 'completed',
    remark: 'Group contribution'
  },
  {
    fromAddress: 'sei1s5w0z6g8a9b1k4n5s9t6w7e2r3q4a6b8c0d2f',
    toAddress: 'sei1t6x1a7h9b2k5n6s0t7w8e3r4q5a7b9c1d3f5g',
    amount: 75.25,
    denom: 'usei',
    status: 'pending',
    remark: 'Vault deposit'
  },
  {
    fromAddress: 'sei1t6x1a7h9b2k5n6s0t7w8e3r4q5a7b9c1d3f5g',
    toAddress: 'sei1u7y2b8i0c3k6n7s1t8w9e4r5q6a8b0c2d4f6h',
    amount: 50.00,
    denom: 'usei',
    status: 'completed',
    remark: 'Savings transfer'
  }
];

const demoGroups: DemoGroup[] = [
  {
    name: 'Vacation Fund 2024',
    description: 'Group savings for a summer vacation trip',
    targetAmount: 5000,
    currentAmount: 3250,
    creator: 'sei1qy352euf3kfn4w3jz2g7nvtf5jl3tqvl7wy2lx',
    participants: [
      'sei1qy352euf3kfn4w3jz2g7nvtf5jl3tqvl7wy2lx',
      'sei1r4v9z5f7zx8y6m2k3n8s9t4w5e1r2q3a5b7c9',
      'sei1s5w0z6g8a9b1k4n5s9t6w7e2r3q4a6b8c0d2f'
    ],
    maxParticipants: 5,
    status: 'active'
  },
  {
    name: 'DeFi Investment Pool',
    description: 'Collective DeFi investment strategies',
    targetAmount: 10000,
    currentAmount: 7500,
    creator: 'sei1r4v9z5f7zx8y6m2k3n8s9t4w5e1r2q3a5b7c9',
    participants: [
      'sei1r4v9z5f7zx8y6m2k3n8s9t4w5e1r2q3a5b7c9',
      'sei1s5w0z6g8a9b1k4n5s9t6w7e2r3q4a6b8c0d2f',
      'sei1t6x1a7h9b2k5n6s0t7w8e3r4q5a7b9c1d3f5g',
      'sei1u7y2b8i0c3k6n7s1t8w9e4r5q6a8b0c2d4f6h'
    ],
    maxParticipants: 8,
    status: 'active'
  }
];

const demoPots: DemoPot[] = [
  {
    name: 'Emergency Fund',
    targetAmount: 1000,
    currentAmount: 650,
    owner: 'sei1qy352euf3kfn4w3jz2g7nvtf5jl3tqvl7wy2lx',
    category: 'other',
    autoSaveEnabled: true,
    autoSaveAmount: 25
  },
  {
    name: 'New Car Fund',
    targetAmount: 15000,
    currentAmount: 4500,
    owner: 'sei1r4v9z5f7zx8y6m2k3n8s9t4w5e1r2q3a5b7c9',
    category: 'car',
    autoSaveEnabled: true,
    autoSaveAmount: 150
  },
  {
    name: 'House Down Payment',
    targetAmount: 50000,
    currentAmount: 12000,
    owner: 'sei1s5w0z6g8a9b1k4n5s9t6w7e2r3q4a6b8c0d2f',
    category: 'house',
    autoSaveEnabled: false
  },
  {
    name: 'Investment Portfolio',
    targetAmount: 25000,
    currentAmount: 8750,
    owner: 'sei1t6x1a7h9b2k5n6s0t7w8e3r4q5a7b9c1d3f5g',
    category: 'investment',
    autoSaveEnabled: true,
    autoSaveAmount: 200
  }
];

const demoVaults: DemoVault[] = [
  {
    name: 'High Yield SEI',
    description: 'Conservative SEI staking strategy',
    strategy: 'Conservative',
    depositedAmount: 2500,
    owner: 'sei1qy352euf3kfn4w3jz2g7nvtf5jl3tqvl7wy2lx',
    apy: 12.5,
    riskLevel: 'low'
  },
  {
    name: 'DeFi Yield Farm',
    description: 'Aggressive yield farming across protocols',
    strategy: 'Aggressive',
    depositedAmount: 5000,
    owner: 'sei1r4v9z5f7zx8y6m2k3n8s9t4w5e1r2q3a5b7c9',
    apy: 24.8,
    riskLevel: 'high'
  },
  {
    name: 'Balanced Portfolio',
    description: 'Balanced approach to DeFi yields',
    strategy: 'Balanced',
    depositedAmount: 3750,
    owner: 'sei1s5w0z6g8a9b1k4n5s9t6w7e2r3q4a6b8c0d2f',
    apy: 18.2,
    riskLevel: 'medium'
  }
];

async function seedDemoData() {
  try {
    logger.info('🌱 Starting demo data seeding...');

    // Clear existing data
    logger.info('🧹 Clearing existing data...');
    await prisma.transfer.deleteMany({});
    await prisma.group.deleteMany({});
    await prisma.pot.deleteMany({});
    await prisma.vault.deleteMany({});
    await prisma.user.deleteMany({});

    // Seed users
    logger.info('👥 Creating demo users...');
    for (const user of demoUsers) {
      await prisma.user.create({
        data: {
          address: user.address,
          username: user.username,
          email: `${user.username}@example.com`
        }
      });
    }

    // Seed transfers
    logger.info('💸 Creating demo transfers...');
    for (const transfer of demoTransfers) {
      await prisma.transfer.create({
        data: {
          sender: transfer.fromAddress,
          recipient: transfer.toAddress,
          amount: transfer.amount.toString(),
          denom: transfer.denom,
          status: transfer.status.toUpperCase(),
          metadata: JSON.stringify({ remark: transfer.remark }),
          txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
          blockHeight: Math.floor(Math.random() * 1000000) + 1000000,
          expiry: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
        }
      });
    }

    // Seed groups
    logger.info('👫 Creating demo groups...');
    for (const group of demoGroups) {
      await prisma.group.create({
        data: {
          groupId: `group_${Math.random().toString(36).substr(2, 9)}`,
          name: group.name,
          description: group.description
        }
      });
    }

    // Seed pots
    logger.info('🍯 Creating demo savings pots...');
    for (const pot of demoPots) {
      await prisma.pot.create({
        data: {
          potId: `pot_${Math.random().toString(36).substr(2, 9)}`,
          name: pot.name,
          description: `Saving goal for ${pot.name}`,
          targetAmount: pot.targetAmount.toString(),
          currentAmount: pot.currentAmount.toString(),
          expiry: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000), // Next year
          status: 'ACTIVE'
        }
      });
    }

    // Seed vaults
    logger.info('🏦 Creating demo vaults...');
    for (const vault of demoVaults) {
      await prisma.vault.create({
        data: {
          vaultId: `vault_${Math.random().toString(36).substr(2, 9)}`,
          name: vault.name,
          description: vault.description,
          strategy: vault.strategy,
          riskLevel: vault.riskLevel.toUpperCase(),
          totalDeposits: vault.depositedAmount.toString(),
          totalValue: vault.depositedAmount.toString(),
          apr: vault.apy.toString(),
          status: 'ACTIVE'
        }
      });
    }

    // Demo data completed
    logger.info('✨ Demo data creation completed!');

    logger.info('✅ Demo data seeding completed successfully!');
    
    // Print summary
    const stats = {
      users: await prisma.user.count(),
      transfers: await prisma.transfer.count(),
      groups: await prisma.group.count(),
      pots: await prisma.pot.count(),
      vaults: await prisma.vault.count()
    };

    logger.info('📊 Demo data summary:', stats);

  } catch (error) {
    logger.error('❌ Error seeding demo data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedDemoData()
    .then(() => {
      logger.info('🎉 Demo data seeding script completed!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Demo data seeding script failed:', error);
      process.exit(1);
    });
}

export { seedDemoData };
