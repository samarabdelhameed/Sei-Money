import { ApiResponse, Recommendation, MarketData } from '../../types';
import { aiAnalysisService, PortfolioData, PortfolioMetrics, RiskAnalysis, PerformanceTracking } from './ai-analysis-service';
import { contractService } from './contract-service';
import { blockchainService } from './blockchain-service';

// AI Recommendation Types
export interface AIRecommendation extends Recommendation {
  category: 'portfolio' | 'savings' | 'investment' | 'risk' | 'market';
  confidence: number; // 0-100
  expectedImpact: number; // Expected improvement percentage
  timeframe: 'immediate' | 'short' | 'medium' | 'long';
  executionSteps: ExecutionStep[];
  requiredActions: RequiredAction[];
  marketContext: MarketContext;
}

export interface ExecutionStep {
  id: string;
  description: string;
  action: 'deposit' | 'withdraw' | 'transfer' | 'create_pot' | 'join_group' | 'invest_vault';
  parameters: Record<string, any>;
  estimatedGas?: number;
  estimatedTime?: number; // in minutes
}

export interface RequiredAction {
  type: 'approval' | 'balance_check' | 'contract_interaction' | 'market_timing';
  description: string;
  isCompleted: boolean;
  canAutoExecute: boolean;
}

export interface MarketContext {
  currentTrend: 'bullish' | 'bearish' | 'sideways';
  volatility: 'low' | 'medium' | 'high';
  liquidityConditions: 'good' | 'moderate' | 'poor';
  recommendedTiming: 'now' | 'wait' | 'gradual';
  marketFactors: string[];
}

export interface UserProfile {
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentGoals: string[];
  timeHorizon: 'short' | 'medium' | 'long';
  liquidityNeeds: 'high' | 'medium' | 'low';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  preferences: UserPreferences;
}

export interface UserPreferences {
  autoExecuteRecommendations: boolean;
  maxRiskLevel: number; // 0-100
  preferredAssetTypes: string[];
  excludedStrategies: string[];
  notificationFrequency: 'real-time' | 'daily' | 'weekly';
}

export interface RecommendationExecution {
  recommendationId: string;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled';
  steps: ExecutionStepResult[];
  totalGasUsed?: number;
  totalTimeElapsed?: number;
  finalResult?: any;
  error?: string;
}

export interface ExecutionStepResult {
  stepId: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  transactionHash?: string;
  gasUsed?: number;
  timeElapsed?: number;
  result?: any;
  error?: string;
}

export interface AIRecommendationEngine {
  // Recommendation Generation
  generateRecommendations(portfolioData: PortfolioData, userProfile: UserProfile): Promise<AIRecommendation[]>;
  analyzeMarketConditions(): Promise<MarketContext>;
  personalizeRecommendations(recommendations: AIRecommendation[], userProfile: UserProfile): Promise<AIRecommendation[]>;
  
  // Recommendation Execution
  executeRecommendation(recommendation: AIRecommendation, userAddress: string): Promise<RecommendationExecution>;
  validateRecommendation(recommendation: AIRecommendation, portfolioData: PortfolioData): Promise<boolean>;
  estimateExecutionCost(recommendation: AIRecommendation): Promise<{ gas: number; time: number }>;
  
  // Real-time Updates
  subscribeToMarketUpdates(callback: (context: MarketContext) => void): void;
  unsubscribeFromMarketUpdates(): void;
}

class AIRecommendationEngineImpl implements AIRecommendationEngine {
  private marketUpdateSubscriptions: Set<(context: MarketContext) => void> = new Set();
  private marketUpdateInterval: NodeJS.Timeout | null = null;

