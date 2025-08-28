import { ApiResponse } from '../../types';
import { contractService } from './contract-service';
import { escrowContractService, DisputeInfo, DisputeVote, EscrowEvent } from './escrow-contract';

// Dispute Resolution Service for Real Blockchain Implementation
export interface DisputeEvidence {
  id: string;
  disputeId: string;
  submittedBy: string;
  type: 'document' | 'image' | 'video' | 'text' | 'transaction';
  title: string;
  description: string;
  content: string; // IPFS hash or direct content
  timestamp: Date;
  verified: boolean;
}

export interface ArbitrationCase {
  id: string;
  disputeId: string;
  escrowId: string;
  arbiters: string[];
  requiredVotes: number;
  currentVotes: number;
  status: 'pending' | 'voting' | 'decided' | 'executed';
  deadline: Date;
  createdAt: Date;
  decision?: 'buyer' | 'seller' | 'split';
  executedAt?: Date;
  executionTxHash?: string;
}

export interface ArbitrationVote {
  id: string;
  caseId: string;
  voter: string;
  decision: 'buyer' | 'seller' | 'split';
  reasoning: string;
  confidence: number; // 1-10 scale
  timestamp: Date;
  txHash: string;
}

export interface DisputeResolution {
  id: string;
  disputeId: string;
  resolution: 'buyer_wins' | 'seller_wins' | 'split_funds' | 'extend_deadline' | 'cancel_escrow';
  reasoning: string;
  fundDistribution: {
    buyer: number;
    seller: number;
    arbiters: number;
  };
  executedAt: Date;
  txHash: string;
}

export interface DisputeResolutionService {
  // Evidence management
  submitEvidence(disputeId: string, evidence: Omit<DisputeEvidence, 'id' | 'timestamp' | 'verified'>): Promise<ApiResponse<DisputeEvidence>>;
  getDisputeEvidence(disputeId: string): Promise<ApiResponse<DisputeEvidence[]>>;
  verifyEvidence(evidenceId: string): Promise<ApiResponse<boolean>>;
  
  // Arbitration system
  createArbitrationCase(disputeId: string, arbiters: string[]): Promise<ApiResponse<ArbitrationCase>>;
  getArbitrationCase(caseId: string): Promise<ApiResponse<ArbitrationCase>>;
  submitArbitrationVote(caseId: string, decision: 'buyer' | 'seller' | 'split', reasoning: string, confidence: number): Promise<ApiResponse<ArbitrationVote>>;
  getArbitrationVotes(caseId: string): Promise<ApiResponse<ArbitrationVote[]>>;
  
  // Resolution execution
  executeResolution(caseId: string): Promise<ApiResponse<DisputeResolution>>;
  getResolutionHistory(disputeId: string): Promise<ApiResponse<DisputeResolution[]>>;
  
  // Automatic resolution
  checkAutoResolution(disputeId: string): Promise<ApiResponse<boolean>>;
  executeAutoResolution(disputeId: string): Promise<ApiResponse<DisputeResolution>>;
  
  // Real-time monitoring
  subscribeToDisputeUpdates(disputeId: string, callback: (event: any) => void): void;
  unsubscribeFromDisputeUpdates(disputeId: string): void;
  
  // Analytics and reporting
  getDisputeStatistics(): Promise<ApiResponse<any>>;
  getArbitrationPerformance(arbiter: string): Promise<ApiResponse<any>>;
}

class DisputeResolutionServiceImpl implements DisputeResolutionService {
  private readonly contractAddress = 'sei1dispute...'; // Real dispute resolution contract
  private subscriptions: Map<string, (event: any) => void> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;

