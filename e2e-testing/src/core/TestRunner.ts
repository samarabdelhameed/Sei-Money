import { 
  TestConfig, 
  TestScenario, 
  TestResult, 
  TestSuiteResult, 
  TestExecutionStatus,
  TestStep,
  StepResult,
  ErrorType,
  TestSummary,
  Logger
} from '../types';
import { getLogger, createChildLogger } from '../utils/logger';
import { initializeEnvironment, cleanupEnvironment, checkEnvironmentHealth } from '../utils/environment';

/**
 * Core test runner class that orchestrates test execution
 */
export class TestRunner {
  private config: TestConfig;
  private logger: Logger;
  private executionStatus: TestExecutionStatus;
  private scenarios: Map<string, TestScenario> = new Map();
  private isInitialized: boolean = false;

  constructor(config: TestConfig) {
    this.config = config;
    this.logger = createChildLogger(getLogger(), { component: 'TestRunner' });
    this.executionStatus = {
      isRunning: false,
      progress: 0,
      errors: 0,
      warnings: 0,
    };
  }

  /**
   * Initialize the test runner and environment
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('TestRunner already initialized');
      return;
    }

    this.logger.info('Initializing TestRunner...');

    try {
      // Initialize environment
      await initializeEnvironment(this.config);

      // Check environment health
      const health = await checkEnvironmentHealth(this.config);
      if (health.overall.status !== 'healthy') {
        throw new Error(`Environment health check failed: ${health.overall.error}`);
      }

      this.isInitialized = true;
      this.logger.info('TestRunner initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize TestRunner', { error });
      throw error;
    }
  }

  /**
   * Register a test scenario
   */
  registerScenario(scenario: TestScenario): void {
    this.logger.debug(`Registering scenario: ${scenario.id}`, { scenario: scenario.name });
    this.scenarios.set(scenario.id, scenario);
  }

