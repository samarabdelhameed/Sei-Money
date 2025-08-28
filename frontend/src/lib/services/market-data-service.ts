import { ApiResponse } from '../../types';

// Market Data Types
export interface MarketPrice {
  symbol: string;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: number;
}

export interface MarketTrend {
  symbol: string;
  trend: 'bullish' | 'bearish' | 'neutral';
  strength: number; // 0-100
  indicators: {
    rsi: number;
    macd: number;
    sma20: number;
    sma50: number;
  };
  prediction: {
    shortTerm: 'up' | 'down' | 'sideways';
    confidence: number;
  };
}

export interface DeFiMetrics {
  protocol: string;
  tvl: number;
  tvlChange24h: number;
  volume24h: number;
  apy: number;
  users24h: number;
  category: string;
}

export interface MarketDataConfig {
  updateInterval: number;
  enableRealTime: boolean;
  trackedSymbols: string[];
  trackedProtocols: string[];
  apiKeys: {
    coinGecko?: string;
    coinMarketCap?: string;
    defiLlama?: string;
  };
}

export interface MarketDataService {
  // Price data
  getPrice(symbol: string): Promise<ApiResponse<MarketPrice>>;
  getPrices(symbols: string[]): Promise<ApiResponse<MarketPrice[]>>;
  getPriceHistory(symbol: string, days: number): Promise<ApiResponse<{ timestamp: number; price: number }[]>>;
  
  // Market analysis
  getMarketTrend(symbol: string): Promise<ApiResponse<MarketTrend>>;
  getMarketOverview(): Promise<ApiResponse<{ totalMarketCap: number; btcDominance: number; fearGreedIndex: number }>>;
  
  // DeFi data
  getDeFiMetrics(protocol: string): Promise<ApiResponse<DeFiMetrics>>;
  getTopDeFiProtocols(limit?: number): Promise<ApiResponse<DeFiMetrics[]>>;
  
  // Real-time subscriptions
  subscribeToPriceUpdates(symbol: string, callback: (price: MarketPrice) => void): string;
  unsubscribeFromPriceUpdates(subscriptionId: string): void;
  
  // Configuration
  updateConfig(config: Partial<MarketDataConfig>): void;
  getConfig(): MarketDataConfig;
}

class MarketDataServiceImpl implements MarketDataService {
  private config: MarketDataConfig = {
    updateInterval: 60000, // 1 minute
    enableRealTime: true,
    trackedSymbols: ['SEI', 'BTC', 'ETH', 'USDT', 'USDC'],
    trackedProtocols: ['uniswap', 'aave', 'compound'],
    apiKeys: {}
  };

  private priceCache: Map<string, { data: MarketPrice; timestamp: number }> = new Map();
  private subscriptions: Map<string, { symbol: string; callback: (price: MarketPrice) => void }> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;

  // API endpoints
  private readonly endpoints = {
    coinGecko: 'https://api.coingecko.com/api/v3',
    coinMarketCap: 'https://pro-api.coinmarketcap.com/v1',
    defiLlama: 'https://api.llama.fi'
  };

  constructor() {
    this.startPriceUpdates();
  }

  async getPrice(symbol: string): Promise<ApiResponse<MarketPrice>> {
    try {
      // Check cache first
      const cached = this.priceCache.get(symbol.toLowerCase());
      if (cached && Date.now() - cached.timestamp < 30000) { // 30 seconds cache
        return {
          success: true,
          data: cached.data,
          timestamp: Date.now()
        };
      }

      // Fetch from CoinGecko
      const response = await this.fetchFromCoinGecko(`/simple/price`, {
        ids: this.symbolToId(symbol),
        vs_currencies: 'usd',
        include_24hr_change: 'true',
        include_24hr_vol: 'true',
        include_market_cap: 'true'
      });

      if (response.success && response.data) {
        const coinId = this.symbolToId(symbol);
        const priceData = response.data[coinId];
        
        if (priceData) {
          const marketPrice: MarketPrice = {
            symbol: symbol.toUpperCase(),
            price: priceData.usd || 0,
            priceChange24h: priceData.usd_24h_change || 0,
            priceChangePercent24h: priceData.usd_24h_change || 0,
            volume24h: priceData.usd_24h_vol || 0,
            marketCap: priceData.usd_market_cap || 0,
            lastUpdated: Date.now()
          };

          // Update cache
          this.priceCache.set(symbol.toLowerCase(), {
            data: marketPrice,
            timestamp: Date.now()
          });

          return {
            success: true,
            data: marketPrice,
            timestamp: Date.now()
          };
        }
      }

      throw new Error(`Price data not found for ${symbol}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get price',
        timestamp: Date.now()
      };
    }
  }

  async getPrices(symbols: string[]): Promise<ApiResponse<MarketPrice[]>> {
    try {
      const coinIds = symbols.map(symbol => this.symbolToId(symbol)).join(',');
      
      const response = await this.fetchFromCoinGecko(`/simple/price`, {
        ids: coinIds,
        vs_currencies: 'usd',
        include_24hr_change: 'true',
        include_24hr_vol: 'true',
        include_market_cap: 'true'
      });

      if (response.success && response.data) {
        const prices: MarketPrice[] = symbols.map(symbol => {
          const coinId = this.symbolToId(symbol);
          const priceData = response.data[coinId];
          
          const marketPrice: MarketPrice = {
            symbol: symbol.toUpperCase(),
            price: priceData?.usd || 0,
            priceChange24h: priceData?.usd_24h_change || 0,
            priceChangePercent24h: priceData?.usd_24h_change || 0,
            volume24h: priceData?.usd_24h_vol || 0,
            marketCap: priceData?.usd_market_cap || 0,
            lastUpdated: Date.now()
          };

          // Update cache
          this.priceCache.set(symbol.toLowerCase(), {
            data: marketPrice,
            timestamp: Date.now()
          });

          return marketPrice;
        });

        return {
          success: true,
          data: prices,
          timestamp: Date.now()
        };
      }

      throw new Error('Failed to fetch prices');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get prices',
        timestamp: Date.now()
      };
    }
  }

  async getPriceHistory(symbol: string, days: number): Promise<ApiResponse<{ timestamp: number; price: number }[]>> {
    try {
      const coinId = this.symbolToId(symbol);
      
      const response = await this.fetchFromCoinGecko(`/coins/${coinId}/market_chart`, {
        vs_currency: 'usd',
        days: days.toString()
      });

      if (response.success && response.data?.prices) {
        const history = response.data.prices.map(([timestamp, price]: [number, number]) => ({
          timestamp,
          price
        }));

        return {
          success: true,
          data: history,
          timestamp: Date.now()
        };
      }

      throw new Error(`Price history not found for ${symbol}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get price history',
        timestamp: Date.now()
      };
    }
  }

