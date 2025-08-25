// Test Reporter - Quick Implementation
import { TestResult, TestSuite, TestSummary } from './types';

export class TestReporter {
  private static instance: TestReporter;

  static getInstance(): TestReporter {
    if (!TestReporter.instance) {
      TestReporter.instance = new TestReporter();
    }
    return TestReporter.instance;
  }

  generateReport(testSuite: TestSuite): string {
    const { name, tests, startTime, endTime, summary } = testSuite;
    
    let report = `
# Test Report: ${name}
**Generated:** ${new Date().toISOString()}
**Duration:** ${endTime ? Math.round((endTime.getTime() - startTime.getTime()) / 1000) : 'N/A'}s

## Summary
- **Total Tests:** ${summary.total}
- **Passed:** ${summary.passed} ✅
- **Failed:** ${summary.failed} ❌
- **Warnings:** ${summary.warnings} ⚠️
- **Pass Rate:** ${((summary.passed / summary.total) * 100).toFixed(1)}%

## Test Results
`;

    tests.forEach(test => {
      const status = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⚠️';
      report += `
### ${status} ${test.testName}
- **Status:** ${test.status}
- **Duration:** ${test.executionTime.toFixed(2)}ms
- **Details:** ${test.details}
${test.errors?.length ? `- **Errors:** ${test.errors.join(', ')}` : ''}
`;
    });

    return report;
  }

  logToConsole(testSuite: TestSuite): void {
    console.group(`🧪 Test Suite: ${testSuite.name}`);
    console.log(`📊 Summary: ${testSuite.summary.passed}/${testSuite.summary.total} passed`);
    
    testSuite.tests.forEach(test => {
      const emoji = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⚠️';
      console.log(`${emoji} ${test.testName}: ${test.details}`);
      if (test.errors?.length) {
        console.error('Errors:', test.errors);
      }
    });
    
    console.groupEnd();
  }

  createTestSuite(name: string, tests: TestResult[]): TestSuite {
    const summary: TestSummary = {
      total: tests.length,
      passed: tests.filter(t => t.status === 'passed').length,
      failed: tests.filter(t => t.status === 'failed').length,
      warnings: tests.filter(t => t.status === 'warning').length,
      skipped: 0,
      criticalIssues: tests.filter(t => t.status === 'failed' && t.errors?.length).length
    };

    return {
      name,
      description: `Comprehensive testing of ${name}`,
      tests,
      startTime: new Date(),
      endTime: new Date(),
      totalDuration: tests.reduce((sum, t) => sum + t.executionTime, 0),
      passRate: (summary.passed / summary.total) * 100,
      summary
    };
  }
}