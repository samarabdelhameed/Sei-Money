// AI Agent Integration for SeiMoney
import { apiService } from './api';

// AI Agent Types
export interface AIRecommendation {
  id: string;
  type: 'optimize' | 'alert' | 'suggestion' | 'risk';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'portfolio' | 'trading' | 'risk' | 'opportunity' | 'general';
  confidence: number; // 0-100
  actionRequired: boolean;
  estimatedImpact: 'positive' | 'negative' | 'neutral';
  createdAt: Date;
  expiresAt?: Date;
}

export interface AIPortfolioAnalysis {
  portfolioId: string;
  riskScore: number; // 0-100
  diversificationScore: number; // 0-100
  performanceScore: number; // 0-100
  recommendations: AIRecommendation[];
  riskFactors: string[];
  opportunities: string[];
  lastUpdated: Date;
}

export interface AITradingSignal {
  id: string;
  asset: string;
  signal: 'buy' | 'sell' | 'hold';
  confidence: number; // 0-100
  price: number;
  targetPrice: number;
  stopLoss: number;
  reasoning: string;
  riskLevel: 'low' | 'medium' | 'high';
  expiry: Date;
  createdAt: Date;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    type?: 'question' | 'analysis' | 'recommendation';
    category?: string;
    confidence?: number;
  };
}

export interface AIConversation {
  id: string;
  title: string;
  messages: AIChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

// AI Agent Service Class
export class AIAgentService {
  private baseURL: string;
  private isConnected: boolean = false;
  private sessionId: string | null = null;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || import.meta.env.VITE_AI_AGENT_URL || 'http://localhost:3002';
  }

