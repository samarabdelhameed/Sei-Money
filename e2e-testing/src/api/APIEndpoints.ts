import { APIEndpointConfig, EndpointTest } from './types';

export class APIEndpoints {
  private config: APIEndpointConfig;

  constructor() {
    this.config = {
      transfers: {
        list: '/api/v1/transfers',
        create: '/api/v1/transfers',
        get: '/api/v1/transfers/{id}',
        claim: '/api/v1/transfers/{id}/claim',
        refund: '/api/v1/transfers/{id}/refund',
      },
      groups: {
        list: '/api/v1/groups',
        create: '/api/v1/groups',
        get: '/api/v1/groups/{id}',
        contribute: '/api/v1/groups/{id}/contribute',
        distribute: '/api/v1/groups/{id}/distribute',
        refund: '/api/v1/groups/{id}/refund',
      },
      pots: {
        list: '/api/v1/pots',
        create: '/api/v1/pots',
        get: '/api/v1/pots/{id}',
        deposit: '/api/v1/pots/{id}/deposit',
        break: '/api/v1/pots/{id}/break',
        close: '/api/v1/pots/{id}/close',
      },
      vaults: {
        list: '/api/v1/vaults',
        create: '/api/v1/vaults',
        get: '/api/v1/vaults/{id}',
        deposit: '/api/v1/vaults/{id}/deposit',
        withdraw: '/api/v1/vaults/{id}/withdraw',
        position: '/api/v1/vaults/{id}/position',
        harvest: '/api/v1/vaults/{id}/harvest',
      },
      health: {
        basic: '/health',
        contracts: '/health/contracts',
        wallet: '/health/wallet/{address}',
        network: '/health/network',
        dataService: '/health/data-service',
        marketStats: '/api/v1/market/stats',
      },
      user: {
        profile: '/api/v1/user/profile',
        balance: '/api/v1/user/balance',
        transactions: '/api/v1/user/transactions',
        activity: '/api/v1/user/activity',
      },
      realtime: {
        status: '/api/v1/realtime/status',
        health: '/api/v1/realtime/health',
        start: '/api/v1/realtime/start',
        stop: '/api/v1/realtime/stop',
        refresh: '/api/v1/realtime/refresh',
        events: '/api/v1/realtime/events',
      },
    };
  }

