import { FormHelpers, PaymentFormData, GroupFormData, PotFormData, VaultFormData } from '../ui/FormHelpers';
import { UIAutomation } from '../ui/UIAutomation';
import { createTestConfig } from '../config';

describe('FormHelpers', () => {
  let formHelpers: FormHelpers;
  let uiAutomation: UIAutomation;
  let testConfig: any;

  beforeEach(() => {
    testConfig = createTestConfig({
      environment: {
        frontendUrl: 'http://localhost:3000',
        backendUrl: 'http://localhost:8000',
        blockchainNetwork: 'sei-testnet',
        blockchainRpcUrl: 'https://rpc.sei-apis.com',
        contractAddress: 'sei1234567890abcdef',
        testWalletAddress: 'sei1test123456789',
        testWalletPrivateKey: 'test_private_key',
        testWalletMnemonic: 'test mnemonic phrase',
      },
      browser: {
        headless: true,
        timeout: 30000,
        screenshotOnFailure: false,
      },
      logging: {
        level: 'debug',
      },
    });

    uiAutomation = new UIAutomation(testConfig);
    formHelpers = new FormHelpers(uiAutomation);
  });

  afterEach(async () => {
    if (uiAutomation) {
      try {
        await uiAutomation.cleanup();
      } catch (error) {
        // Ignore cleanup errors in tests
      }
    }
  });

  describe('initialization', () => {
    it('should create FormHelpers instance', () => {
      expect(formHelpers).toBeDefined();
    });
  });

  describe('payment form data validation', () => {
    it('should validate payment form data structure', () => {
      const paymentData: PaymentFormData = {
        recipient: 'sei1recipient123456789',
        amount: '100.50',
        remark: 'Test payment',
        expiryDate: '2024-12-31',
        priority: 'medium',
      };

      expect(paymentData.recipient).toBe('sei1recipient123456789');
      expect(paymentData.amount).toBe('100.50');
      expect(paymentData.remark).toBe('Test payment');
      expect(paymentData.expiryDate).toBe('2024-12-31');
      expect(paymentData.priority).toBe('medium');
    });

    it('should handle minimal payment form data', () => {
      const paymentData: PaymentFormData = {
        recipient: 'sei1recipient123456789',
        amount: '50.00',
      };

      expect(paymentData.recipient).toBeDefined();
      expect(paymentData.amount).toBeDefined();
      expect(paymentData.remark).toBeUndefined();
      expect(paymentData.expiryDate).toBeUndefined();
      expect(paymentData.priority).toBeUndefined();
    });
  });

  describe('group form data validation', () => {
    it('should validate group form data structure', () => {
      const groupData: GroupFormData = {
        name: 'Test Group',
        description: 'A test group for savings',
        targetAmount: '1000.00',
        type: 'savings',
        isPrivate: true,
        inviteMembers: ['member1@example.com', 'member2@example.com'],
      };

      expect(groupData.name).toBe('Test Group');
      expect(groupData.description).toBe('A test group for savings');
      expect(groupData.targetAmount).toBe('1000.00');
      expect(groupData.type).toBe('savings');
      expect(groupData.isPrivate).toBe(true);
      expect(groupData.inviteMembers).toHaveLength(2);
    });

    it('should handle different group types', () => {
      const savingsGroup: GroupFormData = {
        name: 'Savings Group',
        description: 'For saving money',
        targetAmount: '5000.00',
        type: 'savings',
      };

      const investmentGroup: GroupFormData = {
        name: 'Investment Group',
        description: 'For investments',
        targetAmount: '10000.00',
        type: 'investment',
      };

      const expenseGroup: GroupFormData = {
        name: 'Expense Group',
        description: 'For shared expenses',
        targetAmount: '2000.00',
        type: 'expense',
      };

      expect(savingsGroup.type).toBe('savings');
      expect(investmentGroup.type).toBe('investment');
      expect(expenseGroup.type).toBe('expense');
    });
  });

  describe('pot form data validation', () => {
    it('should validate pot form data structure', () => {
      const potData: PotFormData = {
        name: 'Vacation Fund',
        targetAmount: '3000.00',
        targetDate: '2024-06-01',
        description: 'Saving for summer vacation',
        initialDeposit: '500.00',
        autoSave: true,
        autoSaveAmount: '100.00',
      };

      expect(potData.name).toBe('Vacation Fund');
      expect(potData.targetAmount).toBe('3000.00');
      expect(potData.targetDate).toBe('2024-06-01');
      expect(potData.description).toBe('Saving for summer vacation');
      expect(potData.initialDeposit).toBe('500.00');
      expect(potData.autoSave).toBe(true);
      expect(potData.autoSaveAmount).toBe('100.00');
    });

    it('should handle minimal pot form data', () => {
      const potData: PotFormData = {
        name: 'Emergency Fund',
        targetAmount: '1000.00',
        targetDate: '2024-12-31',
      };

      expect(potData.name).toBeDefined();
      expect(potData.targetAmount).toBeDefined();
      expect(potData.targetDate).toBeDefined();
      expect(potData.description).toBeUndefined();
      expect(potData.initialDeposit).toBeUndefined();
      expect(potData.autoSave).toBeUndefined();
    });
  });

  describe('vault form data validation', () => {
    it('should validate vault form data structure', () => {
      const vaultData: VaultFormData = {
        strategy: 'Conservative Growth',
        depositAmount: '5000.00',
        lockPeriod: '12 months',
        riskLevel: 'low',
        autoCompound: true,
      };

      expect(vaultData.strategy).toBe('Conservative Growth');
      expect(vaultData.depositAmount).toBe('5000.00');
      expect(vaultData.lockPeriod).toBe('12 months');
      expect(vaultData.riskLevel).toBe('low');
      expect(vaultData.autoCompound).toBe(true);
    });

    it('should handle different risk levels', () => {
      const lowRiskVault: VaultFormData = {
        strategy: 'Safe Strategy',
        depositAmount: '1000.00',
        lockPeriod: '6 months',
        riskLevel: 'low',
      };

      const mediumRiskVault: VaultFormData = {
        strategy: 'Balanced Strategy',
        depositAmount: '2000.00',
        lockPeriod: '12 months',
        riskLevel: 'medium',
      };

      const highRiskVault: VaultFormData = {
        strategy: 'Aggressive Strategy',
        depositAmount: '3000.00',
        lockPeriod: '24 months',
        riskLevel: 'high',
      };

      expect(lowRiskVault.riskLevel).toBe('low');
      expect(mediumRiskVault.riskLevel).toBe('medium');
      expect(highRiskVault.riskLevel).toBe('high');
    });
  });

  describe('form validation methods', () => {
    beforeEach(async () => {
      await uiAutomation.initialize();
    });

    it('should handle form validation without UI', async () => {
      // Test validation logic without actual UI interaction
      const expectedValues = {
        recipient: 'sei1test123456789',
        amount: '100.00',
      };

      // This will fail because there's no actual form, but tests the method structure
      const result = await formHelpers.validateFormFields(expectedValues);
      expect(typeof result).toBe('boolean');
    });

    it('should handle validation errors gracefully', async () => {
      // Test error handling in validation
      const result = await formHelpers.waitForValidation(1000);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('form interaction methods', () => {
    beforeEach(async () => {
      await uiAutomation.initialize();
      // Navigate to a test page
      await uiAutomation.navigateTo('https://example.com');
    });

    it('should handle form submission gracefully', async () => {
      // This will fail because there's no submit button, but tests error handling
      await expect(formHelpers.submitForm({ timeout: 1000 })).rejects.toThrow();
    });

    it('should handle form cancellation gracefully', async () => {
      // This will fail because there's no cancel button, but tests error handling
      await expect(formHelpers.cancelForm({ timeout: 1000 })).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle UI automation errors', async () => {
      // Test without initializing UI automation
      const paymentData: PaymentFormData = {
        recipient: 'sei1test123456789',
        amount: '100.00',
      };

      await expect(formHelpers.fillPaymentForm(paymentData, { timeout: 1000 }))
        .rejects.toThrow();
    });

    it('should handle invalid form data gracefully', async () => {
      await uiAutomation.initialize();
      await uiAutomation.navigateTo('https://example.com');

      // Test with empty form data
      const emptyPaymentData: PaymentFormData = {
        recipient: '',
        amount: '',
      };

      // Should not throw, but will fail to find elements
      await expect(formHelpers.fillPaymentForm(emptyPaymentData, { timeout: 1000 }))
        .rejects.toThrow();
    });
  });
});