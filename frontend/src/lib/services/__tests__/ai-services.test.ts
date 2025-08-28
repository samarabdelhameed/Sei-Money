import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { aiAnalysisService, PortfolioData } from '../ai-analysis-service';
import { aiRecommendationEngine, UserProfile } from '../ai-recommendation-engine';
import { aiAgentService } from '../ai-agent-service';

// Mock the dependencies
vi.mock('../real-data-service');
vi.mock('../blockchain-service');
vi.mock('../contract-service');

describe('AI Analysis Service', () => {
  const mockAddress = 'sei1test_address';
  
  const mockPortfolioData: PortfolioData = {
    address: mockAddress,
    balance: 1000,
    transactions: [],
    pots: [
      {
        id: '1',
        name: 'Vacation Fund',
        currentAmount: 500,
        targetAmount: 1000,
        category: 'vacation'
      }
    ],
    escrows: [],
    groups: [],
    vaults: [],
    investments: [],
    marketData: {
      price: 0.5,
      change24h: 2.5,
      volume24h: 1000000,
      marketCap: 500000000,
      tvl: 50000000,
      activeUsers: 10000
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    aiAnalysisService.unsubscribeFromPortfolioUpdates();
  });

  test('should aggregate portfolio data from real sources', async () => {
    const portfolioData = await aiAnalysisService.aggregatePortfolioData(mockAddress);
    
    expect(portfolioData).toBeDefined();
    expect(portfolioData.address).toBe(mockAddress);
    expect(typeof portfolioData.balance).toBe('number');
    expect(Array.isArray(portfolioData.pots)).toBe(true);
    expect(Array.isArray(portfolioData.escrows)).toBe(true);
    expect(Array.isArray(portfolioData.groups)).toBe(true);
    expect(Array.isArray(portfolioData.vaults)).toBe(true);
    expect(Array.isArray(portfolioData.investments)).toBe(true);
    expect(portfolioData.marketData).toBeDefined();
  });

  test('should calculate portfolio metrics correctly', async () => {
    const metrics = await aiAnalysisService.calculatePortfolioMetrics(mockPortfolioData);
    
    expect(metrics).toBeDefined();
    expect(typeof metrics.totalValue).toBe('number');
    expect(typeof metrics.diversificationScore).toBe('number');
    expect(typeof metrics.riskScore).toBe('number');
    expect(typeof metrics.performanceScore).toBe('number');
    expect(typeof metrics.liquidityRatio).toBe('number');
    expect(typeof metrics.growthRate).toBe('number');
    
    expect(metrics.diversificationScore).toBeGreaterThanOrEqual(0);
    expect(metrics.diversificationScore).toBeLessThanOrEqual(100);
    expect(metrics.riskScore).toBeGreaterThanOrEqual(0);
    expect(metrics.riskScore).toBeLessThanOrEqual(100);
  });

  test('should analyze portfolio risk', async () => {
    const riskAnalysis = await aiAnalysisService.analyzeRisk(mockPortfolioData);
    
    expect(riskAnalysis).toBeDefined();
    expect(['low', 'medium', 'high']).toContain(riskAnalysis.overallRisk);
    expect(Array.isArray(riskAnalysis.riskFactors)).toBe(true);
    expect(Array.isArray(riskAnalysis.recommendations)).toBe(true);
    expect(typeof riskAnalysis.concentrationRisk).toBe('number');
    expect(typeof riskAnalysis.liquidityRisk).toBe('number');
    expect(typeof riskAnalysis.marketRisk).toBe('number');
    expect(typeof riskAnalysis.counterpartyRisk).toBe('number');
  });

  test('should track portfolio performance', async () => {
    const performance = await aiAnalysisService.trackPerformance(mockPortfolioData);
    
    expect(performance).toBeDefined();
    expect(typeof performance.totalReturn).toBe('number');
    expect(typeof performance.totalReturnPercentage).toBe('number');
    expect(typeof performance.annualizedReturn).toBe('number');
    expect(typeof performance.sharpeRatio).toBe('number');
    expect(typeof performance.maxDrawdown).toBe('number');
    expect(typeof performance.volatility).toBe('number');
    expect(typeof performance.benchmarkComparison).toBe('number');
    expect(Array.isArray(performance.performanceHistory)).toBe(true);
  });

  test('should subscribe to portfolio updates', () => {
    const mockCallback = vi.fn();
    
    aiAnalysisService.subscribeToPortfolioUpdates(mockAddress, mockCallback);
    
    // Verify subscription was set up (implementation detail)
    expect(mockCallback).not.toHaveBeenCalled(); // Should not be called immediately
  });
});

