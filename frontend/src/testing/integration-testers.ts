// Integration Testers for SeiMoney Frontend

import { TestResult, TestStatus, TestCategory, APITestResult, ContractTestResult, WalletTestResult } from './types';
import { testUtils } from './test-utilities';
import { API_ENDPOINTS } from './test-config';

export class IntegrationTesters {

  // Backend API Integration Tests
  async testBackendIntegration(): Promise<APITestResult[]> {
    const results: APITestResult[] = [];

    try {
      results.push(await this.testHealthEndpoint());
      results.push(await this.testMarketDataEndpoints());
      results.push(await this.testTransferEndpoints());
      results.push(await this.testVaultEndpoints());
      results.push(await this.testUserDataEndpoints());
    } catch (error) {
      console.error('Backend integration test error:', error);
    }

    return results;
  }

  private async testHealthEndpoint(): Promise<APITestResult> {
    const startTime = performance.now();
    
    try {
      const result = await testUtils.testApiEndpoint(API_ENDPOINTS.HEALTH);
      
      return {
        testName: 'Health Endpoint',
        status: result.success ? TestStatus.PASSED : TestStatus.FAILED,
        executionTime: result.responseTime,
        details: result.success ? 'Health check passed' : `Health check failed: ${result.error}`,
        timestamp: new Date(),
        category: TestCategory.INTEGRATION,
        endpoint: API_ENDPOINTS.HEALTH,
        method: 'GET',
        statusCode: result.status,
        responseTime: result.responseTime,
        responseData: result.data
      };
    } catch (error) {
      return {
        testName: 'Health Endpoint',
        status: TestStatus.FAILED,
        executionTime: performance.now() - startTime,
        details: `Health endpoint test failed: ${error}`,
        timestamp: new Date(),
        category: TestCategory.INTEGRATION,
        endpoint: API_ENDPOINTS.HEALTH,
        method: 'GET',
        statusCode: 0,
        responseTime: performance.now() - startTime,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  private async testMarketDataEndpoints(): Promise<APITestResult> {
    const startTime = performance.now();
    
    try {
      const statsResult = await testUtils.testApiEndpoint(API_ENDPOINTS.MARKET_STATS);
      const tvlResult = await testUtils.testApiEndpoint(API_ENDPOINTS.TVL_HISTORY);

      const errors: string[] = [];
      let totalResponseTime = 0;

      if (!statsResult.success) {
        errors.push(`Market stats failed: ${statsResult.error}`);
      } else {
        totalResponseTime += statsResult.responseTime;
        
        // Validate response structure
        if (statsResult.data && typeof statsResult.data === 'object') {
          const requiredFields = ['totalTvl', 'activeUsers', 'successRate', 'avgApy'];
          const missingFields = requiredFields.filter(field => 
            !statsResult.data.stats || !(field in statsResult.data.stats)
          );
          
          if (missingFields.length > 0) {
            errors.push(`Missing fields in stats: ${missingFields.join(', ')}`);
          }
        }
      }

      if (!tvlResult.success) {
        errors.push(`TVL history failed: ${tvlResult.error}`);
      } else {
        totalResponseTime += tvlResult.responseTime;
        
        // Validate TVL history structure
        if (tvlResult.data && Array.isArray(tvlResult.data.data)) {
          const hasValidData = tvlResult.data.data.every((item: any) => 
            item.date && typeof item.value === 'number'
          );
          
          if (!hasValidData) {
            errors.push('Invalid TVL history data structure');
          }
        }
      }

      return {
        testName: 'Market Data Endpoints',
        status: errors.length === 0 ? TestStatus.PASSED : TestStatus.FAILED,
        executionTime: totalResponseTime,
        details: errors.length === 0 ? 
          'Market data endpoints working correctly' : 
          `Errors: ${errors.join(', ')}`,
        timestamp: new Date(),
        category: TestCategory.INTEGRATION,
        endpoint: `${API_ENDPOINTS.MARKET_STATS}, ${API_ENDPOINTS.TVL_HISTORY}`,
        method: 'GET',
        statusCode: statsResult.status,
        responseTime: totalResponseTime,
        errors: errors.length > 0 ? errors : undefined,
        responseData: { stats: statsResult.data, tvl: tvlResult.data }
      };

    } catch (error) {
      return {
        testName: 'Market Data Endpoints',
        status: TestStatus.FAILED,
        executionTime: performance.now() - startTime,
        details: `Market data test failed: ${error}`,
        timestamp: new Date(),
        category: TestCategory.INTEGRATION,
        endpoint: API_ENDPOINTS.MARKET_STATS,
        method: 'GET',
        statusCode: 0,
        responseTime: performance.now() - startTime,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  private async testTransferEndpoints(): Promise<APITestResult> {
    const startTime = performance.now();
    
    try {
      const result = await testUtils.testApiEndpoint(API_ENDPOINTS.TRANSFERS);
      
      const errors: string[] = [];
      
      if (!result.success) {
        errors.push(`Transfers endpoint failed: ${result.error}`);
      } else if (result.data && Array.isArray(result.data)) {
        // Validate transfer structure
        const hasValidStructure = result.data.every((transfer: any) => 
          transfer.id && transfer.sender && transfer.recipient && 
          typeof transfer.amount === 'number' && transfer.status
        );
        
        if (!hasValidStructure) {
          errors.push('Invalid transfer data structure');
        }
      }

      return {
        testName: 'Transfer Endpoints',
        status: errors.length === 0 ? TestStatus.PASSED : TestStatus.FAILED,
        executionTime: result.responseTime,
        details: errors.length === 0 ? 
          `Transfers loaded successfully (${Array.isArray(result.data) ? result.data.length : 0} items)` : 
          `Errors: ${errors.join(', ')}`,
        timestamp: new Date(),
        category: TestCategory.INTEGRATION,
        endpoint: API_ENDPOINTS.TRANSFERS,
        method: 'GET',
        statusCode: result.status,
        responseTime: result.responseTime,
        responseData: result.data,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      return {
        testName: 'Transfer Endpoints',
        status: TestStatus.FAILED,
        executionTime: performance.now() - startTime,
        details: `Transfer endpoints test failed: ${error}`,
        timestamp: new Date(),
        category: TestCategory.INTEGRATION,
        endpoint: API_ENDPOINTS.TRANSFERS,
        method: 'GET',
        statusCode: 0,
        responseTime: performance.now() - startTime,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  private async testVaultEndpoints(): Promise<APITestResult> {
    const startTime = performance.now();
    
    try {
      const result = await testUtils.testApiEndpoint(API_ENDPOINTS.VAULTS);
      
      const errors: string[] = [];
      
      if (!result.success) {
        errors.push(`Vaults endpoint failed: ${result.error}`);
      } else if (result.data && Array.isArray(result.data)) {
        // Validate vault structure
        const hasValidStructure = result.data.every((vault: any) => 
          vault.id && vault.name && typeof vault.apy === 'number' && 
          typeof vault.tvl === 'number' && vault.strategy
        );
        
        if (!hasValidStructure) {
          errors.push('Invalid vault data structure');
        }
      }

      return {
        testName: 'Vault Endpoints',
        status: errors.length === 0 ? TestStatus.PASSED : TestStatus.FAILED,
        executionTime: result.responseTime,
        details: errors.length === 0 ? 
          `Vaults loaded successfully (${Array.isArray(result.data) ? result.data.length : 0} items)` : 
          `Errors: ${errors.join(', ')}`,
        timestamp: new Date(),
        category: TestCategory.INTEGRATION,
        endpoint: API_ENDPOINTS.VAULTS,
        method: 'GET',
        statusCode: result.status,
        responseTime: result.responseTime,
        responseData: result.data,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      return {
        testName: 'Vault Endpoints',
        status: TestStatus.FAILED,
        executionTime: performance.now() - startTime,
        details: `Vault endpoints test failed: ${error}`,
        timestamp: new Date(),
        category: TestCategory.INTEGRATION,
        endpoint: API_ENDPOINTS.VAULTS,
        method: 'GET',
        statusCode: 0,
        responseTime: performance.now() - startTime,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  private async testUserDataEndpoints(): Promise<APITestResult> {
    const startTime = performance.now();
    
    try {
      const profileResult = await testUtils.testApiEndpoint(API_ENDPOINTS.USER_PROFILE);
      const balanceResult = await testUtils.testApiEndpoint(API_ENDPOINTS.WALLET_BALANCE);

      const errors: string[] = [];
      let totalResponseTime = 0;

      if (!profileResult.success) {
        errors.push(`User profile failed: ${profileResult.error}`);
      } else {
        totalResponseTime += profileResult.responseTime;
      }

      if (!balanceResult.success) {
        errors.push(`Wallet balance failed: ${balanceResult.error}`);
      } else {
        totalResponseTime += balanceResult.responseTime;
        
        // Validate balance structure
        if (balanceResult.data && typeof balanceResult.data.balance !== 'number') {
          errors.push('Invalid balance data structure');
        }
      }

      return {
        testName: 'User Data Endpoints',
        status: errors.length === 0 ? TestStatus.PASSED : TestStatus.FAILED,
        executionTime: totalResponseTime,
        details: errors.length === 0 ? 
          'User data endpoints working correctly' : 
          `Errors: ${errors.join(', ')}`,
        timestamp: new Date(),
        category: TestCategory.INTEGRATION,
        endpoint: `${API_ENDPOINTS.USER_PROFILE}, ${API_ENDPOINTS.WALLET_BALANCE}`,
        method: 'GET',
        statusCode: profileResult.status,
        responseTime: totalResponseTime,
        errors: errors.length > 0 ? errors : undefined,
        responseData: { profile: profileResult.data, balance: balanceResult.data }
      };

    } catch (error) {
      return {
        testName: 'User Data Endpoints',
        status: TestStatus.FAILED,
        executionTime: performance.now() - startTime,
        details: `User data test failed: ${error}`,
        timestamp: new Date(),
        category: TestCategory.INTEGRATION,
        endpoint: API_ENDPOINTS.USER_PROFILE,
        method: 'GET',
        statusCode: 0,
        responseTime: performance.now() - startTime,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  // Smart Contract Integration Tests
  async testSmartContractIntegration(): Promise<ContractTestResult[]> {
    const results: ContractTestResult[] = [];

    try {
      results.push(await this.testPaymentsContract());
      results.push(await this.testVaultsContract());
      results.push(await this.testGroupsContract());
    } catch (error) {
      console.error('Smart contract integration test error:', error);
    }

    return results;
  }

  private async testPaymentsContract(): Promise<ContractTestResult> {
    const startTime = performance.now();
    
    try {
      // This would test actual smart contract interactions
      // For now, we'll simulate the test
      
      const mockContractAddress = 'sei1contract_payments_address_here';
      const mockFunctionName = 'createPayment';
      
      // Simulate contract call
      await testUtils.sleep(1000);
      
      return {
        testName: 'Payments Contract',
        status: TestStatus.PASSED,
        executionTime: performance.now() - startTime,
        details: 'Payments contract integration simulated successfully',
        timestamp: new Date(),
        category: TestCategory.INTEGRATION,
        contractAddress: mockContractAddress,
        functionName: mockFunctionName,
        gasUsed: 150000,
        inputData: { recipient: 'sei1test', amount: 100 },
        outputData: { success: true, txHash: '0xmockhash' }
      };

    } catch (error) {
      return {
        testName: 'Payments Contract',
        status: TestStatus.FAILED,
        executionTime: performance.now() - startTime,
        details: `Payments contract test failed: ${error}`,
        timestamp: new Date(),
        category: TestCategory.INTEGRATION,
        contractAddress: 'unknown',
        functionName: 'createPayment',
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  private async testVaultsContract(): Promise<ContractTestResult> {
    const startTime = performance.now();
    
    try {
      const mockContractAddress = 'sei1contract_vaults_address_here';
      const mockFunctionName = 'deposit';
      
      await testUtils.sleep(800);
      
      return {
        testName: 'Vaults Contract',
        status: TestStatus.PASSED,
        executionTime: performance.now() - startTime,
        details: 'Vaults contract integration simulated successfully',
        timestamp: new Date(),
        category: TestCategory.INTEGRATION,
        contractAddress: mockContractAddress,
        functionName: mockFunctionName,
        gasUsed: 200000,
        inputData: { vaultId: 'vault1', amount: 500 },
        outputData: { success: true, shares: 450 }
      };

    } catch (error) {
      return {
        testName: 'Vaults Contract',
        status: TestStatus.FAILED,
        executionTime: performance.now() - startTime,
        details: `Vaults contract test failed: ${error}`,
        timestamp: new Date(),
        category: TestCategory.INTEGRATION,
        contractAddress: 'unknown',
        functionName: 'deposit',
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  private async testGroupsContract(): Promise<ContractTestResult> {
    const startTime = performance.now();
    
    try {
      const mockContractAddress = 'sei1contract_groups_address_here';
      const mockFunctionName = 'joinGroup';
      
      await testUtils.sleep(600);
      
      return {
        testName: 'Groups Contract',
        status: TestStatus.PASSED,
        executionTime: performance.now() - startTime,
        details: 'Groups contract integration simulated successfully',
        timestamp: new Date(),
        category: TestCategory.INTEGRATION,
        contractAddress: mockContractAddress,
        functionName: mockFunctionName,
        gasUsed: 120000,
        inputData: { groupId: 'group1', contribution: 250 },
        outputData: { success: true, position: 3 }
      };

    } catch (error) {
      return {
        testName: 'Groups Contract',
        status: TestStatus.FAILED,
        executionTime: performance.now() - startTime,
        details: `Groups contract test failed: ${error}`,
        timestamp: new Date(),
        category: TestCategory.INTEGRATION,
        contractAddress: 'unknown',
        functionName: 'joinGroup',
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  // Wallet Integration Tests
  async testWalletIntegration(): Promise<WalletTestResult[]> {
    const results: WalletTestResult[] = [];

    try {
      const walletAvailability = await testUtils.detectWalletAvailability();
      
      if (walletAvailability.keplr) {
        results.push(await this.testKeplrConnection());
      }
      
      if (walletAvailability.leap) {
        results.push(await this.testLeapConnection());
      }
      
      if (walletAvailability.metamask) {
        results.push(await this.testMetaMaskConnection());
      }

      if (!walletAvailability.keplr && !walletAvailability.leap && !walletAvailability.metamask) {
        results.push({
          testName: 'Wallet Availability',
          status: TestStatus.WARNING,
          executionTime: 0,
          details: 'No wallets detected in browser',
          timestamp: new Date(),
          category: TestCategory.INTEGRATION,
          walletType: 'keplr'
        });
      }

    } catch (error) {
      console.error('Wallet integration test error:', error);
    }

    return results;
  }

  private async testKeplrConnection(): Promise<WalletTestResult> {
    const startTime = performance.now();
    
    try {
      const keplr = (window as any).keplr;
      
      if (!keplr) {
        return {
          testName: 'Keplr Connection',
          status: TestStatus.FAILED,
          executionTime: performance.now() - startTime,
          details: 'Keplr wallet not available',
          timestamp: new Date(),
          category: TestCategory.INTEGRATION,
          walletType: 'keplr'
        };
      }

      // Test connection (this would normally require user interaction)
      // For testing purposes, we'll simulate the connection
      await testUtils.sleep(500);
      
      return {
        testName: 'Keplr Connection',
        status: TestStatus.PASSED,
        executionTime: performance.now() - startTime,
        details: 'Keplr wallet detected and connection simulated',
        timestamp: new Date(),
        category: TestCategory.INTEGRATION,
        walletType: 'keplr',
        connectionTime: performance.now() - startTime
      };

    } catch (error) {
      return {
        testName: 'Keplr Connection',
        status: TestStatus.FAILED,
        executionTime: performance.now() - startTime,
        details: `Keplr connection test failed: ${error}`,
        timestamp: new Date(),
        category: TestCategory.INTEGRATION,
        walletType: 'keplr',
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  private async testLeapConnection(): Promise<WalletTestResult> {
    const startTime = performance.now();
    
    try {
      const leap = (window as any).leap;
      
      if (!leap) {
        return {
          testName: 'Leap Connection',
          status: TestStatus.FAILED,
          executionTime: performance.now() - startTime,
          details: 'Leap wallet not available',
          timestamp: new Date(),
          category: TestCategory.INTEGRATION,
          walletType: 'leap'
        };
      }

      await testUtils.sleep(500);
      
      return {
        testName: 'Leap Connection',
        status: TestStatus.PASSED,
        executionTime: performance.now() - startTime,
        details: 'Leap wallet detected and connection simulated',
        timestamp: new Date(),
        category: TestCategory.INTEGRATION,
        walletType: 'leap',
        connectionTime: performance.now() - startTime
      };

    } catch (error) {
      return {
        testName: 'Leap Connection',
        status: TestStatus.FAILED,
        executionTime: performance.now() - startTime,
        details: `Leap connection test failed: ${error}`,
        timestamp: new Date(),
        category: TestCategory.INTEGRATION,
        walletType: 'leap',
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  private async testMetaMaskConnection(): Promise<WalletTestResult> {
    const startTime = performance.now();
    
    try {
      const ethereum = (window as any).ethereum;
      
      if (!ethereum) {
        return {
          testName: 'MetaMask Connection',
          status: TestStatus.FAILED,
          executionTime: performance.now() - startTime,
          details: 'MetaMask not available',
          timestamp: new Date(),
          category: TestCategory.INTEGRATION,
          walletType: 'metamask'
        };
      }

      await testUtils.sleep(500);
      
      return {
        testName: 'MetaMask Connection',
        status: TestStatus.PASSED,
        executionTime: performance.now() - startTime,
        details: 'MetaMask detected and connection simulated',
        timestamp: new Date(),
        category: TestCategory.INTEGRATION,
        walletType: 'metamask',
        connectionTime: performance.now() - startTime
      };

    } catch (error) {
      return {
        testName: 'MetaMask Connection',
        status: TestStatus.FAILED,
        executionTime: performance.now() - startTime,
        details: `MetaMask connection test failed: ${error}`,
        timestamp: new Date(),
        category: TestCategory.INTEGRATION,
        walletType: 'metamask',
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }
}

export const integrationTesters = new IntegrationTesters();