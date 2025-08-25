// Infrastructure Validation Script
// This script validates that all testing infrastructure components are working correctly

import { testInfrastructure } from './test-infrastructure';
import { testUtils } from './test-utilities';
import { screenshotCapture } from './screenshot-capture';
import { testDataManager } from './test-data-manager';
import { comprehensiveTester } from './comprehensive-tester';

export async function validateTestingInfrastructure(): Promise<{
  success: boolean;
  results: Array<{ component: string; status: 'pass' | 'fail'; message: string }>;
}> {
  const results: Array<{ component: string; status: 'pass' | 'fail'; message: string }> = [];
  
  console.log('🔍 Validating SeiMoney Testing Infrastructure...');

  // 1. Test Infrastructure Initialization
  try {
    const status = await testInfrastructure.initialize();
    results.push({
      component: 'Test Infrastructure',
      status: status.initialized ? 'pass' : 'fail',
      message: status.initialized ? 'Infrastructure initialized successfully' : `Initialization failed: ${status.errors.join(', ')}`
    });
  } catch (error) {
    results.push({
      component: 'Test Infrastructure',
      status: 'fail',
      message: `Initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }

  // 2. Test Utilities
  try {
    const envInfo = testUtils.getEnvironmentInfo();
    const hasRequiredProps = envInfo.browser && envInfo.os && envInfo.deviceType;
    results.push({
      component: 'Test Utilities',
      status: hasRequiredProps ? 'pass' : 'fail',
      message: hasRequiredProps ? 'Environment detection working' : 'Environment detection incomplete'
    });
  } catch (error) {
    results.push({
      component: 'Test Utilities',
      status: 'fail',
      message: `Utilities error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }

  // 3. Screenshot Capture
  try {
    const screenshot = await screenshotCapture.capture();
    const hasScreenshot = screenshot && screenshot.length > 0;
    results.push({
      component: 'Screenshot Capture',
      status: hasScreenshot ? 'pass' : 'fail',
      message: hasScreenshot ? 'Screenshot capture working' : 'Screenshot capture failed'
    });
  } catch (error) {
    results.push({
      component: 'Screenshot Capture',
      status: 'fail',
      message: `Screenshot error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }

  // 4. Test Data Manager
  try {
    const envInfo = testUtils.getEnvironmentInfo();
    const snapshotId = testDataManager.createSnapshot('validation_test', { test: true }, envInfo);
    const snapshot = testDataManager.getSnapshot(snapshotId);
    const dataWorking = snapshot && snapshot.data.test === true;
    
    // Cleanup test data
    if (snapshotId) {
      testDataManager.deleteSnapshot(snapshotId);
    }
    
    results.push({
      component: 'Test Data Manager',
      status: dataWorking ? 'pass' : 'fail',
      message: dataWorking ? 'Data management working' : 'Data management failed'
    });
  } catch (error) {
    results.push({
      component: 'Test Data Manager',
      status: 'fail',
      message: `Data manager error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }

  // 5. Comprehensive Tester
  try {
    const tester = comprehensiveTester;
    const hasRequiredMethods = typeof tester.testSpecificScreen === 'function' && 
                              typeof tester.testSpecificIntegration === 'function';
    results.push({
      component: 'Comprehensive Tester',
      status: hasRequiredMethods ? 'pass' : 'fail',
      message: hasRequiredMethods ? 'Comprehensive tester ready' : 'Comprehensive tester missing methods'
    });
  } catch (error) {
    results.push({
      component: 'Comprehensive Tester',
      status: 'fail',
      message: `Tester error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }

  // 6. Browser Compatibility
  try {
    const hasRequiredAPIs = typeof fetch !== 'undefined' &&
                           typeof localStorage !== 'undefined' &&
                           typeof sessionStorage !== 'undefined' &&
                           typeof MutationObserver !== 'undefined';
    results.push({
      component: 'Browser Compatibility',
      status: hasRequiredAPIs ? 'pass' : 'fail',
      message: hasRequiredAPIs ? 'Browser APIs available' : 'Missing required browser APIs'
    });
  } catch (error) {
    results.push({
      component: 'Browser Compatibility',
      status: 'fail',
      message: `Browser check error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }

  // 7. Health Check
  try {
    const healthCheck = await testInfrastructure.performHealthCheck();
    results.push({
      component: 'Health Check',
      status: healthCheck.overall === 'healthy' ? 'pass' : 'fail',
      message: `System health: ${healthCheck.overall} (${healthCheck.issues.length} issues)`
    });
  } catch (error) {
    results.push({
      component: 'Health Check',
      status: 'fail',
      message: `Health check error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }

  const passedTests = results.filter(r => r.status === 'pass').length;
  const totalTests = results.length;
  const success = passedTests === totalTests;

  console.log(`✅ Infrastructure Validation Complete: ${passedTests}/${totalTests} components passed`);
  
  // Log results
  results.forEach(result => {
    const emoji = result.status === 'pass' ? '✅' : '❌';
    console.log(`${emoji} ${result.component}: ${result.message}`);
  });

  return { success, results };
}

// Auto-run validation if this file is imported directly
if (typeof window !== 'undefined') {
  (window as any).validateTestingInfrastructure = validateTestingInfrastructure;
  
  // Add to SeiMoneyTesting namespace if it exists
  if ((window as any).SeiMoneyTesting) {
    (window as any).SeiMoneyTesting.validateInfrastructure = validateTestingInfrastructure;
  }
}