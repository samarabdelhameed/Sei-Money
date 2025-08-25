// AI Agent Screen Comprehensive Tester
// Comprehensive testing for AI Agent screen

import { TestResult, TestStatus, TestCategory } from './types';
import { testUtils } from './test-utilities';

export class AIAgentScreenTester {
  private results: TestResult[] = [];

  async testAIAgentScreen(): Promise<TestResult[]> {
    console.log('🤖 Testing AI Agent Screen...');
    this.results = [];

    try {
      // Navigate to AI agent screen
      await this.navigateToAIAgent();
      await this.sleep(2000);

      // Test 7.1: AI agent connectivity and responses
      await this.testAIAgentConnectivityAndResponses();
      
      // Test 7.2: AI recommendations and insights
      await this.testAIRecommendationsAndInsights();

    } catch (error) {
      console.error('❌ AI Agent screen testing failed:', error);
      this.results.push(testUtils.handleTestError(error as Error, 'AI Agent Screen Testing'));
    }

    return this.results;
  }

  // Test 7.1: AI agent connectivity and responses
  private async testAIAgentConnectivityAndResponses(): Promise<void> {
    console.log('  🔗 Testing AI agent connectivity and responses...');
    const startTime = performance.now();

    try {
      // Check for AI status indicator
      const statusElements = document.querySelectorAll('[data-testid*="ai-status"], [class*="status"]');
      const statusTexts = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent?.toLowerCase() || '';
        return text.includes('ai online') || text.includes('online') || text.includes('connected');
      });
      const hasAIStatus = statusElements.length > 0 || statusTexts.length > 0;

      this.addResult('AI Agent - Status Indicator',
        hasAIStatus ? TestStatus.PASSED : TestStatus.WARNING,
        hasAIStatus ? 'AI status indicator found' : 'AI status indicator not clearly visible',
        TestCategory.INTEGRATION, performance.now() - startTime);

      // Check for chat interface
      const chatElements = document.querySelectorAll('[data-testid*="chat"], [class*="chat"]');
      const messageElements = document.querySelectorAll('[data-testid*="message"], [class*="message"]');
      const hasChatInterface = chatElements.length > 0 || messageElements.length > 0;

      this.addResult('AI Agent - Chat Interface',
        hasChatInterface ? TestStatus.PASSED : TestStatus.WARNING,
        hasChatInterface ? 'Chat interface found' : 'Chat interface not clearly visible',
        TestCategory.UI, performance.now() - startTime);

      // Check for input field
      const inputElements = document.querySelectorAll('[data-testid*="ai-query-input"], input, textarea');
      const chatInputs = Array.from(inputElements).filter(input => {
        const placeholder = (input as HTMLInputElement).placeholder?.toLowerCase() || '';
        return placeholder.includes('ask') || placeholder.includes('message') || placeholder.includes('ai');
      });
      const hasInputField = chatInputs.length > 0;

      this.addResult('AI Agent - Input Field',
        hasInputField ? TestStatus.PASSED : TestStatus.FAILED,
        hasInputField ? `Found ${chatInputs.length} input fields` : 'No input field found',
        TestCategory.UI, performance.now() - startTime);

