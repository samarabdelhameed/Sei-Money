// API Testing Types

export interface APITestConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  authentication?: {
    type: 'bearer' | 'basic' | 'custom';
    token?: string;
    username?: string;
    password?: string;
    headers?: Record<string, string>;
  };
  defaultHeaders?: Record<string, string>;
}

export interface APIResponse<T = any> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: T;
  responseTime: number;
  timestamp: string;
}

export interface APITestResult {
  endpoint: string;
  method: string;
  success: boolean;
  response?: APIResponse;
  error?: APITestError;
  validations: ValidationResult[];
  executionTime: number;
  timestamp: string;
}

export interface APITestError {
  type: 'network' | 'timeout' | 'validation' | 'authentication' | 'server';
  message: string;
  details?: any;
  statusCode?: number;
  retryable: boolean;
}

export interface ValidationResult {
  field: string;
  rule: string;
  passed: boolean;
  expected?: any;
  actual?: any;
  message?: string;
}

export interface EndpointTest {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  headers?: Record<string, string>;
  body?: any;
  queryParams?: Record<string, any>;
  expectedStatus?: number;
  validations?: ValidationRule[];
  timeout?: number;
  retryAttempts?: number;
  dependencies?: string[];
}

export interface ValidationRule {
  field: string;
  type: 'exists' | 'equals' | 'contains' | 'matches' | 'greater_than' | 'less_than' | 'array_length' | 'object_keys';
  value?: any;
  message?: string;
  required?: boolean;
}

// Platform-specific API types
export interface TransferData {
  recipient: string;
  amount: string;
  remark?: string;
  expiry?: string;
}

export interface GroupData {
  name: string;
  description: string;
  targetAmount: number;
  type: string;
}

export interface PotData {
  name: string;
  targetAmount: number;
  targetDate: string;
  description: string;
  initialDeposit?: number;
}

export interface VaultData {
  name: string;
  strategy: string;
  initialDeposit: number;
  lockPeriod: number;
}

export interface APIEndpointConfig {
  transfers: {
    list: string;
    create: string;
    get: string;
    claim: string;
    refund: string;
  };
  groups: {
    list: string;
    create: string;
    get: string;
    contribute: string;
    distribute: string;
    refund: string;
  };
  pots: {
    list: string;
    create: string;
    get: string;
    deposit: string;
    break: string;
    close: string;
  };
  vaults: {
    list: string;
    create: string;
    get: string;
    deposit: string;
    withdraw: string;
    position: string;
    harvest: string;
  };
  health: {
    basic: string;
    contracts: string;
    wallet: string;
    network: string;
    dataService: string;
    marketStats: string;
  };
  user: {
    profile: string;
    balance: string;
    transactions: string;
    activity: string;
  };
  realtime: {
    status: string;
    health: string;
    start: string;
    stop: string;
    refresh: string;
    events: string;
  };
}