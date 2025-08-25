// Test Infrastructure Setup and Management

import { testUtils } from './test-utilities';
import { screenshotCapture } from './screenshot-capture';
import { testDataManager } from './test-data-manager';
import { TestConfig, BrowserConfig, EnvironmentInfo } from './types';
import { DEFAULT_TEST_CONFIG } from './test-config';

export interface TestInfrastructureStatus {
  initialized: boolean;
  screenshotCapture: boolean;
  dataManagement: boolean;
  environmentDetection: boolean;
  apiConnectivity: boolean;
  walletAvailability: {
    keplr: boolean;
    leap: boolean;
    metamask: boolean;
  };
  errors: string[];
}

export class TestInfrastructure {
  private static instance: TestInfrastructure;
  private config: TestConfig;
  private status: TestInfrastructureStatus;
  private initialized = false;

  static getInstance(): TestInfrastructure {
    if (!TestInfrastructure.instance) {
      TestInfrastructure.instance = new TestInfrastructure();
    }
    return TestInfrastructure.instance;
  }

  constructor() {
    this.config = { ...DEFAULT_TEST_CONFIG };
    this.status = {
      initialized: false,
      screenshotCapture: false,
      dataManagement: false,
      environmentDetection: false,
      apiConnectivity: false,
      walletAvailability: {
        keplr: false,
        leap: false,
        metamask: false
      },
      errors: []
    };
  }

  async initialize(customConfig?: Partial<TestConfig>): Promise<TestInfrastructureStatus> {
    console.log('🚀 Initializing SeiMoney Test Infrastructure...');
    
    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }

    this.status.errors = [];

    try {
      // Step 1: Environment Detection
      await this.setupEnvironmentDetection();

      // Step 2: Screenshot Capture Setup
      await this.setupScreenshotCapture();

      // Step 3: Data Management Setup
      await this.setupDataManagement();

      // Step 4: API Connectivity Check
      await this.checkAPIConnectivity();

      // Step 5: Wallet Availability Check
      await this.checkWalletAvailability();

      // Step 6: Test Data Cleanup
      await this.setupTestDataCleanup();

      // Step 7: Browser Compatibility Check
      await this.checkBrowserCompatibility();

      this.status.initialized = true;
      this.initialized = true;

      console.log('✅ Test Infrastructure initialized successfully');
      this.logInfrastructureStatus();

    } catch (error) {
      console.error('❌ Test Infrastructure initialization failed:', error);
      this.status.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return this.status;
  }

  private async setupEnvironmentDetection(): Promise<void> {
    try {
      const envInfo = testUtils.getEnvironmentInfo();
      console.log('🌍 Environment detected:', envInfo);
      
      // Store environment info for test reporting
      testDataManager.createSnapshot('environment_info', envInfo, envInfo);
      
      this.status.environmentDetection = true;
    } catch (error) {
      this.status.errors.push('Environment detection failed');
      throw error;
    }
  }

  private async setupScreenshotCapture(): Promise<void> {
    try {
      // Test screenshot capture capability
      const testScreenshot = await screenshotCapture.capture();
      if (testScreenshot) {
        console.log('📸 Screenshot capture initialized');
        this.status.screenshotCapture = true;
      } else {
        throw new Error('Screenshot capture test failed');
      }
    } catch (error) {
      console.warn('⚠️ Screenshot capture not available:', error);
      this.status.errors.push('Screenshot capture unavailable');
      // Don't throw - screenshot is optional
      this.status.screenshotCapture = false;
    }
  }

  private async setupDataManagement(): Promise<void> {
    try {
      // Test data storage capabilities
      const testData = { test: 'infrastructure_setup', timestamp: new Date() };
      const envInfo = testUtils.getEnvironmentInfo();
      const snapshotId = testDataManager.createSnapshot('infrastructure_test', testData, envInfo);
      
      // Verify we can retrieve the data
      const retrieved = testDataManager.getSnapshot(snapshotId);
      if (!retrieved) {
        throw new Error('Data management test failed');
      }

      // Clean up test data
      testDataManager.deleteSnapshot(snapshotId);
      
      console.log('💾 Data management initialized');
      this.status.dataManagement = true;
    } catch (error) {
      this.status.errors.push('Data management setup failed');
      throw error;
    }
  }

  private async checkAPIConnectivity(): Promise<void> {
    try {
      const healthCheck = await testUtils.testApiEndpoint('/health');
      if (healthCheck.success) {
        console.log('🌐 API connectivity confirmed');
        this.status.apiConnectivity = true;
      } else {
        console.warn('⚠️ API not accessible, tests will run in offline mode');
        this.status.apiConnectivity = false;
      }
    } catch (error) {
      console.warn('⚠️ API connectivity check failed:', error);
      this.status.apiConnectivity = false;
      // Don't throw - API might not be available in all test environments
    }
  }

  private async checkWalletAvailability(): Promise<void> {
    try {
      const wallets = await testUtils.detectWalletAvailability();
      this.status.walletAvailability = wallets;
      
      const availableWallets = Object.entries(wallets)
        .filter(([_, available]) => available)
        .map(([name, _]) => name);

      if (availableWallets.length > 0) {
        console.log('👛 Available wallets:', availableWallets.join(', '));
      } else {
        console.warn('⚠️ No wallets detected');
      }
    } catch (error) {
      console.warn('⚠️ Wallet availability check failed:', error);
      this.status.errors.push('Wallet detection failed');
    }
  }