      // Check for send button
      const sendButtons = document.querySelectorAll('[data-testid*="send-query-btn"], button');
      const sendButtonsArray = Array.from(sendButtons).filter(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        const hasIcon = btn.querySelector('svg') !== null;
        return text.includes('send') || hasIcon;
      });
      const hasSendButton = sendButtonsArray.length > 0;

      this.addResult('AI Agent - Send Button',
        hasSendButton ? TestStatus.PASSED : TestStatus.WARNING,
        hasSendButton ? `Found ${sendButtonsArray.length} send buttons` : 'Send button not found',
        TestCategory.UI, performance.now() - startTime);

      // Test chat interaction
      if (hasInputField && hasSendButton) {
        try {
          const inputField = chatInputs[0] as HTMLInputElement | HTMLTextAreaElement;
          const sendButton = sendButtonsArray[0] as HTMLElement;

          // Test input functionality
          const testMessage = 'Test message for AI agent';
          inputField.value = testMessage;
          inputField.dispatchEvent(new Event('input', { bubbles: true }));
          
          await this.sleep(500);

          // Check if send button becomes enabled
          const isButtonEnabled = !sendButton.hasAttribute('disabled');

          this.addResult('AI Agent - Input Interaction',
            isButtonEnabled ? TestStatus.PASSED : TestStatus.WARNING,
            isButtonEnabled ? 'Input field and send button interaction working' : 'Input interaction may have issues',
            TestCategory.UI, performance.now() - startTime);

          // Clear the input
          inputField.value = '';
          inputField.dispatchEvent(new Event('input', { bubbles: true }));

        } catch (error) {
          this.addResult('AI Agent - Input Interaction', TestStatus.WARNING,
            'Could not test input interaction automatically',
            TestCategory.UI, performance.now() - startTime);
        }
      }

      // Check for conversation history
      const conversationElements = document.querySelectorAll('[data-testid*="conversation"], [class*="conversation"]');
      const messageHistory = document.querySelectorAll('[data-testid*="message"], [class*="message"], p, div');
      const hasConversationHistory = conversationElements.length > 0 || 
        Array.from(messageHistory).some(el => el.textContent?.includes('Hello') || el.textContent?.includes('assistant'));

      this.addResult('AI Agent - Conversation History',
        hasConversationHistory ? TestStatus.PASSED : TestStatus.WARNING,
        hasConversationHistory ? 'Conversation history found' : 'Conversation history not clearly visible',
        TestCategory.DATA, performance.now() - startTime);

      // Check for typing indicator
      const typingElements = document.querySelectorAll('[data-testid*="typing"], [class*="typing"]');
      const loadingElements = document.querySelectorAll('[class*="animate"], [class*="pulse"]');
      const hasTypingIndicator = typingElements.length > 0 || loadingElements.length > 0;

      this.addResult('AI Agent - Typing Indicator',
        hasTypingIndicator ? TestStatus.PASSED : TestStatus.WARNING,
        hasTypingIndicator ? 'Typing/loading indicators found' : 'Typing indicators not clearly visible',
        TestCategory.UI, performance.now() - startTime);

      // Check for response quality indicators
      const qualityElements = document.querySelectorAll('[data-testid*="quality"], [class*="quality"]');
      const ratingElements = document.querySelectorAll('[data-testid*="rating"], [class*="rating"]');
      const hasQualityIndicators = qualityElements.length > 0 || ratingElements.length > 0;

      this.addResult('AI Agent - Response Quality',
        hasQualityIndicators ? TestStatus.PASSED : TestStatus.WARNING,
        hasQualityIndicators ? 'Response quality indicators found' : 'Response quality indicators not clearly visible',
        TestCategory.UI, performance.now() - startTime);

    } catch (error) {
      this.addResult('AI Agent Connectivity Test', TestStatus.FAILED,
        `AI connectivity test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.INTEGRATION, performance.now() - startTime);
    }
  }

  // Test 7.2: AI recommendations and insights
  private async testAIRecommendationsAndInsights(): Promise<void> {
    console.log('  💡 Testing AI recommendations and insights...');
    const startTime = performance.now();

    try {
      // Check for market analysis section
      const marketElements = document.querySelectorAll('[data-testid*="market"], [class*="market"]');
      const analysisElements = document.querySelectorAll('[data-testid*="analysis"], [class*="analysis"]');
      const hasMarketAnalysis = marketElements.length > 0 || analysisElements.length > 0;

      this.addResult('AI Agent - Market Analysis',
        hasMarketAnalysis ? TestStatus.PASSED : TestStatus.WARNING,
        hasMarketAnalysis ? 'Market analysis section found' : 'Market analysis not clearly visible',
        TestCategory.DATA, performance.now() - startTime);

      // Check for recommendations panel
      const recommendationElements = document.querySelectorAll('[data-testid*="recommendation"], [class*="recommendation"]');
      const suggestionElements = document.querySelectorAll('[data-testid*="suggestion"], [class*="suggestion"]');
      const hasRecommendations = recommendationElements.length > 0 || suggestionElements.length > 0;

      this.addResult('AI Agent - Recommendations Panel',
        hasRecommendations ? TestStatus.PASSED : TestStatus.WARNING,
        hasRecommendations ? 'Recommendations panel found' : 'Recommendations panel not clearly visible',
        TestCategory.UI, performance.now() - startTime);

      // Check for portfolio insights
      const portfolioElements = document.querySelectorAll('[data-testid*="portfolio"], [class*="portfolio"]');
      const insightElements = document.querySelectorAll('[data-testid*="insight"], [class*="insight"]');
      const hasPortfolioInsights = portfolioElements.length > 0 || insightElements.length > 0;

      this.addResult('AI Agent - Portfolio Insights',
        hasPortfolioInsights ? TestStatus.PASSED : TestStatus.WARNING,
        hasPortfolioInsights ? 'Portfolio insights found' : 'Portfolio insights not clearly visible',
        TestCategory.DATA, performance.now() - startTime);

      // Check for risk assessment
      const riskElements = document.querySelectorAll('[data-testid*="risk"], [class*="risk"]');
      const riskTexts = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent?.toLowerCase() || '';
        return text.includes('risk') || text.includes('assessment');
      });
      const hasRiskAssessment = riskElements.length > 0 || riskTexts.length > 0;

      this.addResult('AI Agent - Risk Assessment',
        hasRiskAssessment ? TestStatus.PASSED : TestStatus.WARNING,
        hasRiskAssessment ? 'Risk assessment found' : 'Risk assessment not clearly visible',
        TestCategory.DATA, performance.now() - startTime);

      // Check for strategy suggestions
      const strategyElements = document.querySelectorAll('[data-testid*="strategy"], [class*="strategy"]');
      const strategyTexts = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent?.toLowerCase() || '';
        return text.includes('strategy') || text.includes('optimize');
      });
      const hasStrategySuggestions = strategyElements.length > 0 || strategyTexts.length > 0;

      this.addResult('AI Agent - Strategy Suggestions',
        hasStrategySuggestions ? TestStatus.PASSED : TestStatus.WARNING,
        hasStrategySuggestions ? 'Strategy suggestions found' : 'Strategy suggestions not clearly visible',
        TestCategory.DATA, performance.now() - startTime);

      // Check for market data integration
      const priceElements = document.querySelectorAll('[data-testid*="price"], [class*="price"]');
      const chartElements = document.querySelectorAll('canvas, svg, [class*="chart"]');
      const hasMarketData = priceElements.length > 0 || chartElements.length > 0;

      this.addResult('AI Agent - Market Data Integration',
        hasMarketData ? TestStatus.PASSED : TestStatus.WARNING,
        hasMarketData ? `Market data elements found (prices: ${priceElements.length}, charts: ${chartElements.length})` : 'Market data integration not clearly visible',
        TestCategory.DATA, performance.now() - startTime);

      // Check for actionable recommendations
      const actionButtons = document.querySelectorAll('button');
      const actionableButtons = Array.from(actionButtons).filter(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        return text.includes('execute') || text.includes('apply') || text.includes('optimize') || text.includes('compound');
      });
      const hasActionableRecommendations = actionableButtons.length > 0;

      this.addResult('AI Agent - Actionable Recommendations',
        hasActionableRecommendations ? TestStatus.PASSED : TestStatus.WARNING,
        hasActionableRecommendations ? `Found ${actionableButtons.length} actionable recommendation buttons` : 'Actionable recommendations not found',
        TestCategory.UI, performance.now() - startTime);

      // Check for personalized advice
      const personalizedElements = document.querySelectorAll('[data-testid*="personal"], [class*="personal"]');
      const adviceElements = document.querySelectorAll('[data-testid*="advice"], [class*="advice"]');
      const hasPersonalizedAdvice = personalizedElements.length > 0 || adviceElements.length > 0;

      this.addResult('AI Agent - Personalized Advice',
        hasPersonalizedAdvice ? TestStatus.PASSED : TestStatus.WARNING,
        hasPersonalizedAdvice ? 'Personalized advice elements found' : 'Personalized advice not clearly visible',
        TestCategory.DATA, performance.now() - startTime);

      // Check for bot integration status
      const botElements = document.querySelectorAll('[data-testid*="bot"], [class*="bot"]');
      const integrationElements = document.querySelectorAll('[data-testid*="integration"], [class*="integration"]');
      const hasBotIntegration = botElements.length > 0 || integrationElements.length > 0;

      this.addResult('AI Agent - Bot Integration',
        hasBotIntegration ? TestStatus.PASSED : TestStatus.WARNING,
        hasBotIntegration ? 'Bot integration elements found' : 'Bot integration not clearly visible',
        TestCategory.INTEGRATION, performance.now() - startTime);

      // Check for automated actions
      const automationElements = document.querySelectorAll('[data-testid*="auto"], [class*="auto"]');
      const automationTexts = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent?.toLowerCase() || '';
        return text.includes('auto') || text.includes('automated');
      });
      const hasAutomatedActions = automationElements.length > 0 || automationTexts.length > 0;

      this.addResult('AI Agent - Automated Actions',
        hasAutomatedActions ? TestStatus.PASSED : TestStatus.WARNING,
        hasAutomatedActions ? 'Automated action elements found' : 'Automated actions not clearly visible',
        TestCategory.UI, performance.now() - startTime);

    } catch (error) {
      this.addResult('AI Recommendations Test', TestStatus.FAILED,
        `AI recommendations test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.DATA, performance.now() - startTime);
    }
  }

  // Helper methods
  private async navigateToAIAgent(): Promise<void> {
    const currentPath = window.location.pathname;
    const currentHash = window.location.hash;
    
    if (!currentPath.includes('/ai-agent') && !currentHash.includes('/ai-agent')) {
      window.location.hash = '#/ai-agent';
      await this.sleep(1000);
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private addResult(testName: string, status: TestStatus, details: string, category: TestCategory, executionTime: number): void {
    this.results.push({
      testName,
      status,
      details,
      category,
      executionTime,
      timestamp: new Date(),
      errors: status === TestStatus.FAILED ? [details] : undefined
    });
  }

  // Get summary of results
  getSummary(): { total: number; passed: number; failed: number; warnings: number; passRate: number } {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === TestStatus.PASSED).length;
    const failed = this.results.filter(r => r.status === TestStatus.FAILED).length;
    const warnings = this.results.filter(r => r.status === TestStatus.WARNING).length;
    const passRate = total > 0 ? (passed / total) * 100 : 0;

    return { total, passed, failed, warnings, passRate };
  }

  // Get detailed results
  getResults(): TestResult[] {
    return this.results;
  }
}

// Export singleton instance
export const aiAgentScreenTester = new AIAgentScreenTester();

// Make available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).AIAgentScreenTester = aiAgentScreenTester;
}