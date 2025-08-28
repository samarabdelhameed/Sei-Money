import { ApiResponse } from '../../types';
import { contractService } from './contract-service';
import { blockchainService } from './blockchain-service';

// Real Escrow Contract Interface
export interface RealEscrowCase {
  id: string;
  contractAddress: string;
  title: string;
  description: string;
  amount: number;
  buyer: string;
  seller: string;
  arbiter: string;
  status: 'created' | 'funded' | 'released' | 'disputed' | 'resolved' | 'cancelled';
  createdAt: Date;
  expiryDate: Date;
  terms: string[];
  milestones: EscrowMilestone[];
  disputeInfo?: DisputeInfo;
  contractEvents: EscrowEvent[];
}

export interface EscrowMilestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  status: 'pending' | 'completed' | 'disputed';
  completedAt?: Date;
  evidence?: string[];
}

export interface DisputeInfo {
  id: string;
  escrowId: string;
  reason: string;
  evidence: string[];
  raisedBy: string;
  raisedAt: Date;
  status: 'open' | 'voting' | 'resolved';
  resolution?: string;
  resolvedAt?: Date;
  votes: DisputeVote[];
}

export interface DisputeVote {
  voter: string;
  decision: 'buyer' | 'seller';
  reason: string;
  votedAt: Date;
}

export interface EscrowEvent {
  id: string;
  escrowId: string;
  type: 'created' | 'funded' | 'milestone_completed' | 'disputed' | 'resolved' | 'released' | 'cancelled';
  actor: string;
  amount?: number;
  data?: any;
  timestamp: Date;
  txHash: string;
}

export interface CreateEscrowParams {
  title: string;
  description: string;
  amount: number;
  seller: string;
  arbiter: string;
  expiryDate: Date;
  terms: string[];
  milestones?: Omit<EscrowMilestone, 'id' | 'status' | 'completedAt'>[];
}

export interface EscrowContractService {
  // Core escrow operations
  createEscrow(params: CreateEscrowParams): Promise<ApiResponse<RealEscrowCase>>;
  fundEscrow(escrowId: string, amount: number): Promise<ApiResponse<string>>;
  releasePayment(escrowId: string, milestoneId?: string): Promise<ApiResponse<string>>;
  cancelEscrow(escrowId: string): Promise<ApiResponse<string>>;
  
  // Query operations
  getEscrow(escrowId: string): Promise<ApiResponse<RealEscrowCase>>;
  getUserEscrows(address: string): Promise<ApiResponse<RealEscrowCase[]>>;
  getEscrowsByStatus(status: string): Promise<ApiResponse<RealEscrowCase[]>>;
  getEscrowEvents(escrowId: string): Promise<ApiResponse<EscrowEvent[]>>;
  
  // Milestone operations
  completeMilestone(escrowId: string, milestoneId: string, evidence?: string[]): Promise<ApiResponse<string>>;
  getMilestoneStatus(escrowId: string, milestoneId: string): Promise<ApiResponse<EscrowMilestone>>;
  
  // Dispute operations
  raiseDispute(escrowId: string, reason: string, evidence: string[]): Promise<ApiResponse<DisputeInfo>>;
  voteOnDispute(disputeId: string, decision: 'buyer' | 'seller', reason: string): Promise<ApiResponse<string>>;
  resolveDispute(disputeId: string, resolution: string): Promise<ApiResponse<string>>;
  getDispute(disputeId: string): Promise<ApiResponse<DisputeInfo>>;
  
  // Real-time monitoring
  subscribeToEscrowUpdates(escrowId: string, callback: (event: EscrowEvent) => void): void;
  unsubscribeFromUpdates(escrowId: string): void;
}

class EscrowContractServiceImpl implements EscrowContractService {
  private readonly contractAddress = 'sei1escrow...'; // Real escrow contract address
  private subscriptions: Map<string, (event: EscrowEvent) => void> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;

