import { contractService, ContractCallParams } from './contract-service';
import { blockchainService } from './blockchain-service';
import { ApiResponse } from '../../types';

// Savings Pots Smart Contract Interface
export const POTS_CONTRACT_ADDRESS = 'sei1c5d4flfqv3zjms0g894z82hnhv62h2vjr9hgd05c6xh456q8xjfq8f3qmj';

export interface PotContractData {
  id: number;
  owner: string;
  goal: {
    amount: string;
    denom: string;
  };
  current: string;
  label?: string;
  created_at: number;
  closed: boolean;
  broken: boolean;
}

export interface CreatePotParams {
  goal: {
    amount: string;
    denom: string;
  };
  label?: string;
}

export interface DepositPotParams {
  pot_id: number;
  amount: {
    amount: string;
    denom: string;
  };
}

export class SavingsPotsContract {
  private contractAddress: string;

  constructor(contractAddress: string = POTS_CONTRACT_ADDRESS) {
    this.contractAddress = contractAddress;
  }

  // Query Methods (Read-only)
  
  async getConfig(): Promise<ApiResponse<any>> {
    return contractService.call({
      contractAddress: this.contractAddress,
      method: 'config',
      args: []
    });
  }

  async getPot(id: number): Promise<ApiResponse<PotContractData>> {
    return contractService.call({
      contractAddress: this.contractAddress,
      method: 'get_pot',
      args: [{ id }]
    });
  }

  async listPotsByOwner(
    owner: string, 
    startAfter?: number, 
    limit?: number
  ): Promise<ApiResponse<PotContractData[]>> {
    const args: any = { owner };
    if (startAfter !== undefined) args.start_after = startAfter;
    if (limit !== undefined) args.limit = limit;

    return contractService.call({
      contractAddress: this.contractAddress,
      method: 'list_pots_by_owner',
      args: [args]
    });
  }

  async listAllPots(
    startAfter?: number, 
    limit?: number
  ): Promise<ApiResponse<PotContractData[]>> {
    const args: any = {};
    if (startAfter !== undefined) args.start_after = startAfter;
    if (limit !== undefined) args.limit = limit;

    return contractService.call({
      contractAddress: this.contractAddress,
      method: 'list_all_pots',
      args: [args]
    });
  }

  // Execute Methods (Write operations)
  
  async openPot(params: CreatePotParams): Promise<ApiResponse<any>> {
    return contractService.call({
      contractAddress: this.contractAddress,
      method: 'open_pot',
      args: [params]
    });
  }

  async depositPot(params: DepositPotParams): Promise<ApiResponse<any>> {
    return contractService.call({
      contractAddress: this.contractAddress,
      method: 'deposit_pot',
      args: [params],
      value: parseInt(params.amount.amount) // Send the deposit amount
    });
  }

  async breakPot(potId: number): Promise<ApiResponse<any>> {
    return contractService.call({
      contractAddress: this.contractAddress,
      method: 'break_pot',
      args: [{ pot_id: potId }]
    });
  }

  async closePot(potId: number): Promise<ApiResponse<any>> {
    return contractService.call({
      contractAddress: this.contractAddress,
      method: 'close_pot',
      args: [{ pot_id: potId }]
    });
  }

  // Helper Methods

  async getUserPotsSummary(owner: string): Promise<{
    totalPots: number;
    activePots: number;
    completedPots: number;
    brokenPots: number;
    totalSaved: number;
    totalGoal: number;
  }> {
    try {
      const response = await this.listPotsByOwner(owner);
      
      if (!response.success || !response.data.result) {
        return {
          totalPots: 0,
          activePots: 0,
          completedPots: 0,
          brokenPots: 0,
          totalSaved: 0,
          totalGoal: 0
        };
      }

      const pots = Array.isArray(response.data.result) ? response.data.result : [];
      
      let totalSaved = 0;
      let totalGoal = 0;
      let activePots = 0;
      let completedPots = 0;
      let brokenPots = 0;

      pots.forEach(pot => {
        const currentAmount = parseInt(pot.current) / 1000000; // Convert from usei
        const goalAmount = parseInt(pot.goal.amount) / 1000000; // Convert from usei
        
        totalSaved += currentAmount;
        totalGoal += goalAmount;

        if (pot.closed) {
          completedPots++;
        } else if (pot.broken) {
          brokenPots++;
        } else {
          activePots++;
        }
      });

      return {
        totalPots: pots.length,
        activePots,
        completedPots,
        brokenPots,
        totalSaved,
        totalGoal
      };
    } catch (error) {
      console.error('Error getting user pots summary:', error);
      return {
        totalPots: 0,
        activePots: 0,
        completedPots: 0,
        brokenPots: 0,
        totalSaved: 0,
        totalGoal: 0
      };
    }
  }

  async getPotProgress(potId: number): Promise<{
    current: number;
    goal: number;
    percentage: number;
    remaining: number;
    status: 'active' | 'completed' | 'broken';
  }> {
    try {
      const response = await this.getPot(potId);
      
      if (!response.success || !response.data.result) {
        throw new Error('Pot not found');
      }

      const pot = response.data.result;
      const current = parseInt(pot.current) / 1000000; // Convert from usei
      const goal = parseInt(pot.goal.amount) / 1000000; // Convert from usei
      const percentage = goal > 0 ? (current / goal) * 100 : 0;
      const remaining = Math.max(0, goal - current);

      let status: 'active' | 'completed' | 'broken' = 'active';
      if (pot.closed) status = 'completed';
      else if (pot.broken) status = 'broken';

      return {
        current,
        goal,
        percentage: Math.min(percentage, 100),
        remaining,
        status
      };
    } catch (error) {
      console.error('Error getting pot progress:', error);
      throw error;
    }
  }

  // Utility methods for amount conversion
  
  static seiToUsei(amount: number): string {
    return Math.floor(amount * 1000000).toString();
  }

  static useiToSei(amount: string): number {
    return parseInt(amount) / 1000000;
  }

  static formatSeiAmount(amount: number): string {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
  }

  // Validation methods
  
  static validatePotCreation(data: {
    name: string;
    targetAmount: number;
    category: string;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push('Pot name is required');
    }

    if (data.name && data.name.length > 100) {
      errors.push('Pot name must be less than 100 characters');
    }

    if (!data.targetAmount || data.targetAmount <= 0) {
      errors.push('Target amount must be greater than 0');
    }

    if (data.targetAmount && data.targetAmount > 1000000) {
      errors.push('Target amount cannot exceed 1,000,000 SEI');
    }

    if (!data.category) {
      errors.push('Category is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  static validateDeposit(amount: number, currentBalance: number): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!amount || amount <= 0) {
      errors.push('Deposit amount must be greater than 0');
    }

    if (amount > currentBalance) {
      errors.push('Insufficient balance for deposit');
    }

    if (amount < 0.000001) { // Minimum 1 usei
      errors.push('Deposit amount too small (minimum 0.000001 SEI)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Singleton instance
export const savingsPotsContract = new SavingsPotsContract();
export default savingsPotsContract;