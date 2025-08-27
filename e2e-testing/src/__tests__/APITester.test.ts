import { APITester, HTTPClient, ResponseValidator, APIEndpoints } from '../api';
import { APITestConfig, ValidationRule } from '../api/types';

describe('API Testing Infrastructure', () => {
  let apiTester: APITester;
  let config: APITestConfig;

  beforeEach(() => {
    config = {
      baseUrl: 'http://localhost:3001',
      timeout: 5000,
      retryAttempts: 2,
      defaultHeaders: {
        'Content-Type': 'application/json',
      },
    };
    apiTester = new APITester(config);
  });

  describe('HTTPClient', () => {
    it('should create HTTP client with correct configuration', () => {
      const httpClient = new HTTPClient(config);
      expect(httpClient).toBeDefined();
      expect(httpClient.getConfig()).toEqual(config);
    });

    it('should handle authentication configuration', () => {
      const authConfig = {
        ...config,
        authentication: {
          type: 'bearer' as const,
          token: 'test-token',
        },
      };
      const httpClient = new HTTPClient(authConfig);
      expect(httpClient).toBeDefined();
    });
  });

  describe('ResponseValidator', () => {
    it('should validate response exists rule', () => {
      const response = {
        status: 200,
        statusText: 'OK',
        headers: {},
        data: { ok: true, message: 'success' },
        responseTime: 100,
        timestamp: new Date().toISOString(),
      };

      const rules: ValidationRule[] = [
        { field: 'ok', type: 'exists' },
        { field: 'message', type: 'exists' },
      ];

      const results = ResponseValidator.validateResponse(response, rules);
      expect(results).toHaveLength(2);
      expect(results.every(r => r.passed)).toBe(true);
    });

    it('should validate response equals rule', () => {
      const response = {
        status: 200,
        statusText: 'OK',
        headers: {},
        data: { ok: true, status: 'success' },
        responseTime: 100,
        timestamp: new Date().toISOString(),
      };

      const rules: ValidationRule[] = [
        { field: 'ok', type: 'equals', value: true },
        { field: 'status', type: 'equals', value: 'success' },
      ];

      const results = ResponseValidator.validateResponse(response, rules);
      expect(results).toHaveLength(2);
      expect(results.every(r => r.passed)).toBe(true);
    });

    it('should handle nested field validation', () => {
      const response = {
        status: 200,
        statusText: 'OK',
        headers: {},
        data: { 
          ok: true, 
          data: { 
            user: { 
              id: 123, 
              name: 'Test User' 
            } 
          } 
        },
        responseTime: 100,
        timestamp: new Date().toISOString(),
      };

      const rules: ValidationRule[] = [
        { field: 'data.user.id', type: 'exists' },
        { field: 'data.user.name', type: 'equals', value: 'Test User' },
      ];

      const results = ResponseValidator.validateResponse(response, rules);
      expect(results).toHaveLength(2);
      expect(results.every(r => r.passed)).toBe(true);
    });

    it('should validate standard response structure', () => {
      const response = {
        status: 200,
        statusText: 'OK',
        headers: {},
        data: { ok: true, data: { message: 'success' } },
        responseTime: 100,
        timestamp: new Date().toISOString(),
      };

      const results = ResponseValidator.validateStandardResponse(response, true);
      expect(results.length).toBeGreaterThan(0);
      expect(ResponseValidator.allValidationsPassed(results)).toBe(true);
    });
  });

  describe('APIEndpoints', () => {
    it('should provide correct endpoint URLs', () => {
      const endpoints = new APIEndpoints();
      
      expect(endpoints.getEndpoint('transfers', 'list')).toBe('/api/transfers');
      expect(endpoints.getEndpoint('transfers', 'create')).toBe('/api/transfers');
      expect(endpoints.getEndpoint('groups', 'list')).toBe('/api/groups');
      expect(endpoints.getEndpoint('health', 'basic')).toBe('/api/health');
    });

    it('should handle parameter substitution', () => {
      const endpoints = new APIEndpoints();
      
      const url = endpoints.getEndpoint('transfers', 'get', { id: '123' });
      expect(url).toBe('/api/transfers/123');
      
      const walletUrl = endpoints.getEndpoint('health', 'wallet', { address: 'sei1test...' });
      expect(walletUrl).toBe('/api/health/wallet/sei1test...');
    });

    it('should provide predefined test cases', () => {
      const endpoints = new APIEndpoints();
      
      const transferTests = endpoints.getTransferTests();
      expect(transferTests.length).toBeGreaterThan(0);
      expect(transferTests[0]).toHaveProperty('name');
      expect(transferTests[0]).toHaveProperty('method');
      expect(transferTests[0]).toHaveProperty('path');
      
      const healthTests = endpoints.getHealthTests();
      expect(healthTests.length).toBeGreaterThan(0);
    });
  });

  describe('APITester', () => {
    it('should initialize with correct configuration', () => {
      expect(apiTester).toBeDefined();
      expect(apiTester.getConfig()).toEqual(config);
    });

    it('should update authentication token', () => {
      apiTester.updateAuthToken('new-token');
      // Should not throw error
      expect(apiTester).toBeDefined();
    });

    it('should update base URL', () => {
      const newUrl = 'http://localhost:3002';
      apiTester.updateBaseUrl(newUrl);
      expect(apiTester.getConfig().baseUrl).toBe(newUrl);
    });

    it('should generate test report', () => {
      const mockResults = [
        {
          endpoint: '/api/health',
          method: 'GET',
          success: true,
          response: {
            status: 200,
            statusText: 'OK',
            headers: {},
            data: { ok: true },
            responseTime: 100,
            timestamp: new Date().toISOString(),
          },
          validations: [],
          executionTime: 100,
          timestamp: new Date().toISOString(),
        },
        {
          endpoint: '/api/transfers',
          method: 'POST',
          success: false,
          error: {
            type: 'validation' as const,
            message: 'Invalid data',
            retryable: false,
          },
          validations: [],
          executionTime: 200,
          timestamp: new Date().toISOString(),
        },
      ];

      const report = apiTester.generateReport(mockResults);
      expect(report).toContain('API Test Report');
      expect(report).toContain('Total Tests: 2');
      expect(report).toContain('Passed: 1');
      expect(report).toContain('Failed: 1');
      expect(report).toContain('Success Rate: 50.00%');
    });
  });
});