import { ApiResponse, AIAgent, Recommendation } from '../../types';
import { aiAnalysisService, PortfolioData, PortfolioMetrics, RiskAnalysis, PerformanceTracking } from './ai-analysis-service';
import { aiRecommendationEngine, AIRecommendation, UserProfile, MarketContext, RecommendationExecution } from './ai-recommendation-engine';

// AI Agent Service Types
export interface AIAgentStatus {
  type: 'risk' | 'scheduler' | 'rebalancer' | 'assistant';
  isOnline: boolean;
  lastUpdate: Date;
  performance: AgentPerformance;
  capabilities: string[];
  currentTasks: AgentTask[];
}

export interface AgentPerformance {
  successRate: number; // 0-100
  avgResponseTime: number; // in milliseconds
  recommendationsGenerated: number;
  recommendationsExecuted: number;
  userSatisfactionScore: number; // 0-100
}

export interface AgentTask {
  id: string;
  type: 'analysis' | 'recommendation' | 'execution' | 'monitoring';
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  estimatedCompletion?: Date;
  progress: number; // 0-100
}

export interface AIInsights {
  portfolioHealth: 'excellent' | 'good' | 'fair' | 'poor';
  keyFindings: string[];
  opportunities: string[];
  risks: string[];
  nextActions: string[];
  confidenceLevel: number; // 0-100
}

export interface AIAgentService {
  // Agent Management
  getAgentStatus(type: 'risk' | 'scheduler' | 'rebalancer' | 'assistant'): Promise<AIAgentStatus>;
  activateAgent(type: 'risk' | 'scheduler' | 'rebalancer' | 'assistant'): Promise<boolean>;
  deactivateAgent(type: 'risk' | 'scheduler' | 'rebalancer' | 'assistant'): Promise<boolean>;
  
  // Comprehensive Analysis
  performFullAnalysis(address: string, userProfile: UserProfile): Promise<AIInsights>;
  generateRecommendations(address: string, userProfile: UserProfile): Promise<AIRecommendation[]>;
  executeRecommendation(recommendationId: string, address: string): Promise<RecommendationExecution>;
  
  // Real-time Monitoring
  startMonitoring(address: string, userProfile: UserProfile): Promise<void>;
  stopMonitoring(): Promise<void>;
  
  // Agent Communication
  subscribeToAgentUpdates(callback: (update: AgentUpdate) => void): void;
  unsubscribeFromAgentUpdates(): void;
}

export interface AgentUpdate {
  agentType: 'risk' | 'scheduler' | 'rebalancer' | 'assistant';
  updateType: 'status' | 'recommendation' | 'alert' | 'completion';
  data: any;
  timestamp: Date;
}

class AIAgentServiceImpl implements AIAgentService {
  private agents: Map<string, AIAgentStatus> = new Map();
  private monitoringActive = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private updateSubscriptions: Set<(update: AgentUpdate) => void> = new Set();

  constructor() {
    this.initializeAgents();
  }

  async getAgentStatus(type: 'risk' | 'scheduler' | 'rebalancer' | 'assistant'): Promise<AIAgentStatus> {
    const agent = this.agents.get(type);
    if (!agent) {
      throw new Error(`Agent ${type} not found`);
    }
    return { ...agent };
  }

  async activateAgent(type: 'risk' | 'scheduler' | 'rebalancer' | 'assistant'): Promise<boolean> {
    try {
      console.log(`Activating ${type} agent`);
      
      const agent = this.agents.get(type);
      if (!agent) {
        throw new Error(`Agent ${type} not found`);
      }

      agent.isOnline = true;
      agent.lastUpdate = new Date();
      
      // Start agent-specific tasks
      await this.startAgentTasks(type);
      
      this.notifySubscribers({
        agentType: type,
        updateType: 'status',
        data: { status: 'activated' },
        timestamp: new Date()
      });

      console.log(`${type} agent activated successfully`);
      return true;
    } catch (error) {
      console.error(`Error activating ${type} agent:`, error);
      return false;
    }
  }

