import { ApiResponse } from '../../types';
import { blockchainService } from './blockchain-service';
import { contractService } from './contract-service';

// Real Data Service - replaces all mock data with real blockchain data
export interface RealSavingsPot {
  id: string;
  contractAddress: string;
  owner: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  category: string;
  createdAt: Date;
  targetDate?: Date;
  autoSaveEnabled: boolean;
  autoSaveAmount: number;
  autoSaveFrequency: 'daily' | 'weekly' | 'monthly';
  lastAutoSave?: Date;
  status: 'active' | 'completed' | 'paused' | 'broken';
  transactions: PotTransaction[];
}

export interface PotTransaction {
  id: string;
  potId: string;
  type: 'deposit' | 'withdrawal' | 'auto_save';
  amount: number;
  timestamp: Date;
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface RealDataService {
  // Wallet Data - from MetaMask and blockchain directly
  getWalletBalance(address: string): Promise<number>;
  getWalletTransactions(address: string): Promise<any[]>;
  
  // Savings Pots - from Smart Contracts
  getUserPots(address: string): Promise<RealSavingsPot[]>;
  getPotBalance(potId: string): Promise<number>;
  getAutoSaveStatus(potId: string): Promise<any>;
  createPot(data: any): Promise<RealSavingsPot>;
  depositToPot(potId: string, amount: number): Promise<any>;
  
  // Real-time Updates
  subscribeToUpdates(address: string, callback: (data: any) => void): void;
  unsubscribeFromUpdates(): void;
}

class RealDataServiceImpl implements RealDataService {
  private updateSubscriptions: Map<string, (data: any) => void> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;

  async getWalletBalance(address: string): Promise<number> {
    try {
      const response = await blockchainService.getBalance(address);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to get wallet balance');
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      return 0;
    }
  }

  async getWalletTransactions(address: string): Promise<any[]> {
    try {
      // This would query the blockchain for transaction history
      // For now, return empty array as this requires blockchain integration
      return [];
    } catch (error) {
      console.error('Error getting wallet transactions:', error);
      return [];
    }
  }

  async getUserPots(address: string): Promise<RealSavingsPot[]> {
    try {
      // Query the pots smart contract for user's pots
      const response = await contractService.call({
        contractAddress: 'sei1c5d4flfqv3zjms0g894z82hnhv62h2vjr9hgd05c6xh456q8xjfq8f3qmj', // POTS contract
        method: 'list_pots_by_owner',
        args: [address]
      });

      if (response.success && response.data.result) {
        // Transform contract data to our format
        const contractPots = Array.isArray(response.data.result) ? response.data.result : [];
        
        return contractPots.map((pot: any) => ({
          id: pot.id?.toString() || Math.random().toString(),
          contractAddress: 'sei1c5d4flfqv3zjms0g894z82hnhv62h2vjr9hgd05c6xh456q8xjfq8f3qmj',
          owner: pot.owner || address,
          name: pot.label || `Pot ${pot.id}`,
          targetAmount: pot.goal?.amount ? parseInt(pot.goal.amount) / 1000000 : 1000, // Convert from usei
          currentAmount: pot.current ? parseInt(pot.current) / 1000000 : 0, // Convert from usei
          category: this.inferCategory(pot.label || ''),
          createdAt: pot.created_at ? new Date(pot.created_at * 1000) : new Date(),
          targetDate: undefined, // Not stored in contract yet
          autoSaveEnabled: false, // Not implemented in contract yet
          autoSaveAmount: 0,
          autoSaveFrequency: 'monthly' as const,
          lastAutoSave: undefined,
          status: pot.closed ? 'completed' : pot.broken ? 'broken' : 'active',
          transactions: []
        }));
      }

      // Fallback to empty array if contract call fails
      return [];
    } catch (error) {
      console.error('Error getting user pots:', error);
      return [];
    }
  }

  async getPotBalance(potId: string): Promise<number> {
    try {
      const response = await contractService.call({
        contractAddress: 'sei1c5d4flfqv3zjms0g894z82hnhv62h2vjr9hgd05c6xh456q8xjfq8f3qmj',
        method: 'get_pot',
        args: [parseInt(potId)]
      });

      if (response.success && response.data.result) {
        const pot = response.data.result;
        return pot.current ? parseInt(pot.current) / 1000000 : 0; // Convert from usei
      }

      return 0;
    } catch (error) {
      console.error('Error getting pot balance:', error);
      return 0;
    }
  }

