/**
 * Test setup file for Jest
 */

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to suppress console.log in tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Mock fetch if not available
if (!global.fetch) {
  global.fetch = jest.fn();
}

// Mock crypto if not available
if (!global.crypto) {
  global.crypto = {
    getRandomValues: jest.fn(),
    subtle: {} as any,
  } as any;
}

// Mock TextEncoder/TextDecoder if not available
if (!global.TextEncoder) {
  global.TextEncoder = require('util').TextEncoder;
}

if (!global.TextDecoder) {
  global.TextDecoder = require('util').TextDecoder;
}

// Set test timeout
jest.setTimeout(30000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
