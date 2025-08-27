import { APIResponse, ValidationResult, ValidationRule } from './types';
import { getLogger } from '../utils/logger';

export class ResponseValidator {
  /**
   * Validate API response against a set of rules
   */
  static validateResponse<T = any>(
    response: APIResponse<T>,
    rules: ValidationRule[]
  ): ValidationResult[] {
    const results: ValidationResult[] = [];

    for (const rule of rules) {
      const result = this.validateRule(response, rule);
      results.push(result);
      
      if (!result.passed) {
        getLogger().warn(`Validation failed for field '${rule.field}': ${result.message}`);
      }
    }

    return results;
  }

  /**
   * Validate a single rule against the response
   */
  private static validateRule<T = any>(
    response: APIResponse<T>,
    rule: ValidationRule
  ): ValidationResult {
    const fieldValue = this.getFieldValue(response.data, rule.field);
    
    try {
      switch (rule.type) {
        case 'exists':
          return this.validateExists(rule.field, fieldValue, rule);
        
        case 'equals':
          return this.validateEquals(rule.field, fieldValue, rule.value, rule);
        
        case 'contains':
          return this.validateContains(rule.field, fieldValue, rule.value, rule);
        
        case 'matches':
          return this.validateMatches(rule.field, fieldValue, rule.value, rule);
        
        case 'greater_than':
          return this.validateGreaterThan(rule.field, fieldValue, rule.value, rule);
        
        case 'less_than':
          return this.validateLessThan(rule.field, fieldValue, rule.value, rule);
        
        case 'array_length':
          return this.validateArrayLength(rule.field, fieldValue, rule.value, rule);
        
        case 'object_keys':
          return this.validateObjectKeys(rule.field, fieldValue, rule.value, rule);
        
        default:
          return {
            field: rule.field,
            rule: rule.type,
            passed: false,
            message: `Unknown validation rule: ${rule.type}`,
          };
      }
    } catch (error) {
      return {
        field: rule.field,
        rule: rule.type,
        passed: false,
        message: `Validation error: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Get field value from nested object using dot notation
   */
  private static getFieldValue(data: any, fieldPath: string): any {
    if (!fieldPath) return data;
    
    const keys = fieldPath.split('.');
    let value = data;
    
    for (const key of keys) {
      if (value === null || value === undefined) {
        return undefined;
      }
      
      // Handle array indices
      if (key.includes('[') && key.includes(']')) {
        const [arrayKey, indexStr] = key.split('[');
        const index = parseInt(indexStr.replace(']', ''));
        
        if (arrayKey) {
          value = value[arrayKey];
        }
        
        if (Array.isArray(value) && !isNaN(index)) {
          value = value[index];
        } else {
          return undefined;
        }
      } else {
        value = value[key];
      }
    }
    
    return value;
  }

  private static validateExists(
    field: string,
    actual: any,
    rule: ValidationRule
  ): ValidationResult {
    const exists = actual !== undefined && actual !== null;
    
    return {
      field,
      rule: 'exists',
      passed: exists,
      actual,
      message: rule.message || (exists ? 'Field exists' : 'Field does not exist'),
    };
  }

  private static validateEquals(
    field: string,
    actual: any,
    expected: any,
    rule: ValidationRule
  ): ValidationResult {
    const passed = actual === expected;
    
    return {
      field,
      rule: 'equals',
      passed,
      expected,
      actual,
      message: rule.message || (passed ? 'Values are equal' : `Expected ${expected}, got ${actual}`),
    };
  }

  private static validateContains(
    field: string,
    actual: any,
    expected: any,
    rule: ValidationRule
  ): ValidationResult {
    let passed = false;
    
    if (typeof actual === 'string' && typeof expected === 'string') {
      passed = actual.includes(expected);
    } else if (Array.isArray(actual)) {
      passed = actual.includes(expected);
    } else if (typeof actual === 'object' && actual !== null) {
      passed = Object.prototype.hasOwnProperty.call(actual, expected);
    }
    
    return {
      field,
      rule: 'contains',
      passed,
      expected,
      actual,
      message: rule.message || (passed ? 'Contains expected value' : `Does not contain ${expected}`),
    };
  }

  private static validateMatches(
    field: string,
    actual: any,
    pattern: string | RegExp,
    rule: ValidationRule
  ): ValidationResult {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    const passed = typeof actual === 'string' && regex.test(actual);
    
    return {
      field,
      rule: 'matches',
      passed,
      expected: pattern,
      actual,
      message: rule.message || (passed ? 'Matches pattern' : `Does not match pattern ${pattern}`),
    };
  }

  private static validateGreaterThan(
    field: string,
    actual: any,
    expected: number,
    rule: ValidationRule
  ): ValidationResult {
    const passed = typeof actual === 'number' && actual > expected;
    
    return {
      field,
      rule: 'greater_than',
      passed,
      expected,
      actual,
      message: rule.message || (passed ? 'Greater than expected' : `Expected > ${expected}, got ${actual}`),
    };
  }

  private static validateLessThan(
    field: string,
    actual: any,
    expected: number,
    rule: ValidationRule
  ): ValidationResult {
    const passed = typeof actual === 'number' && actual < expected;
    
    return {
      field,
      rule: 'less_than',
      passed,
      expected,
      actual,
      message: rule.message || (passed ? 'Less than expected' : `Expected < ${expected}, got ${actual}`),
    };
  }

  private static validateArrayLength(
    field: string,
    actual: any,
    expectedLength: number,
    rule: ValidationRule
  ): ValidationResult {
    const passed = Array.isArray(actual) && actual.length === expectedLength;
    const actualLength = Array.isArray(actual) ? actual.length : 'not an array';
    
    return {
      field,
      rule: 'array_length',
      passed,
      expected: expectedLength,
      actual: actualLength,
      message: rule.message || (passed ? 'Array length matches' : `Expected length ${expectedLength}, got ${actualLength}`),
    };
  }

  private static validateObjectKeys(
    field: string,
    actual: any,
    expectedKeys: string[],
    rule: ValidationRule
  ): ValidationResult {
    if (typeof actual !== 'object' || actual === null) {
      return {
        field,
        rule: 'object_keys',
        passed: false,
        expected: expectedKeys,
        actual: 'not an object',
        message: rule.message || 'Expected an object',
      };
    }
    
    const actualKeys = Object.keys(actual);
    const hasAllKeys = expectedKeys.every(key => actualKeys.includes(key));
    
    return {
      field,
      rule: 'object_keys',
      passed: hasAllKeys,
      expected: expectedKeys,
      actual: actualKeys,
      message: rule.message || (hasAllKeys ? 'Has all expected keys' : `Missing keys: ${expectedKeys.filter(k => !actualKeys.includes(k)).join(', ')}`),
    };
  }

  /**
   * Validate common API response structure
   */
  static validateStandardResponse<T = any>(
    response: APIResponse<T>,
    expectSuccess: boolean = true
  ): ValidationResult[] {
    const rules: ValidationRule[] = [
      { field: 'ok', type: 'exists', required: true },
      { field: 'ok', type: 'equals', value: expectSuccess },
    ];

    if (expectSuccess) {
      rules.push({ field: 'data', type: 'exists', required: true });
    } else {
      rules.push({ field: 'error', type: 'exists', required: true });
    }

    return this.validateResponse(response, rules);
  }

  /**
   * Validate transfer response structure
   */
  static validateTransferResponse(response: APIResponse): ValidationResult[] {
    const rules: ValidationRule[] = [
      { field: 'ok', type: 'equals', value: true },
      { field: 'data', type: 'exists' },
      { field: 'data.transferId', type: 'exists' },
      { field: 'data.txHash', type: 'exists' },
      { field: 'data.status', type: 'exists' },
      { field: 'data.sender', type: 'exists' },
      { field: 'data.recipient', type: 'exists' },
      { field: 'data.amount', type: 'exists' },
    ];

    return this.validateResponse(response, rules);
  }

  /**
   * Validate group response structure
   */
  static validateGroupResponse(response: APIResponse): ValidationResult[] {
    const rules: ValidationRule[] = [
      { field: 'ok', type: 'equals', value: true },
      { field: 'data', type: 'exists' },
      { field: 'data.id', type: 'exists' },
      { field: 'data.name', type: 'exists' },
      { field: 'data.description', type: 'exists' },
      { field: 'data.targetAmount', type: 'exists' },
      { field: 'data.type', type: 'exists' },
    ];

    return this.validateResponse(response, rules);
  }

  /**
   * Validate pot response structure
   */
  static validatePotResponse(response: APIResponse): ValidationResult[] {
    const rules: ValidationRule[] = [
      { field: 'ok', type: 'equals', value: true },
      { field: 'data', type: 'exists' },
      { field: 'data.id', type: 'exists' },
      { field: 'data.name', type: 'exists' },
      { field: 'data.targetAmount', type: 'exists' },
      { field: 'data.currentAmount', type: 'exists' },
      { field: 'data.targetDate', type: 'exists' },
    ];

    return this.validateResponse(response, rules);
  }

  /**
   * Validate vault response structure
   */
  static validateVaultResponse(response: APIResponse): ValidationResult[] {
    const rules: ValidationRule[] = [
      { field: 'ok', type: 'equals', value: true },
      { field: 'data', type: 'exists' },
      { field: 'data.id', type: 'exists' },
      { field: 'data.name', type: 'exists' },
      { field: 'data.strategy', type: 'exists' },
      { field: 'data.tvl', type: 'exists' },
      { field: 'data.apr', type: 'exists' },
    ];

    return this.validateResponse(response, rules);
  }

  /**
   * Check if all validations passed
   */
  static allValidationsPassed(results: ValidationResult[]): boolean {
    return results.every(result => result.passed);
  }

  /**
   * Get failed validations
   */
  static getFailedValidations(results: ValidationResult[]): ValidationResult[] {
    return results.filter(result => !result.passed);
  }

  /**
   * Format validation results for logging
   */
  static formatValidationResults(results: ValidationResult[]): string {
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    const failed = results.filter(r => !r.passed);
    
    let output = `Validation Results: ${passed}/${total} passed\n`;
    
    if (failed.length > 0) {
      output += '\nFailed Validations:\n';
      failed.forEach(result => {
        output += `  - ${result.field} (${result.rule}): ${result.message}\n`;
      });
    }
    
    return output;
  }
}