  async createEscrow(params: CreateEscrowParams): Promise<ApiResponse<RealEscrowCase>> {
    try {
      // Convert amount to usei (multiply by 1,000,000)
      const amountUsei = Math.floor(params.amount * 1000000);
      const expiryTimestamp = Math.floor(params.expiryDate.getTime() / 1000);
      
      // Prepare milestones for contract
      const contractMilestones = params.milestones?.map((milestone, index) => ({
        id: index.toString(),
        title: milestone.title,
        description: milestone.description,
        amount: Math.floor(milestone.amount * 1000000).toString(),
      })) || [];

      const response = await contractService.call({
        contractAddress: this.contractAddress,
        method: 'create_escrow',
        args: [{
          title: params.title,
          description: params.description,
          amount: amountUsei.toString(),
          seller: params.seller,
          arbiter: params.arbiter,
          expiry: expiryTimestamp,
          terms: params.terms,
          milestones: contractMilestones
        }],
        value: 0 // No initial funding
      });

      if (response.success && response.data.transactionHash) {
        // Create the escrow object from contract response
        const escrowId = this.extractEscrowIdFromTx(response.data.transactionHash);
        
        const newEscrow: RealEscrowCase = {
          id: escrowId,
          contractAddress: this.contractAddress,
          title: params.title,
          description: params.description,
          amount: params.amount,
          buyer: 'current_user', // Would get from wallet context
          seller: params.seller,
          arbiter: params.arbiter,
          status: 'created',
          createdAt: new Date(),
          expiryDate: params.expiryDate,
          terms: params.terms,
          milestones: params.milestones?.map((milestone, index) => ({
            id: index.toString(),
            title: milestone.title,
            description: milestone.description,
            amount: milestone.amount,
            status: 'pending'
          })) || [],
          contractEvents: [{
            id: '1',
            escrowId,
            type: 'created',
            actor: 'current_user',
            timestamp: new Date(),
            txHash: response.data.transactionHash
          }]
        };

        return {
          success: true,
          data: newEscrow,
          timestamp: Date.now()
        };
      }

      throw new Error(response.error || 'Failed to create escrow');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create escrow',
        timestamp: Date.now()
      };
    }
  }

  async fundEscrow(escrowId: string, amount: number): Promise<ApiResponse<string>> {
    try {
      const amountUsei = Math.floor(amount * 1000000);
      
      const response = await contractService.call({
        contractAddress: this.contractAddress,
        method: 'fund_escrow',
        args: [{
          escrow_id: escrowId,
          amount: amountUsei.toString()
        }],
        value: amountUsei
      });

      if (response.success && response.data.transactionHash) {
        return {
          success: true,
          data: response.data.transactionHash,
          timestamp: Date.now()
        };
      }

      throw new Error(response.error || 'Failed to fund escrow');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fund escrow',
        timestamp: Date.now()
      };
    }
  }

  async releasePayment(escrowId: string, milestoneId?: string): Promise<ApiResponse<string>> {
    try {
      const response = await contractService.call({
        contractAddress: this.contractAddress,
        method: 'release_payment',
        args: [{
          escrow_id: escrowId,
          milestone_id: milestoneId || null
        }],
        value: 0
      });

      if (response.success && response.data.transactionHash) {
        return {
          success: true,
          data: response.data.transactionHash,
          timestamp: Date.now()
        };
      }

      throw new Error(response.error || 'Failed to release payment');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to release payment',
        timestamp: Date.now()
      };
    }
  }

  async cancelEscrow(escrowId: string): Promise<ApiResponse<string>> {
    try {
      const response = await contractService.call({
        contractAddress: this.contractAddress,
        method: 'cancel_escrow',
        args: [{
          escrow_id: escrowId
        }],
        value: 0
      });

      if (response.success && response.data.transactionHash) {
        return {
          success: true,
          data: response.data.transactionHash,
          timestamp: Date.now()
        };
      }

      throw new Error(response.error || 'Failed to cancel escrow');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel escrow',
        timestamp: Date.now()
      };
    }
  }

  async getEscrow(escrowId: string): Promise<ApiResponse<RealEscrowCase>> {
    try {
      const response = await contractService.call({
        contractAddress: this.contractAddress,
        method: 'get_escrow',
        args: [{ escrow_id: escrowId }],
        value: 0
      });

      if (response.success && response.data.result) {
        const contractEscrow = response.data.result;
        
        const escrow: RealEscrowCase = {
          id: contractEscrow.id || escrowId,
          contractAddress: this.contractAddress,
          title: contractEscrow.title || 'Unknown Escrow',
          description: contractEscrow.description || '',
          amount: contractEscrow.amount ? parseInt(contractEscrow.amount) / 1000000 : 0,
          buyer: contractEscrow.buyer || '',
          seller: contractEscrow.seller || '',
          arbiter: contractEscrow.arbiter || '',
          status: this.mapContractStatus(contractEscrow.status),
          createdAt: contractEscrow.created_at ? new Date(contractEscrow.created_at * 1000) : new Date(),
          expiryDate: contractEscrow.expiry ? new Date(contractEscrow.expiry * 1000) : new Date(),
          terms: contractEscrow.terms || [],
          milestones: this.mapContractMilestones(contractEscrow.milestones || []),
          disputeInfo: contractEscrow.dispute ? this.mapContractDispute(contractEscrow.dispute) : undefined,
          contractEvents: await this.getEscrowEventsInternal(escrowId)
        };

        return {
          success: true,
          data: escrow,
          timestamp: Date.now()
        };
      }

      throw new Error('Escrow not found');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get escrow',
        timestamp: Date.now()
      };
    }
  }

  async getUserEscrows(address: string): Promise<ApiResponse<RealEscrowCase[]>> {
    try {
      const response = await contractService.call({
        contractAddress: this.contractAddress,
        method: 'list_escrows_by_user',
        args: [{ user: address }],
        value: 0
      });

      if (response.success && response.data.result) {
        const contractEscrows = Array.isArray(response.data.result) ? response.data.result : [];
        
        const escrows: RealEscrowCase[] = await Promise.all(
          contractEscrows.map(async (contractEscrow: any) => ({
            id: contractEscrow.id || Math.random().toString(),
            contractAddress: this.contractAddress,
            title: contractEscrow.title || 'Unknown Escrow',
            description: contractEscrow.description || '',
            amount: contractEscrow.amount ? parseInt(contractEscrow.amount) / 1000000 : 0,
            buyer: contractEscrow.buyer || '',
            seller: contractEscrow.seller || '',
            arbiter: contractEscrow.arbiter || '',
            status: this.mapContractStatus(contractEscrow.status),
            createdAt: contractEscrow.created_at ? new Date(contractEscrow.created_at * 1000) : new Date(),
            expiryDate: contractEscrow.expiry ? new Date(contractEscrow.expiry * 1000) : new Date(),
            terms: contractEscrow.terms || [],
            milestones: this.mapContractMilestones(contractEscrow.milestones || []),
            disputeInfo: contractEscrow.dispute ? this.mapContractDispute(contractEscrow.dispute) : undefined,
            contractEvents: await this.getEscrowEventsInternal(contractEscrow.id)
          }))
        );

        return {
          success: true,
          data: escrows,
          timestamp: Date.now()
        };
      }

      return {
        success: true,
        data: [],
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user escrows',
        timestamp: Date.now()
      };
    }
  }

  async getEscrowsByStatus(status: string): Promise<ApiResponse<RealEscrowCase[]>> {
    try {
      const response = await contractService.call({
        contractAddress: this.contractAddress,
        method: 'list_escrows_by_status',
        args: [{ status: this.mapStatusToContract(status) }],
        value: 0
      });

      if (response.success && response.data.result) {
        const contractEscrows = Array.isArray(response.data.result) ? response.data.result : [];
        
        const escrows: RealEscrowCase[] = await Promise.all(
          contractEscrows.map(async (contractEscrow: any) => ({
            id: contractEscrow.id || Math.random().toString(),
            contractAddress: this.contractAddress,
            title: contractEscrow.title || 'Unknown Escrow',
            description: contractEscrow.description || '',
            amount: contractEscrow.amount ? parseInt(contractEscrow.amount) / 1000000 : 0,
            buyer: contractEscrow.buyer || '',
            seller: contractEscrow.seller || '',
            arbiter: contractEscrow.arbiter || '',
            status: this.mapContractStatus(contractEscrow.status),
            createdAt: contractEscrow.created_at ? new Date(contractEscrow.created_at * 1000) : new Date(),
            expiryDate: contractEscrow.expiry ? new Date(contractEscrow.expiry * 1000) : new Date(),
            terms: contractEscrow.terms || [],
            milestones: this.mapContractMilestones(contractEscrow.milestones || []),
            disputeInfo: contractEscrow.dispute ? this.mapContractDispute(contractEscrow.dispute) : undefined,
            contractEvents: await this.getEscrowEventsInternal(contractEscrow.id)
          }))
        );

        return {
          success: true,
          data: escrows,
          timestamp: Date.now()
        };
      }

      return {
        success: true,
        data: [],
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get escrows by status',
        timestamp: Date.now()
      };
    }
  }

  async getEscrowEvents(escrowId: string): Promise<ApiResponse<EscrowEvent[]>> {
    try {
      const events = await this.getEscrowEventsInternal(escrowId);
      return {
        success: true,
        data: events,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get escrow events',
        timestamp: Date.now()
      };
    }
  }

  async completeMilestone(escrowId: string, milestoneId: string, evidence?: string[]): Promise<ApiResponse<string>> {
    try {
      const response = await contractService.call({
        contractAddress: this.contractAddress,
        method: 'complete_milestone',
        args: [{
          escrow_id: escrowId,
          milestone_id: milestoneId,
          evidence: evidence || []
        }],
        value: 0
      });

      if (response.success && response.data.transactionHash) {
        return {
          success: true,
          data: response.data.transactionHash,
          timestamp: Date.now()
        };
      }

      throw new Error(response.error || 'Failed to complete milestone');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete milestone',
        timestamp: Date.now()
      };
    }
  }

  async getMilestoneStatus(escrowId: string, milestoneId: string): Promise<ApiResponse<EscrowMilestone>> {
    try {
      const escrowResponse = await this.getEscrow(escrowId);
      
      if (escrowResponse.success && escrowResponse.data) {
        const milestone = escrowResponse.data.milestones.find(m => m.id === milestoneId);
        
        if (milestone) {
          return {
            success: true,
            data: milestone,
            timestamp: Date.now()
          };
        }
      }

      throw new Error('Milestone not found');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get milestone status',
        timestamp: Date.now()
      };
    }
  }

  async raiseDispute(escrowId: string, reason: string, evidence: string[]): Promise<ApiResponse<DisputeInfo>> {
    try {
      const response = await contractService.call({
        contractAddress: this.contractAddress,
        method: 'raise_dispute',
        args: [{
          escrow_id: escrowId,
          reason,
          evidence
        }],
        value: 0
      });

      if (response.success && response.data.transactionHash) {
        const disputeId = this.extractDisputeIdFromTx(response.data.transactionHash);
        
        const dispute: DisputeInfo = {
          id: disputeId,
          escrowId,
          reason,
          evidence,
          raisedBy: 'current_user', // Would get from wallet context
          raisedAt: new Date(),
          status: 'open',
          votes: []
        };

        return {
          success: true,
          data: dispute,
          timestamp: Date.now()
        };
      }

      throw new Error(response.error || 'Failed to raise dispute');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to raise dispute',
        timestamp: Date.now()
      };
    }
  }

  async voteOnDispute(disputeId: string, decision: 'buyer' | 'seller', reason: string): Promise<ApiResponse<string>> {
    try {
      const response = await contractService.call({
        contractAddress: this.contractAddress,
        method: 'vote_on_dispute',
        args: [{
          dispute_id: disputeId,
          decision,
          reason
        }],
        value: 0
      });

      if (response.success && response.data.transactionHash) {
        return {
          success: true,
          data: response.data.transactionHash,
          timestamp: Date.now()
        };
      }

      throw new Error(response.error || 'Failed to vote on dispute');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to vote on dispute',
        timestamp: Date.now()
      };
    }
  }

  async resolveDispute(disputeId: string, resolution: string): Promise<ApiResponse<string>> {
    try {
      const response = await contractService.call({
        contractAddress: this.contractAddress,
        method: 'resolve_dispute',
        args: [{
          dispute_id: disputeId,
          resolution
        }],
        value: 0
      });

      if (response.success && response.data.transactionHash) {
        return {
          success: true,
          data: response.data.transactionHash,
          timestamp: Date.now()
        };
      }

      throw new Error(response.error || 'Failed to resolve dispute');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to resolve dispute',
        timestamp: Date.now()
      };
    }
  }

  async getDispute(disputeId: string): Promise<ApiResponse<DisputeInfo>> {
    try {
      const response = await contractService.call({
        contractAddress: this.contractAddress,
        method: 'get_dispute',
        args: [{ dispute_id: disputeId }],
        value: 0
      });

      if (response.success && response.data.result) {
        const contractDispute = response.data.result;
        const dispute = this.mapContractDispute(contractDispute);

        return {
          success: true,
          data: dispute,
          timestamp: Date.now()
        };
      }

      throw new Error('Dispute not found');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get dispute',
        timestamp: Date.now()
      };
    }
  }

  subscribeToEscrowUpdates(escrowId: string, callback: (event: EscrowEvent) => void): void {
    this.subscriptions.set(escrowId, callback);
    
    // Start polling for updates if not already running
    if (!this.updateInterval) {
      this.updateInterval = setInterval(async () => {
        for (const [id, cb] of this.subscriptions.entries()) {
          try {
            const events = await this.getEscrowEventsInternal(id);
            // Only call callback with new events (simplified for now)
            if (events.length > 0) {
              cb(events[events.length - 1]); // Latest event
            }
          } catch (error) {
            console.error('Error in escrow update subscription:', error);
          }
        }
      }, 30000); // Poll every 30 seconds
    }
  }

  unsubscribeFromUpdates(escrowId: string): void {
    this.subscriptions.delete(escrowId);
    
    if (this.subscriptions.size === 0 && this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // Private helper methods
  private extractEscrowIdFromTx(txHash: string): string {
    // In a real implementation, this would parse the transaction logs
    // to extract the escrow ID from the contract events
    return Math.random().toString(36).substr(2, 9);
  }

  private extractDisputeIdFromTx(txHash: string): string {
    // In a real implementation, this would parse the transaction logs
    // to extract the dispute ID from the contract events
    return Math.random().toString(36).substr(2, 9);
  }

  private mapContractStatus(contractStatus: any): RealEscrowCase['status'] {
    // Map contract status to our interface
    switch (contractStatus) {
      case 'created': return 'created';
      case 'funded': return 'funded';
      case 'released': return 'released';
      case 'disputed': return 'disputed';
      case 'resolved': return 'resolved';
      case 'cancelled': return 'cancelled';
      default: return 'created';
    }
  }

  private mapStatusToContract(status: string): string {
    // Map our status to contract status
    return status;
  }

  private mapContractMilestones(contractMilestones: any[]): EscrowMilestone[] {
    return contractMilestones.map((milestone: any) => ({
      id: milestone.id || Math.random().toString(),
      title: milestone.title || '',
      description: milestone.description || '',
      amount: milestone.amount ? parseInt(milestone.amount) / 1000000 : 0,
      status: milestone.status === 'completed' ? 'completed' : 'pending',
      completedAt: milestone.completed_at ? new Date(milestone.completed_at * 1000) : undefined,
      evidence: milestone.evidence || []
    }));
  }

  private mapContractDispute(contractDispute: any): DisputeInfo {
    return {
      id: contractDispute.id || Math.random().toString(),
      escrowId: contractDispute.escrow_id || '',
      reason: contractDispute.reason || '',
      evidence: contractDispute.evidence || [],
      raisedBy: contractDispute.raised_by || '',
      raisedAt: contractDispute.raised_at ? new Date(contractDispute.raised_at * 1000) : new Date(),
      status: contractDispute.status || 'open',
      resolution: contractDispute.resolution,
      resolvedAt: contractDispute.resolved_at ? new Date(contractDispute.resolved_at * 1000) : undefined,
      votes: contractDispute.votes?.map((vote: any) => ({
        voter: vote.voter || '',
        decision: vote.decision || 'buyer',
        reason: vote.reason || '',
        votedAt: vote.voted_at ? new Date(vote.voted_at * 1000) : new Date()
      })) || []
    };
  }

  private async getEscrowEventsInternal(escrowId: string): Promise<EscrowEvent[]> {
    try {
      // In a real implementation, this would query blockchain events
      // For now, return empty array as this requires event indexing
      return [];
    } catch (error) {
      console.error('Error getting escrow events:', error);
      return [];
    }
  }
}

export const escrowContractService = new EscrowContractServiceImpl();
export default escrowContractService;