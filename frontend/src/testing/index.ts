// SeiMoney Frontend Comprehensive Testing Suite - Main Export

export * from './types';
export * from './test-utilities';
export * from './test-config';
export * from './comprehensive-tester';
export * from './test-infrastructure';
export * from './screenshot-capture';
export * from './test-data-manager';
export * from './test-reporter';
export * from './validate-infrastructure';
export * from './navigation-tester';
export * from './error-edge-case-tester';
export * from './performance-load-tester';
export * from './cross-browser-device-tester';

// Main testing interface
export { comprehensiveTester } from './comprehensive-tester';
export { testUtils } from './test-utilities';
export { testInfrastructure } from './test-infrastructure';
export { screenshotCapture } from './screenshot-capture';
export { testDataManager } from './test-data-manager';
export { quickTests } from './quick-test';
export { validateTestingInfrastructure } from './validate-infrastructure';
export { navigationTester } from './navigation-tester';
export { errorEdgeCaseTester } from './error-edge-case-tester';
export { performanceLoadTester } from './performance-load-tester';
export { crossBrowserDeviceTester } from './cross-browser-device-tester';

// Quick test execution functions
export const runFullTestSuite = async () => {
  const { comprehensiveTester } = await import('./comprehensive-tester');
  return await comprehensiveTester.runComprehensiveTests();
};

export const testScreen = async (screenName: string) => {
  const { comprehensiveTester } = await import('./comprehensive-tester');
  return await comprehensiveTester.testSpecificScreen(screenName);
};

export const testIntegration = async (integrationType: string) => {
  const { comprehensiveTester } = await import('./comprehensive-tester');
  return await comprehensiveTester.testSpecificIntegration(integrationType);
};

// Initialize infrastructure on load
export const initializeTestingInfrastructure = async () => {
  const { testInfrastructure } = await import('./test-infrastructure');
  return await testInfrastructure.initialize();
};

// Browser console helpers
if (typeof window !== 'undefined') {
  (window as any).SeiMoneyTesting = {
    runFullTestSuite,
    testScreen,
    testIntegration,
    initializeTestingInfrastructure,
    quickTests: () => import('./quick-test').then(m => m.quickTests),
    comprehensiveTester: () => import('./comprehensive-tester').then(m => m.comprehensiveTester),
    testUtils: () => import('./test-utilities').then(m => m.testUtils),
    testInfrastructure: () => import('./test-infrastructure').then(m => m.testInfrastructure),
    screenshotCapture: () => import('./screenshot-capture').then(m => m.screenshotCapture),
    testDataManager: () => import('./test-data-manager').then(m => m.testDataManager),
    validateInfrastructure: () => import('./validate-infrastructure').then(m => m.validateTestingInfrastructure),
    validateTasks1to4: () => import('./task-validator').then(m => m.taskValidator.validateTasks1to4()),
    taskValidator: () => import('./task-validator').then(m => m.taskValidator)
  };
  
  // Also make TaskValidator and RealDataTester available directly
  import('./task-validator').then(({ taskValidator }) => {
    (window as any).TaskValidator = taskValidator;
  }).catch(() => {
    console.warn('TaskValidator not available');
  });
  
  import('./real-data-tester').then(({ realDataTester }) => {
    (window as any).RealDataTester = realDataTester;
  }).catch(() => {
    console.warn('RealDataTester not available');
  });
  
  import('./auto-test-runner').then(({ autoTestRunner }) => {
    (window as any).AutoTestRunner = autoTestRunner;
  }).catch(() => {
    console.warn('AutoTestRunner not available');
  });
  
  import('./navigation-tester').then(({ navigationTester }) => {
    (window as any).NavigationTester = navigationTester;
  }).catch(() => {
    console.warn('NavigationTester not available');
  });
  
  import('./error-edge-case-tester').then(({ errorEdgeCaseTester }) => {
    (window as any).ErrorEdgeCaseTester = errorEdgeCaseTester;
  }).catch(() => {
    console.warn('ErrorEdgeCaseTester not available');
  });
  
  import('./performance-load-tester').then(({ performanceLoadTester }) => {
    (window as any).PerformanceLoadTester = performanceLoadTester;
  }).catch(() => {
    console.warn('PerformanceLoadTester not available');
  });
  
  import('./cross-browser-device-tester').then(({ crossBrowserDeviceTester }) => {
    (window as any).CrossBrowserDeviceTester = crossBrowserDeviceTester;
  }).catch(() => {
    console.warn('CrossBrowserDeviceTester not available');
  });
  
  console.log('🧪 SeiMoney Testing Suite loaded!');
  console.log('Available commands:');
  console.log('  SeiMoneyTesting.runFullTestSuite() - Run complete test suite');
  console.log('  SeiMoneyTesting.testScreen("home") - Test specific screen');
  console.log('  SeiMoneyTesting.testIntegration("api") - Test specific integration');
  console.log('  SeiMoneyTesting.testInfrastructure() - Access test infrastructure');
  console.log('  SeiMoneyTesting.screenshotCapture() - Access screenshot utilities');
  console.log('  SeiMoneyTesting.testDataManager() - Access data management');
  console.log('  SeiMoneyTesting.validateInfrastructure() - Validate infrastructure');
}