  private async setupTestDataCleanup(): Promise<void> {
    try {
      // Register cleanup for old test data
      testDataManager.registerCleanupTask({
        id: 'infrastructure_cleanup',
        description: 'Clean up test infrastructure data',
        cleanup: async () => {
          await testDataManager.cleanupOldData(2 * 60 * 60 * 1000); // 2 hours
          screenshotCapture.clearStoredScreenshots();
        },
        priority: 'medium'
      });

      console.log('🧹 Test data cleanup configured');
    } catch (error) {
      console.warn('⚠️ Test data cleanup setup failed:', error);
      this.status.errors.push('Cleanup setup failed');
    }
  }

  private async checkBrowserCompatibility(): Promise<void> {
    try {
      const userAgent = navigator.userAgent;
      const isSupported = this.isBrowserSupported(userAgent);
      
      if (!isSupported) {
        console.warn('⚠️ Browser may not be fully supported for testing');
        this.status.errors.push('Browser compatibility warning');
      } else {
        console.log('✅ Browser compatibility confirmed');
      }
    } catch (error) {
      console.warn('⚠️ Browser compatibility check failed:', error);
    }
  }

  private isBrowserSupported(userAgent: string): boolean {
    // Check for modern browser features
    const hasRequiredFeatures = 
      typeof fetch !== 'undefined' &&
      typeof Promise !== 'undefined' &&
      typeof localStorage !== 'undefined' &&
      typeof sessionStorage !== 'undefined' &&
      typeof MutationObserver !== 'undefined';

    return hasRequiredFeatures;
  }

  // Public methods for infrastructure management

  getStatus(): TestInfrastructureStatus {
    return { ...this.status };
  }

  getConfig(): TestConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<TestConfig>): void {
    this.config = { ...this.config, ...updates };
    console.log('⚙️ Test configuration updated');
  }

  async reinitialize(): Promise<TestInfrastructureStatus> {
    console.log('🔄 Reinitializing test infrastructure...');
    this.initialized = false;
    return await this.initialize();
  }

  async performHealthCheck(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, boolean>;
    issues: string[];
  }> {
    const checks: Record<string, boolean> = {};
    const issues: string[] = [];

    // Check environment detection
    try {
      testUtils.getEnvironmentInfo();
      checks.environmentDetection = true;
    } catch (error) {
      checks.environmentDetection = false;
      issues.push('Environment detection failed');
    }

    // Check screenshot capture
    try {
      await screenshotCapture.capture();
      checks.screenshotCapture = true;
    } catch (error) {
      checks.screenshotCapture = false;
      issues.push('Screenshot capture failed');
    }

    // Check data management
    try {
      const stats = testDataManager.getDataStatistics();
      checks.dataManagement = true;
    } catch (error) {
      checks.dataManagement = false;
      issues.push('Data management failed');
    }

    // Check API connectivity
    try {
      const result = await testUtils.testApiEndpoint('/health');
      checks.apiConnectivity = result.success;
      if (!result.success) {
        issues.push('API not accessible');
      }
    } catch (error) {
      checks.apiConnectivity = false;
      issues.push('API connectivity check failed');
    }

    // Determine overall health
    const passedChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;
    
    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (passedChecks === totalChecks) {
      overall = 'healthy';
    } else if (passedChecks >= totalChecks * 0.7) {
      overall = 'degraded';
    } else {
      overall = 'unhealthy';
    }

    return { overall, checks, issues };
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up test infrastructure...');
    
    try {
      await testDataManager.executeAllCleanupTasks();
      screenshotCapture.clearStoredScreenshots();
      screenshotCapture.clearBaselines();
      
      console.log('✅ Test infrastructure cleanup completed');
    } catch (error) {
      console.error('❌ Test infrastructure cleanup failed:', error);
    }
  }

  // Utility methods for test execution

  async prepareTestEnvironment(testName: string): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Create environment snapshot
    const envInfo = testUtils.getEnvironmentInfo();
    testDataManager.createSnapshot(`${testName}_environment`, {
      testName,
      startTime: new Date(),
      config: this.config,
      status: this.status
    }, envInfo);

    console.log(`🎯 Test environment prepared for: ${testName}`);
  }

  async captureTestEvidence(testName: string, elementSelector?: string): Promise<{
    screenshot: string;
    environment: EnvironmentInfo;
    timestamp: Date;
  }> {
    const screenshot = await screenshotCapture.capture(elementSelector);
    const environment = testUtils.getEnvironmentInfo();
    const timestamp = new Date();

    // Store evidence
    testDataManager.createSnapshot(`${testName}_evidence`, {
      screenshot,
      environment,
      timestamp
    }, environment);

    return { screenshot, environment, timestamp };
  }

  private logInfrastructureStatus(): void {
    console.group('📊 Test Infrastructure Status');
    console.log('✅ Initialized:', this.status.initialized);
    console.log('📸 Screenshot Capture:', this.status.screenshotCapture);
    console.log('💾 Data Management:', this.status.dataManagement);
    console.log('🌍 Environment Detection:', this.status.environmentDetection);
    console.log('🌐 API Connectivity:', this.status.apiConnectivity);
    console.log('👛 Wallet Availability:', this.status.walletAvailability);
    
    if (this.status.errors.length > 0) {
      console.warn('⚠️ Issues:', this.status.errors);
    }
    
    console.groupEnd();
  }
}

// Export singleton instance
export const testInfrastructure = TestInfrastructure.getInstance();

// Auto-initialize when imported (can be disabled by setting window.DISABLE_AUTO_INIT = true)
if (typeof window !== 'undefined' && !(window as any).DISABLE_AUTO_INIT) {
  // Initialize after a short delay to allow other modules to load
  setTimeout(() => {
    testInfrastructure.initialize().catch(error => {
      console.warn('Auto-initialization failed:', error);
    });
  }, 1000);
}