  async generateRecommendations(portfolioData: PortfolioData, userProfile: UserProfile): Promise<AIRecommendation[]> {
    try {
      console.log('Generating AI recommendations based on real portfolio data');

      // Analyze current portfolio state
      const [metrics, riskAnalysis, performance, marketContext] = await Promise.all([
        aiAnalysisService.calculatePortfolioMetrics(portfolioData),
        aiAnalysisService.analyzeRisk(portfolioData),
        aiAnalysisService.trackPerformance(portfolioData),
        this.analyzeMarketConditions()
      ]);

      const recommendations: AIRecommendation[] = [];

      // Generate portfolio rebalancing recommendations
      const rebalanceRecs = await this.generateRebalanceRecommendations(
        portfolioData, metrics, riskAnalysis, userProfile, marketContext
      );
      recommendations.push(...rebalanceRecs);

      // Generate savings optimization recommendations
      const savingsRecs = await this.generateSavingsRecommendations(
        portfolioData, metrics, userProfile, marketContext
      );
      recommendations.push(...savingsRecs);

      // Generate investment opportunity recommendations
      const investmentRecs = await this.generateInvestmentRecommendations(
        portfolioData, performance, userProfile, marketContext
      );
      recommendations.push(...investmentRecs);

      // Generate risk management recommendations
      const riskRecs = await this.generateRiskManagementRecommendations(
        portfolioData, riskAnalysis, userProfile, marketContext
      );
      recommendations.push(...riskRecs);

      // Generate market timing recommendations
      const marketRecs = await this.generateMarketTimingRecommendations(
        portfolioData, marketContext, userProfile
      );
      recommendations.push(...marketRecs);

      // Personalize and rank recommendations
      const personalizedRecs = await this.personalizeRecommendations(recommendations, userProfile);

      console.log(`Generated ${personalizedRecs.length} AI recommendations`);
      return personalizedRecs;
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      throw new Error('Failed to generate AI recommendations');
    }
  }

  async analyzeMarketConditions(): Promise<MarketContext> {
    try {
      console.log('Analyzing real market conditions');

      // This would integrate with real market data APIs
      // For now, we'll simulate market analysis
      const marketData = await this.fetchRealMarketData();

      // Analyze trend based on price movement
      const currentTrend: 'bullish' | 'bearish' | 'sideways' = 
        marketData.change24h > 5 ? 'bullish' :
        marketData.change24h < -5 ? 'bearish' : 'sideways';

      // Analyze volatility based on price changes
      const volatility: 'low' | 'medium' | 'high' = 
        Math.abs(marketData.change24h) > 10 ? 'high' :
        Math.abs(marketData.change24h) > 3 ? 'medium' : 'low';

      // Analyze liquidity based on volume
      const liquidityConditions: 'good' | 'moderate' | 'poor' = 
        marketData.volume24h > 1000000 ? 'good' :
        marketData.volume24h > 100000 ? 'moderate' : 'poor';

      // Determine recommended timing
      const recommendedTiming: 'now' | 'wait' | 'gradual' = 
        volatility === 'high' ? 'wait' :
        currentTrend === 'bullish' && liquidityConditions === 'good' ? 'now' : 'gradual';

      // Identify key market factors
      const marketFactors: string[] = [];
      if (volatility === 'high') marketFactors.push('High market volatility detected');
      if (liquidityConditions === 'poor') marketFactors.push('Low liquidity conditions');
      if (Math.abs(marketData.change24h) > 15) marketFactors.push('Significant price movement');
      if (marketData.tvl < 10000000) marketFactors.push('Low total value locked');

      const marketContext: MarketContext = {
        currentTrend,
        volatility,
        liquidityConditions,
        recommendedTiming,
        marketFactors
      };

      console.log('Market analysis completed:', marketContext);
      return marketContext;
    } catch (error) {
      console.error('Error analyzing market conditions:', error);
      // Return default market context
      return {
        currentTrend: 'sideways',
        volatility: 'medium',
        liquidityConditions: 'moderate',
        recommendedTiming: 'gradual',
        marketFactors: ['Market data unavailable']
      };
    }
  }

