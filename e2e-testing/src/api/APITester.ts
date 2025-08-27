import { HTTPClient } from './HTTPClient';
import { ResponseValidator } from './ResponseValidator';
import { APIEndpoints } from './APIEndpoints';
import {
  APITestConfig,
  APITestResult,
  APIResponse,
  EndpointTest,
  TransferData,
  GroupData,
  PotData,
  VaultData,

} from './types';
import { getLogger } from '../utils/logger';

export class APITester {
  private httpClient: HTTPClient;
  private endpoints: APIEndpoints;
  private config: APITestConfig;
  private logger = getLogger();

  constructor(config: APITestConfig) {
    this.config = config;
    this.httpClient = new HTTPClient(config);
    this.endpoints = new APIEndpoints();
  }

  /**
   * Test a single endpoint
   */
  async testEndpoint(test: EndpointTest): Promise<APITestResult> {
    const startTime = Date.now();
    this.logger.info(`Testing endpoint: ${test.method} ${test.path}`);

    try {
      let response: APIResponse;

      // Make the API call based on method
      switch (test.method) {
        case 'GET':
          response = await this.httpClient.get(test.path, test.queryParams, {
            ...(test.headers && { headers: test.headers }),
            ...(test.timeout && { timeout: test.timeout }),
          });
          break;
        case 'POST':
          response = await this.httpClient.post(test.path, test.body, test.queryParams, {
            ...(test.headers && { headers: test.headers }),
            ...(test.timeout && { timeout: test.timeout }),
          });
          break;
        case 'PUT':
          response = await this.httpClient.put(test.path, test.body, test.queryParams, {
            ...(test.headers && { headers: test.headers }),
            ...(test.timeout && { timeout: test.timeout }),
          });
          break;
        case 'DELETE':
          response = await this.httpClient.delete(test.path, test.queryParams, {
            ...(test.headers && { headers: test.headers }),
            ...(test.timeout && { timeout: test.timeout }),
          });
          break;
        case 'PATCH':
          response = await this.httpClient.patch(test.path, test.body, test.queryParams, {
            ...(test.headers && { headers: test.headers }),
            ...(test.timeout && { timeout: test.timeout }),
          });
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${test.method}`);
      }

      // Check expected status code
      const statusMatches = !test.expectedStatus || response.status === test.expectedStatus;
      if (!statusMatches) {
        this.logger.warn(`Status code mismatch: expected ${test.expectedStatus}, got ${response.status}`);
      }

      // Run validations
      const validations = test.validations 
        ? ResponseValidator.validateResponse(response, test.validations)
        : [];

      const success = statusMatches && ResponseValidator.allValidationsPassed(validations);

      const result: APITestResult = {
        endpoint: test.path,
        method: test.method,
        success,
        response,
        validations,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };

      if (success) {
        this.logger.info(`✅ Test passed: ${test.name}`);
      } else {
        this.logger.error(`❌ Test failed: ${test.name}`);
        this.logger.error(ResponseValidator.formatValidationResults(validations));
      }

      return result;
    } catch (error: any) {
      const result: APITestResult = {
        endpoint: test.path,
        method: test.method,
        success: false,
        error: error,
        validations: [],
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };

      this.logger.error(`❌ Test failed with error: ${test.name}`, error);
      return result;
    }
  }

  /**
   * Test multiple endpoints
   */
  async testEndpoints(tests: EndpointTest[]): Promise<APITestResult[]> {
    const results: APITestResult[] = [];
    
    for (const test of tests) {
      const result = await this.testEndpoint(test);
      results.push(result);
      
      // Add delay between tests to avoid overwhelming the server
      await this.sleep(100);
    }

    return results;
  }

  /**
   * Test health endpoints
   */
  async testHealth(): Promise<APITestResult[]> {
    this.logger.info('🏥 Testing health endpoints...');
    const tests = this.endpoints.getHealthTests();
    return this.testEndpoints(tests);
  }

  /**
   * Test transfers functionality
   */
  async testTransfers(testData?: Partial<TransferData>): Promise<APITestResult[]> {
    this.logger.info('💸 Testing transfers functionality...');
    
    const tests = this.endpoints.getTransferTests();
    
    // Update test data if provided
    if (testData) {
      tests.forEach(test => {
        if (test.method === 'POST' && test.body) {
          test.body = { ...test.body, ...testData };
        }
      });
    }

    return this.testEndpoints(tests);
  }

  /**
   * Test groups functionality
   */
  async testGroups(testData?: Partial<GroupData>): Promise<APITestResult[]> {
    this.logger.info('👥 Testing groups functionality...');
    
    const tests = this.endpoints.getGroupTests();
    
    // Update test data if provided
    if (testData) {
      tests.forEach(test => {
        if (test.method === 'POST' && test.body) {
          test.body = { ...test.body, ...testData };
        }
      });
    }

    return this.testEndpoints(tests);
  }

  /**
   * Test pots functionality
   */
  async testPots(testData?: Partial<PotData>): Promise<APITestResult[]> {
    this.logger.info('🏺 Testing pots functionality...');
    
    const tests = this.endpoints.getPotTests();
    
    // Update test data if provided
    if (testData) {
      tests.forEach(test => {
        if (test.method === 'POST' && test.body) {
          test.body = { ...test.body, ...testData };
        }
      });
    }

    return this.testEndpoints(tests);
  }

  /**
   * Test vaults functionality
   */
  async testVaults(testData?: Partial<VaultData>): Promise<APITestResult[]> {
    this.logger.info('🏦 Testing vaults functionality...');
    
    const tests = this.endpoints.getVaultTests();
    
    // Update test data if provided
    if (testData) {
      tests.forEach(test => {
        if (test.method === 'POST' && test.body) {
          test.body = { ...test.body, ...testData };
        }
      });
    }

    return this.testEndpoints(tests);
  }

  /**
   * Test user endpoints
   */
  async testUser(): Promise<APITestResult[]> {
    this.logger.info('👤 Testing user endpoints...');
    const tests = this.endpoints.getUserTests();
    return this.testEndpoints(tests);
  }

  /**
   * Run comprehensive API test suite
   */
  async runFullTestSuite(): Promise<{
    results: APITestResult[];
    summary: {
      total: number;
      passed: number;
      failed: number;
      successRate: number;
      totalTime: number;
    };
  }> {
    this.logger.info('🚀 Starting comprehensive API test suite...');
    const startTime = Date.now();
    
    const allResults: APITestResult[] = [];

    try {
      // Test in order of dependency
      const healthResults = await this.testHealth();
      allResults.push(...healthResults);

      const userResults = await this.testUser();
      allResults.push(...userResults);

      const transferResults = await this.testTransfers();
      allResults.push(...transferResults);

      const groupResults = await this.testGroups();
      allResults.push(...groupResults);

      const potResults = await this.testPots();
      allResults.push(...potResults);

      const vaultResults = await this.testVaults();
      allResults.push(...vaultResults);

    } catch (error) {
      this.logger.error('Test suite execution failed:', error);
    }

    const totalTime = Date.now() - startTime;
    const passed = allResults.filter(r => r.success).length;
    const failed = allResults.length - passed;
    const successRate = allResults.length > 0 ? (passed / allResults.length) * 100 : 0;

    const summary = {
      total: allResults.length,
      passed,
      failed,
      successRate: Math.round(successRate * 100) / 100,
      totalTime,
    };

    this.logger.info(`📊 Test Suite Summary:
      Total Tests: ${summary.total}
      Passed: ${summary.passed}
      Failed: ${summary.failed}
      Success Rate: ${summary.successRate}%
      Total Time: ${summary.totalTime}ms
    `);

    return { results: allResults, summary };
  }

  /**
   * Create a transfer using real API
   */
  async createTransfer(transferData: TransferData): Promise<APITestResult> {
    const test: EndpointTest = {
      name: 'Create Real Transfer',
      method: 'POST',
      path: this.endpoints.getEndpoint('transfers', 'create'),
      body: transferData,
      expectedStatus: 200,
      validations: [
        { field: 'ok', type: 'equals', value: true },
        { field: 'data.transferId', type: 'exists' },
        { field: 'data.txHash', type: 'exists' },
        { field: 'data.status', type: 'equals', value: 'pending' },
        { field: 'data.recipient', type: 'equals', value: transferData.recipient },
        { field: 'data.amount', type: 'equals', value: transferData.amount },
      ],
    };

    return this.testEndpoint(test);
  }

  /**
   * Get transfers list using real API
   */
  async getTransfers(address?: string): Promise<APITestResult> {
    const test: EndpointTest = {
      name: 'Get Transfers List',
      method: 'GET',
      path: this.endpoints.getEndpoint('transfers', 'list'),
      ...(address && { queryParams: { address } }),
      expectedStatus: 200,
      validations: [
        { field: 'ok', type: 'equals', value: true },
        { field: 'data', type: 'exists' },
        { field: 'data.transfers', type: 'exists' },
        { field: 'data.pagination', type: 'exists' },
      ],
    };

    return this.testEndpoint(test);
  }

  /**
   * Create a group using real API
   */
  async createGroup(groupData: GroupData): Promise<APITestResult> {
    const test: EndpointTest = {
      name: 'Create Real Group',
      method: 'POST',
      path: this.endpoints.getEndpoint('groups', 'create'),
      body: groupData,
      expectedStatus: 200,
      validations: [
        { field: 'ok', type: 'equals', value: true },
        { field: 'data.id', type: 'exists' },
        { field: 'data.name', type: 'equals', value: groupData.name },
        { field: 'data.type', type: 'equals', value: groupData.type },
      ],
    };

    return this.testEndpoint(test);
  }

  /**
   * Create a pot using real API
   */
  async createPot(potData: PotData): Promise<APITestResult> {
    const test: EndpointTest = {
      name: 'Create Real Pot',
      method: 'POST',
      path: this.endpoints.getEndpoint('pots', 'create'),
      body: potData,
      expectedStatus: 200,
      validations: [
        { field: 'ok', type: 'equals', value: true },
        { field: 'data.id', type: 'exists' },
        { field: 'data.name', type: 'equals', value: potData.name },
        { field: 'data.targetAmount', type: 'equals', value: potData.targetAmount },
      ],
    };

    return this.testEndpoint(test);
  }

  /**
   * Create a vault using real API
   */
  async createVault(vaultData: VaultData): Promise<APITestResult> {
    const test: EndpointTest = {
      name: 'Create Real Vault',
      method: 'POST',
      path: this.endpoints.getEndpoint('vaults', 'create'),
      body: vaultData,
      expectedStatus: 200,
      validations: [
        { field: 'ok', type: 'equals', value: true },
        { field: 'data.id', type: 'exists' },
        { field: 'data.name', type: 'equals', value: vaultData.name },
        { field: 'data.strategy', type: 'equals', value: vaultData.strategy },
      ],
    };

    return this.testEndpoint(test);
  }

  /**
   * Update authentication token
   */
  updateAuthToken(token: string): void {
    this.httpClient.updateAuthToken(token);
  }

  /**
   * Update base URL
   */
  updateBaseUrl(baseUrl: string): void {
    this.httpClient.updateBaseUrl(baseUrl);
    this.config.baseUrl = baseUrl;
  }

  /**
   * Get current configuration
   */
  getConfig(): APITestConfig {
    return { ...this.config };
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate test report
   */
  generateReport(results: APITestResult[]): string {
    const passed = results.filter(r => r.success).length;
    const failed = results.length - passed;
    const successRate = results.length > 0 ? (passed / results.length) * 100 : 0;
    const totalTime = results.reduce((sum, r) => sum + r.executionTime, 0);

    let report = `
# API Test Report
Generated: ${new Date().toISOString()}

## Summary
- Total Tests: ${results.length}
- Passed: ${passed}
- Failed: ${failed}
- Success Rate: ${successRate.toFixed(2)}%
- Total Execution Time: ${totalTime}ms

## Test Results
`;

    results.forEach((result, index) => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      report += `
### ${index + 1}. ${result.method} ${result.endpoint}
- Status: ${status}
- Response Time: ${result.executionTime}ms
- HTTP Status: ${result.response?.status || 'N/A'}
`;

      if (!result.success) {
        if (result.error) {
          report += `- Error: ${result.error.message}\n`;
        }
        
        const failedValidations = ResponseValidator.getFailedValidations(result.validations);
        if (failedValidations.length > 0) {
          report += `- Failed Validations:\n`;
          failedValidations.forEach(v => {
            report += `  - ${v.field} (${v.rule}): ${v.message}\n`;
          });
        }
      }
    });

    return report;
  }
}