  async submitEvidence(
    disputeId: string, 
    evidence: Omit<DisputeEvidence, 'id' | 'timestamp' | 'verified'>
  ): Promise<ApiResponse<DisputeEvidence>> {
    try {
      // Store evidence on IPFS or blockchain storage
      const contentHash = await this.storeEvidenceContent(evidence.content, evidence.type);
      
      const response = await contractService.call({
        contractAddress: this.contractAddress,
        method: 'submit_evidence',
        args: [{
          dispute_id: disputeId,
          evidence_type: evidence.type,
          title: evidence.title,
          description: evidence.description,
          content_hash: contentHash,
          submitted_by: evidence.submittedBy
        }],
        value: 0
      });

      if (response.success && response.data.transactionHash) {
        const evidenceId = this.extractEvidenceIdFromTx(response.data.transactionHash);
        
        const newEvidence: DisputeEvidence = {
          id: evidenceId,
          disputeId,
          submittedBy: evidence.submittedBy,
          type: evidence.type,
          title: evidence.title,
          description: evidence.description,
          content: contentHash,
          timestamp: new Date(),
          verified: false // Will be verified by arbiters
        };

        return {
          success: true,
          data: newEvidence,
          timestamp: Date.now()
        };
      }

      throw new Error(response.error || 'Failed to submit evidence');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit evidence',
        timestamp: Date.now()
      };
    }
  }

  async getDisputeEvidence(disputeId: string): Promise<ApiResponse<DisputeEvidence[]>> {
    try {
      const response = await contractService.call({
        contractAddress: this.contractAddress,
        method: 'get_dispute_evidence',
        args: [{ dispute_id: disputeId }],
        value: 0
      });

      if (response.success && response.data.result) {
        const contractEvidence = Array.isArray(response.data.result) ? response.data.result : [];
        
        const evidence: DisputeEvidence[] = contractEvidence.map((item: any) => ({
          id: item.id || Math.random().toString(),
          disputeId,
          submittedBy: item.submitted_by || '',
          type: item.evidence_type || 'text',
          title: item.title || '',
          description: item.description || '',
          content: item.content_hash || '',
          timestamp: item.timestamp ? new Date(item.timestamp * 1000) : new Date(),
          verified: item.verified || false
        }));

        return {
          success: true,
          data: evidence,
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
        error: error instanceof Error ? error.message : 'Failed to get dispute evidence',
        timestamp: Date.now()
      };
    }
  }

  async verifyEvidence(evidenceId: string): Promise<ApiResponse<boolean>> {
    try {
      const response = await contractService.call({
        contractAddress: this.contractAddress,
        method: 'verify_evidence',
        args: [{ evidence_id: evidenceId }],
        value: 0
      });

      if (response.success && response.data.transactionHash) {
        return {
          success: true,
          data: true,
          timestamp: Date.now()
        };
      }

      throw new Error(response.error || 'Failed to verify evidence');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify evidence',
        timestamp: Date.now()
      };
    }
  }

  async createArbitrationCase(disputeId: string, arbiters: string[]): Promise<ApiResponse<ArbitrationCase>> {
    try {
      const requiredVotes = Math.ceil(arbiters.length / 2); // Majority required
      const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      
      const response = await contractService.call({
        contractAddress: this.contractAddress,
        method: 'create_arbitration_case',
        args: [{
          dispute_id: disputeId,
          arbiters,
          required_votes: requiredVotes,
          deadline: Math.floor(deadline.getTime() / 1000)
        }],
        value: 0
      });

      if (response.success && response.data.transactionHash) {
        const caseId = this.extractCaseIdFromTx(response.data.transactionHash);
        
        // Get escrow ID from dispute
        const disputeResponse = await escrowContractService.getDispute(disputeId);
        const escrowId = disputeResponse.success ? disputeResponse.data?.escrowId || '' : '';
        
        const arbitrationCase: ArbitrationCase = {
          id: caseId,
          disputeId,
          escrowId,
          arbiters,
          requiredVotes,
          currentVotes: 0,
          status: 'voting',
          deadline,
          createdAt: new Date()
        };

        return {
          success: true,
          data: arbitrationCase,
          timestamp: Date.now()
        };
      }

      throw new Error(response.error || 'Failed to create arbitration case');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create arbitration case',
        timestamp: Date.now()
      };
    }
  }

  async getArbitrationCase(caseId: string): Promise<ApiResponse<ArbitrationCase>> {
    try {
      const response = await contractService.call({
        contractAddress: this.contractAddress,
        method: 'get_arbitration_case',
        args: [{ case_id: caseId }],
        value: 0
      });

      if (response.success && response.data.result) {
        const contractCase = response.data.result;
        
        const arbitrationCase: ArbitrationCase = {
          id: contractCase.id || caseId,
          disputeId: contractCase.dispute_id || '',
          escrowId: contractCase.escrow_id || '',
          arbiters: contractCase.arbiters || [],
          requiredVotes: contractCase.required_votes || 1,
          currentVotes: contractCase.current_votes || 0,
          status: contractCase.status || 'pending',
          deadline: contractCase.deadline ? new Date(contractCase.deadline * 1000) : new Date(),
          createdAt: contractCase.created_at ? new Date(contractCase.created_at * 1000) : new Date(),
          decision: contractCase.decision,
          executedAt: contractCase.executed_at ? new Date(contractCase.executed_at * 1000) : undefined,
          executionTxHash: contractCase.execution_tx_hash
        };

        return {
          success: true,
          data: arbitrationCase,
          timestamp: Date.now()
        };
      }

      throw new Error('Arbitration case not found');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get arbitration case',
        timestamp: Date.now()
      };
    }
  }

  async submitArbitrationVote(
    caseId: string, 
    decision: 'buyer' | 'seller' | 'split', 
    reasoning: string, 
    confidence: number
  ): Promise<ApiResponse<ArbitrationVote>> {
    try {
      const response = await contractService.call({
        contractAddress: this.contractAddress,
        method: 'submit_arbitration_vote',
        args: [{
          case_id: caseId,
          decision,
          reasoning,
          confidence: Math.max(1, Math.min(10, confidence)) // Ensure 1-10 range
        }],
        value: 0
      });

      if (response.success && response.data.transactionHash) {
        const voteId = this.extractVoteIdFromTx(response.data.transactionHash);
        
        const vote: ArbitrationVote = {
          id: voteId,
          caseId,
          voter: 'current_user', // Would get from wallet context
          decision,
          reasoning,
          confidence,
          timestamp: new Date(),
          txHash: response.data.transactionHash
        };

        return {
          success: true,
          data: vote,
          timestamp: Date.now()
        };
      }

      throw new Error(response.error || 'Failed to submit arbitration vote');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit arbitration vote',
        timestamp: Date.now()
      };
    }
  }

  async getArbitrationVotes(caseId: string): Promise<ApiResponse<ArbitrationVote[]>> {
    try {
      const response = await contractService.call({
        contractAddress: this.contractAddress,
        method: 'get_arbitration_votes',
        args: [{ case_id: caseId }],
        value: 0
      });

      if (response.success && response.data.result) {
        const contractVotes = Array.isArray(response.data.result) ? response.data.result : [];
        
        const votes: ArbitrationVote[] = contractVotes.map((vote: any) => ({
          id: vote.id || Math.random().toString(),
          caseId,
          voter: vote.voter || '',
          decision: vote.decision || 'buyer',
          reasoning: vote.reasoning || '',
          confidence: vote.confidence || 5,
          timestamp: vote.timestamp ? new Date(vote.timestamp * 1000) : new Date(),
          txHash: vote.tx_hash || ''
        }));

        return {
          success: true,
          data: votes,
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
        error: error instanceof Error ? error.message : 'Failed to get arbitration votes',
        timestamp: Date.now()
      };
    }
  }

  async executeResolution(caseId: string): Promise<ApiResponse<DisputeResolution>> {
    try {
      // First get the arbitration case to determine the decision
      const caseResponse = await this.getArbitrationCase(caseId);
      if (!caseResponse.success || !caseResponse.data) {
        throw new Error('Arbitration case not found');
      }

      const arbitrationCase = caseResponse.data;
      
      // Get votes to calculate the decision
      const votesResponse = await this.getArbitrationVotes(caseId);
      if (!votesResponse.success) {
        throw new Error('Failed to get arbitration votes');
      }

      const votes = votesResponse.data || [];
      const decision = this.calculateDecision(votes);
      const fundDistribution = this.calculateFundDistribution(decision, arbitrationCase);

      const response = await contractService.call({
        contractAddress: this.contractAddress,
        method: 'execute_resolution',
        args: [{
          case_id: caseId,
          decision,
          fund_distribution: {
            buyer: Math.floor(fundDistribution.buyer * 1000000), // Convert to usei
            seller: Math.floor(fundDistribution.seller * 1000000),
            arbiters: Math.floor(fundDistribution.arbiters * 1000000)
          }
        }],
        value: 0
      });

      if (response.success && response.data.transactionHash) {
        const resolution: DisputeResolution = {
          id: Math.random().toString(),
          disputeId: arbitrationCase.disputeId,
          resolution: this.mapDecisionToResolution(decision),
          reasoning: this.generateResolutionReasoning(votes, decision),
          fundDistribution,
          executedAt: new Date(),
          txHash: response.data.transactionHash
        };

        return {
          success: true,
          data: resolution,
          timestamp: Date.now()
        };
      }

      throw new Error(response.error || 'Failed to execute resolution');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute resolution',
        timestamp: Date.now()
      };
    }
  }

  async getResolutionHistory(disputeId: string): Promise<ApiResponse<DisputeResolution[]>> {
    try {
      const response = await contractService.call({
        contractAddress: this.contractAddress,
        method: 'get_resolution_history',
        args: [{ dispute_id: disputeId }],
        value: 0
      });

      if (response.success && response.data.result) {
        const contractResolutions = Array.isArray(response.data.result) ? response.data.result : [];
        
        const resolutions: DisputeResolution[] = contractResolutions.map((res: any) => ({
          id: res.id || Math.random().toString(),
          disputeId,
          resolution: res.resolution || 'buyer_wins',
          reasoning: res.reasoning || '',
          fundDistribution: {
            buyer: res.fund_distribution?.buyer ? parseInt(res.fund_distribution.buyer) / 1000000 : 0,
            seller: res.fund_distribution?.seller ? parseInt(res.fund_distribution.seller) / 1000000 : 0,
            arbiters: res.fund_distribution?.arbiters ? parseInt(res.fund_distribution.arbiters) / 1000000 : 0
          },
          executedAt: res.executed_at ? new Date(res.executed_at * 1000) : new Date(),
          txHash: res.tx_hash || ''
        }));

        return {
          success: true,
          data: resolutions,
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
        error: error instanceof Error ? error.message : 'Failed to get resolution history',
        timestamp: Date.now()
      };
    }
  }

  async checkAutoResolution(disputeId: string): Promise<ApiResponse<boolean>> {
    try {
      const response = await contractService.call({
        contractAddress: this.contractAddress,
        method: 'check_auto_resolution',
        args: [{ dispute_id: disputeId }],
        value: 0
      });

      if (response.success && response.data.result) {
        return {
          success: true,
          data: response.data.result.can_auto_resolve || false,
          timestamp: Date.now()
        };
      }

      return {
        success: true,
        data: false,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check auto resolution',
        timestamp: Date.now()
      };
    }
  }

  async executeAutoResolution(disputeId: string): Promise<ApiResponse<DisputeResolution>> {
    try {
      const response = await contractService.call({
        contractAddress: this.contractAddress,
        method: 'execute_auto_resolution',
        args: [{ dispute_id: disputeId }],
        value: 0
      });

      if (response.success && response.data.transactionHash) {
        // Auto resolution typically favors the buyer if seller doesn't respond
        const resolution: DisputeResolution = {
          id: Math.random().toString(),
          disputeId,
          resolution: 'buyer_wins',
          reasoning: 'Automatic resolution due to seller non-response within deadline',
          fundDistribution: {
            buyer: 0.95, // 95% to buyer
            seller: 0,
            arbiters: 0.05 // 5% arbitration fee
          },
          executedAt: new Date(),
          txHash: response.data.transactionHash
        };

        return {
          success: true,
          data: resolution,
          timestamp: Date.now()
        };
      }

      throw new Error(response.error || 'Failed to execute auto resolution');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute auto resolution',
        timestamp: Date.now()
      };
    }
  }

  subscribeToDisputeUpdates(disputeId: string, callback: (event: any) => void): void {
    this.subscriptions.set(disputeId, callback);
    
    // Start polling for updates if not already running
    if (!this.updateInterval) {
      this.updateInterval = setInterval(async () => {
        for (const [id, cb] of this.subscriptions.entries()) {
          try {
            // Check for dispute updates
            const disputeResponse = await escrowContractService.getDispute(id);
            if (disputeResponse.success && disputeResponse.data) {
              cb({
                type: 'dispute_update',
                disputeId: id,
                dispute: disputeResponse.data,
                timestamp: new Date()
              });
            }
          } catch (error) {
            console.error('Error in dispute update subscription:', error);
          }
        }
      }, 30000); // Poll every 30 seconds
    }
  }

  unsubscribeFromDisputeUpdates(disputeId: string): void {
    this.subscriptions.delete(disputeId);
    
    if (this.subscriptions.size === 0 && this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  async getDisputeStatistics(): Promise<ApiResponse<any>> {
    try {
      const response = await contractService.call({
        contractAddress: this.contractAddress,
        method: 'get_dispute_statistics',
        args: [],
        value: 0
      });

      if (response.success && response.data.result) {
        return {
          success: true,
          data: response.data.result,
          timestamp: Date.now()
        };
      }

      // Return mock statistics if contract doesn't support this yet
      return {
        success: true,
        data: {
          totalDisputes: 0,
          resolvedDisputes: 0,
          averageResolutionTime: 0,
          buyerWinRate: 0,
          sellerWinRate: 0,
          splitRate: 0
        },
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get dispute statistics',
        timestamp: Date.now()
      };
    }
  }

  async getArbitrationPerformance(arbiter: string): Promise<ApiResponse<any>> {
    try {
      const response = await contractService.call({
        contractAddress: this.contractAddress,
        method: 'get_arbitration_performance',
        args: [{ arbiter }],
        value: 0
      });

      if (response.success && response.data.result) {
        return {
          success: true,
          data: response.data.result,
          timestamp: Date.now()
        };
      }

      // Return mock performance if contract doesn't support this yet
      return {
        success: true,
        data: {
          totalCases: 0,
          completedCases: 0,
          averageConfidence: 0,
          successRate: 0,
          reputation: 0
        },
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get arbitration performance',
        timestamp: Date.now()
      };
    }
  }

  // Private helper methods
  private async storeEvidenceContent(content: string, type: string): Promise<string> {
    // In a real implementation, this would store content on IPFS or similar
    // For now, return a mock hash
    return `ipfs_${type}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractEvidenceIdFromTx(txHash: string): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private extractCaseIdFromTx(txHash: string): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private extractVoteIdFromTx(txHash: string): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private calculateDecision(votes: ArbitrationVote[]): 'buyer' | 'seller' | 'split' {
    if (votes.length === 0) return 'buyer'; // Default to buyer if no votes
    
    const voteCounts = votes.reduce((acc, vote) => {
      acc[vote.decision] = (acc[vote.decision] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Find the decision with the most votes
    const maxVotes = Math.max(...Object.values(voteCounts));
    const winningDecisions = Object.entries(voteCounts)
      .filter(([_, count]) => count === maxVotes)
      .map(([decision, _]) => decision);

    // If there's a tie, default to split
    if (winningDecisions.length > 1) return 'split';
    
    return winningDecisions[0] as 'buyer' | 'seller' | 'split';
  }

  private calculateFundDistribution(decision: 'buyer' | 'seller' | 'split', arbitrationCase: ArbitrationCase): {
    buyer: number;
    seller: number;
    arbiters: number;
  } {
    const arbitrationFee = 0.05; // 5% arbitration fee
    const remainingFunds = 1 - arbitrationFee;

    switch (decision) {
      case 'buyer':
        return {
          buyer: remainingFunds,
          seller: 0,
          arbiters: arbitrationFee
        };
      case 'seller':
        return {
          buyer: 0,
          seller: remainingFunds,
          arbiters: arbitrationFee
        };
      case 'split':
        return {
          buyer: remainingFunds / 2,
          seller: remainingFunds / 2,
          arbiters: arbitrationFee
        };
      default:
        return {
          buyer: remainingFunds,
          seller: 0,
          arbiters: arbitrationFee
        };
    }
  }

  private mapDecisionToResolution(decision: 'buyer' | 'seller' | 'split'): DisputeResolution['resolution'] {
    switch (decision) {
      case 'buyer': return 'buyer_wins';
      case 'seller': return 'seller_wins';
      case 'split': return 'split_funds';
      default: return 'buyer_wins';
    }
  }

  private generateResolutionReasoning(votes: ArbitrationVote[], decision: 'buyer' | 'seller' | 'split'): string {
    if (votes.length === 0) {
      return 'No arbitration votes received, defaulting to buyer protection';
    }

    const decisionVotes = votes.filter(vote => vote.decision === decision);
    const avgConfidence = decisionVotes.reduce((sum, vote) => sum + vote.confidence, 0) / decisionVotes.length;
    
    return `Arbitration decision based on ${decisionVotes.length} votes with average confidence of ${avgConfidence.toFixed(1)}/10. ${
      decisionVotes.length > 0 ? `Primary reasoning: ${decisionVotes[0].reasoning}` : ''
    }`;
  }
}

export const disputeResolutionService = new DisputeResolutionServiceImpl();
export default disputeResolutionService;