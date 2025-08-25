// Jest setup file for blockchain tests
import { config } from '../config';

// Extend Jest timeout for blockchain operations
jest.setTimeout(30000);

// Mock console.log in tests to reduce noise
const originalLog = console.log;
console.log = (...args: any[]) => {
  if (process.env['NODE_ENV'] === 'test' && !process.env['VERBOSE_TESTS']) {
    return;
  }
  originalLog(...args);
};

// Validate config before running tests
beforeAll(() => {
  try {
    config; // This will trigger validation
  } catch (error) {
    console.error('Configuration validation failed:', error);
    throw error;
  }
});