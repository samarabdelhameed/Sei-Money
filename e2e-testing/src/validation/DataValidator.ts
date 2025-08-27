/**
 * Data validation utilities for E2E testing
 */

// import axios from 'axios'; // Removed unused import
import winston from 'winston';

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/validation.log' })
  ]
});

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  executionTime: number;
  timestamp: string;
}

export interface PortfolioData {
  vaults: {
    total: number;
    totalDeposits: number;
    totalYield: number;
    performance: number;
  };
  pots: {
    total: number;
  };
  groups: {
    total: number;
  };
  transfers: {
    total: number;
  };
  allocation: any;
  totalValue: number;
}

export class DataValidator {
  private apiTester: any;
  private config: any;

  constructor(apiTester: any, config: any = {}) {
    this.apiTester = apiTester;
    this.config = {
      tolerance: 0.01,
      ...config
    };
  }

  /**
   * Validate portfolio calculation accuracy
   */
  async validatePortfolioCalculation(portfolioData: PortfolioData, expectedTotals: any): Promise<ValidationResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // Validate individual components
      const calculatedTotal = 
        portfolioData.vaults.total + 
        portfolioData.pots.total + 
        portfolioData.groups.total + 
        portfolioData.transfers.total;

      // Check if calculated total matches expected with tolerance
      const tolerance = this.config.tolerance;
      const isValid = Math.abs(calculatedTotal - expectedTotals.totalValue) <= tolerance;

      if (!isValid) {
        errors.push(`Total calculation mismatch. Expected: ${expectedTotals.totalValue}, Actual: ${calculatedTotal}`);
      }

      // Validate allocation consistency
      if (portfolioData.allocation) {
        for (const [key, value] of Object.entries(portfolioData.allocation)) {
          if (typeof value !== 'number' || value < 0) {
            errors.push(`Invalid allocation value for ${key}: ${value}`);
          }
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };

    } catch (error: any) {
      logger.error(`Portfolio validation failed: ${error.message}`);
      return {
        isValid: false,
        errors: [`Validation error: ${error.message}`],
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Validate numeric field consistency
   */
  public validateNumericField(field: string, actual: number, expected: number): ValidationResult {
    const tolerance = this.config.tolerance;
    const isValid = Math.abs(actual - expected) <= tolerance;

    return {
      isValid,
      errors: isValid ? [] : [
        `Field ${field} mismatch. Expected: ${expected}, Actual: ${actual}`
      ],
      executionTime: 0,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get test data from API endpoints
   */
  async getPortfolioData(): Promise<PortfolioData> {
    try {
      const vaults = await this.getVaultsData();
      const pots = await this.getPotsData();
      const groups = await this.getGroupsData();
      const transfers = await this.getTransferData();

      // Calculate individual component totals based on expected totals
      const calculatedTotals = this.calculateExpectedTotals({
        vaults,
        pots,
        groups,
        transfers
      });

      return calculatedTotals;

    } catch (error: any) {
      logger.error(`Failed to get portfolio data: ${error.message}`);
      return {
        vaults: { total: 0, totalDeposits: 0, totalYield: 0, performance: 0 },
        pots: { total: 0 },
        groups: { total: 0 },
        transfers: { total: 0 },
        allocation: {},
        totalValue: 0
      };
    }
  }

  /**
   * Get vaults data
   */
  private async getVaultsData(): Promise<any> {
    try {
      const response = await this.apiTester.get('/vaults');
      return response.data;
    } catch (error) {
      return { total: 0, count: 0 };
    }
  }

  /**
   * Get pots data
   */
  private async getPotsData(): Promise<any> {
    try {
      const response = await this.apiTester.get('/pots');
      return response.data;
    } catch (error) {
      return { total: 0, count: 0 };
    }
  }

  /**
   * Get groups data
   */
  private async getGroupsData(): Promise<any> {
    try {
      const response = await this.apiTester.get('/groups');
      return response.data;
    } catch (error) {
      return { total: 0, count: 0 };
    }
  }

  /**
   * Get transfer data
   */
  private async getTransferData(): Promise<any> {
    try {
      const response = await this.apiTester.get('/transfers');
      return response.data;
    } catch (error) {
      return { total: 0, count: 0 };
    }
  }

  /**
   * Calculate expected totals
   */
  private calculateExpectedTotals(data: any): PortfolioData {
    return {
      vaults: {
        total: data.vaults.total || 0,
        totalDeposits: data.vaults.totalDeposits || 0,
        totalYield: data.vaults.totalYield || 0,
        performance: data.vaults.totalYield / data.vaults.totalDeposits * 100 || 0,
      },
      pots: {
        total: data.pots.total || 0,
      },
      groups: {
        total: data.groups.total || 0,
      },
      transfers: {
        total: data.transfers.total || 0,
      },
      allocation: {
        vaults: data.vaults.total || 0,
        pots: data.pots.total || 0,
        groups: data.groups.total || 0,
        transfers: data.transfers.total || 0,
      },
      totalValue: (data.vaults.total || 0) + (data.pots.total || 0) + (data.groups.total || 0) + (data.transfers.total || 0)
    };
  }
}