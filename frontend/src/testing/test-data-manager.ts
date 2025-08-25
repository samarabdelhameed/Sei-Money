// Test Data Management and Cleanup Utility

import { TestResult, TestSuite, EnvironmentInfo } from './types';

export interface TestDataSnapshot {
  id: string;
  timestamp: Date;
  testName: string;
  data: any;
  environment: EnvironmentInfo;
}

export interface TestCleanupTask {
  id: string;
  description: string;
  cleanup: () => Promise<void>;
  priority: 'high' | 'medium' | 'low';
}

export class TestDataManager {
  private static instance: TestDataManager;
  private snapshots: Map<string, TestDataSnapshot> = new Map();
  private cleanupTasks: Map<string, TestCleanupTask> = new Map();
  private testResults: Map<string, TestResult[]> = new Map();
  private testSuites: Map<string, TestSuite> = new Map();

  static getInstance(): TestDataManager {
    if (!TestDataManager.instance) {
      TestDataManager.instance = new TestDataManager();
    }
    return TestDataManager.instance;
  }

  // Test Data Snapshot Management
  createSnapshot(testName: string, data: any, environment: EnvironmentInfo): string {
    const id = `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const snapshot: TestDataSnapshot = {
      id,
      timestamp: new Date(),
      testName,
      data: this.deepClone(data),
      environment
    };

    this.snapshots.set(id, snapshot);
    this.persistSnapshot(snapshot);
    
    console.log(`📸 Created test data snapshot: ${id} for ${testName}`);
    return id;
  }

  getSnapshot(id: string): TestDataSnapshot | null {
    return this.snapshots.get(id) || this.loadSnapshot(id);
  }

  getAllSnapshots(): TestDataSnapshot[] {
    return Array.from(this.snapshots.values());
  }

  getSnapshotsForTest(testName: string): TestDataSnapshot[] {
    return Array.from(this.snapshots.values()).filter(s => s.testName === testName);
  }

  deleteSnapshot(id: string): boolean {
    const deleted = this.snapshots.delete(id);
    if (deleted) {
      this.removePersistedSnapshot(id);
      console.log(`🗑️ Deleted test data snapshot: ${id}`);
    }
    return deleted;
  }

  // Test Results Management
  storeTestResults(testSuiteName: string, results: TestResult[]): void {
    this.testResults.set(testSuiteName, results);
    this.persistTestResults(testSuiteName, results);
    console.log(`💾 Stored ${results.length} test results for ${testSuiteName}`);
  }

  getTestResults(testSuiteName: string): TestResult[] {
    return this.testResults.get(testSuiteName) || this.loadTestResults(testSuiteName) || [];
  }

  getAllTestResults(): Map<string, TestResult[]> {
    return new Map(this.testResults);
  }

  // Test Suite Management
  storeTestSuite(suite: TestSuite): void {
    this.testSuites.set(suite.name, suite);
    this.persistTestSuite(suite);
    console.log(`📋 Stored test suite: ${suite.name}`);
  }

  getTestSuite(name: string): TestSuite | null {
    return this.testSuites.get(name) || this.loadTestSuite(name);
  }

  getAllTestSuites(): TestSuite[] {
    return Array.from(this.testSuites.values());
  }

  // Cleanup Task Management
  registerCleanupTask(task: TestCleanupTask): void {
    this.cleanupTasks.set(task.id, task);
    console.log(`🧹 Registered cleanup task: ${task.id} - ${task.description}`);
  }

  async executeCleanupTask(id: string): Promise<boolean> {
    const task = this.cleanupTasks.get(id);
    if (!task) return false;

    try {
      await task.cleanup();
      console.log(`✅ Executed cleanup task: ${task.id}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to execute cleanup task ${task.id}:`, error);
      return false;
    }
  }

  async executeAllCleanupTasks(): Promise<void> {
    console.log('🧹 Executing all cleanup tasks...');
    
    // Sort by priority: high -> medium -> low
    const tasks = Array.from(this.cleanupTasks.values()).sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    for (const task of tasks) {
      await this.executeCleanupTask(task.id);
    }

    this.cleanupTasks.clear();
    console.log('✅ All cleanup tasks completed');
  }

  // Data Persistence Methods
  private persistSnapshot(snapshot: TestDataSnapshot): void {
    try {
      const key = `seiMoney_snapshot_${snapshot.id}`;
      localStorage.setItem(key, JSON.stringify(snapshot));
    } catch (error) {
      console.warn('Failed to persist snapshot:', error);
    }
  }

  private loadSnapshot(id: string): TestDataSnapshot | null {
    try {
      const key = `seiMoney_snapshot_${id}`;
      const data = localStorage.getItem(key);
      if (data) {
        const snapshot = JSON.parse(data);
        snapshot.timestamp = new Date(snapshot.timestamp);
        this.snapshots.set(id, snapshot);
        return snapshot;
      }
    } catch (error) {
      console.warn('Failed to load snapshot:', error);
    }
    return null;
  }

  private removePersistedSnapshot(id: string): void {
    try {
      const key = `seiMoney_snapshot_${id}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove persisted snapshot:', error);
    }
  }

  private persistTestResults(testSuiteName: string, results: TestResult[]): void {
    try {
      const key = `seiMoney_results_${testSuiteName}`;
      localStorage.setItem(key, JSON.stringify(results));
    } catch (error) {
      console.warn('Failed to persist test results:', error);
    }
  }

  private loadTestResults(testSuiteName: string): TestResult[] | null {
    try {
      const key = `seiMoney_results_${testSuiteName}`;
      const data = localStorage.getItem(key);
      if (data) {
        const results = JSON.parse(data);
        // Convert timestamp strings back to Date objects
        results.forEach((result: TestResult) => {
          result.timestamp = new Date(result.timestamp);
        });
        this.testResults.set(testSuiteName, results);
        return results;
      }
    } catch (error) {
      console.warn('Failed to load test results:', error);
    }
    return null;
  }

  private persistTestSuite(suite: TestSuite): void {
    try {
      const key = `seiMoney_suite_${suite.name}`;
      localStorage.setItem(key, JSON.stringify(suite));
    } catch (error) {
      console.warn('Failed to persist test suite:', error);
    }
  }

  private loadTestSuite(name: string): TestSuite | null {
    try {
      const key = `seiMoney_suite_${name}`;
      const data = localStorage.getItem(key);
      if (data) {
        const suite = JSON.parse(data);
        // Convert timestamp strings back to Date objects
        suite.startTime = new Date(suite.startTime);
        if (suite.endTime) suite.endTime = new Date(suite.endTime);
        suite.tests.forEach((test: TestResult) => {
          test.timestamp = new Date(test.timestamp);
        });
        this.testSuites.set(name, suite);
        return suite;
      }
    } catch (error) {
      console.warn('Failed to load test suite:', error);
    }
    return null;
  }

  // Utility Methods
  private deepClone(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    
    const cloned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }
    return cloned;
  }

  // Cleanup and Maintenance
  async cleanupOldData(maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
    console.log('🧹 Cleaning up old test data...');
    
    const cutoffTime = Date.now() - maxAge;
    let cleanedCount = 0;

    // Clean old snapshots
    for (const [id, snapshot] of this.snapshots.entries()) {
      if (snapshot.timestamp.getTime() < cutoffTime) {
        this.deleteSnapshot(id);
        cleanedCount++;
      }
    }

    // Clean old localStorage data
    try {
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith('seiMoney_') && this.isOldData(key, cutoffTime)
      );
      keys.forEach(key => localStorage.removeItem(key));
      cleanedCount += keys.length;
    } catch (error) {
      console.warn('Failed to clean localStorage:', error);
    }

    console.log(`✅ Cleaned up ${cleanedCount} old data items`);
  }

  private isOldData(key: string, cutoffTime: number): boolean {
    try {
      const data = localStorage.getItem(key);
      if (!data) return true;
      
      const parsed = JSON.parse(data);
      const timestamp = parsed.timestamp || parsed.startTime;
      if (!timestamp) return true;
      
      return new Date(timestamp).getTime() < cutoffTime;
    } catch {
      return true; // Remove invalid data
    }
  }

  clearAllTestData(): void {
    console.log('🗑️ Clearing all test data...');
    
    this.snapshots.clear();
    this.testResults.clear();
    this.testSuites.clear();
    this.cleanupTasks.clear();

    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('seiMoney_'));
      keys.forEach(key => localStorage.removeItem(key));
      
      const sessionKeys = Object.keys(sessionStorage).filter(key => key.startsWith('seiMoney_'));
      sessionKeys.forEach(key => sessionStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear stored data:', error);
    }

    console.log('✅ All test data cleared');
  }

  // Statistics and Reporting
  getDataStatistics(): {
    snapshots: number;
    testResults: number;
    testSuites: number;
    cleanupTasks: number;
    storageUsage: number;
  } {
    let storageUsage = 0;
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('seiMoney_'));
      storageUsage = keys.reduce((total, key) => {
        const item = localStorage.getItem(key);
        return total + (item ? item.length : 0);
      }, 0);
    } catch (error) {
      console.warn('Failed to calculate storage usage:', error);
    }

    return {
      snapshots: this.snapshots.size,
      testResults: this.testResults.size,
      testSuites: this.testSuites.size,
      cleanupTasks: this.cleanupTasks.size,
      storageUsage: Math.round(storageUsage / 1024) // KB
    };
  }

  exportTestData(): string {
    const data = {
      snapshots: Array.from(this.snapshots.values()),
      testResults: Object.fromEntries(this.testResults),
      testSuites: Array.from(this.testSuites.values()),
      exportTime: new Date().toISOString(),
      version: '1.0.0'
    };

    return JSON.stringify(data, null, 2);
  }

  importTestData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      // Import snapshots
      if (data.snapshots) {
        data.snapshots.forEach((snapshot: TestDataSnapshot) => {
          snapshot.timestamp = new Date(snapshot.timestamp);
          this.snapshots.set(snapshot.id, snapshot);
        });
      }

      // Import test results
      if (data.testResults) {
        Object.entries(data.testResults).forEach(([name, results]) => {
          (results as TestResult[]).forEach(result => {
            result.timestamp = new Date(result.timestamp);
          });
          this.testResults.set(name, results as TestResult[]);
        });
      }

      // Import test suites
      if (data.testSuites) {
        data.testSuites.forEach((suite: TestSuite) => {
          suite.startTime = new Date(suite.startTime);
          if (suite.endTime) suite.endTime = new Date(suite.endTime);
          suite.tests.forEach(test => {
            test.timestamp = new Date(test.timestamp);
          });
          this.testSuites.set(suite.name, suite);
        });
      }

      console.log('✅ Test data imported successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to import test data:', error);
      return false;
    }
  }
}

// Export singleton instance
export const testDataManager = TestDataManager.getInstance();

// Register default cleanup tasks
testDataManager.registerCleanupTask({
  id: 'clear_test_data',
  description: 'Clear all test data from storage',
  cleanup: async () => {
    testDataManager.clearAllTestData();
  },
  priority: 'low'
});

testDataManager.registerCleanupTask({
  id: 'cleanup_old_data',
  description: 'Remove test data older than 24 hours',
  cleanup: async () => {
    await testDataManager.cleanupOldData();
  },
  priority: 'medium'
});