  async personalizeRecommendations(recommendations: AIRecommendation[], userProfile: UserProfile): Promise<AIRecommendation[]> {
    console.log('Personalizing recommendations based on user profile');

    return recommendations
      .filter(rec => {
        // Filter based on risk tolerance
        if (userProfile.riskTolerance === 'conservative' && rec.priority === 'high' && rec.category === 'investment') {
          return false;
        }
        
        // Filter based on excluded strategies
        if (userProfile.preferences.excludedStrategies.some(strategy => 
          rec.description.toLowerCase().includes(strategy.toLowerCase())
        )) {
          return false;
        }

        return true;
      })
      .map(rec => {
        // Adjust confidence based on user experience
        let adjustedConfidence = rec.confidence;
        if (userProfile.experienceLevel === 'beginner' && rec.category === 'investment') {
          adjustedConfidence *= 0.8; // Reduce confidence for complex recommendations
        }

        // Adjust timeframe based on user preferences
        let adjustedTimeframe = rec.timeframe;
        if (userProfile.timeHorizon === 'short' && rec.timeframe === 'long') {
          adjustedTimeframe = 'medium';
        }

        return {
          ...rec,
          confidence: adjustedConfidence,
          timeframe: adjustedTimeframe
        };
      })
      .sort((a, b) => {
        // Sort by priority, confidence, and expected impact
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        const aScore = priorityWeight[a.priority] * a.confidence * a.expectedImpact;
        const bScore = priorityWeight[b.priority] * b.confidence * b.expectedImpact;
        return bScore - aScore;
      })
      .slice(0, 10); // Return top 10 recommendations
  }

  async executeRecommendation(recommendation: AIRecommendation, userAddress: string): Promise<RecommendationExecution> {
    try {
      console.log('Executing AI recommendation:', recommendation.id);

      const execution: RecommendationExecution = {
        recommendationId: recommendation.id,
        status: 'pending',
        steps: recommendation.executionSteps.map(step => ({
          stepId: step.id,
          status: 'pending'
        }))
      };

      // Validate recommendation before execution
      const portfolioData = await aiAnalysisService.aggregatePortfolioData(userAddress);
      const isValid = await this.validateRecommendation(recommendation, portfolioData);
      
      if (!isValid) {
        execution.status = 'failed';
        execution.error = 'Recommendation validation failed';
        return execution;
      }

      execution.status = 'executing';
      const startTime = Date.now();

      // Execute each step
      for (let i = 0; i < recommendation.executionSteps.length; i++) {
        const step = recommendation.executionSteps[i];
        const stepResult = execution.steps[i];
        
        try {
          stepResult.status = 'executing';
          const stepStartTime = Date.now();

          // Execute the step based on its action type
          const result = await this.executeStep(step, userAddress);
          
          stepResult.status = 'completed';
          stepResult.result = result;
          stepResult.transactionHash = result.transactionHash;
          stepResult.gasUsed = result.gasUsed;
          stepResult.timeElapsed = Date.now() - stepStartTime;

        } catch (error) {
          stepResult.status = 'failed';
          stepResult.error = error instanceof Error ? error.message : 'Step execution failed';
          
          execution.status = 'failed';
          execution.error = `Step ${step.id} failed: ${stepResult.error}`;
          break;
        }
      }

      if (execution.status === 'executing') {
        execution.status = 'completed';
        execution.totalTimeElapsed = Date.now() - startTime;
        execution.totalGasUsed = execution.steps.reduce((sum, step) => sum + (step.gasUsed || 0), 0);
      }

      console.log('Recommendation execution completed:', execution);
      return execution;
    } catch (error) {
      console.error('Error executing recommendation:', error);
      return {
        recommendationId: recommendation.id,
        status: 'failed',
        steps: [],
        error: error instanceof Error ? error.message : 'Execution failed'
      };
    }
  }

  async validateRecommendation(recommendation: AIRecommendation, portfolioData: PortfolioData): Promise<boolean> {
    try {
      console.log('Validating recommendation:', recommendation.id);

      // Check if user has sufficient balance for the recommendation
      for (const step of recommendation.executionSteps) {
        if (step.action === 'deposit' || step.action === 'invest_vault') {
          const amount = step.parameters.amount || 0;
          if (portfolioData.balance < amount) {
            console.log('Insufficient balance for recommendation');
            return false;
          }
        }
      }

      // Check if required actions are feasible
      for (const action of recommendation.requiredActions) {
        if (action.type === 'balance_check' && !action.isCompleted) {
          // Verify balance requirements
          const requiredBalance = recommendation.executionSteps
            .filter(step => step.action === 'deposit' || step.action === 'invest_vault')
            .reduce((sum, step) => sum + (step.parameters.amount || 0), 0);
          
          if (portfolioData.balance < requiredBalance) {
            return false;
          }
        }
      }

      // Check market conditions
      if (recommendation.marketContext.recommendedTiming === 'wait') {
        console.log('Market conditions suggest waiting');
        return false;
      }

      console.log('Recommendation validation passed');
      return true;
    } catch (error) {
      console.error('Error validating recommendation:', error);
      return false;
    }
  }

