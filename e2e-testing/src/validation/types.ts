// Data Validation Types

export interface DataValidationConfig {
  database?: {
    url: string;
    timeout: number;
  };
  blockchain: {
    rpcUrl: string;
    contractAddress: string;
    timeout: number;
  };
  api: {
    baseUrl: string;
    timeout: number;
  };
  consistency: {
    toleranceMs: number; // Time tolerance for data sync
    retryAttempts: number;
    retryDelayMs: number;
  };
}

export interface CrossComponentValidation {
  entityId: string;
  entityType: 'transfer' | 'group' | 'pot' | 'vault';
  frontend: {
    displayedData: any;
    componentState: any;
    uiElements: UIElementState[];
  };
  backend: {
    apiResponse: any;
    databaseState: any;
    cacheState?: any;
  };
  blockchain: {
    contractState: any;
    transactionHash?: string;
    blockHeight?: number;
  };
  consistency: {
    dataMatches: boolean;
    discrepancies: Discrepancy[];
    lastSyncTime: string;
    validationTime: string;
  };
}

export interface UIElementState {
  selector: string;
  value: any;
  visible: boolean;
  enabled: boolean;
  text?: string;
}

export interface Discrepancy {
  field: string;
  component: 'frontend' | 'backend' | 'blockchain';
  expected: any;
  actual: any;
  severity: 'critical' | 'warning' | 'info';
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  timestamp: string;
  executionTime: number;
  data?: any;
}

export interface ValidationError {
  field: string;
  expected: any;
  actual: any;
  message: string;
  component?: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  details?: any;
  component?: string;
}

export interface TransferValidation {
  transferId: string;
  frontendData: {
    displayedInList: boolean;
    correctAmount: boolean;
    correctRecipient: boolean;
    correctStatus: boolean;
    correctRemark: boolean;
  };
  backendData: {
    existsInDatabase: boolean;
    correctAmount: boolean;
    correctRecipient: boolean;
    correctStatus: boolean;
    correctTimestamp: boolean;
  };
  blockchainData: {
    contractStateUpdated: boolean;
    correctBalance: boolean;
    transactionConfirmed: boolean;
  };
  consistency: ValidationResult;
}

export interface GroupValidation {
  groupId: string;
  frontendData: {
    displayedInList: boolean;
    correctName: boolean;
    correctTargetAmount: boolean;
    correctType: boolean;
    correctMemberCount: boolean;
  };
  backendData: {
    existsInDatabase: boolean;
    correctConfiguration: boolean;
    correctMemberList: boolean;
    correctContributions: boolean;
  };
  blockchainData: {
    contractStateUpdated: boolean;
    correctPoolBalance: boolean;
    correctMemberStates: boolean;
  };
  consistency: ValidationResult;
}

export interface PotValidation {
  potId: string;
  frontendData: {
    displayedInList: boolean;
    correctTargetAmount: boolean;
    correctProgress: boolean;
    correctBalance: boolean;
    correctTargetDate: boolean;
  };
  backendData: {
    existsInDatabase: boolean;
    correctConfiguration: boolean;
    correctBalance: boolean;
    correctTransactionHistory: boolean;
  };
  blockchainData: {
    contractStateUpdated: boolean;
    correctBalance: boolean;
    correctLockPeriod: boolean;
  };
  consistency: ValidationResult;
}

export interface VaultValidation {
  vaultId: string;
  frontendData: {
    displayedInList: boolean;
    correctStrategy: boolean;
    correctTVL: boolean;
    correctAPR: boolean;
    correctUserPosition: boolean;
  };
  backendData: {
    existsInDatabase: boolean;
    correctConfiguration: boolean;
    correctPerformanceMetrics: boolean;
    correctUserPositions: boolean;
  };
  blockchainData: {
    contractStateUpdated: boolean;
    correctTVL: boolean;
    correctYieldCalculations: boolean;
    correctUserShares: boolean;
  };
  consistency: ValidationResult;
}

export interface DashboardValidation {
  portfolioTotals: {
    transfersTotal: ValidationResult;
    groupsTotal: ValidationResult;
    potsTotal: ValidationResult;
    vaultsTotal: ValidationResult;
    overallTotal: ValidationResult;
  };
  activityCounts: {
    activeTransfers: ValidationResult;
    activeGroups: ValidationResult;
    activePots: ValidationResult;
    activeVaults: ValidationResult;
  };
  realTimeUpdates: {
    dataFreshness: ValidationResult;
    syncStatus: ValidationResult;
    lastUpdateTime: ValidationResult;
  };
  consistency: ValidationResult;
}

export interface PortfolioValidation {
  calculations: {
    totalValue: ValidationResult;
    profitLoss: ValidationResult;
    allocation: ValidationResult;
    performance: ValidationResult;
  };
  dataAccuracy: {
    sourceDataConsistency: ValidationResult;
    calculationAccuracy: ValidationResult;
    displayAccuracy: ValidationResult;
  };
  consistency: ValidationResult;
}

export interface DatabaseValidationResult {
  connected: boolean;
  tablesExist: boolean;
  dataIntegrity: ValidationResult;
  queryResults: Record<string, any>;
  executionTime: number;
  error?: string;
}

export interface BlockchainValidationResult {
  connected: boolean;
  contractExists: boolean;
  contractState: any;
  blockHeight: number;
  networkId: string;
  executionTime: number;
  error?: string;
}

export interface ConsistencyReport {
  entityId: string;
  entityType: string;
  overallConsistency: boolean;
  componentComparisons: ComponentComparison[];
  discrepancies: Discrepancy[];
  recommendations: string[];
  timestamp: string;
  executionTime: number;
}

export interface ComponentComparison {
  components: string[];
  field: string;
  consistent: boolean;
  values: Record<string, any>;
  tolerance?: number;
}