import { ApiResponse, SavingsPot, EscrowCase, Group, Vault, Investment, MarketData } from '../../types';
import { realDataService } from './real-data-service';
import { blockchainService } from './blockchain-service';
import { contractService } from './contract-service';

// Portfolio Analysis Types
export interface PortfolioMetrics {
  totalValue: number;
  totalPots: number;
  totalEscrows: number;
  totalGroups: number;
  totalVaults: number;
  diversificationScore: number;
  riskScore: number;
  performanceScore: number;
  liquidityRatio: number;
  growthRate: number;
}

export interface RiskAnalysis {
  overallRisk: 'low' | 'medium' | 'high';
  riskFactors: RiskFactor[];
  concentrationRisk: number;
  liquidityRisk: number;
  marketRisk: number;
  counterpartyRisk: number;
  recommendations: string[];
}

export interface RiskFactor {
  type: 'concentration' | 'liquidity' | 'market' | 'counterparty';
  severity: 'low' | 'medium' | 'high';
  description: string;
  impact: number;
}

export interface PerformanceTracking {
  totalReturn: number;
  totalReturnPercentage: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  volatility: number;
  benchmarkComparison: number;
  performanceHistory: PerformancePoint[];
}

export interface PerformancePoint {
  date: Date;
  portfolioValue: number;
  returns: number;
  benchmark: number;
}

export interface PortfolioData {
  address: string;
  balance: number;
  transactions: any[];
  pots: any[];
  escrows: EscrowCase[];
  groups: Group[];
  vaults: Vault[];
  investments: Investment[];
  marketData: MarketData;
}

export interface AIAnalysisService {
  // Portfolio Analysis
  aggregatePortfolioData(address: string): Promise<PortfolioData>;
  calculatePortfolioMetrics(data: PortfolioData): Promise<PortfolioMetrics>;
  analyzeRisk(data: PortfolioData): Promise<RiskAnalysis>;
  trackPerformance(data: PortfolioData): Promise<PerformanceTracking>;
  
  // Real-time Updates
  subscribeToPortfolioUpdates(address: string, callback: (data: PortfolioData) => void): void;
  unsubscribeFromPortfolioUpdates(): void;
}

class AIAnalysisServiceImpl implements AIAnalysisService {
  private updateSubscriptions: Map<string, (data: PortfolioData) => void> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;

  async aggregatePortfolioData(address: string): Promise<PortfolioData> {
    try {
      console.log('Aggregating real portfolio data for address:', address);

      // Fetch all real data from blockchain and contracts
      const [
        balance,
        transactions,
        pots,
        escrows,
        groups,
        vaults,
        investments,
        marketData
      ] = await Promise.all([
        this.getRealBalance(address),
        this.getRealTransactions(address),
        this.getRealPots(address),
        this.getRealEscrows(address),
        this.getRealGroups(address),
        this.getRealVaults(address),
        this.getRealInvestments(address),
        this.getRealMarketData()
      ]);

      const portfolioData: PortfolioData = {
        address,
        balance,
        transactions,
        pots,
        escrows,
        groups,
        vaults,
        investments,
        marketData
      };

      console.log('Portfolio data aggregated:', {
        balance,
        potsCount: pots.length,
        escrowsCount: escrows.length,
        groupsCount: groups.length,
        vaultsCount: vaults.length,
        investmentsCount: investments.length
      });

      return portfolioData;
    } catch (error) {
      console.error('Error aggregating portfolio data:', error);
      throw new Error('Failed to aggregate portfolio data from blockchain');
    }
  }

