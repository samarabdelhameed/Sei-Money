# SeiMoney Frontend Comprehensive Testing Infrastructure

This directory contains the complete testing infrastructure for the SeiMoney frontend application, implementing comprehensive validation of all screens, integrations, and user workflows.

## 🏗️ Infrastructure Components

### Core Components

1. **Test Infrastructure** (`test-infrastructure.ts`)
   - Initializes and manages the entire testing environment
   - Performs health checks and status monitoring
   - Handles cleanup and maintenance tasks

2. **Test Utilities** (`test-utilities.ts`)
   - Provides common testing utilities and helper functions
   - Environment detection and browser compatibility checks
   - Element interaction and validation utilities

3. **Screenshot Capture** (`screenshot-capture.ts`)
   - Automated screenshot capture using html2canvas
   - Screenshot comparison and baseline management
   - Visual regression testing capabilities

4. **Test Data Manager** (`test-data-manager.ts`)
   - Manages test data snapshots and cleanup
   - Persistent storage of test results and evidence
   - Data export/import functionality

5. **Test Reporter** (`test-reporter.ts`)
   - Generates comprehensive test reports
   - Multiple output formats (HTML, JSON, CSV)
   - Test result visualization and analysis

### Testing Modules

6. **Comprehensive Tester** (`comprehensive-tester.ts`)
   - Main orchestrator for all testing activities
   - Coordinates screen, integration, and workflow tests
   - Provides unified testing interface

7. **Test Configuration** (`test-config.ts`)
   - Centralized configuration for all test scenarios
   - Screen-specific test cases and validation rules
   - API endpoints and test data templates

8. **Type Definitions** (`types.ts`)
   - Complete TypeScript interfaces for all testing components
   - Ensures type safety across the testing infrastructure
   - Standardized data structures for test results

## 🚀 Getting Started

### Prerequisites

1. **Dependencies Installation**
   ```bash
   cd frontend
   npm install
   ```

2. **Required Dependencies**
   - `html2canvas` - For screenshot capture
   - `pixelmatch` - For image comparison
   - `pngjs` - For PNG image processing

### Initialization

1. **Automatic Initialization**
   The testing infrastructure auto-initializes when imported:
   ```typescript
   import { testInfrastructure } from './testing';
   // Infrastructure initializes automatically
   ```

2. **Manual Initialization**
   ```typescript
   import { testInfrastructure } from './testing';
   
   const status = await testInfrastructure.initialize({
     environment: 'development',
     screenshotOnFailure: true,
     realDataValidation: true
   });
   ```

### Basic Usage

1. **Browser Console**
   ```javascript
   // Run full test suite
   SeiMoneyTesting.runFullTestSuite()
   
   // Test specific screen
   SeiMoneyTesting.testScreen("home")
   
   // Test integration
   SeiMoneyTesting.testIntegration("api")
   
   // Capture screenshots
   SeiMoneyTesting.screenshotCapture().then(sc => sc.capture())
   ```

2. **Test Runner Interface**
   Open `test-runner-comprehensive.html` in your browser for a GUI interface.

## 📋 Test Categories

### 1. Screen Validation Tests
- **Home Screen**: Market statistics, navigation, TVL chart
- **Dashboard**: Wallet connection, portfolio display, real-time updates
- **Payments**: Form validation, contract integration, transaction flow
- **AI Agent**: Service connectivity, query handling, response validation

### 2. Integration Tests
- **Backend API**: Health checks, endpoint validation, response times
- **Smart Contracts**: Contract interaction, transaction execution
- **Wallet Integration**: Multi-wallet support, connection flows

### 3. Data Validation Tests
- **Real Data Verification**: Cross-reference with blockchain explorers
- **Market Data Accuracy**: Compare with external sources
- **Calculation Validation**: Portfolio values, APY calculations

### 4. Performance Tests
- **Page Load Times**: Measure and validate loading performance
- **Memory Usage**: Monitor memory consumption
- **API Response Times**: Track backend performance

### 5. Error Handling Tests
- **Network Errors**: Offline scenarios, API failures
- **Wallet Errors**: Connection failures, transaction errors
- **Form Validation**: Input validation, error messages

## 🔧 Configuration

### Test Configuration (`test-config.ts`)

```typescript
export const DEFAULT_TEST_CONFIG: TestConfig = {
  environment: 'development',
  baseUrl: 'http://localhost:5173',
  apiUrl: 'http://localhost:3001',
  timeout: 30000,
  retryAttempts: 3,
  screenshotOnFailure: true,
  performanceMonitoring: true,
  realDataValidation: true
};
```

### Screen Test Configuration

Each screen has detailed test configuration including:
- Test cases with preconditions and expected results
- Data validation rules and selectors
- User interaction scenarios
- Performance thresholds

### Browser Configuration

```typescript
export const BROWSER_CONFIGS: BrowserConfig[] = [
  {
    name: 'Chrome',
    viewport: { width: 1920, height: 1080 }
  },
  {
    name: 'Chrome Mobile',
    viewport: { width: 375, height: 667 },
    deviceEmulation: { name: 'iPhone SE' }
  }
];
```

## 📊 Test Results and Reporting

### Test Result Structure

```typescript
interface TestResult {
  testName: string;
  status: 'passed' | 'failed' | 'warning';
  executionTime: number;
  details: string;
  errors?: string[];
  screenshots?: string[];
  timestamp: Date;
  category: TestCategory;
}
```

### Test Suite Structure

```typescript
interface TestSuite {
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
```