  async deactivateAgent(type: 'risk' | 'scheduler' | 'rebalancer' | 'assistant'): Promise<boolean> {
    try {
      console.log(`Deactivating ${type} agent`);
      
      const agent = this.agents.get(type);
      if (!agent) {
        throw new Error(`Agent ${type} not found`);
      }

      agent.isOnline = false;
      agent.lastUpdate = new Date();
      agent.currentTasks = [];
      
      this.notifySubscribers({
        agentType: type,
        updateType: 'status',
        data: { status: 'deactivated' },
        timestamp: new Date()
      });

      console.log(`${type} agent deactivated successfully`);
      return true;
    } catch (error) {
      console.error(`Error deactivating ${type} agent:`, error);
      return false;
    }
  }

  async performFullAnalysis(address: string, userProfile: UserProfile): Promise<AIInsights> {
    try {
      console.log('Performing full AI analysis for address:', address);

      // Start analysis task
      const analysisTask: AgentTask = {
        id: `analysis_${Date.now()}`,
        type: 'analysis',
        status: 'running',
        startTime: new Date(),
        progress: 0
      };

      this.addTaskToAgent('assistant', analysisTask);

      // Aggregate portfolio data
      analysisTask.progress = 20;
      const portfolioData = await aiAnalysisService.aggregatePortfolioData(address);

      // Calculate metrics
      analysisTask.progress = 40;
      const [metrics, riskAnalysis, performance] = await Promise.all([
        aiAnalysisService.calculatePortfolioMetrics(portfolioData),
        aiAnalysisService.analyzeRisk(portfolioData),
        aiAnalysisService.trackPerformance(portfolioData)
      ]);

      // Analyze market conditions
      analysisTask.progress = 60;
      const marketContext = await aiRecommendationEngine.analyzeMarketConditions();

      // Generate insights
      analysisTask.progress = 80;
      const insights = await this.generateInsights(portfolioData, metrics, riskAnalysis, performance, marketContext, userProfile);

      // Complete analysis
      analysisTask.progress = 100;
      analysisTask.status = 'completed';
      analysisTask.estimatedCompletion = new Date();

      this.notifySubscribers({
        agentType: 'assistant',
        updateType: 'completion',
        data: { task: analysisTask, insights },
        timestamp: new Date()
      });

      console.log('Full AI analysis completed');
      return insights;
    } catch (error) {
      console.error('Error performing full analysis:', error);
      throw new Error('Failed to perform AI analysis');
    }
  }

  async generateRecommendations(address: string, userProfile: UserProfile): Promise<AIRecommendation[]> {
    try {
      console.log('Generating AI recommendations for address:', address);

      // Start recommendation task
      const recommendationTask: AgentTask = {
        id: `recommendations_${Date.now()}`,
        type: 'recommendation',
        status: 'running',
        startTime: new Date(),
        progress: 0
      };

      this.addTaskToAgent('rebalancer', recommendationTask);

      // Get portfolio data
      recommendationTask.progress = 30;
      const portfolioData = await aiAnalysisService.aggregatePortfolioData(address);

      // Generate recommendations
      recommendationTask.progress = 70;
      const recommendations = await aiRecommendationEngine.generateRecommendations(portfolioData, userProfile);

      // Complete task
      recommendationTask.progress = 100;
      recommendationTask.status = 'completed';
      recommendationTask.estimatedCompletion = new Date();

      this.notifySubscribers({
        agentType: 'rebalancer',
        updateType: 'recommendation',
        data: { recommendations },
        timestamp: new Date()
      });

      console.log(`Generated ${recommendations.length} AI recommendations`);
      return recommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw new Error('Failed to generate AI recommendations');
    }
  }

