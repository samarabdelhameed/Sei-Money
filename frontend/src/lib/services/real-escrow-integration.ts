import { escrowContractService, RealEscrowCase } from './escrow-contract';
import { disputeResolutionService } from './dispute-resolution-service';
import { realDataService } from './real-data-service';

// Real Escrow Integration Service - يربط جميع خدمات الإسكرو الحقيقية
export interface EscrowIntegrationService {
  // Complete escrow workflow
  createCompleteEscrow(params: any): Promise<RealEscrowCase>;
  getEscrowWithDisputes(escrowId: string): Promise<RealEscrowCase & { disputes?: any[] }>;
  handleEscrowLifecycle(escrowId: string, action: string): Promise<any>;
  
  // Real-time monitoring
  startEscrowMonitoring(userAddress: string): void;
  stopEscrowMonitoring(): void;
  
  // Analytics and reporting
  getEscrowAnalytics(userAddress: string): Promise<any>;
}

class RealEscrowIntegrationImpl implements EscrowIntegrationService {
  private monitoringActive = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  async createCompleteEscrow(params: {
    title: string;
    description: string;
    amount: number;
    seller: string;
    arbiter?: string;
    expiryDate: Date;
    terms: string[];
    autoFund?: boolean;
  }): Promise<RealEscrowCase> {
    try {
      // 1. Create the escrow contract
      const createResponse = await escrowContractService.createEscrow({
        title: params.title,
        description: params.description,
        amount: params.amount,
        seller: params.seller,
        arbiter: params.arbiter || 'sei1default_arbiter...',
        expiryDate: params.expiryDate,
        terms: params.terms
      });

      if (!createResponse.success || !createResponse.data) {
        throw new Error(createResponse.error || 'Failed to create escrow');
      }

      const escrow = createResponse.data;

      // 2. Auto-fund if requested
      if (params.autoFund) {
        const fundResponse = await escrowContractService.fundEscrow(escrow.id, params.amount);
        if (fundResponse.success) {
          escrow.status = 'funded';
        }
      }

      // 3. Set up monitoring for this escrow
      escrowContractService.subscribeToEscrowUpdates(escrow.id, (event) => {
        console.log('Escrow event:', event);
        // Handle real-time updates
      });

      return escrow;
    } catch (error) {
      throw new Error(`Failed to create complete escrow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getEscrowWithDisputes(escrowId: string): Promise<RealEscrowCase & { disputes?: any[] }> {
    try {
      // 1. Get the escrow details
      const escrowResponse = await escrowContractService.getEscrow(escrowId);
      if (!escrowResponse.success || !escrowResponse.data) {
        throw new Error('Escrow not found');
      }

      const escrow = escrowResponse.data;

      // 2. Get dispute information if escrow is disputed
      let disputes: any[] = [];
      if (escrow.status === 'disputed' && escrow.disputeInfo) {
        const evidenceResponse = await disputeResolutionService.getDisputeEvidence(escrow.disputeInfo.id);
        if (evidenceResponse.success) {
          disputes = [{
            ...escrow.disputeInfo,
            evidence: evidenceResponse.data || []
          }];
        }
      }

      return {
        ...escrow,
        disputes
      };
    } catch (error) {
      throw new Error(`Failed to get escrow with disputes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async handleEscrowLifecycle(escrowId: string, action: string): Promise<any> {
    try {
      switch (action) {
        case 'fund':
          // Get escrow amount first
          const escrowResponse = await escrowContractService.getEscrow(escrowId);
          if (!escrowResponse.success || !escrowResponse.data) {
            throw new Error('Escrow not found');
          }
          return await escrowContractService.fundEscrow(escrowId, escrowResponse.data.amount);

        case 'release':
          return await escrowContractService.releasePayment(escrowId);

        case 'dispute':
          return await escrowContractService.raiseDispute(escrowId, 'Dispute raised from lifecycle management', []);

        case 'cancel':
          return await escrowContractService.cancelEscrow(escrowId);

        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      throw new Error(`Failed to handle escrow lifecycle: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  startEscrowMonitoring(userAddress: string): void {
    if (this.monitoringActive) {
      return;
    }

    this.monitoringActive = true;
    
    // Monitor escrows every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      try {
        // 1. Get user's escrows
        const escrowsResponse = await escrowContractService.getUserEscrows(userAddress);
        if (!escrowsResponse.success || !escrowsResponse.data) {
          return;
        }

        const escrows = escrowsResponse.data;

        // 2. Check for expired escrows
        const now = new Date();
        const expiredEscrows = escrows.filter(escrow => 
          escrow.expiryDate < now && 
          ['created', 'funded'].includes(escrow.status)
        );

        // 3. Handle expired escrows
        for (const escrow of expiredEscrows) {
          if (escrow.status === 'funded') {
            // Auto-release to buyer if seller didn't deliver
            await escrowContractService.releasePayment(escrow.id);
          } else if (escrow.status === 'created') {
            // Cancel unfunded escrows
            await escrowContractService.cancelEscrow(escrow.id);
          }
        }

        // 4. Check for disputes that can be auto-resolved
        const disputedEscrows = escrows.filter(escrow => escrow.status === 'disputed');
        for (const escrow of disputedEscrows) {
          if (escrow.disputeInfo) {
            const canAutoResolve = await disputeResolutionService.checkAutoResolution(escrow.disputeInfo.id);
            if (canAutoResolve.success && canAutoResolve.data) {
              await disputeResolutionService.executeAutoResolution(escrow.disputeInfo.id);
            }
          }
        }

      } catch (error) {
        console.error('Error in escrow monitoring:', error);
      }
    }, 30000);
  }

  stopEscrowMonitoring(): void {
    this.monitoringActive = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  async getEscrowAnalytics(userAddress: string): Promise<any> {
    try {
      // 1. Get user's escrows
      const escrowsResponse = await escrowContractService.getUserEscrows(userAddress);
      if (!escrowsResponse.success || !escrowsResponse.data) {
        return {
          totalEscrows: 0,
          totalValue: 0,
          completedEscrows: 0,
          disputedEscrows: 0,
          successRate: 0,
          averageValue: 0,
          averageCompletionTime: 0
        };
      }

      const escrows = escrowsResponse.data;

      // 2. Calculate analytics
      const totalEscrows = escrows.length;
      const totalValue = escrows.reduce((sum, escrow) => sum + escrow.amount, 0);
      const completedEscrows = escrows.filter(e => e.status === 'released').length;
      const disputedEscrows = escrows.filter(e => e.status === 'disputed').length;
      const successRate = totalEscrows > 0 ? (completedEscrows / totalEscrows) * 100 : 0;
      const averageValue = totalEscrows > 0 ? totalValue / totalEscrows : 0;

      // Calculate average completion time for completed escrows
      const completedEscrowsWithTime = escrows.filter(e => e.status === 'released');
      const averageCompletionTime = completedEscrowsWithTime.length > 0 
        ? completedEscrowsWithTime.reduce((sum, escrow) => {
            const completionTime = new Date().getTime() - escrow.createdAt.getTime();
            return sum + completionTime;
          }, 0) / completedEscrowsWithTime.length / (1000 * 60 * 60 * 24) // Convert to days
        : 0;

      // 3. Get dispute statistics
      const disputeStats = await disputeResolutionService.getDisputeStatistics();

      return {
        totalEscrows,
        totalValue,
        completedEscrows,
        disputedEscrows,
        successRate,
        averageValue,
        averageCompletionTime,
        disputeStatistics: disputeStats.success ? disputeStats.data : null,
        monthlyTrend: await this.calculateMonthlyTrend(escrows),
        statusDistribution: this.calculateStatusDistribution(escrows)
      };
    } catch (error) {
      throw new Error(`Failed to get escrow analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async calculateMonthlyTrend(escrows: RealEscrowCase[]): Promise<any[]> {
    const monthlyData: { [key: string]: { count: number; value: number } } = {};
    
    escrows.forEach(escrow => {
      const monthKey = escrow.createdAt.toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { count: 0, value: 0 };
      }
      monthlyData[monthKey].count++;
      monthlyData[monthKey].value += escrow.amount;
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        count: data.count,
        value: data.value
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private calculateStatusDistribution(escrows: RealEscrowCase[]): any {
    const distribution: { [key: string]: number } = {};
    
    escrows.forEach(escrow => {
      distribution[escrow.status] = (distribution[escrow.status] || 0) + 1;
    });

    return distribution;
  }
}

// Export singleton instance
export const realEscrowIntegration = new RealEscrowIntegrationImpl();

// Integration with existing real data service
export const integrateEscrowWithRealData = () => {
  // Extend real data service with escrow methods
  const originalRealDataService = realDataService;
  
  return {
    ...originalRealDataService,
    
    // Add escrow-specific methods
    async getUserEscrows(address: string) {
      const response = await escrowContractService.getUserEscrows(address);
      return response.success ? response.data || [] : [];
    },
    
    async getEscrowAnalytics(address: string) {
      return await realEscrowIntegration.getEscrowAnalytics(address);
    },
    
    async createEscrow(params: any) {
      return await realEscrowIntegration.createCompleteEscrow(params);
    },
    
    // Start monitoring when user connects
    startMonitoring(address: string) {
      originalRealDataService.subscribeToUpdates(address, (data) => {
        // Handle wallet updates
      });
      realEscrowIntegration.startEscrowMonitoring(address);
    },
    
    // Stop monitoring when user disconnects
    stopMonitoring() {
      originalRealDataService.unsubscribeFromUpdates();
      realEscrowIntegration.stopEscrowMonitoring();
    }
  };
};

export default realEscrowIntegration;