  async estimateExecutionCost(recommendation: AIRecommendation): Promise<{ gas: number; time: number }> {
    try {
      let totalGas = 0;
      let totalTime = 0;

      for (const step of recommendation.executionSteps) {
        // Estimate gas for each step
        const gasEstimate = step.estimatedGas || await this.estimateStepGas(step);
        totalGas += gasEstimate;

        // Estimate time for each step
        const timeEstimate = step.estimatedTime || await this.estimateStepTime(step);
        totalTime += timeEstimate;
      }

      return { gas: totalGas, time: totalTime };
    } catch (error) {
      console.error('Error estimating execution cost:', error);
      return { gas: 100000, time: 5 }; // Default estimates
    }
  }

  subscribeToMarketUpdates(callback: (context: MarketContext) => void): void {
    console.log('Subscribing to market updates');
    this.marketUpdateSubscriptions.add(callback);
    
    // Start polling for market updates every 5 minutes
    if (!this.marketUpdateInterval) {
      this.marketUpdateInterval = setInterval(async () => {
        try {
          const marketContext = await this.analyzeMarketConditions();
          this.marketUpdateSubscriptions.forEach(cb => cb(marketContext));
        } catch (error) {
          console.error('Error in market update subscription:', error);
        }
      }, 300000); // 5 minutes
    }
  }

  unsubscribeFromMarketUpdates(): void {
    console.log('Unsubscribing from market updates');
    this.marketUpdateSubscriptions.clear();
    if (this.marketUpdateInterval) {
      clearInterval(this.marketUpdateInterval);
      this.marketUpdateInterval = null;
    }
  }

  // Private helper methods
  private async fetchRealMarketData(): Promise<MarketData> {
    // This would fetch from real APIs like CoinGecko, CoinMarketCap, etc.
    // For now, return simulated data
    return {
      price: 0.5 + (Math.random() - 0.5) * 0.1,
      change24h: (Math.random() - 0.5) * 20,
      volume24h: 500000 + Math.random() * 1000000,
      marketCap: 400000000 + Math.random() * 200000000,
      tvl: 40000000 + Math.random() * 20000000,
      activeUsers: 8000 + Math.random() * 4000
    };
  }

  private async generateRebalanceRecommendations(
    portfolioData: PortfolioData,
    metrics: PortfolioMetrics,
    riskAnalysis: RiskAnalysis,
    userProfile: UserProfile,
    marketContext: MarketContext
  ): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = [];

    // Check if portfolio needs rebalancing
    if (metrics.diversificationScore < 50) {
      recommendations.push({
        id: `rebalance_${Date.now()}`,
        type: 'rebalance',
        title: 'Portfolio Rebalancing Needed',
        description: 'Your portfolio lacks diversification. Consider redistributing assets across different categories.',
        priority: 'high',
        createdAt: new Date(),
        category: 'portfolio',
        confidence: 85,
        expectedImpact: 15,
        timeframe: 'medium',
        executionSteps: [
          {
            id: 'step_1',
            description: 'Create new savings pot for emergency fund',
            action: 'create_pot',
            parameters: {
              name: 'Emergency Fund',
              targetAmount: portfolioData.balance * 0.2,
              category: 'investment'
            }
          }
        ],
        requiredActions: [
          {
            type: 'balance_check',
            description: 'Ensure sufficient balance for rebalancing',
            isCompleted: false,
            canAutoExecute: true
          }
        ],
        marketContext
      });
    }