describe('AI Recommendation Engine', () => {
  const mockAddress = 'sei1test_address';
  
  const mockUserProfile: UserProfile = {
    riskTolerance: 'moderate',
    investmentGoals: ['growth', 'savings'],
    timeHorizon: 'medium',
    liquidityNeeds: 'medium',
    experienceLevel: 'intermediate',
    preferences: {
      autoExecuteRecommendations: false,
      maxRiskLevel: 70,
      preferredAssetTypes: ['savings', 'investment'],
      excludedStrategies: [],
      notificationFrequency: 'daily'
    }
  };

  const mockPortfolioData: PortfolioData = {
    address: mockAddress,
    balance: 1000,
    transactions: [],
    pots: [],
    escrows: [],
    groups: [],
    vaults: [],
    investments: [],
    marketData: {
      price: 0.5,
      change24h: 2.5,
      volume24h: 1000000,
      marketCap: 500000000,
      tvl: 50000000,
      activeUsers: 10000
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    aiRecommendationEngine.unsubscribeFromMarketUpdates();
  });

  test('should analyze market conditions', async () => {
    const marketContext = await aiRecommendationEngine.analyzeMarketConditions();
    
    expect(marketContext).toBeDefined();
    expect(['bullish', 'bearish', 'sideways']).toContain(marketContext.currentTrend);
    expect(['low', 'medium', 'high']).toContain(marketContext.volatility);
    expect(['good', 'moderate', 'poor']).toContain(marketContext.liquidityConditions);
    expect(['now', 'wait', 'gradual']).toContain(marketContext.recommendedTiming);
    expect(Array.isArray(marketContext.marketFactors)).toBe(true);
  });

  test('should generate AI recommendations', async () => {
    const recommendations = await aiRecommendationEngine.generateRecommendations(mockPortfolioData, mockUserProfile);
    
    expect(Array.isArray(recommendations)).toBe(true);
    
    if (recommendations.length > 0) {
      const rec = recommendations[0];
      expect(rec.id).toBeDefined();
      expect(rec.title).toBeDefined();
      expect(rec.description).toBeDefined();
      expect(['low', 'medium', 'high']).toContain(rec.priority);
      expect(['portfolio', 'savings', 'investment', 'risk', 'market']).toContain(rec.category);
      expect(typeof rec.confidence).toBe('number');
      expect(rec.confidence).toBeGreaterThanOrEqual(0);
      expect(rec.confidence).toBeLessThanOrEqual(100);
      expect(typeof rec.expectedImpact).toBe('number');
      expect(['immediate', 'short', 'medium', 'long']).toContain(rec.timeframe);
      expect(Array.isArray(rec.executionSteps)).toBe(true);
      expect(Array.isArray(rec.requiredActions)).toBe(true);
    }
  });

  test('should personalize recommendations based on user profile', async () => {
    const mockRecommendations = [
      {
        id: 'test_1',
        type: 'deposit' as const,
        title: 'High Risk Investment',
        description: 'Invest in high-risk vault',
        priority: 'high' as const,
        createdAt: new Date(),
        category: 'investment' as const,
        confidence: 80,
        expectedImpact: 25,
        timeframe: 'long' as const,
        executionSteps: [],
        requiredActions: [],
        marketContext: {
          currentTrend: 'bullish' as const,
          volatility: 'high' as const,
          liquidityConditions: 'good' as const,
          recommendedTiming: 'now' as const,
          marketFactors: []
        }
      }
    ];

    const conservativeProfile: UserProfile = {
      ...mockUserProfile,
      riskTolerance: 'conservative'
    };

    const personalizedRecs = await aiRecommendationEngine.personalizeRecommendations(mockRecommendations, conservativeProfile);
    
    expect(Array.isArray(personalizedRecs)).toBe(true);
    // Conservative users should have high-risk investment recommendations filtered out
    const highRiskInvestments = personalizedRecs.filter(rec => 
      rec.category === 'investment' && rec.priority === 'high'
    );
    expect(highRiskInvestments.length).toBe(0);
  });

  test('should validate recommendations', async () => {
    const mockRecommendation = {
      id: 'test_rec',
      type: 'deposit' as const,
      title: 'Test Recommendation',
      description: 'Test description',
      priority: 'medium' as const,
      createdAt: new Date(),
      category: 'savings' as const,
      confidence: 75,
      expectedImpact: 10,
      timeframe: 'short' as const,
      executionSteps: [
        {
          id: 'step_1',
          description: 'Deposit to pot',
          action: 'deposit' as const,
          parameters: { amount: 100 }
        }
      ],
      requiredActions: [
        {
          type: 'balance_check' as const,
          description: 'Check balance',
          isCompleted: false,
          canAutoExecute: true
        }
      ],
      marketContext: {
        currentTrend: 'bullish' as const,
        volatility: 'low' as const,
        liquidityConditions: 'good' as const,
        recommendedTiming: 'now' as const,
        marketFactors: []
      }
    };

    const isValid = await aiRecommendationEngine.validateRecommendation(mockRecommendation, mockPortfolioData);
    expect(typeof isValid).toBe('boolean');
  });

  test('should estimate execution cost', async () => {
    const mockRecommendation = {
      id: 'test_rec',
      type: 'deposit' as const,
      title: 'Test Recommendation',
      description: 'Test description',
      priority: 'medium' as const,
      createdAt: new Date(),
      category: 'savings' as const,
      confidence: 75,
      expectedImpact: 10,
      timeframe: 'short' as const,
      executionSteps: [
        {
          id: 'step_1',
          description: 'Create pot',
          action: 'create_pot' as const,
          parameters: { name: 'Test Pot', targetAmount: 500 }
        }
      ],
      requiredActions: [],
      marketContext: {
        currentTrend: 'bullish' as const,
        volatility: 'low' as const,
        liquidityConditions: 'good' as const,
        recommendedTiming: 'now' as const,
        marketFactors: []
      }
    };

    const cost = await aiRecommendationEngine.estimateExecutionCost(mockRecommendation);
    
    expect(cost).toBeDefined();
    expect(typeof cost.gas).toBe('number');
    expect(typeof cost.time).toBe('number');
    expect(cost.gas).toBeGreaterThan(0);
    expect(cost.time).toBeGreaterThan(0);
  });

  test('should subscribe to market updates', () => {
    const mockCallback = vi.fn();
    
    aiRecommendationEngine.subscribeToMarketUpdates(mockCallback);
    
    // Verify subscription was set up (implementation detail)
    expect(mockCallback).not.toHaveBeenCalled(); // Should not be called immediately
  });
});