  async getMarketTrend(symbol: string): Promise<ApiResponse<MarketTrend>> {
    try {
      // Get price history for technical analysis
      const historyResponse = await this.getPriceHistory(symbol, 30);
      
      if (!historyResponse.success || !historyResponse.data) {
        throw new Error('Failed to get price history for analysis');
      }

      const prices = historyResponse.data.map(item => item.price);
      const indicators = this.calculateTechnicalIndicators(prices);
      
      // Simple trend analysis
      const recentPrices = prices.slice(-7); // Last 7 days
      const trend = this.determineTrend(recentPrices);
      
      const marketTrend: MarketTrend = {
        symbol: symbol.toUpperCase(),
        trend: trend.direction,
        strength: trend.strength,
        indicators,
        prediction: {
          shortTerm: trend.direction === 'bullish' ? 'up' : trend.direction === 'bearish' ? 'down' : 'sideways',
          confidence: trend.strength
        }
      };

      return {
        success: true,
        data: marketTrend,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get market trend',
        timestamp: Date.now()
      };
    }
  }

  async getMarketOverview(): Promise<ApiResponse<{ totalMarketCap: number; btcDominance: number; fearGreedIndex: number }>> {
    try {
      const response = await this.fetchFromCoinGecko('/global');

      if (response.success && response.data?.data) {
        const globalData = response.data.data;
        
        return {
          success: true,
          data: {
            totalMarketCap: globalData.total_market_cap?.usd || 0,
            btcDominance: globalData.market_cap_percentage?.btc || 0,
            fearGreedIndex: 50 // Would integrate with Fear & Greed Index API
          },
          timestamp: Date.now()
        };
      }

      throw new Error('Failed to get market overview');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get market overview',
        timestamp: Date.now()
      };
    }
  }

  async getDeFiMetrics(protocol: string): Promise<ApiResponse<DeFiMetrics>> {
    try {
      const response = await this.fetchFromDeFiLlama(`/protocol/${protocol}`);

      if (response.success && response.data) {
        const protocolData = response.data;
        
        const metrics: DeFiMetrics = {
          protocol: protocolData.name || protocol,
          tvl: protocolData.tvl || 0,
          tvlChange24h: protocolData.change_1d || 0,
          volume24h: protocolData.volume24h || 0,
          apy: protocolData.apy || 0,
          users24h: protocolData.users || 0,
          category: protocolData.category || 'Unknown'
        };

        return {
          success: true,
          data: metrics,
          timestamp: Date.now()
        };
      }

      throw new Error(`DeFi metrics not found for ${protocol}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get DeFi metrics',
        timestamp: Date.now()
      };
    }
  }

  async getTopDeFiProtocols(limit = 10): Promise<ApiResponse<DeFiMetrics[]>> {
    try {
      const response = await this.fetchFromDeFiLlama('/protocols');

      if (response.success && response.data) {
        const protocols = response.data
          .slice(0, limit)
          .map((protocol: any) => ({
            protocol: protocol.name,
            tvl: protocol.tvl || 0,
            tvlChange24h: protocol.change_1d || 0,
            volume24h: protocol.volume24h || 0,
            apy: protocol.apy || 0,
            users24h: protocol.users || 0,
            category: protocol.category || 'Unknown'
          }));

        return {
          success: true,
          data: protocols,
          timestamp: Date.now()
        };
      }

      throw new Error('Failed to get top DeFi protocols');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get top DeFi protocols',
        timestamp: Date.now()
      };
    }
  }

  subscribeToPriceUpdates(symbol: string, callback: (price: MarketPrice) => void): string {
    const subscriptionId = this.generateSubscriptionId();
    
    this.subscriptions.set(subscriptionId, {
      symbol: symbol.toLowerCase(),
      callback
    });

    return subscriptionId;
  }

  unsubscribeFromPriceUpdates(subscriptionId: string): void {
    this.subscriptions.delete(subscriptionId);
  }

  updateConfig(config: Partial<MarketDataConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart updates with new interval
    if (config.updateInterval) {
      this.stopPriceUpdates();
      this.startPriceUpdates();
    }
  }

  getConfig(): MarketDataConfig {
    return { ...this.config };
  }

  // Private methods
  private async fetchFromCoinGecko(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<any>> {
    try {
      const url = new URL(this.endpoints.coinGecko + endpoint);
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.append(key, value);
        });
      }

      const headers: Record<string, string> = {
        'Accept': 'application/json'
      };

      if (this.config.apiKeys.coinGecko) {
        headers['x-cg-demo-api-key'] = this.config.apiKeys.coinGecko;
      }

      const response = await fetch(url.toString(), { headers });
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'CoinGecko API error',
        timestamp: Date.now()
      };
    }
  }

  private async fetchFromDeFiLlama(endpoint: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(this.endpoints.defiLlama + endpoint);
      
      if (!response.ok) {
        throw new Error(`DeFiLlama API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'DeFiLlama API error',
        timestamp: Date.now()
      };
    }
  }

  private symbolToId(symbol: string): string {
    // Map common symbols to CoinGecko IDs
    const symbolMap: Record<string, string> = {
      'SEI': 'sei-network',
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'USDT': 'tether',
      'USDC': 'usd-coin',
      'BNB': 'binancecoin',
      'ADA': 'cardano',
      'SOL': 'solana',
      'DOT': 'polkadot',
      'MATIC': 'matic-network'
    };

    return symbolMap[symbol.toUpperCase()] || symbol.toLowerCase();
  }

  private calculateTechnicalIndicators(prices: number[]): MarketTrend['indicators'] {
    if (prices.length < 50) {
      return { rsi: 50, macd: 0, sma20: 0, sma50: 0 };
    }

    // Simple Moving Averages
    const sma20 = prices.slice(-20).reduce((sum, price) => sum + price, 0) / 20;
    const sma50 = prices.slice(-50).reduce((sum, price) => sum + price, 0) / 50;

    // RSI calculation (simplified)
    const rsi = this.calculateRSI(prices.slice(-14));

    // MACD (simplified)
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macd = ema12 - ema26;

    return { rsi, macd, sma20, sma50 };
  }

  private calculateRSI(prices: number[]): number {
    if (prices.length < 2) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }

    const avgGain = gains / (prices.length - 1);
    const avgLoss = losses / (prices.length - 1);

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0;

    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;

    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }

    return ema;
  }

  private determineTrend(prices: number[]): { direction: 'bullish' | 'bearish' | 'neutral'; strength: number } {
    if (prices.length < 2) {
      return { direction: 'neutral', strength: 0 };
    }

    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const change = ((lastPrice - firstPrice) / firstPrice) * 100;

    let direction: 'bullish' | 'bearish' | 'neutral';
    let strength: number;

    if (change > 5) {
      direction = 'bullish';
      strength = Math.min(Math.abs(change) * 2, 100);
    } else if (change < -5) {
      direction = 'bearish';
      strength = Math.min(Math.abs(change) * 2, 100);
    } else {
      direction = 'neutral';
      strength = Math.max(20 - Math.abs(change), 0);
    }

    return { direction, strength };
  }

  private startPriceUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(async () => {
      if (this.config.enableRealTime && this.subscriptions.size > 0) {
        await this.updateSubscribedPrices();
      }
    }, this.config.updateInterval);
  }

  private stopPriceUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private async updateSubscribedPrices(): void {
    const symbols = Array.from(new Set(
      Array.from(this.subscriptions.values()).map(sub => sub.symbol)
    ));

    if (symbols.length === 0) return;

    try {
      const pricesResponse = await this.getPrices(symbols);
      
      if (pricesResponse.success && pricesResponse.data) {
        for (const price of pricesResponse.data) {
          // Notify all subscribers for this symbol
          for (const [subscriptionId, subscription] of this.subscriptions.entries()) {
            if (subscription.symbol === price.symbol.toLowerCase()) {
              try {
                subscription.callback(price);
              } catch (error) {
                console.error('Error in price update callback:', error);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error updating subscribed prices:', error);
    }
  }

  private generateSubscriptionId(): string {
    return `market_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const marketDataService = new MarketDataServiceImpl();
export default marketDataService;