  async executeRecommendation(recommendationId: string, address: string): Promise<RecommendationExecution> {
    try {
      console.log('Executing recommendation:', recommendationId);

      // Find the recommendation (this would be stored in a real implementation)
      const portfolioData = await aiAnalysisService.aggregatePortfolioData(address);
      const userProfile: UserProfile = {
        riskTolerance: 'moderate',
        investmentGoals: ['growth'],
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

      const recommendations = await aiRecommendationEngine.generateRecommendations(portfolioData, userProfile);
      const recommendation = recommendations.find(r => r.id === recommendationId);

      if (!recommendation) {
        throw new Error('Recommendation not found');
      }

      // Start execution task
      const executionTask: AgentTask = {
        id: `execution_${Date.now()}`,
        type: 'execution',
        status: 'running',
        startTime: new Date(),
        progress: 0
      };

      this.addTaskToAgent('scheduler', executionTask);

      // Execute recommendation
      const execution = await aiRecommendationEngine.executeRecommendation(recommendation, address);

      // Update task progress
      executionTask.progress = 100;
      executionTask.status = execution.status === 'completed' ? 'completed' : 'failed';
      executionTask.estimatedCompletion = new Date();

      this.notifySubscribers({
        agentType: 'scheduler',
        updateType: 'completion',
        data: { execution },
        timestamp: new Date()
      });

      console.log('Recommendation execution completed:', execution.status);
      return execution;
    } catch (error) {
      console.error('Error executing recommendation:', error);
      throw new Error('Failed to execute recommendation');
    }
  }

  async startMonitoring(address: string, userProfile: UserProfile): Promise<void> {
    try {
      console.log('Starting AI monitoring for address:', address);

      if (this.monitoringActive) {
        console.log('Monitoring already active');
        return;
      }

      this.monitoringActive = true;

      // Activate risk agent for monitoring
      await this.activateAgent('risk');

      // Start monitoring interval (every 5 minutes)
      this.monitoringInterval = setInterval(async () => {
        try {
          await this.performMonitoringCycle(address, userProfile);
        } catch (error) {
          console.error('Error in monitoring cycle:', error);
        }
      }, 300000); // 5 minutes

      console.log('AI monitoring started successfully');
    } catch (error) {
      console.error('Error starting monitoring:', error);
      throw new Error('Failed to start AI monitoring');
    }
  }

  async stopMonitoring(): Promise<void> {
    try {
      console.log('Stopping AI monitoring');

      this.monitoringActive = false;

      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
        this.monitoringInterval = null;
      }

      // Deactivate risk agent
      await this.deactivateAgent('risk');

      console.log('AI monitoring stopped successfully');
    } catch (error) {
      console.error('Error stopping monitoring:', error);
      throw new Error('Failed to stop AI monitoring');
    }
  }

  subscribeToAgentUpdates(callback: (update: AgentUpdate) => void): void {
    console.log('Subscribing to agent updates');
    this.updateSubscriptions.add(callback);
  }

  unsubscribeFromAgentUpdates(): void {
    console.log('Unsubscribing from agent updates');
    this.updateSubscriptions.clear();
  }

  // Private helper methods
  private initializeAgents(): void {
    const agentTypes: Array<'risk' | 'scheduler' | 'rebalancer' | 'assistant'> = ['risk', 'scheduler', 'rebalancer', 'assistant'];
    
    agentTypes.forEach(type => {
      this.agents.set(type, {
        type,
        isOnline: false,
        lastUpdate: new Date(),
        performance: {
          successRate: 95,
          avgResponseTime: 2000,
          recommendationsGenerated: 0,
          recommendationsExecuted: 0,
          userSatisfactionScore: 85
        },
        capabilities: this.getAgentCapabilities(type),
        currentTasks: []
      });
    });
  }

  private getAgentCapabilities(type: 'risk' | 'scheduler' | 'rebalancer' | 'assistant'): string[] {
    switch (type) {
      case 'risk':
        return ['Risk Analysis', 'Portfolio Monitoring', 'Alert Generation', 'Compliance Checking'];
      case 'scheduler':
        return ['Task Scheduling', 'Automated Execution', 'Transaction Management', 'Timing Optimization'];
      case 'rebalancer':
        return ['Portfolio Rebalancing', 'Asset Allocation', 'Diversification Analysis', 'Performance Optimization'];
      case 'assistant':
        return ['General Analysis', 'User Guidance', 'Data Aggregation', 'Insight Generation'];
      default:
        return [];
    }
  }

  private async startAgentTasks(type: 'risk' | 'scheduler' | 'rebalancer' | 'assistant'): Promise<void> {
    // Start agent-specific background tasks
    switch (type) {
      case 'risk':
        // Start risk monitoring tasks
        break;
      case 'scheduler':
        // Start scheduling tasks
        break;
      case 'rebalancer':
        // Start rebalancing analysis tasks
        break;
      case 'assistant':
        // Start general assistance tasks
        break;
    }
  }

  private addTaskToAgent(agentType: string, task: AgentTask): void {
    const agent = this.agents.get(agentType);
    if (agent) {
      agent.currentTasks.push(task);
      agent.lastUpdate = new Date();
    }
  }