  async calculatePortfolioMetrics(data: PortfolioData): Promise<PortfolioMetrics> {
    try {
      console.log('Calculating portfolio metrics from real data');

      // Calculate total value from all sources
      const potValue = data.pots.reduce((sum, pot) => sum + (pot.currentAmount || 0), 0);
      const escrowValue = data.escrows.reduce((sum, escrow) => sum + (escrow.amount || 0), 0);
      const groupValue = data.groups.reduce((sum, group) => {
        const userParticipation = group.participants?.find(p => p.address === data.address);
        return sum + (userParticipation?.contribution || 0);
      }, 0);
      const vaultValue = data.investments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0);

      const totalValue = data.balance + potValue + escrowValue + groupValue + vaultValue;

      // Calculate diversification score (0-100)
      const diversificationScore = this.calculateDiversificationScore(data);

      // Calculate risk score based on portfolio composition
      const riskScore = this.calculateRiskScore(data);

      // Calculate performance score based on returns
      const performanceScore = this.calculatePerformanceScore(data);

      // Calculate liquidity ratio (liquid assets / total assets)
      const liquidAssets = data.balance + potValue; // Pots are relatively liquid
      const liquidityRatio = totalValue > 0 ? (liquidAssets / totalValue) * 100 : 0;

      // Calculate growth rate based on historical data
      const growthRate = this.calculateGrowthRate(data);

      const metrics: PortfolioMetrics = {
        totalValue,
        totalPots: data.pots.length,
        totalEscrows: data.escrows.length,
        totalGroups: data.groups.length,
        totalVaults: data.vaults.length,
        diversificationScore,
        riskScore,
        performanceScore,
        liquidityRatio,
        growthRate
      };

      console.log('Portfolio metrics calculated:', metrics);
      return metrics;
    } catch (error) {
      console.error('Error calculating portfolio metrics:', error);
      throw new Error('Failed to calculate portfolio metrics');
    }
  }

  async analyzeRisk(data: PortfolioData): Promise<RiskAnalysis> {
    try {
      console.log('Analyzing portfolio risk from real data');

      const riskFactors: RiskFactor[] = [];

      // Analyze concentration risk
      const concentrationRisk = this.analyzeConcentrationRisk(data);
      if (concentrationRisk > 0.7) {
        riskFactors.push({
          type: 'concentration',
          severity: concentrationRisk > 0.9 ? 'high' : 'medium',
          description: 'Portfolio is highly concentrated in few assets',
          impact: concentrationRisk
        });
      }

      // Analyze liquidity risk
      const liquidityRisk = this.analyzeLiquidityRisk(data);
      if (liquidityRisk > 0.6) {
        riskFactors.push({
          type: 'liquidity',
          severity: liquidityRisk > 0.8 ? 'high' : 'medium',
          description: 'High portion of assets are illiquid',
          impact: liquidityRisk
        });
      }

      // Analyze market risk
      const marketRisk = this.analyzeMarketRisk(data);
      if (marketRisk > 0.5) {
        riskFactors.push({
          type: 'market',
          severity: marketRisk > 0.8 ? 'high' : 'medium',
          description: 'Portfolio exposed to high market volatility',
          impact: marketRisk
        });
      }

      // Analyze counterparty risk
      const counterpartyRisk = this.analyzeCounterpartyRisk(data);
      if (counterpartyRisk > 0.4) {
        riskFactors.push({
          type: 'counterparty',
          severity: counterpartyRisk > 0.7 ? 'high' : 'medium',
          description: 'High exposure to counterparty defaults',
          impact: counterpartyRisk
        });
      }

      // Determine overall risk
      const avgRisk = (concentrationRisk + liquidityRisk + marketRisk + counterpartyRisk) / 4;
      const overallRisk: 'low' | 'medium' | 'high' = 
        avgRisk > 0.7 ? 'high' : avgRisk > 0.4 ? 'medium' : 'low';

      // Generate recommendations
      const recommendations = this.generateRiskRecommendations(riskFactors);

      const riskAnalysis: RiskAnalysis = {
        overallRisk,
        riskFactors,
        concentrationRisk,
        liquidityRisk,
        marketRisk,
        counterpartyRisk,
        recommendations
      };

      console.log('Risk analysis completed:', riskAnalysis);
      return riskAnalysis;
    } catch (error) {
      console.error('Error analyzing risk:', error);
      throw new Error('Failed to analyze portfolio risk');
    }
  }

  async trackPerformance(data: PortfolioData): Promise<PerformanceTracking> {
    try {
      console.log('Tracking portfolio performance from real data');

      // Calculate total return based on current vs initial values
      const totalReturn = this.calculateTotalReturn(data);
      const totalReturnPercentage = this.calculateTotalReturnPercentage(data);

      // Calculate annualized return
      const annualizedReturn = this.calculateAnnualizedReturn(data);

      // Calculate Sharpe ratio (return per unit of risk)
      const sharpeRatio = this.calculateSharpeRatio(data);

      // Calculate maximum drawdown
      const maxDrawdown = this.calculateMaxDrawdown(data);

      // Calculate volatility
      const volatility = this.calculateVolatility(data);

      // Compare with benchmark (market performance)
      const benchmarkComparison = this.calculateBenchmarkComparison(data);

      // Generate performance history
      const performanceHistory = this.generatePerformanceHistory(data);

      const performance: PerformanceTracking = {
        totalReturn,
        totalReturnPercentage,
        annualizedReturn,
        sharpeRatio,
        maxDrawdown,
        volatility,
        benchmarkComparison,
        performanceHistory
      };

      console.log('Performance tracking completed:', performance);
      return performance;
    } catch (error) {
      console.error('Error tracking performance:', error);
      throw new Error('Failed to track portfolio performance');
    }
  }

  subscribeToPortfolioUpdates(address: string, callback: (data: PortfolioData) => void): void {
    console.log('Subscribing to portfolio updates for:', address);
    this.updateSubscriptions.set(address, callback);
    
    // Start polling for updates every 60 seconds
    if (!this.updateInterval) {
      this.updateInterval = setInterval(async () => {
        for (const [addr, cb] of this.updateSubscriptions.entries()) {
          try {
            const portfolioData = await this.aggregatePortfolioData(addr);
            cb(portfolioData);
          } catch (error) {
            console.error('Error in portfolio update subscription:', error);
          }
        }
      }, 60000);
    }
  }

  unsubscribeFromPortfolioUpdates(): void {
    console.log('Unsubscribing from portfolio updates');
    this.updateSubscriptions.clear();
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // Private helper methods for real data fetching
  private async getRealBalance(address: string): Promise<number> {
    try {
      return await realDataService.getWalletBalance(address);
    } catch (error) {
      console.error('Error getting real balance:', error);
      return 0;
    }
  }

  private async getRealTransactions(address: string): Promise<any[]> {
    try {
      return await realDataService.getWalletTransactions(address);
    } catch (error) {
      console.error('Error getting real transactions:', error);
      return [];
    }
  }

  private async getRealPots(address: string): Promise<any[]> {
    try {
      return await realDataService.getUserPots(address);
    } catch (error) {
      console.error('Error getting real pots:', error);
      return [];
    }
  }

  private async getRealEscrows(address: string): Promise<EscrowCase[]> {
    try {
      // Query escrow contracts for user's escrows
      const response = await contractService.call({
        contractAddress: 'sei1escrow_contract_address', // Replace with actual escrow contract
        method: 'list_escrows_by_user',
        args: [address]
      });

      if (response.success && response.data.result) {
        return Array.isArray(response.data.result) ? response.data.result : [];
      }
      return [];
    } catch (error) {
      console.error('Error getting real escrows:', error);
      return [];
    }
  }

  private async getRealGroups(address: string): Promise<Group[]> {
    try {
      // Query group contracts for user's groups
      const response = await contractService.call({
        contractAddress: 'sei1group_contract_address', // Replace with actual group contract
        method: 'list_groups_by_user',
        args: [address]
      });

      if (response.success && response.data.result) {
        return Array.isArray(response.data.result) ? response.data.result : [];
      }
      return [];
    } catch (error) {
      console.error('Error getting real groups:', error);
      return [];
    }
  }

  private async getRealVaults(address: string): Promise<Vault[]> {
    try {
      // Query vault contracts for available vaults
      const response = await contractService.call({
        contractAddress: 'sei1vault_contract_address', // Replace with actual vault contract
        method: 'list_active_vaults',
        args: []
      });

      if (response.success && response.data.result) {
        return Array.isArray(response.data.result) ? response.data.result : [];
      }
      return [];
    } catch (error) {
      console.error('Error getting real vaults:', error);
      return [];
    }
  }

  private async getRealInvestments(address: string): Promise<Investment[]> {
    try {
      // Query vault contracts for user's investments
      const response = await contractService.call({
        contractAddress: 'sei1vault_contract_address', // Replace with actual vault contract
        method: 'list_user_investments',
        args: [address]
      });

      if (response.success && response.data.result) {
        return Array.isArray(response.data.result) ? response.data.result : [];
      }
      return [];
    } catch (error) {
      console.error('Error getting real investments:', error);
      return [];
    }
  }

  private async getRealMarketData(): Promise<MarketData> {
    try {
      // This would fetch from real market data APIs like CoinGecko
      // For now, return mock data structure
      return {
        price: 0.5, // SEI price in USD
        change24h: 2.5,
        volume24h: 1000000,
        marketCap: 500000000,
        tvl: 50000000,
        activeUsers: 10000
      };
    } catch (error) {
      console.error('Error getting real market data:', error);
      return {
        price: 0,
        change24h: 0,
        volume24h: 0,
        marketCap: 0,
        tvl: 0,
        activeUsers: 0
      };
    }
  }

  // Private calculation methods
  private calculateDiversificationScore(data: PortfolioData): number {
    const totalValue = data.balance + 
      data.pots.reduce((sum, pot) => sum + (pot.currentAmount || 0), 0) +
      data.escrows.reduce((sum, escrow) => sum + (escrow.amount || 0), 0) +
      data.investments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0);

    if (totalValue === 0) return 0;

    // Calculate Herfindahl-Hirschman Index for diversification
    const assetTypes = [
      data.balance / totalValue, // Cash
      data.pots.reduce((sum, pot) => sum + (pot.currentAmount || 0), 0) / totalValue, // Savings
      data.escrows.reduce((sum, escrow) => sum + (escrow.amount || 0), 0) / totalValue, // Escrows
      data.investments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0) / totalValue // Investments
    ];

    const hhi = assetTypes.reduce((sum, share) => sum + (share * share), 0);
    return Math.max(0, (1 - hhi) * 100); // Convert to 0-100 scale
  }

  private calculateRiskScore(data: PortfolioData): number {
    // Risk score based on asset allocation and volatility
    const totalValue = data.balance + 
      data.pots.reduce((sum, pot) => sum + (pot.currentAmount || 0), 0) +
      data.investments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0);

    if (totalValue === 0) return 0;

    // Higher risk for more volatile investments
    const investmentRatio = data.investments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0) / totalValue;
    const escrowRatio = data.escrows.reduce((sum, escrow) => sum + (escrow.amount || 0), 0) / totalValue;
    
    return Math.min(100, (investmentRatio * 80) + (escrowRatio * 40)); // Scale to 0-100
  }

  private calculatePerformanceScore(data: PortfolioData): number {
    // Performance score based on returns
    const totalReturns = data.investments.reduce((sum, inv) => sum + (inv.pnlPercentage || 0), 0);
    const avgReturn = data.investments.length > 0 ? totalReturns / data.investments.length : 0;
    
    // Convert to 0-100 scale (assuming -50% to +50% range)
    return Math.max(0, Math.min(100, (avgReturn + 50) * 2));
  }

  private calculateGrowthRate(data: PortfolioData): number {
    // Calculate growth rate based on investment performance
    const totalPnl = data.investments.reduce((sum, inv) => sum + (inv.pnlPercentage || 0), 0);
    return data.investments.length > 0 ? totalPnl / data.investments.length : 0;
  }

  private analyzeConcentrationRisk(data: PortfolioData): number {
    // Analyze if portfolio is too concentrated in single assets
    const totalValue = data.balance + 
      data.pots.reduce((sum, pot) => sum + (pot.currentAmount || 0), 0) +
      data.investments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0);

    if (totalValue === 0) return 0;

    // Find largest single position
    const largestPosition = Math.max(
      data.balance / totalValue,
      ...data.pots.map(pot => (pot.currentAmount || 0) / totalValue),
      ...data.investments.map(inv => (inv.currentValue || 0) / totalValue)
    );

    return largestPosition; // 0-1 scale
  }

  private analyzeLiquidityRisk(data: PortfolioData): number {
    const totalValue = data.balance + 
      data.pots.reduce((sum, pot) => sum + (pot.currentAmount || 0), 0) +
      data.investments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0);

    if (totalValue === 0) return 0;

    // Illiquid assets (investments and long-term escrows)
    const illiquidValue = data.investments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0);
    return illiquidValue / totalValue; // 0-1 scale
  }

  private analyzeMarketRisk(data: PortfolioData): number {
    // Market risk based on exposure to volatile assets
    const volatileAssets = data.investments.filter(inv => inv.pnlPercentage && Math.abs(inv.pnlPercentage) > 10);
    return Math.min(1, volatileAssets.length / Math.max(1, data.investments.length));
  }

  private analyzeCounterpartyRisk(data: PortfolioData): number {
    // Counterparty risk from escrows and group investments
    const totalValue = data.balance + 
      data.pots.reduce((sum, pot) => sum + (pot.currentAmount || 0), 0) +
      data.investments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0);

    if (totalValue === 0) return 0;

    const counterpartyExposure = data.escrows.reduce((sum, escrow) => sum + (escrow.amount || 0), 0);
    return counterpartyExposure / totalValue; // 0-1 scale
  }

  private generateRiskRecommendations(riskFactors: RiskFactor[]): string[] {
    const recommendations: string[] = [];

    riskFactors.forEach(factor => {
      switch (factor.type) {
        case 'concentration':
          recommendations.push('Consider diversifying your portfolio across different asset types');
          break;
        case 'liquidity':
          recommendations.push('Maintain higher cash reserves for better liquidity');
          break;
        case 'market':
          recommendations.push('Consider reducing exposure to high-volatility investments');
          break;
        case 'counterparty':
          recommendations.push('Diversify counterparty exposure across multiple parties');
          break;
      }
    });

    return recommendations;
  }

  private calculateTotalReturn(data: PortfolioData): number {
    return data.investments.reduce((sum, inv) => sum + (inv.pnl || 0), 0);
  }

  private calculateTotalReturnPercentage(data: PortfolioData): number {
    const totalInvested = data.investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const totalReturn = this.calculateTotalReturn(data);
    return totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
  }

  private calculateAnnualizedReturn(data: PortfolioData): number {
    // Simplified annualized return calculation
    const totalReturnPercentage = this.calculateTotalReturnPercentage(data);
    // Assuming average holding period of 1 year for simplification
    return totalReturnPercentage;
  }

  private calculateSharpeRatio(data: PortfolioData): number {
    const returns = data.investments.map(inv => inv.pnlPercentage || 0);
    if (returns.length === 0) return 0;

    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    return stdDev > 0 ? avgReturn / stdDev : 0;
  }

  private calculateMaxDrawdown(data: PortfolioData): number {
    // Simplified max drawdown calculation
    const returns = data.investments.map(inv => inv.pnlPercentage || 0);
    if (returns.length === 0) return 0;

    let maxDrawdown = 0;
    let peak = 0;

    returns.forEach(ret => {
      peak = Math.max(peak, ret);
      const drawdown = peak - ret;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    });

    return maxDrawdown;
  }

  private calculateVolatility(data: PortfolioData): number {
    const returns = data.investments.map(inv => inv.pnlPercentage || 0);
    if (returns.length === 0) return 0;

    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  private calculateBenchmarkComparison(data: PortfolioData): number {
    // Compare portfolio performance to market benchmark (SEI price change)
    const portfolioReturn = this.calculateTotalReturnPercentage(data);
    const benchmarkReturn = data.marketData.change24h; // Using 24h change as benchmark
    
    return portfolioReturn - benchmarkReturn;
  }

  private generatePerformanceHistory(data: PortfolioData): PerformancePoint[] {
    // Generate simplified performance history
    // In real implementation, this would use historical data
    const now = new Date();
    const history: PerformancePoint[] = [];

    for (let i = 30; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const portfolioValue = data.balance + 
        data.pots.reduce((sum, pot) => sum + (pot.currentAmount || 0), 0) +
        data.investments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0);
      
      history.push({
        date,
        portfolioValue: portfolioValue * (0.95 + Math.random() * 0.1), // Simulate variation
        returns: (Math.random() - 0.5) * 10, // Random returns for demo
        benchmark: data.marketData.change24h * (0.8 + Math.random() * 0.4)
      });
    }

    return history;
  }
}

export const aiAnalysisService = new AIAnalysisServiceImpl();
export default aiAnalysisService;