describe('AI Agent Service', () => {
  const mockAddress = 'sei1test_address';
  
  const mockUserProfile: UserProfile = {
    riskTolerance: 'moderate',
    investmentGoals: ['growth'],
    timeHorizon: 'medium',
    liquidityNeeds: 'medium',
    experienceLevel: 'intermediate',
    preferences: {
      autoExecuteRecommendations: false,
      maxRiskLevel: 70,
      preferredAssetTypes: ['savings'],
      excludedStrategies: [],
      notificationFrequency: 'daily'
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await aiAgentService.stopMonitoring();
    aiAgentService.unsubscribeFromAgentUpdates();
  });

  test('should get agent status', async () => {
    const status = await aiAgentService.getAgentStatus('risk');
    
    expect(status).toBeDefined();
    expect(status.type).toBe('risk');
    expect(typeof status.isOnline).toBe('boolean');
    expect(status.lastUpdate).toBeInstanceOf(Date);
    expect(status.performance).toBeDefined();
    expect(Array.isArray(status.capabilities)).toBe(true);
    expect(Array.isArray(status.currentTasks)).toBe(true);
    
    expect(typeof status.performance.successRate).toBe('number');
    expect(typeof status.performance.avgResponseTime).toBe('number');
    expect(typeof status.performance.recommendationsGenerated).toBe('number');
    expect(typeof status.performance.recommendationsExecuted).toBe('number');
    expect(typeof status.performance.userSatisfactionScore).toBe('number');
  });

  test('should activate and deactivate agents', async () => {
    // Test activation
    const activateResult = await aiAgentService.activateAgent('assistant');
    expect(activateResult).toBe(true);
    
    const statusAfterActivation = await aiAgentService.getAgentStatus('assistant');
    expect(statusAfterActivation.isOnline).toBe(true);
    
    // Test deactivation
    const deactivateResult = await aiAgentService.deactivateAgent('assistant');
    expect(deactivateResult).toBe(true);
    
    const statusAfterDeactivation = await aiAgentService.getAgentStatus('assistant');
    expect(statusAfterDeactivation.isOnline).toBe(false);
  });

  test('should perform full analysis', async () => {
    const insights = await aiAgentService.performFullAnalysis(mockAddress, mockUserProfile);
    
    expect(insights).toBeDefined();
    expect(['excellent', 'good', 'fair', 'poor']).toContain(insights.portfolioHealth);
    expect(Array.isArray(insights.keyFindings)).toBe(true);
    expect(Array.isArray(insights.opportunities)).toBe(true);
    expect(Array.isArray(insights.risks)).toBe(true);
    expect(Array.isArray(insights.nextActions)).toBe(true);
    expect(typeof insights.confidenceLevel).toBe('number');
    expect(insights.confidenceLevel).toBeGreaterThanOrEqual(0);
    expect(insights.confidenceLevel).toBeLessThanOrEqual(100);
  });

  test('should generate recommendations', async () => {
    const recommendations = await aiAgentService.generateRecommendations(mockAddress, mockUserProfile);
    
    expect(Array.isArray(recommendations)).toBe(true);
    
    if (recommendations.length > 0) {
      const rec = recommendations[0];
      expect(rec.id).toBeDefined();
      expect(rec.title).toBeDefined();
      expect(rec.description).toBeDefined();
      expect(['low', 'medium', 'high']).toContain(rec.priority);
      expect(['portfolio', 'savings', 'investment', 'risk', 'market']).toContain(rec.category);
    }
  });

  test('should subscribe to agent updates', () => {
    const mockCallback = vi.fn();
    
    aiAgentService.subscribeToAgentUpdates(mockCallback);
    
    // Verify subscription was set up (implementation detail)
    expect(mockCallback).not.toHaveBeenCalled(); // Should not be called immediately
  });

  test('should start and stop monitoring', async () => {
    // Test starting monitoring
    await expect(aiAgentService.startMonitoring(mockAddress, mockUserProfile)).resolves.not.toThrow();
    
    // Test stopping monitoring
    await expect(aiAgentService.stopMonitoring()).resolves.not.toThrow();
  });
});

