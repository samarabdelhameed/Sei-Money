// Core Testing Types
export interface TestConfig {
  environment: {
    frontendUrl: string;
    backendUrl: string;
    blockchainNetwork: string;
    blockchainRpcUrl: string;
    contractAddress: string;
    testWalletAddress: string;
    testWalletPrivateKey: string;
    testWalletMnemonic: string;
  };
  
  browser: {
    headless: boolean;
    timeout: number;
    screenshotOnFailure: boolean;
  };
  
  api: {
    timeout: number;
    retryAttempts: number;
  };
  
  validation: {
    timeouts: {
      uiInteraction: number;
      apiCall: number;
      blockchainConfirmation: number;
      dataConsistency: number;
    };
    retryAttempts: number;
    screenshotOnFailure: boolean;
  };
  
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug';
    file?: string | undefined;
  };
  
  database?: {
    url: string;
  } | undefined;
}

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  steps: TestStep[];
  expectedOutcomes: ExpectedOutcome[];
  timeout: number;
  retryCount: number;
  dependencies?: string[];
}

export interface TestStep {
  id: string;
  type: 'ui_interaction' | 'api_call' | 'validation' | 'wait' | 'setup' | 'cleanup';
  action: string;
  parameters: Record<string, any>;
  expectedResult?: any;
  validations: Validation[];
  timeout?: number;
}

export interface ExpectedOutcome {
  type: 'ui_state' | 'api_response' | 'database_state' | 'blockchain_state';
  description: string;
  validation: (result: any) => boolean;
}

export interface Validation {
  type: 'equals' | 'contains' | 'exists' | 'greater_than' | 'less_than' | 'matches_regex';
  field: string;
  expected: any;
  message?: string;
}

export interface TestResult {
  scenarioId: string;
  success: boolean;
  executionTime: number;
  startTime: string;
  endTime: string;
  steps: StepResult[];
  dataValidations: ValidationResult[];
  screenshots: string[];
  errors: TestError[];
  warnings: TestWarning[];
}

export interface StepResult {
  stepId: string;
  success: boolean;
  executionTime: number;
  result?: any;
  error?: TestError;
  validations: ValidationResult[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  timestamp: string;
  executionTime: number;
  data?: any;
}

export interface TestError {
  type: ErrorType;
  message: string;
  details: any;
  timestamp: string;
  step?: string;
  screenshot?: string;
  stackTrace?: string;
  retryable: boolean;
}

export interface TestWarning {
  type: string;
  message: string;
  details?: any;
  timestamp: string;
  step?: string;
}

export interface ValidationError {
  field: string;
  expected: any;
  actual: any;
  message: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  details?: any;
}

export enum ErrorType {
  UI_INTERACTION_FAILED = 'ui_interaction_failed',
  API_CALL_FAILED = 'api_call_failed',
  DATA_VALIDATION_FAILED = 'data_validation_failed',
  BLOCKCHAIN_INTERACTION_FAILED = 'blockchain_interaction_failed',
  TIMEOUT_EXCEEDED = 'timeout_exceeded',
  ASSERTION_FAILED = 'assertion_failed',
  ENVIRONMENT_SETUP_FAILED = 'environment_setup_failed',
  CONFIGURATION_ERROR = 'configuration_error',
  NETWORK_ERROR = 'network_error'
}

export interface TestExecutionStatus {
  isRunning: boolean;
  currentScenario?: string;
  currentStep?: string;
  progress: number;
  startTime?: string;
  estimatedCompletion?: string;
  errors: number;
  warnings: number;
}

export interface TestSuiteResult {
  totalScenarios: number;
  passedScenarios: number;
  failedScenarios: number;
  skippedScenarios: number;
  executionTime: number;
  startTime: string;
  endTime: string;
  overallSuccess: boolean;
  results: TestResult[];
  summary: TestSummary;
}

export interface TestSummary {
  totalSteps: number;
  passedSteps: number;
  failedSteps: number;
  totalValidations: number;
  passedValidations: number;
  failedValidations: number;
  screenshotCount: number;
  errorCount: number;
  warningCount: number;
}

// Environment and Health Check Types
export interface EnvironmentHealth {
  frontend: HealthStatus;
  backend: HealthStatus;
  blockchain: HealthStatus;
  database?: HealthStatus | undefined;
  overall: HealthStatus;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime?: number;
  lastCheck: string;
  error?: string | undefined;
  details?: Record<string, any>;
}

// Utility Types
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface Logger {
  error(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}