  // Connect to AI Agent
  async connect(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          client: 'seimoney-frontend',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        this.sessionId = data.sessionId;
        this.isConnected = true;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to connect to AI Agent:', error);
      return false;
    }
  }

  // Disconnect from AI Agent
  async disconnect(): Promise<void> {
    if (this.sessionId) {
      try {
        await fetch(`${this.baseURL}/disconnect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: this.sessionId,
          }),
        });
      } catch (error) {
        console.error('Error disconnecting from AI Agent:', error);
      }
    }
    
    this.isConnected = false;
    this.sessionId = null;
  }

  // Get portfolio analysis
  async analyzePortfolio(portfolioData: any): Promise<AIPortfolioAnalysis> {
    if (!this.isConnected) {
      throw new Error('AI Agent not connected');
    }

    try {
      const response = await fetch(`${this.baseURL}/analyze-portfolio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': this.sessionId!,
        },
        body: JSON.stringify({
          portfolio: portfolioData,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`AI Agent error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to analyze portfolio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get trading signals
  async getTradingSignals(assets: string[]): Promise<AITradingSignal[]> {
    if (!this.isConnected) {
      throw new Error('AI Agent not connected');
    }

    try {
      const response = await fetch(`${this.baseURL}/trading-signals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': this.sessionId!,
        },
        body: JSON.stringify({
          assets,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`AI Agent error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get trading signals: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get personalized recommendations
  async getRecommendations(userId: string, context?: string): Promise<AIRecommendation[]> {
    if (!this.isConnected) {
      throw new Error('AI Agent not connected');
    }

    try {
      const response = await fetch(`${this.baseURL}/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': this.sessionId!,
        },
        body: JSON.stringify({
          userId,
          context,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`AI Agent error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Chat with AI Agent
  async chat(message: string, conversationId?: string): Promise<AIChatMessage> {
    if (!this.isConnected) {
      throw new Error('AI Agent not connected');
    }

    try {
      const response = await fetch(`${this.baseURL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': this.sessionId!,
        },
        body: JSON.stringify({
          message,
          conversationId,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`AI Agent error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to chat with AI Agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get conversation history
  async getConversationHistory(limit: number = 10): Promise<AIConversation[]> {
    if (!this.isConnected) {
      throw new Error('AI Agent not connected');
    }

    try {
      const response = await fetch(`${this.baseURL}/conversations?limit=${limit}`, {
        headers: {
          'X-Session-ID': this.sessionId!,
        },
      });

      if (!response.ok) {
        throw new Error(`AI Agent error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get conversation history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get market insights
  async getMarketInsights(categories: string[] = ['general']): Promise<any[]> {
    if (!this.isConnected) {
      throw new Error('AI Agent not connected');
    }

    try {
      const response = await fetch(`${this.baseURL}/market-insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': this.sessionId!,
        },
        body: JSON.stringify({
          categories,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`AI Agent error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get market insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Risk assessment
  async assessRisk(transactionData: any): Promise<{
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    riskFactors: string[];
    recommendations: string[];
  }> {
    if (!this.isConnected) {
      throw new Error('AI Agent not connected');
    }

    try {
      const response = await fetch(`${this.baseURL}/risk-assessment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': this.sessionId!,
        },
        body: JSON.stringify({
          transaction: transactionData,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`AI Agent error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to assess risk: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Portfolio optimization
  async optimizePortfolio(portfolioData: any, goals: any): Promise<{
    optimizedPortfolio: any;
    changes: any[];
    expectedReturn: number;
    riskReduction: number;
  }> {
    if (!this.isConnected) {
      throw new Error('AI Agent not connected');
    }

    try {
      const response = await fetch(`${this.baseURL}/optimize-portfolio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': this.sessionId!,
        },
        body: JSON.stringify({
          portfolio: portfolioData,
          goals,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`AI Agent error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to optimize portfolio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Check connection status
  isAgentConnected(): boolean {
    return this.isConnected;
  }

  // Get session ID
  getSessionId(): string | null {
    return this.sessionId;
  }
}

// Export singleton instance
export const aiAgentService = new AIAgentService();

// Mock AI Agent for development/testing
export class MockAIAgentService extends AIAgentService {
  constructor() {
    super();
  }

  async connect(): Promise<boolean> {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.isConnected = true;
    this.sessionId = 'mock-session-' + Date.now();
    return true;
  }

  async getRecommendations(): Promise<AIRecommendation[]> {
    return [
      {
        id: '1',
        type: 'optimize',
        title: 'Portfolio Rebalancing',
        description: 'Consider rebalancing your portfolio to maintain optimal asset allocation',
        priority: 'high',
        category: 'portfolio',
        confidence: 85,
        actionRequired: true,
        estimatedImpact: 'positive',
        createdAt: new Date(),
      },
      {
        id: '2',
        type: 'opportunity',
        title: 'New Yield Farming',
        description: 'High-yield farming opportunity detected in DeFi protocols',
        priority: 'medium',
        category: 'opportunity',
        confidence: 72,
        actionRequired: false,
        estimatedImpact: 'positive',
        createdAt: new Date(),
      },
      {
        id: '3',
        type: 'risk',
        title: 'Market Volatility Alert',
        description: 'Increased market volatility detected, consider risk management',
        priority: 'high',
        category: 'risk',
        confidence: 91,
        actionRequired: true,
        estimatedImpact: 'neutral',
        createdAt: new Date(),
      },
    ];
  }

  async chat(message: string): Promise<AIChatMessage> {
    // Simulate AI response
    const responses = [
      "I can help you with portfolio optimization and risk management strategies.",
      "Based on current market conditions, I recommend diversifying your investments.",
      "Let me analyze your portfolio and provide personalized recommendations.",
      "I've detected some opportunities that could improve your returns.",
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: randomResponse,
      timestamp: new Date(),
      metadata: {
        type: 'recommendation',
        confidence: 85,
      },
    };
  }

  async analyzePortfolio(): Promise<AIPortfolioAnalysis> {
    return {
      portfolioId: 'mock-portfolio',
      riskScore: 65,
      diversificationScore: 78,
      performanceScore: 82,
      recommendations: await this.getRecommendations(),
      riskFactors: ['High concentration in tech stocks', 'Limited international exposure'],
      opportunities: ['DeFi yield farming', 'Emerging market bonds'],
      lastUpdated: new Date(),
    };
  }
}

// Export mock service for development
export const mockAIAgentService = new MockAIAgentService();
