// Mock Data for Testing and Development
import { Transfer, Group, SavingsPot, Vault, EscrowCase, MarketData, User, Wallet } from '../types';

// Mock User Data
export const mockUser: User = {
  id: 'user_123',
  address: 'sei1abc123def456ghi789jkl012mno345pqr678stu',
  username: 'DeFiTrader',
  email: 'trader@seimoney.com',
  avatar: '',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date(),
  preferences: {
    theme: 'dark',
    notifications: true,
    language: 'en'
  }
};

// Mock Wallet Data
export const mockWallet: Wallet = {
  address: 'sei1abc123def456ghi789jkl012mno345pqr678stu',
  balance: 1250.75,
  provider: 'keplr',
  chainId: 'sei-chain',
  isConnected: true
};

// Mock Transfers Data
export const mockTransfers: Transfer[] = [
  {
    id: 'transfer_001',
    sender: 'sei1abc123def456ghi789jkl012mno345pqr678stu',
    recipient: 'sei1def456ghi789jkl012mno345pqr678stu901abc',
    amount: 100.5,
    status: 'completed',
    txHash: '0x1234567890abcdef1234567890abcdef12345678',
    createdAt: new Date('2024-02-20T10:30:00Z'),
    completedAt: new Date('2024-02-20T10:31:00Z'),
    fee: 0.1,
    memo: 'Payment for services'
  },
  {
    id: 'transfer_002',
    sender: 'sei1abc123def456ghi789jkl012mno345pqr678stu',
    recipient: 'sei1ghi789jkl012mno345pqr678stu901abc234def',
    amount: 50.25,
    status: 'pending',
    txHash: '0xabcdef1234567890abcdef1234567890abcdef12',
    createdAt: new Date('2024-02-21T14:15:00Z'),
    fee: 0.1,
    memo: 'Group contribution'
  },
  {
    id: 'transfer_003',
    sender: 'sei1def456ghi789jkl012mno345pqr678stu901abc',
    recipient: 'sei1abc123def456ghi789jkl012mno345pqr678stu',
    amount: 75.0,
    status: 'completed',
    txHash: '0x567890abcdef1234567890abcdef1234567890ab',
    createdAt: new Date('2024-02-19T16:45:00Z'),
    completedAt: new Date('2024-02-19T16:46:00Z'),
    fee: 0.1,
    memo: 'Refund'
  }
];

// Mock Groups Data
export const mockGroups: Group[] = [
  {
    id: 'group_001',
    name: 'DeFi Builders',
    description: 'A group for DeFi enthusiasts and builders',
    creator: 'sei1abc123def456ghi789jkl012mno345pqr678stu',
    members: [
      'sei1abc123def456ghi789jkl012mno345pqr678stu',
      'sei1def456ghi789jkl012mno345pqr678stu901abc',
      'sei1ghi789jkl012mno345pqr678stu901abc234def'
    ],
    targetAmount: 1000,
    currentAmount: 650.75,
    status: 'active',
    createdAt: new Date('2024-02-01'),
    endDate: new Date('2024-03-01'),
    category: 'investment'
  },
  {
    id: 'group_002',
    name: 'Vacation Fund',
    description: 'Saving together for a group vacation',
    creator: 'sei1def456ghi789jkl012mno345pqr678stu901abc',
    members: [
      'sei1abc123def456ghi789jkl012mno345pqr678stu',
      'sei1def456ghi789jkl012mno345pqr678stu901abc'
    ],