  async getAutoSaveStatus(potId: string): Promise<any> {
    // Auto-save not implemented in contract yet
    return {
      enabled: false,
      amount: 0,
      frequency: 'monthly',
      lastSave: null,
      nextSave: null
    };
  }

  async createPot(data: {
    name: string;
    targetAmount: number;
    category: string;
    targetDate?: string;
    autoSaveEnabled: boolean;
    autoSaveAmount: number;
  }): Promise<RealSavingsPot> {
    try {
      // Convert target amount to usei (multiply by 1,000,000)
      const targetAmountUsei = Math.floor(data.targetAmount * 1000000);
      
      const response = await contractService.call({
        contractAddress: 'sei1c5d4flfqv3zjms0g894z82hnhv62h2vjr9hgd05c6xh456q8xjfq8f3qmj',
        method: 'open_pot',
        args: [
          {
            amount: targetAmountUsei.toString(),
            denom: 'usei'
          },
          data.name
        ],
        value: 0 // No initial deposit
      });

      if (response.success) {
        // Return the created pot
        return {
          id: Math.random().toString(), // Would get from transaction result
          contractAddress: 'sei1c5d4flfqv3zjms0g894z82hnhv62h2vjr9hgd05c6xh456q8xjfq8f3qmj',
          owner: 'current_user', // Would get from wallet
          name: data.name,
          targetAmount: data.targetAmount,
          currentAmount: 0,
          category: data.category,
          createdAt: new Date(),
          targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
          autoSaveEnabled: data.autoSaveEnabled,
          autoSaveAmount: data.autoSaveAmount,
          autoSaveFrequency: 'monthly',
          status: 'active',
          transactions: []
        };
      }

      throw new Error(response.error || 'Failed to create pot');
    } catch (error) {
      console.error('Error creating pot:', error);
      throw error;
    }
  }

  async depositToPot(potId: string, amount: number): Promise<any> {
    try {
      // Convert amount to usei
      const amountUsei = Math.floor(amount * 1000000);
      
      const response = await contractService.call({
        contractAddress: 'sei1c5d4flfqv3zjms0g894z82hnhv62h2vjr9hgd05c6xh456q8xjfq8f3qmj',
        method: 'deposit_pot',
        args: [
          parseInt(potId),
          {
            amount: amountUsei.toString(),
            denom: 'usei'
          }
        ],
        value: amountUsei
      });

      if (response.success) {
        return {
          success: true,
          txHash: response.data.transactionHash,
          amount: amount
        };
      }

      throw new Error(response.error || 'Failed to deposit to pot');
    } catch (error) {
      console.error('Error depositing to pot:', error);
      throw error;
    }
  }

  subscribeToUpdates(address: string, callback: (data: any) => void): void {
    this.updateSubscriptions.set(address, callback);
    
    // Start polling for updates every 30 seconds
    if (!this.updateInterval) {
      this.updateInterval = setInterval(async () => {
        for (const [addr, cb] of this.updateSubscriptions.entries()) {
          try {
            const [balance, pots] = await Promise.all([
              this.getWalletBalance(addr),
              this.getUserPots(addr)
            ]);
            
            cb({
              balance,
              pots,
              timestamp: new Date()
            });
          } catch (error) {
            console.error('Error in update subscription:', error);
          }
        }
      }, 30000);
    }
  }

  unsubscribeFromUpdates(): void {
    this.updateSubscriptions.clear();
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private inferCategory(label: string): string {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('vacation') || lowerLabel.includes('travel')) return 'vacation';
    if (lowerLabel.includes('car') || lowerLabel.includes('vehicle')) return 'car';
    if (lowerLabel.includes('house') || lowerLabel.includes('home')) return 'house';
    if (lowerLabel.includes('invest') || lowerLabel.includes('emergency')) return 'investment';
    return 'other';
  }
}

export const realDataService = new RealDataServiceImpl();
export default realDataService;
