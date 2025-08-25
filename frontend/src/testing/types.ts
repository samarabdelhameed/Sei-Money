// Testing Types and Interfaces for SeiMoney Frontend Comprehensive Testing

export enum TestStatus {
  PASSED = 'passed',
  FAILED = 'failed',
  WARNING = 'warning',
  SKIPPED = 'skipped'
}

export enum ErrorSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum TestCategory {
  UI = 'ui',
  INTEGRATION = 'integration',
  DATA = 'data',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  WORKFLOW = 'workflow'
}

export interface TestResult {
  testName: string;
  status: TestStatus;
  executionTime: number;
  details: string;
  errors?: string[];
  screenshots?: string[];
  timestamp: Date;
  category: TestCategory;
  severity?: ErrorSeverity;
}

export interface ValidationResult {
  component: string;
  dataSource: string;
  isValid: boolean;
  expectedValue: any;
  actualValue: any;
  tolerance?: number;
  message: string;
  timestamp: Date;
}

export interface WorkflowResult {
  workflowName: string;
  steps: WorkflowStep[];
  overallStatus: 'completed' | 'failed' | 'partial';
  totalTime: number;
  failurePoint?: string;
  recoveryActions?: string[];
}

export interface WorkflowStep {
  stepName: string;
  status: TestStatus;
  duration: number;
  details: string;
  screenshot?: string;
  error?: string;
}

export interface ScreenTestConfig {
  screenName: string;
  testCases: TestCase[];
  dataValidations: DataValidation[];
  userInteractions: UserInteraction[];
  performanceThresholds: PerformanceThreshold[];
}

export interface TestCase {
  name: string;
  description: string;
  preconditions: string[];
  steps: string[];
  expectedResults: string[];
  priority: 'high' | 'medium' | 'low';
  category: TestCategory;
}

export interface DataValidation {
  elementSelector: string;
  dataSource: string;
  validationType: 'exact' | 'range' | 'format' | 'presence' | 'calculation';
  expectedValue?: any;
  tolerance?: number;
  customValidator?: (value: any) => boolean;
}

export interface UserInteraction {
  action: 'click' | 'input' | 'scroll' | 'hover' | 'drag' | 'keypress';
  target: string;
  value?: string;
  expectedResponse: string;
  timeout: number;
  waitForElement?: string;
}

export interface PerformanceThreshold {
  metric: 'loadTime' | 'responseTime' | 'memoryUsage' | 'bundleSize';
  threshold: number;
  unit: 'ms' | 'mb' | 'kb' | 'bytes';
}

export interface ErrorReport {
  severity: ErrorSeverity;
  category: TestCategory;
  description: string;
  reproduction: string[];
  expectedBehavior: string;
  actualBehavior: string;
  environment: EnvironmentInfo;
  screenshots: string[];
  logs: string[];
  suggestedFix?: string;
  timestamp: Date;
}

export interface EnvironmentInfo {
  browser: string;
  browserVersion: string;
  os: string;
  screenResolution: string;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  walletConnected?: string;
  networkCondition?: string;
}

export interface TestSuite {
  name: string;
  description: string;
  tests: TestResult[];
  startTime: Date;
  endTime?: Date;
  totalDuration?: number;
  passRate: number;
  environment: EnvironmentInfo;
  summary: TestSummary;
}

export interface APITestResult extends TestResult {
  endpoint: string;
  method: string;
  statusCode?: number;
  responseTime: number;
  responseSize?: number;
  requestData?: any;
  responseData?: any;
}

export interface ContractTestResult extends TestResult {
  contractAddress: string;
  functionName: string;
  gasUsed?: number;
  transactionHash?: string;
  blockNumber?: number;
  inputData?: any;
  outputData?: any;
}

export interface WalletTestResult extends TestResult {
  walletType: 'keplr' | 'leap' | 'metamask';
  address?: string;
  balance?: number;
  networkId?: string;
  connectionTime?: number;
}

// Test Configuration Interfaces
export interface TestConfig {
  environment: 'development' | 'staging' | 'production';
  baseUrl: string;
  apiUrl: string;
  timeout: number;
  retryAttempts: number;
  screenshotOnFailure: boolean;
  performanceMonitoring: boolean;
  realDataValidation: boolean;
  crossBrowserTesting: boolean;
  mobileTestingEnabled: boolean;
}

export interface BrowserConfig {
  name: string;
  version?: string;
  headless: boolean;
  viewport: {
    width: number;
    height: number;
  };
  deviceEmulation?: {
    name: string;
    userAgent: string;
    viewport: { width: number; height: number };
  };
}

// Data Validation Interfaces
export interface MarketDataValidation {
  tvl: number;
  activeUsers: number;
  successRate: number;
  avgApy: number;
  lastUpdated: Date;
}

export interface PortfolioValidation {
  totalValue: number;
  walletBalance: number;
  vaultPositions: VaultPosition[];
  groupContributions: GroupContribution[];
  potSavings: PotSaving[];
}

export interface VaultPosition {
  vaultId: string;
  amount: number;
  apy: number;
  performance: number;
}

export interface GroupContribution {
  groupId: string;
  contributed: number;
  totalTarget: number;
  progress: number;
}

export interface PotSaving {
  potId: string;
  current: number;
  target: number;
  progress: number;
}

// Workflow Testing Interfaces
export interface OnboardingWorkflow {
  walletConnection: boolean;
  initialBalance: number;
  firstNavigation: boolean;
  featureDiscovery: boolean;
  completionTime: number;
}

export interface PaymentWorkflow {
  formValidation: boolean;
  contractInteraction: boolean;
  transactionSigning: boolean;
  statusTracking: boolean;
  completionConfirmation: boolean;
}

export interface VaultWorkflow {
  vaultSelection: boolean;
  depositAmount: boolean;
  riskConfirmation: boolean;
  transactionExecution: boolean;
  positionTracking: boolean;
}

// Utility Types
export type TestFunction = () => Promise<TestResult>;
export type ValidationFunction = (data: any) => ValidationResult;
export type WorkflowFunction = () => Promise<WorkflowResult>;

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  warnings: number;
  skipped: number;
  criticalIssues: number;
}

export interface TestReporter {
  generateReport(results: TestResult[]): string;
  exportResults(results: TestResult[], format: 'json' | 'html' | 'csv'): string;
  createSummary(suite: TestSuite): string;
}

export interface ScreenshotCapture {
  capture(elementSelector?: string): Promise<string>;
  compare(baseline: string, current: string): Promise<number>;
  annotate(screenshot: string, annotations: Annotation[]): Promise<string>;
}

export interface Annotation {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;
}