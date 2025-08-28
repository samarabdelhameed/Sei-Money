// Real Services Export - جميع الخدمات الحقيقية للنظام
export { default as blockchainService } from './blockchain-service';
export { default as contractService } from './contract-service';
export { default as realDataService } from './real-data-service';

// Savings Pots Services
export { default as savingsPotsContract } from './savings-pots-contract';
export { default as autoSaveService } from './auto-save-service';

// Escrow Services - المهمة المكتملة
export { 
  escrowContractService,
  type RealEscrowCase,
  type EscrowMilestone,
  type DisputeInfo,
  type EscrowEvent,
  type CreateEscrowParams
} from './escrow-contract';

export { 
  disputeResolutionService,
  type DisputeEvidence,
  type ArbitrationCase,
  type ArbitrationVote,
  type DisputeResolution
} from './dispute-resolution-service';

export { 
  realEscrowIntegration,
  integrateEscrowWithRealData,
  type EscrowIntegrationService
} from './real-escrow-integration';

// AI Services - المهمة الحالية
export { 
  default as aiAnalysisService,
  type PortfolioData,
  type PortfolioMetrics,
  type RiskAnalysis,
  type PerformanceTracking
} from './ai-analysis-service';

export { 
  default as aiRecommendationEngine,
  type AIRecommendation,
  type UserProfile,
  type MarketContext,
  type RecommendationExecution
} from './ai-recommendation-engine';

export { 
  default as aiAgentService,
  type AIAgentStatus,
  type AIInsights,
  type AgentUpdate
} from './ai-agent-service';

// Service Status
export const serviceStatus = {
  blockchain: 'active',
  contracts: 'active',
  realData: 'active',
  savingsPots: 'active',
  autoSave: 'active',
  escrow: 'active', // ✅ مكتمل
  disputeResolution: 'active', // ✅ مكتمل
  escrowIntegration: 'active', // ✅ مكتمل
  aiAnalysis: 'active', // ✅ مكتمل
  aiRecommendations: 'active', // ✅ مكتمل
  aiAgent: 'active' // ✅ مكتمل
};

// Service Health Check
export const checkServiceHealth = async () => {
  const health = {
    blockchain: false,
    contracts: false,
    realData: false,
    escrow: false,
    disputeResolution: false
  };

  try {
    // Test blockchain service
    const balanceTest = await blockchainService.getBalance('test_address');
    health.blockchain = balanceTest.success;

    // Test contract service
    const contractTest = await contractService.call({
      contractAddress: 'test',
      method: 'test',
      args: []
    });
    health.contracts = contractTest.success;

    // Test real data service
    const realDataTest = await realDataService.getWalletBalance('test_address');
    health.realData = typeof realDataTest === 'number';

    // Test escrow service
    const escrowTest = await escrowContractService.getUserEscrows('test_address');
    health.escrow = escrowTest.success;

    // Test dispute resolution service
    const disputeTest = await disputeResolutionService.getDisputeStatistics();
    health.disputeResolution = disputeTest.success;

  } catch (error) {
    console.error('Service health check failed:', error);
  }

  return health;
};

// Initialize all services
export const initializeServices = async (userAddress?: string) => {
  try {
    console.log('🚀 Initializing SeiMoney Real Services...');
    
    // Initialize real data service
    if (userAddress) {
      realDataService.subscribeToUpdates(userAddress, (data) => {
        console.log('Real data update:', data);
      });
      
      // Start escrow monitoring
      realEscrowIntegration.startEscrowMonitoring(userAddress);
    }
    
    console.log('✅ All services initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Service initialization failed:', error);
    return false;
  }
};

// Cleanup services
export const cleanupServices = () => {
  try {
    console.log('🧹 Cleaning up services...');
    
    realDataService.unsubscribeFromUpdates();
    realEscrowIntegration.stopEscrowMonitoring();
    
    console.log('✅ Services cleaned up successfully');
  } catch (error) {
    console.error('❌ Service cleanup failed:', error);
  }
};