    return recommendations;
  }

  private async generateSavingsRecommendations(
    portfolioData: PortfolioData,
    metrics: PortfolioMetrics,
    userProfile: UserProfile,
    marketContext: MarketContext
  ): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = [];

    // Check if user should increase savings
    const savingsRatio = portfolioData.pots.reduce((sum, pot) => sum + (pot.currentAmount || 0), 0) / portfolioData.balance;
    
    if (savingsRatio < 0.2 && portfolioData.balance > 100) {
      recommendations.push({
        id: `savings_${Date.now()}`,
        type: 'deposit',
        title: 'Increase Your Savings Rate',
        description: 'Consider allocating more funds to savings pots to build financial security.',
        priority: 'medium',
        createdAt: new Date(),
        category: 'savings',
        confidence: 75,
        expectedImpact: 10,
        timeframe: 'short',
        executionSteps: [
          {
            id: 'step_1',
            description: 'Create vacation savings pot',
            action: 'create_pot',
            parameters: {
              name: 'Vacation Fund',
              targetAmount: 500,
              category: 'vacation'
            }
          }
        ],
        requiredActions: [
          {
            type: 'balance_check',
            description: 'Check available balance for savings',
            isCompleted: false,
            canAutoExecute: true
          }
        ],
        marketContext
      });
    }

    return recommendations;
  }

  private async generateInvestmentRecommendations(
    portfolioData: PortfolioData,
    performance: PerformanceTracking,
    userProfile: UserProfile,
    marketContext: MarketContext
  ): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = [];

    // Check if user should consider investments
    if (portfolioData.investments.length === 0 && portfolioData.balance > 1000 && userProfile.riskTolerance !== 'conservative') {
      recommendations.push({
        id: `investment_${Date.now()}`,
        type: 'deposit',
        title: 'Consider Investment Opportunities',
        description: 'You have sufficient balance to start investing in yield-generating vaults.',
        priority: 'medium',
        createdAt: new Date(),
        category: 'investment',
        confidence: 70,
        expectedImpact: 20,
        timeframe: 'long',
        executionSteps: [
          {
            id: 'step_1',
            description: 'Invest in low-risk vault',
            action: 'invest_vault',
            parameters: {
              vaultId: 'vault_stable',
              amount: Math.min(500, portfolioData.balance * 0.1)
            }
          }
        ],
        requiredActions: [
          {
            type: 'balance_check',
            description: 'Ensure sufficient balance for investment',
            isCompleted: false,
            canAutoExecute: false
          },
          {
            type: 'approval',
            description: 'User approval required for investment',
            isCompleted: false,
            canAutoExecute: false
          }
        ],
        marketContext
      });
    }

    return recommendations;
  }

  private async generateRiskManagementRecommendations(
    portfolioData: PortfolioData,
    riskAnalysis: RiskAnalysis,
    userProfile: UserProfile,
    marketContext: MarketContext
  ): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = [];

    // Check for high risk situations
    if (riskAnalysis.overallRisk === 'high') {
      recommendations.push({
        id: `risk_${Date.now()}`,
        type: 'alert',
        title: 'High Risk Detected',
        description: 'Your portfolio has high risk exposure. Consider reducing risk through diversification.',
        priority: 'high',
        createdAt: new Date(),
        category: 'risk',
        confidence: 90,
        expectedImpact: 25,
        timeframe: 'immediate',
        executionSteps: [
          {
            id: 'step_1',
            description: 'Move funds to stable savings',
            action: 'transfer',
            parameters: {
              from: 'investments',
              to: 'savings',
              amount: portfolioData.balance * 0.1
            }
          }
        ],
        requiredActions: [
          {
            type: 'approval',
            description: 'User approval for risk reduction',
            isCompleted: false,
            canAutoExecute: false
          }
        ],
        marketContext
      });
    }

    return recommendations;
  }

  private async generateMarketTimingRecommendations(
    portfolioData: PortfolioData,
    marketContext: MarketContext,
    userProfile: UserProfile
  ): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = [];

    // Market timing recommendations based on current conditions
    if (marketContext.currentTrend === 'bullish' && marketContext.volatility === 'low') {
      recommendations.push({
        id: `market_${Date.now()}`,
        type: 'deposit',
        title: 'Favorable Market Conditions',
        description: 'Current market conditions are favorable for increasing exposure.',
        priority: 'medium',
        createdAt: new Date(),
        category: 'market',
        confidence: 65,
        expectedImpact: 15,
        timeframe: 'short',
        executionSteps: [
          {
            id: 'step_1',
            description: 'Increase investment allocation',
            action: 'invest_vault',
            parameters: {
              vaultId: 'vault_growth',
              amount: Math.min(200, portfolioData.balance * 0.05)
            }
          }
        ],
        requiredActions: [
          {
            type: 'market_timing',
            description: 'Optimal market timing detected',
            isCompleted: true,
            canAutoExecute: userProfile.preferences.autoExecuteRecommendations
          }
        ],
        marketContext
      });
    }

    return recommendations;
  }

  private async executeStep(step: ExecutionStep, userAddress: string): Promise<any> {
    console.log('Executing step:', step.id, step.action);

    switch (step.action) {
      case 'create_pot':
        return await this.executeCreatePot(step.parameters, userAddress);
      case 'deposit':
        return await this.executeDeposit(step.parameters, userAddress);
      case 'invest_vault':
        return await this.executeInvestVault(step.parameters, userAddress);
      case 'transfer':
        return await this.executeTransfer(step.parameters, userAddress);
      default:
        throw new Error(`Unknown step action: ${step.action}`);
    }
  }

  private async executeCreatePot(parameters: any, userAddress: string): Promise<any> {
    const response = await contractService.call({
      contractAddress: 'sei1c5d4flfqv3zjms0g894z82hnhv62h2vjr9hgd05c6xh456q8xjfq8f3qmj',
      method: 'open_pot',
      args: [
        {
          amount: Math.floor(parameters.targetAmount * 1000000).toString(),
          denom: 'usei'
        },
        parameters.name
      ],
      value: 0
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to create pot');
    }

    return {
      transactionHash: response.data.transactionHash,
      gasUsed: response.data.gasUsed,
      potId: 'new_pot_id' // Would be extracted from transaction result
    };
  }

  private async executeDeposit(parameters: any, userAddress: string): Promise<any> {
    const response = await contractService.call({
      contractAddress: 'sei1c5d4flfqv3zjms0g894z82hnhv62h2vjr9hgd05c6xh456q8xjfq8f3qmj',
      method: 'deposit_pot',
      args: [
        parseInt(parameters.potId),
        {
          amount: Math.floor(parameters.amount * 1000000).toString(),
          denom: 'usei'
        }
      ],
      value: Math.floor(parameters.amount * 1000000)
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to deposit');
    }

    return {
      transactionHash: response.data.transactionHash,
      gasUsed: response.data.gasUsed,
      amount: parameters.amount
    };
  }

  private async executeInvestVault(parameters: any, userAddress: string): Promise<any> {
    // This would interact with vault contracts
    const response = await contractService.call({
      contractAddress: 'sei1vault_contract_address',
      method: 'invest',
      args: [parameters.vaultId, parameters.amount],
      value: Math.floor(parameters.amount * 1000000)
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to invest in vault');
    }

    return {
      transactionHash: response.data.transactionHash,
      gasUsed: response.data.gasUsed,
      shares: 'calculated_shares'
    };
  }

  private async executeTransfer(parameters: any, userAddress: string): Promise<any> {
    const txData = {
      from: userAddress,
      to: parameters.to,
      amount: parameters.amount
    };

    const response = await blockchainService.sendTransaction(txData);

    if (!response.success) {
      throw new Error(response.error || 'Failed to transfer');
    }

    return {
      transactionHash: response.data.hash,
      gasUsed: response.data.gasUsed || 21000,
      amount: parameters.amount
    };
  }

  private async estimateStepGas(step: ExecutionStep): Promise<number> {
    // Estimate gas based on step type
    switch (step.action) {
      case 'create_pot':
        return 150000;
      case 'deposit':
        return 100000;
      case 'invest_vault':
        return 200000;
      case 'transfer':
        return 21000;
      default:
        return 100000;
    }
  }

  private async estimateStepTime(step: ExecutionStep): Promise<number> {
    // Estimate time in minutes based on step type
    switch (step.action) {
      case 'create_pot':
        return 2;
      case 'deposit':
        return 1;
      case 'invest_vault':
        return 3;
      case 'transfer':
        return 1;
      default:
        return 2;
    }
  }
}

export const aiRecommendationEngine = new AIRecommendationEngineImpl();
export default aiRecommendationEngine;