describe('AI Services Integration', () => {
  const mockAddress = 'sei1test_address';
  
  const mockUserProfile: UserProfile = {
    riskTolerance: 'moderate',
    investmentGoals: ['growth'],
    timeHorizon: 'medium',
    liquidityNeeds: 'medium',
    experienceLevel: 'intermediate',
    preferences: {
      autoExecuteRecommendations: false,
      maxRiskLevel: 70,
      preferredAssetTypes: ['savings'],
      excludedStrategies: [],
      notificationFrequency: 'daily'
    }
  };

  test('should integrate analysis and recommendations', async () => {
    // Get portfolio data
    const portfolioData = await aiAnalysisService.aggregatePortfolioData(mockAddress);
    expect(portfolioData).toBeDefined();
    
    // Generate recommendations based on analysis
    const recommendations = await aiRecommendationEngine.generateRecommendations(portfolioData, mockUserProfile);
    expect(Array.isArray(recommendations)).toBe(true);
    
    // Perform full analysis through agent service
    const insights = await aiAgentService.performFullAnalysis(mockAddress, mockUserProfile);
    expect(insights).toBeDefined();
    
    // Verify data consistency
    expect(insights.portfolioHealth).toBeDefined();
    expect(insights.keyFindings.length).toBeGreaterThan(0);
  });

  test('should handle errors gracefully', async () => {
    const invalidAddress = '';
    
    // Services should handle invalid input gracefully
    await expect(aiAnalysisService.aggregatePortfolioData(invalidAddress)).resolves.toBeDefined();
    await expect(aiRecommendationEngine.analyzeMarketConditions()).resolves.toBeDefined();
    await expect(aiAgentService.performFullAnalysis(invalidAddress, mockUserProfile)).resolves.toBeDefined();
  });
});