  private async generateInsights(
    portfolioData: PortfolioData,
    metrics: PortfolioMetrics,
    riskAnalysis: RiskAnalysis,
    performance: PerformanceTracking,
    marketContext: MarketContext,
    userProfile: UserProfile
  ): Promise<AIInsights> {
    // Determine portfolio health
    const healthScore = (metrics.diversificationScore + metrics.performanceScore + (100 - metrics.riskScore)) / 3;
    const portfolioHealth: 'excellent' | 'good' | 'fair' | 'poor' = 
      healthScore > 80 ? 'excellent' :
      healthScore > 60 ? 'good' :
      healthScore > 40 ? 'fair' : 'poor';

    // Generate key findings
    const keyFindings: string[] = [];
    keyFindings.push(`Portfolio value: ${metrics.totalValue.toFixed(2)} SEI`);
    keyFindings.push(`Diversification score: ${metrics.diversificationScore.toFixed(1)}/100`);
    keyFindings.push(`Risk level: ${riskAnalysis.overallRisk}`);
    keyFindings.push(`Performance: ${performance.totalReturnPercentage.toFixed(1)}% return`);

    // Identify opportunities
    const opportunities: string[] = [];
    if (metrics.diversificationScore < 50) {
      opportunities.push('Improve diversification across asset types');
    }
    if (portfolioData.pots.length === 0) {
      opportunities.push('Start building savings with automated pots');
    }
    if (portfolioData.investments.length === 0 && userProfile.riskTolerance !== 'conservative') {
      opportunities.push('Consider yield-generating investment opportunities');
    }
    if (marketContext.currentTrend === 'bullish') {
      opportunities.push('Favorable market conditions for increased exposure');
    }

    // Identify risks
    const risks: string[] = [];
    riskAnalysis.riskFactors.forEach(factor => {
      if (factor.severity === 'high') {
        risks.push(factor.description);
      }
    });
    if (marketContext.volatility === 'high') {
      risks.push('High market volatility detected');
    }

    // Generate next actions
    const nextActions: string[] = [];
    if (portfolioData.balance > 100 && portfolioData.pots.length === 0) {
      nextActions.push('Create your first savings pot');
    }
    if (metrics.diversificationScore < 40) {
      nextActions.push('Rebalance portfolio for better diversification');
    }
    if (riskAnalysis.overallRisk === 'high') {
      nextActions.push('Reduce portfolio risk exposure');
    }

    // Calculate confidence level
    const confidenceLevel = Math.min(100, 
      (portfolioData.transactions.length * 10) + // More data = higher confidence
      (metrics.diversificationScore * 0.5) + // Better diversification = higher confidence
      50 // Base confidence
    );

    return {
      portfolioHealth,
      keyFindings,
      opportunities,
      risks,
      nextActions,
      confidenceLevel
    };
  }

  private async performMonitoringCycle(address: string, userProfile: UserProfile): Promise<void> {
    try {
      console.log('Performing monitoring cycle');

      // Get current portfolio data
      const portfolioData = await aiAnalysisService.aggregatePortfolioData(address);
      
      // Analyze for risks
      const riskAnalysis = await aiAnalysisService.analyzeRisk(portfolioData);
      
      // Check for high-priority alerts
      if (riskAnalysis.overallRisk === 'high') {
        this.notifySubscribers({
          agentType: 'risk',
          updateType: 'alert',
          data: {
            type: 'high_risk',
            message: 'High risk detected in portfolio',
            riskFactors: riskAnalysis.riskFactors
          },
          timestamp: new Date()
        });
      }

      // Check market conditions
      const marketContext = await aiRecommendationEngine.analyzeMarketConditions();
      
      if (marketContext.volatility === 'high') {
        this.notifySubscribers({
          agentType: 'risk',
          updateType: 'alert',
          data: {
            type: 'market_volatility',
            message: 'High market volatility detected',
            marketContext
          },
          timestamp: new Date()
        });
      }

      // Update agent performance
      const riskAgent = this.agents.get('risk');
      if (riskAgent) {
        riskAgent.lastUpdate = new Date();
        riskAgent.performance.recommendationsGenerated++;
      }

    } catch (error) {
      console.error('Error in monitoring cycle:', error);
    }
  }

  private notifySubscribers(update: AgentUpdate): void {
    this.updateSubscriptions.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    });
  }
}

export const aiAgentService = new AIAgentServiceImpl();
export default aiAgentService;