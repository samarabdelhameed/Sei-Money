import { Transfer, Group, SavingsPot, Vault, EscrowCase, MarketData, User, Wallet } from '../types';

// API Service for SeiMoney Backend Integration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// API Response Types
export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// API Client
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      mode: 'cors',
      credentials: 'include',
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new ApiError(
          `HTTP error! status: ${response.status}`,
          response.status
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        0
      );
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Create API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// API Endpoints
export const API_ENDPOINTS = {
  // Health check
  HEALTH: '/health',
  
  // Transfers
  TRANSFERS: '/api/v1/transfers',
  TRANSFER_BY_ID: (id: string) => `/api/v1/transfers/${id}`,
  
  // Vaults
  VAULTS: '/api/v1/vaults',
  VAULT_BY_ID: (id: string) => `/api/v1/vaults/${id}`,
  
  // Groups
  GROUPS: '/api/v1/groups',
  GROUP_BY_ID: (id: string) => `/api/v1/groups/${id}`,
  
  // Pots
  POTS: '/api/v1/pots',
  POT_BY_ID: (id: string) => `/api/v1/pots/${id}`,
  
  // Escrow
  ESCROW: '/api/v1/escrow',
  ESCROW_BY_ID: (id: string) => `/api/v1/escrow/${id}`,
  
  // Market Data
  MARKET_DATA: '/api/v1/market',
  MARKET_STATS: '/api/v1/market/stats',
  MARKET_TVL_HISTORY: '/api/v1/market/tvl-history',
  MARKET_OVERVIEW: '/api/v1/market/overview',
  
  // User Profile
  USER_PROFILE: '/api/v1/user/profile',
  USER_BALANCE: '/api/v1/user/balance',
  
  // Wallet
  WALLET_CONNECT: '/api/v1/wallet/connect',
  WALLET_DISCONNECT: '/api/v1/wallet/disconnect',
  WALLET_SIGN: '/api/v1/wallet/sign',
  WALLET_BALANCE: (address: string) => `/api/v1/wallet/balance/${address}`,
  WALLET_SESSION: '/api/v1/wallet/session',
  WALLET_SUPPORTED: '/api/v1/wallet/supported',
} as const;

