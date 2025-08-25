// Test setup file
import { initializeLogger } from '../utils/logger';

// Initialize logger for tests
initializeLogger('debug');

// Set test timeout
jest.setTimeout(30000);

// Global test setup
beforeAll(async () => {
  // Any global setup needed for tests
});

// Global test cleanup
afterAll(async () => {
  // Any global cleanup needed for tests
});