## 📸 Screenshot Management

### Capture Screenshots

```typescript
import { screenshotCapture } from './testing';

// Full page screenshot
const fullPage = await screenshotCapture.captureFullPage();

// Element screenshot
const element = await screenshotCapture.captureElement('[data-testid="navbar"]');

// Screen-specific screenshot with baseline
const screenshot = await screenshotCapture.captureScreen('home');
```

### Visual Regression Testing

```typescript
// Compare with baseline
const difference = await screenshotCapture.compareWithBaseline('home', currentScreenshot);

// Annotate screenshots
const annotated = await screenshotCapture.annotate(screenshot, [
  { x: 100, y: 100, width: 200, height: 50, text: 'Error here', color: 'red' }
]);
```

## 💾 Data Management

### Test Data Snapshots

```typescript
import { testDataManager } from './testing';

// Create snapshot
const snapshotId = testDataManager.createSnapshot('test_name', data, environment);

// Retrieve snapshot
const snapshot = testDataManager.getSnapshot(snapshotId);

// Cleanup old data
await testDataManager.cleanupOldData(24 * 60 * 60 * 1000); // 24 hours
```

### Test Results Storage

```typescript
// Store test results
testDataManager.storeTestResults('suite_name', results);

// Get test results
const results = testDataManager.getTestResults('suite_name');

// Export all data
const exportData = testDataManager.exportTestData();
```

## 🔍 Health Monitoring

### Infrastructure Health Check

```typescript
import { testInfrastructure } from './testing';

const healthCheck = await testInfrastructure.performHealthCheck();
console.log('Overall health:', healthCheck.overall); // 'healthy' | 'degraded' | 'unhealthy'
console.log('Issues:', healthCheck.issues);
```

### Status Monitoring

```typescript
const status = testInfrastructure.getStatus();
console.log('Screenshot capture:', status.screenshotCapture);
console.log('API connectivity:', status.apiConnectivity);
console.log('Wallet availability:', status.walletAvailability);
```

## 🧹 Cleanup and Maintenance

### Automatic Cleanup

The infrastructure includes automatic cleanup tasks:
- Remove test data older than specified age
- Clear temporary screenshots
- Clean up localStorage/sessionStorage

### Manual Cleanup

```typescript
// Execute all cleanup tasks
await testDataManager.executeAllCleanupTasks();

// Clear all test data
testDataManager.clearAllTestData();

// Infrastructure cleanup
await testInfrastructure.cleanup();
```

## 🎯 Best Practices

### 1. Test Organization
- Group related tests by screen or functionality
- Use descriptive test names and clear assertions
- Include proper error handling and cleanup

### 2. Data Validation
- Always validate real data against expected formats
- Use tolerance values for numerical comparisons
- Cross-reference with external sources when possible

### 3. Screenshot Testing
- Capture screenshots on test failures
- Maintain baseline screenshots for regression testing
- Use element-specific screenshots for focused testing

### 4. Performance Monitoring
- Set appropriate performance thresholds
- Monitor memory usage during long test runs
- Track API response times and page load speeds

### 5. Error Handling
- Implement graceful degradation for missing features
- Provide clear error messages and recovery suggestions
- Log errors appropriately without exposing sensitive data

## 🚨 Troubleshooting

### Common Issues

1. **Screenshot Capture Fails**
   - Ensure html2canvas is loaded
   - Check for CORS issues with external resources
   - Verify element visibility and dimensions

2. **API Tests Fail**
   - Check backend server availability
   - Verify API endpoint URLs
   - Ensure proper authentication if required

3. **Wallet Tests Fail**
   - Confirm wallet extensions are installed
   - Check for wallet connection permissions
   - Verify network configuration

4. **Performance Tests Inconsistent**
   - Run tests multiple times for averages
   - Consider network conditions and system load
   - Use appropriate performance thresholds

### Debug Mode

Enable debug logging:
```typescript
const config = {
  ...DEFAULT_TEST_CONFIG,
  debug: true,
  verbose: true
};

await testInfrastructure.initialize(config);
```

## 📈 Extending the Infrastructure

### Adding New Test Categories

1. Create new test module in the testing directory
2. Implement required interfaces from `types.ts`
3. Register with the comprehensive tester
4. Update configuration as needed

### Custom Validators

```typescript
// Custom data validator
const customValidator = (data: any): ValidationResult => {
  return {
    component: 'custom',
    dataSource: 'api',
    isValid: data.value > 0,
    expectedValue: '>0',
    actualValue: data.value,
    message: 'Value must be positive',
    timestamp: new Date()
  };
};
```

### Custom Test Cases

```typescript
const customTestCase: TestCase = {
  name: 'Custom Feature Test',
  description: 'Test custom functionality',
  preconditions: ['Feature is enabled'],
  steps: ['Navigate to feature', 'Interact with UI'],
  expectedResults: ['Feature works correctly'],
  priority: 'high',
  category: TestCategory.UI
};
```

## 📚 API Reference

See individual module files for detailed API documentation:
- `types.ts` - Complete type definitions
- `test-utilities.ts` - Utility functions
- `test-infrastructure.ts` - Infrastructure management
- `comprehensive-tester.ts` - Main testing orchestrator

## 🤝 Contributing

When adding new tests or features:
1. Follow existing patterns and conventions
2. Add proper TypeScript types
3. Include comprehensive error handling
4. Update documentation and examples
5. Test thoroughly across different browsers

## 📄 License

This testing infrastructure is part of the SeiMoney project and follows the same licensing terms.