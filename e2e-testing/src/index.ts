// Main entry point for the E2E testing framework
export { TestRunner } from './core/TestRunner';
export { getConfig, loadConfig, validateEnvironment, createTestConfig } from './config';
export { createLogger, getLogger, initializeLogger } from './utils/logger';
export { 
  initializeEnvironment, 
  cleanupEnvironment, 
  checkEnvironmentHealth,
  resetEnvironment 
} from './utils/environment';

// Export all types
export * from './types';

// Re-export commonly used utilities
export { TestRunner as default } from './core/TestRunner';