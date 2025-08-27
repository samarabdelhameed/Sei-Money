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

// UI Automation exports
export {
  UIAutomation,
  FormHelpers,
  VisualValidation,
  PageNavigation,
} from './ui';
export type {
  UIAutomationConfig,
  FormField,
  NavigationOptions,
  ElementInteractionOptions,
  PaymentFormData,
  GroupFormData,
  PotFormData,
  VaultFormData,
  VisualComparisonOptions,
  ScreenshotOptions,
  VisualValidationResult,
  SeiMoneyPages,
  NavigationResult,
} from './ui';

// API Testing exports
export {
  APITester,
  HTTPClient,
  ResponseValidator,
  APIEndpoints,
} from './api';
export type {
  APITestConfig,
  APIResponse,
  APITestResult,
  APITestError,
  ValidationResult,
  EndpointTest,
  ValidationRule,
  TransferData,
  GroupData,
  PotData,
  VaultData,
  APIEndpointConfig,
} from './api';

// Export all types
export * from './types';

// Re-export commonly used utilities
export { TestRunner as default } from './core/TestRunner';