  /**
   * Get endpoint URL with parameter substitution
   */
  getEndpoint(category: keyof APIEndpointConfig, endpoint: string, params?: Record<string, string>): string {
    const categoryConfig = this.config[category] as any;
    if (!categoryConfig || !categoryConfig[endpoint]) {
      throw new Error(`Endpoint not found: ${category}.${endpoint}`);
    }

    let url = categoryConfig[endpoint];
    
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url = url.replace(`{${key}}`, value);
      }
    }

    return url;
  }

  /**
   * Get predefined test cases for transfers
   */
  getTransferTests(): EndpointTest[] {
    return [
      {
        name: 'List Transfers',
        method: 'GET',
        path: this.config.transfers.list,
        queryParams: { address: 'sei1test123456789abcdef' },
        expectedStatus: 200,
        validations: [
          { field: 'ok', type: 'exists' },
          { field: 'data', type: 'exists' },
        ],
      },
      {
        name: 'Create Transfer',
        method: 'POST',
        path: this.config.transfers.create,
        body: {
          recipient: 'sei1test123456789abcdef',
          amount: '1000000',
          remark: 'Test transfer',
        },
        expectedStatus: 200,
        validations: [
          { field: 'ok', type: 'exists' },
        ],
      },
    ];
  }

  /**
   * Get predefined test cases for groups
   */
  getGroupTests(): EndpointTest[] {
    return [
      {
        name: 'List Groups',
        method: 'GET',
        path: this.config.groups.list,
        queryParams: { address: 'sei1test123456789abcdef' },
        expectedStatus: 200,
        validations: [
          { field: 'ok', type: 'exists' },
          { field: 'data', type: 'exists' },
        ],
      },
      {
        name: 'Create Group',
        method: 'POST',
        path: this.config.groups.create,
        body: {
          name: 'Test Group',
          description: 'A test group for API testing',
          targetAmount: 5000000,
          type: 'savings',
        },
        expectedStatus: 200,
        validations: [
          { field: 'ok', type: 'exists' },
        ],
      },
    ];
  }

  /**
   * Get predefined test cases for pots
   */
  getPotTests(): EndpointTest[] {
    return [
      {
        name: 'List Pots',
        method: 'GET',
        path: this.config.pots.list,
        queryParams: { address: 'sei1test123456789abcdef' },
        expectedStatus: 200,
        validations: [
          { field: 'ok', type: 'exists' },
          { field: 'data', type: 'exists' },
        ],
      },
      {
        name: 'Create Pot',
        method: 'POST',
        path: this.config.pots.create,
        body: {
          name: 'Test Savings Pot',
          targetAmount: 10000000,
          targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'A test savings pot',
        },
        expectedStatus: 200,
        validations: [
          { field: 'ok', type: 'exists' },
        ],
      },
    ];
  }

  /**
   * Get predefined test cases for vaults
   */
  getVaultTests(): EndpointTest[] {
    return [
      {
        name: 'List Vaults',
        method: 'GET',
        path: this.config.vaults.list,
        queryParams: { address: 'sei1test123456789abcdef' },
        expectedStatus: 200,
        validations: [
          { field: 'ok', type: 'exists' },
          { field: 'data', type: 'exists' },
        ],
      },
      {
        name: 'Create Vault',
        method: 'POST',
        path: this.config.vaults.create,
        body: {
          name: 'Test Yield Vault',
          strategy: 'yield-farming',
          initialDeposit: 5000000,
          lockPeriod: 30,
        },
        expectedStatus: 200,
        validations: [
          { field: 'ok', type: 'exists' },
        ],
      },
    ];
  }

  /**
   * Get predefined test cases for health endpoints
   */
  getHealthTests(): EndpointTest[] {
    return [
      {
        name: 'Market Stats Health Check',
        method: 'GET',
        path: this.config.health.marketStats,
        expectedStatus: 200,
        validations: [
          { field: 'ok', type: 'equals', value: true },
          { field: 'stats', type: 'exists' },
          { field: 'stats.totalTvl', type: 'exists' },
          { field: 'stats.activeUsers', type: 'exists' },
          { field: 'timestamp', type: 'exists' },
        ],
      },
    ];
  }

  /**
   * Get predefined test cases for user endpoints
   */
  getUserTests(): EndpointTest[] {
    return [
      {
        name: 'Get User Balance',
        method: 'GET',
        path: this.config.user.balance,
        queryParams: { address: 'sei1test123456789abcdef' },
        expectedStatus: 200,
        validations: [
          { field: 'ok', type: 'exists' },
          { field: 'data', type: 'exists' },
        ],
      },
    ];
  }

  /**
   * Get all predefined tests
   */
  getAllTests(): EndpointTest[] {
    return [
      ...this.getHealthTests(),
      ...this.getUserTests(),
      ...this.getTransferTests(),
      ...this.getGroupTests(),
      ...this.getPotTests(),
      ...this.getVaultTests(),
    ];
  }

  /**
   * Get tests by category
   */
  getTestsByCategory(category: string): EndpointTest[] {
    switch (category.toLowerCase()) {
      case 'transfers':
        return this.getTransferTests();
      case 'groups':
        return this.getGroupTests();
      case 'pots':
        return this.getPotTests();
      case 'vaults':
        return this.getVaultTests();
      case 'health':
        return this.getHealthTests();
      case 'user':
        return this.getUserTests();
      default:
        throw new Error(`Unknown test category: ${category}`);
    }
  }

  /**
   * Update endpoint configuration
   */
  updateConfig(newConfig: Partial<APIEndpointConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): APIEndpointConfig {
    return { ...this.config };
  }
}