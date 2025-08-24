/**
 * Common types for SeiMoney Telegram Bot
 */

export interface BotConfig {
  token: string;
  rpcUrl: string;
  contracts: {
    payments: string;
    groups: string;
    pots: string;
    alias: string;
    riskEscrow: string;
    vaults: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  database: {
    url: string;
  };
}

export interface UserSession {
  userId: string;
  telegramId: number;
  seiAddress?: string;
  username?: string;
  isBound: boolean;
  lastActivity: Date;
  preferences: {
    notifications: boolean;
    language: 'en' | 'ar';
    timezone: string;
  };
}

export interface TransferRequest {
  recipient: string;
  amount: string;
  denom: string;
  remark?: string;
  expiry?: number;
}

export interface PoolRequest {
  target: string;
  memo?: string;
  expiry?: number;
}

export interface PotRequest {
  goal: string;
  label?: string;
}

export interface EscrowRequest {
  parties: string[];
  amount: string;
  model: 'MultiSig' | 'TimeTiered' | 'Milestones';
  expiry?: number;
  remark?: string;
}

export interface VaultRequest {
  label: string;
  denom: string;
  strategy: string;
  feeBps?: number;
}

export interface BotCommand {
  command: string;
  description: string;
  usage: string;
  example: string;
  handler: (ctx: any) => Promise<void>;
}

export interface TransactionResult {
  success: boolean;
  txHash?: string;
  error?: string;
  message: string;
}

export interface NotificationData {
  type: 'transfer' | 'claim' | 'refund' | 'pool' | 'pot' | 'escrow' | 'vault';
  userId: string;
  message: string;
  data?: any;
  timestamp: Date;
}

export enum CommandType {
  TRANSFER = 'transfer',
  CLAIM = 'claim',
  REFUND = 'refund',
  POOL = 'pool',
  POT = 'pot',
  ESCROW = 'escrow',
  VAULT = 'vault',
  HELP = 'help',
  STATUS = 'status',
  BIND = 'bind',
  UNBIND = 'unbind'
}

export interface CommandContext {
  userId: number;
  username?: string;
  seiAddress?: string;
  isBound: boolean;
  command: CommandType;
  args: string[];
  timestamp: Date;
}