// API Service Functions
export const apiService = {
  // Health Check
  async checkHealth() {
    return apiClient.get<{ status: string; timestamp: string }>(API_ENDPOINTS.HEALTH);
  },

  // Transfers
  async getTransfers(address?: string) {
    const endpoint = address ? `${API_ENDPOINTS.TRANSFERS}?address=${address}` : API_ENDPOINTS.TRANSFERS;
    return apiClient.get<Transfer[]>(endpoint);
  },

  async createTransfer(transferData: CreateTransferRequest) {
    return apiClient.post<Transfer>(API_ENDPOINTS.TRANSFERS, transferData);
  },

  async getTransferById(id: string) {
    return apiClient.get<Transfer>(API_ENDPOINTS.TRANSFER_BY_ID(id));
  },

  async updateTransfer(id: string, updateData: Partial<Transfer>) {
    return apiClient.put<Transfer>(API_ENDPOINTS.TRANSFER_BY_ID(id), updateData);
  },

  async deleteTransfer(id: string) {
    return apiClient.delete<void>(API_ENDPOINTS.TRANSFER_BY_ID(id));
  },

  // Vaults
  async getVaults() {
    return apiClient.get<Vault[]>(API_ENDPOINTS.VAULTS);
  },

  async getVaultById(id: string) {
    return apiClient.get<Vault>(API_ENDPOINTS.VAULT_BY_ID(id));
  },

  async createVault(vaultData: CreateVaultRequest) {
    return apiClient.post<Vault>(API_ENDPOINTS.VAULTS, vaultData);
  },

  async updateVault(id: string, updateData: Partial<Vault>) {
    return apiClient.put<Vault>(API_ENDPOINTS.VAULT_BY_ID(id), updateData);
  },

  async deleteVault(id: string) {
    return apiClient.delete<void>(API_ENDPOINTS.VAULT_BY_ID(id));
  },

  // Groups
  async getGroups() {
    return apiClient.get<Group[]>(API_ENDPOINTS.GROUPS);
  },

  async getGroupById(id: string) {
    return apiClient.get<Group>(API_ENDPOINTS.GROUP_BY_ID(id));
  },

  async createGroup(groupData: CreateGroupRequest) {
    return apiClient.post<Group>(API_ENDPOINTS.GROUPS, groupData);
  },

  async updateGroup(id: string, updateData: Partial<Group>) {
    return apiClient.put<Group>(API_ENDPOINTS.GROUP_BY_ID(id), updateData);
  },

  async deleteGroup(id: string) {
    return apiClient.delete<void>(API_ENDPOINTS.GROUP_BY_ID(id));
  },

  // Pots
  async getPots() {
    return apiClient.get<SavingsPot[]>(API_ENDPOINTS.POTS);
  },

  async getPotById(id: string) {
    return apiClient.get<SavingsPot>(API_ENDPOINTS.POT_BY_ID(id));
  },

  async createPot(potData: CreatePotRequest) {
    return apiClient.post<SavingsPot>(API_ENDPOINTS.POTS, potData);
  },

  async updatePot(id: string, updateData: Partial<SavingsPot>) {
    return apiClient.put<SavingsPot>(API_ENDPOINTS.POT_BY_ID(id), updateData);
  },

  async deletePot(id: string) {
    return apiClient.delete<void>(API_ENDPOINTS.POT_BY_ID(id));
  },

  // Escrow
  async getEscrows() {
    return apiClient.get<EscrowCase[]>(API_ENDPOINTS.ESCROW);
  },

  async getEscrowById(id: string) {
    return apiClient.get<EscrowCase>(API_ENDPOINTS.ESCROW_BY_ID(id));
  },

  async createEscrow(escrowData: CreateEscrowRequest) {
    return apiClient.post<EscrowCase>(API_ENDPOINTS.ESCROW, escrowData);
  },

  async updateEscrow(id: string, updateData: Partial<EscrowCase>) {
    return apiClient.put<EscrowCase>(API_ENDPOINTS.ESCROW_BY_ID(id), updateData);
  },

  async deleteEscrow(id: string) {
    return apiClient.delete<void>(API_ENDPOINTS.ESCROW_BY_ID(id));
  },

  // Market Data
  async getMarketData() {
    return apiClient.get<MarketData>(API_ENDPOINTS.MARKET_OVERVIEW);
  },

  async getMarketStats() {
    return apiClient.get<{
      ok: boolean;
      stats: {
        totalTvl: { value: number; formatted: string; change: number; changeFormatted: string };
        activeUsers: { value: number; formatted: string; change: number; changeFormatted: string };
        successRate: { value: number; formatted: string; change: number; changeFormatted: string };
        avgApy: { value: number; formatted: string; change: number; changeFormatted: string };
      };
      timestamp: string;
    }>(API_ENDPOINTS.MARKET_STATS);
  },

  async getTvlHistory() {
    return apiClient.get<{
      ok: boolean;
      data: Array<{ date: string; value: number; formatted: string }>;
      timestamp: string;
    }>(API_ENDPOINTS.MARKET_TVL_HISTORY);
  },

  async getMarketOverview() {
    return apiClient.get<{
      ok: boolean;
      data: {
        platform: { name: string; version: string; network: string; chainId: string };
        metrics: { totalValueLocked: number; totalUsers: number; totalTransactions: number; totalContracts: number; averageApy: number; successRate: number };
        contracts: Record<string, string>;
        lastUpdated: string;
      };
      timestamp: string;
    }>(API_ENDPOINTS.MARKET_OVERVIEW);
  },

  // User Profile
  async getUserProfile() {
    return apiClient.get<User>(API_ENDPOINTS.USER_PROFILE);
  },

  async updateUserProfile(profileData: Partial<User>) {
    return apiClient.put<User>(API_ENDPOINTS.USER_PROFILE, profileData);
  },

  async getUserBalance() {
    return apiClient.get<Wallet>(API_ENDPOINTS.USER_BALANCE);
  },

  // Wallet
  async connectWallet(walletData: any) {
    return apiClient.post<any>(API_ENDPOINTS.WALLET_CONNECT, walletData);
  },

  async disconnectWallet() {
    return apiClient.post<void>(API_ENDPOINTS.WALLET_DISCONNECT);
  },

  async signTransaction(signData: SignTransactionRequest) {
    return apiClient.post<SignedTransaction>(API_ENDPOINTS.WALLET_SIGN, signData);
  },
};

// Request/Response Types
export interface CreateTransferRequest {
  recipient: string;
  amount: number;
  expiry: string;
  remark?: string;
}

export interface CreateVaultRequest {
  name: string;
  description: string;
  strategy: string;
  minDeposit: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface CreateGroupRequest {
  name: string;
  description: string;
  targetAmount: number;
  maxParticipants: number;
  expiry: string;
}

export interface CreatePotRequest {
  name: string;
  targetAmount: number;
  category: 'vacation' | 'car' | 'house' | 'investment' | 'other';
  targetDate?: string;
  autoSaveEnabled: boolean;
  autoSaveAmount?: number;
}

export interface CreateEscrowRequest {
  title: string;
  description: string;
  amount: number;
  seller: string;
  deadline: string;
  milestones?: boolean;
}

export interface WalletConnectRequest {
  provider: 'keplr' | 'leap';
  address: string;
}

export interface SignTransactionRequest {
  transaction: unknown;
  walletAddress: string;
}

export interface SignedTransaction {
  signature: string;
  transaction: unknown;
}

// Re-export types from the main types file
export type {
  User,
  Wallet,
  Transfer,
  Group,
  GroupParticipant,
  SavingsPot,
  Vault,
  VaultPerformance,
  Investment,
  EscrowCase,
  AIAgent,
  Recommendation,
  MarketData,
} from '../types';

// Remove duplicate export