  /**
   * Execute a single test scenario
   */
  async executeScenario(scenarioId: string): Promise<TestResult> {
    if (!this.isInitialized) {
      throw new Error('TestRunner not initialized. Call initialize() first.');
    }

    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario not found: ${scenarioId}`);
    }

    this.logger.info(`Executing scenario: ${scenario.name}`, { scenarioId });

    const startTime = new Date().toISOString();
    const executionStartTime = Date.now();

    // Update execution status
    this.executionStatus = {
      isRunning: true,
      currentScenario: scenario.name,
      progress: 0,
      startTime,
      errors: 0,
      warnings: 0,
    };

    const result: TestResult = {
      scenarioId,
      success: false,
      executionTime: 0,
      startTime,
      endTime: '',
      steps: [],
      dataValidations: [],
      screenshots: [],
      errors: [],
      warnings: [],
    };

    try {
      // Execute scenario steps
      for (let i = 0; i < scenario.steps.length; i++) {
        const step = scenario.steps[i];
        this.executionStatus.currentStep = step.action;
        this.executionStatus.progress = ((i + 1) / scenario.steps.length) * 100;

        this.logger.debug(`Executing step: ${step.action}`, { stepId: step.id });

        const stepResult = await this.executeStep(step, scenario);
        result.steps.push(stepResult);

        if (!stepResult.success) {
          this.executionStatus.errors++;
          result.errors.push(stepResult.error!);

          // Check if we should continue or fail fast
          if (!stepResult.error?.retryable) {
            this.logger.error(`Non-retryable error in step ${step.id}, stopping scenario execution`);
            break;
          }
        }
      }

      // Determine overall success
      result.success = result.steps.every(step => step.success) && result.errors.length === 0;
      result.executionTime = Date.now() - executionStartTime;
      result.endTime = new Date().toISOString();

      this.logger.info(`Scenario execution completed: ${scenario.name}`, {
        success: result.success,
        executionTime: result.executionTime,
        steps: result.steps.length,
        errors: result.errors.length,
      });

    } catch (error: any) {
      this.logger.error(`Scenario execution failed: ${scenario.name}`, { error });
      
      result.success = false;
      result.executionTime = Date.now() - executionStartTime;
      result.endTime = new Date().toISOString();
      result.errors.push({
        type: ErrorType.ENVIRONMENT_SETUP_FAILED,
        message: `Scenario execution failed: ${error.message}`,
        details: error,
        timestamp: new Date().toISOString(),
        retryable: false,
      });
    } finally {
      // Reset execution status
      this.executionStatus = {
        isRunning: false,
        progress: 100,
        errors: result.errors.length,
        warnings: result.warnings.length,
      };
    }

    return result;
  }

  /**
   * Execute multiple scenarios as a test suite
   */
  async executeFullSuite(scenarioIds?: string[]): Promise<TestSuiteResult> {
    if (!this.isInitialized) {
      throw new Error('TestRunner not initialized. Call initialize() first.');
    }

    const startTime = new Date().toISOString();
    const executionStartTime = Date.now();

    // Determine which scenarios to run
    const scenariosToRun = scenarioIds || Array.from(this.scenarios.keys());
    
    this.logger.info(`Executing test suite with ${scenariosToRun.length} scenarios`);

    const results: TestResult[] = [];
    let passedScenarios = 0;
    let failedScenarios = 0;
    let skippedScenarios = 0;

    for (const scenarioId of scenariosToRun) {
      try {
        const result = await this.executeScenario(scenarioId);
        results.push(result);

        if (result.success) {
          passedScenarios++;
        } else {
          failedScenarios++;
        }
      } catch (error: any) {
        this.logger.error(`Failed to execute scenario: ${scenarioId}`, { error });
        skippedScenarios++;
        
        // Create a failed result for the skipped scenario
        results.push({
          scenarioId,
          success: false,
          executionTime: 0,
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          steps: [],
          dataValidations: [],
          screenshots: [],
          errors: [{
            type: ErrorType.ENVIRONMENT_SETUP_FAILED,
            message: `Failed to execute scenario: ${error.message}`,
            details: error,
            timestamp: new Date().toISOString(),
            retryable: false,
          }],
          warnings: [],
        });
      }
    }

    const executionTime = Date.now() - executionStartTime;
    const endTime = new Date().toISOString();

    // Calculate summary statistics
    const summary = this.calculateSummary(results);

    const suiteResult: TestSuiteResult = {
      totalScenarios: scenariosToRun.length,
      passedScenarios,
      failedScenarios,
      skippedScenarios,
      executionTime,
      startTime,
      endTime,
      overallSuccess: failedScenarios === 0 && skippedScenarios === 0,
      results,
      summary,
    };

    this.logger.info('Test suite execution completed', {
      totalScenarios: suiteResult.totalScenarios,
      passed: passedScenarios,
      failed: failedScenarios,
      skipped: skippedScenarios,
      executionTime,
      overallSuccess: suiteResult.overallSuccess,
    });

    return suiteResult;
  }

  /**
   * Execute a single test step
   */
  private async executeStep(step: TestStep, _scenario: TestScenario): Promise<StepResult> {
    const stepLogger = createChildLogger(this.logger, { step: step.id });
    const startTime = Date.now();

    const stepResult: StepResult = {
      stepId: step.id,
      success: false,
      executionTime: 0,
      validations: [],
    };

    try {
      stepLogger.debug(`Executing step: ${step.action}`, { type: step.type, parameters: step.parameters });

      // Execute step based on type
      let result: any;
      switch (step.type) {
        case 'setup':
          result = await this.executeSetupStep(step);
          break;
        case 'cleanup':
          result = await this.executeCleanupStep(step);
          break;
        case 'wait':
          result = await this.executeWaitStep(step);
          break;
        case 'validation':
          result = await this.executeValidationStep(step);
          break;
        default:
          // For now, other step types will be implemented in subsequent tasks
          stepLogger.warn(`Step type '${step.type}' not yet implemented, marking as successful`);
          result = { success: true, message: `Step type '${step.type}' placeholder` };
      }

      stepResult.result = result;
      stepResult.success = true;
      stepResult.executionTime = Date.now() - startTime;

      stepLogger.debug(`Step completed successfully`, { executionTime: stepResult.executionTime });

    } catch (error: any) {
      stepResult.success = false;
      stepResult.executionTime = Date.now() - startTime;
      stepResult.error = {
        type: this.classifyError(error),
        message: error.message,
        details: error,
        timestamp: new Date().toISOString(),
        step: step.id,
        retryable: this.isRetryableError(error),
      };

      stepLogger.error(`Step failed`, { error: stepResult.error });
    }

    return stepResult;
  }

  /**
   * Execute setup step
   */
  private async executeSetupStep(step: TestStep): Promise<any> {
    const { action, parameters } = step;
    
    switch (action) {
      case 'initialize_test_data':
        return await this.initializeTestData(parameters);
      case 'reset_environment':
        return await this.resetTestEnvironment();
      default:
        throw new Error(`Unknown setup action: ${action}`);
    }
  }

  /**
   * Execute cleanup step
   */
  private async executeCleanupStep(step: TestStep): Promise<any> {
    const { action, parameters } = step;
    
    switch (action) {
      case 'cleanup_test_data':
        return await this.cleanupTestData(parameters);
      case 'reset_browser':
        return await this.resetBrowser();
      default:
        throw new Error(`Unknown cleanup action: ${action}`);
    }
  }

  /**
   * Execute wait step
   */
  private async executeWaitStep(step: TestStep): Promise<any> {
    const { parameters } = step;
    const duration = parameters.duration || 1000;
    
    this.logger.debug(`Waiting for ${duration}ms`);
    await new Promise(resolve => setTimeout(resolve, duration));
    
    return { waited: duration };
  }

  /**
   * Execute validation step
   */
  private async executeValidationStep(step: TestStep): Promise<any> {
    const { parameters } = step;
    
    // This is a placeholder - actual validation logic will be implemented in later tasks
    this.logger.debug('Executing validation step', { parameters });
    
    return { validated: true, parameters };
  }

  /**
   * Helper methods for step execution
   */
  private async initializeTestData(parameters: any): Promise<any> {
    this.logger.debug('Initializing test data', { parameters });
    // Placeholder implementation
    return { initialized: true };
  }

  private async resetTestEnvironment(): Promise<any> {
    this.logger.debug('Resetting test environment');
    // Placeholder implementation
    return { reset: true };
  }

  private async cleanupTestData(parameters: any): Promise<any> {
    this.logger.debug('Cleaning up test data', { parameters });
    // Placeholder implementation
    return { cleaned: true };
  }

  private async resetBrowser(): Promise<any> {
    this.logger.debug('Resetting browser');
    // Placeholder implementation
    return { reset: true };
  }

  /**
   * Classify error type
   */
  private classifyError(error: any): ErrorType {
    if (error.code === 'TIMEOUT' || error.message?.includes('timeout')) {
      return ErrorType.TIMEOUT_EXCEEDED;
    }
    if (error.code === 'ECONNREFUSED' || error.message?.includes('connection')) {
      return ErrorType.NETWORK_ERROR;
    }
    return ErrorType.ENVIRONMENT_SETUP_FAILED;
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    const retryableCodes = ['TIMEOUT', 'ECONNREFUSED', 'ENOTFOUND'];
    return retryableCodes.includes(error.code) || error.message?.includes('timeout');
  }

  /**
   * Calculate test summary statistics
   */
  private calculateSummary(results: TestResult[]): TestSummary {
    let totalSteps = 0;
    let passedSteps = 0;
    let failedSteps = 0;
    let totalValidations = 0;
    let passedValidations = 0;
    let failedValidations = 0;
    let screenshotCount = 0;
    let errorCount = 0;
    let warningCount = 0;

    for (const result of results) {
      totalSteps += result.steps.length;
      passedSteps += result.steps.filter(step => step.success).length;
      failedSteps += result.steps.filter(step => !step.success).length;
      
      for (const step of result.steps) {
        totalValidations += step.validations.length;
        passedValidations += step.validations.filter(v => v.isValid).length;
        failedValidations += step.validations.filter(v => !v.isValid).length;
      }
      
      screenshotCount += result.screenshots.length;
      errorCount += result.errors.length;
      warningCount += result.warnings.length;
    }

    return {
      totalSteps,
      passedSteps,
      failedSteps,
      totalValidations,
      passedValidations,
      failedValidations,
      screenshotCount,
      errorCount,
      warningCount,
    };
  }

  /**
   * Get current execution status
   */
  getExecutionStatus(): TestExecutionStatus {
    return { ...this.executionStatus };
  }

  /**
   * Configure the test runner
   */
  configure(config: Partial<TestConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.info('TestRunner configuration updated');
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down TestRunner...');
    
    try {
      await cleanupEnvironment();
      this.isInitialized = false;
      this.logger.info('TestRunner shutdown completed');
    } catch (error) {
      this.logger.error('Error during TestRunner shutdown', { error });
      throw error;
    }
  }
}