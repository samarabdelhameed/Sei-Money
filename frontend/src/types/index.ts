export interface User {
  id: string;
  address: string;
  username?: string;
  avatar?: string;
  reputation: number;
}

export interface Wallet {
  address: string;
  balance: number;
  isConnected: boolean;
  provider: 'keplr' | 'leap' | null;
}

export interface Transfer {
  id: string;
  sender: string;
  recipient: string;
  amount: number;
  status: 'pending' | 'completed' | 'expired' | 'refunded';
  expiry: Date;
  remark?: string;
  createdAt: Date;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  maxParticipants: number;
  currentParticipants: number;
  expiry: Date;
  creator: string;
  status: 'active' | 'completed' | 'expired';
  participants: GroupParticipant[];
}

export interface GroupParticipant {
  address: string;
  contribution: number;
  joinedAt: Date;
}

export interface SavingsPot {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  category: 'vacation' | 'car' | 'house' | 'investment' | 'other';
  autoSaveEnabled: boolean;
  autoSaveAmount: number;
  createdAt: Date;
  targetDate?: Date;
}

export interface Vault {
  id: string;
  name: string;
  description: string;
  tvl: number;
  apy: number;
  riskLevel: 'low' | 'medium' | 'high';
  strategy: string;
  minDeposit: number;
  isActive: boolean;
  performance: VaultPerformance[];
}

export interface VaultPerformance {
  date: Date;
  value: number;
  apy: number;
}

export interface Investment {
  id: string;
  vaultId: string;
  amount: number;
  shares: number;
  entryPrice: number;
  currentValue: number;
  pnl: number;
  pnlPercentage: number;
  createdAt: Date;
}

export interface EscrowCase {
  id: string;
  title: string;
  description: string;
  parties: string[];
  amount: number;
  status: 'pending' | 'active' | 'completed' | 'disputed' | 'resolved';
  approvals: Record<string, boolean>;
  expiry: Date;
  createdAt: Date;
  documents?: string[];
}

export interface AIAgent {
  type: 'risk' | 'scheduler' | 'rebalancer' | 'assistant';
  isOnline: boolean;
  lastUpdate: Date;
  recommendations: Recommendation[];
}

export interface Recommendation {
  id: string;
  type: 'rebalance' | 'withdraw' | 'deposit' | 'alert';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
}

export interface MarketData {
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  tvl: number;
  activeUsers: number;
}