import { UIAutomation, FormField, ElementInteractionOptions } from './UIAutomation';
import { Logger } from '../types';
import { getLogger, createChildLogger } from '../utils/logger';

export interface PaymentFormData {
  recipient: string;
  amount: string;
  remark?: string;
  expiryDate?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface GroupFormData {
  name: string;
  description: string;
  targetAmount: string;
  type: 'savings' | 'investment' | 'expense';
  isPrivate?: boolean;
  inviteMembers?: string[];
}

export interface PotFormData {
  name: string;
  targetAmount: string;
  targetDate: string;
  description?: string;
  initialDeposit?: string;
  autoSave?: boolean;
  autoSaveAmount?: string;
}

export interface VaultFormData {
  strategy: string;
  depositAmount: string;
  lockPeriod: string;
  riskLevel?: 'low' | 'medium' | 'high';
  autoCompound?: boolean;
}

/**
 * Form helpers for SeiMoney platform-specific forms
 */
export class FormHelpers {
  private uiAutomation: UIAutomation;
  private logger: Logger;

  constructor(uiAutomation: UIAutomation) {
    this.uiAutomation = uiAutomation;
    this.logger = createChildLogger(getLogger(), { component: 'FormHelpers' });
  }

  /**
   * Fill payment transfer form
   */
  async fillPaymentForm(data: PaymentFormData, options: ElementInteractionOptions = {}): Promise<void> {
    this.logger.info('Filling payment form', { recipient: data.recipient, amount: data.amount });

    const fields: FormField[] = [
      {
        selector: '[data-testid="recipient-input"], #recipient, input[name="recipient"]',
        value: data.recipient,
        type: 'text',
      },
      {
        selector: '[data-testid="amount-input"], #amount, input[name="amount"]',
        value: data.amount,
        type: 'number',
      },
    ];

    // Add optional fields if provided
    if (data.remark) {
      fields.push({
        selector: '[data-testid="remark-input"], #remark, input[name="remark"], textarea[name="remark"]',
        value: data.remark,
        type: 'text',
      });
    }

    if (data.expiryDate) {
      fields.push({
        selector: '[data-testid="expiry-date-input"], #expiryDate, input[name="expiryDate"]',
        value: data.expiryDate,
        type: 'text',
      });
    }

    if (data.priority) {
      fields.push({
        selector: '[data-testid="priority-select"], #priority, select[name="priority"]',
        value: data.priority,
        type: 'select',
      });
    }

    try {
      await this.uiAutomation.fillForm(fields, options);
      this.logger.info('Payment form filled successfully');
    } catch (error) {
      this.logger.error('Failed to fill payment form', { error });
      throw error;
    }
  }

  /**
   * Fill group creation form
   */
  async fillGroupForm(data: GroupFormData, options: ElementInteractionOptions = {}): Promise<void> {
    this.logger.info('Filling group form', { name: data.name, type: data.type });

    const fields: FormField[] = [
      {
        selector: '[data-testid="group-name-input"], #groupName, input[name="groupName"]',
        value: data.name,
        type: 'text',
      },
      {
        selector: '[data-testid="group-description-input"], #description, textarea[name="description"]',
        value: data.description,
        type: 'text',
      },
      {
        selector: '[data-testid="target-amount-input"], #targetAmount, input[name="targetAmount"]',
        value: data.targetAmount,
        type: 'number',
      },
      {
        selector: '[data-testid="group-type-select"], #groupType, select[name="groupType"]',
        value: data.type,
        type: 'select',
      },
    ];

    // Add privacy setting if specified
    if (data.isPrivate !== undefined) {
      fields.push({
        selector: '[data-testid="private-group-checkbox"], #isPrivate, input[name="isPrivate"]',
        value: data.isPrivate.toString(),
        type: 'checkbox',
      });
    }

    try {
      await this.uiAutomation.fillForm(fields, options);

      // Handle member invitations if provided
      if (data.inviteMembers && data.inviteMembers.length > 0) {
        await this.addGroupMembers(data.inviteMembers, options);
      }

      this.logger.info('Group form filled successfully');
    } catch (error) {
      this.logger.error('Failed to fill group form', { error });
      throw error;
    }
  }

  /**
   * Fill savings pot form
   */
  async fillPotForm(data: PotFormData, options: ElementInteractionOptions = {}): Promise<void> {
    this.logger.info('Filling pot form', { name: data.name, targetAmount: data.targetAmount });

    const fields: FormField[] = [
      {
        selector: '[data-testid="pot-name-input"], #potName, input[name="potName"]',
        value: data.name,
        type: 'text',
      },
      {
        selector: '[data-testid="target-amount-input"], #targetAmount, input[name="targetAmount"]',
        value: data.targetAmount,
        type: 'number',
      },
      {
        selector: '[data-testid="target-date-input"], #targetDate, input[name="targetDate"]',
        value: data.targetDate,
        type: 'text',
      },
    ];

    // Add optional fields
    if (data.description) {
      fields.push({
        selector: '[data-testid="pot-description-input"], #description, textarea[name="description"]',
        value: data.description,
        type: 'text',
      });
    }

    if (data.initialDeposit) {
      fields.push({
        selector: '[data-testid="initial-deposit-input"], #initialDeposit, input[name="initialDeposit"]',
        value: data.initialDeposit,
        type: 'number',
      });
    }

    if (data.autoSave !== undefined) {
      fields.push({
        selector: '[data-testid="auto-save-checkbox"], #autoSave, input[name="autoSave"]',
        value: data.autoSave.toString(),
        type: 'checkbox',
      });
    }

    if (data.autoSaveAmount) {
      fields.push({
        selector: '[data-testid="auto-save-amount-input"], #autoSaveAmount, input[name="autoSaveAmount"]',
        value: data.autoSaveAmount,
        type: 'number',
      });
    }

    try {
      await this.uiAutomation.fillForm(fields, options);
      this.logger.info('Pot form filled successfully');
    } catch (error) {
      this.logger.error('Failed to fill pot form', { error });
      throw error;
    }
  }

  /**
   * Fill vault investment form
   */
  async fillVaultForm(data: VaultFormData, options: ElementInteractionOptions = {}): Promise<void> {
    this.logger.info('Filling vault form', { strategy: data.strategy, depositAmount: data.depositAmount });

    const fields: FormField[] = [
      {
        selector: '[data-testid="strategy-select"], #strategy, select[name="strategy"]',
        value: data.strategy,
        type: 'select',
      },
      {
        selector: '[data-testid="deposit-amount-input"], #depositAmount, input[name="depositAmount"]',
        value: data.depositAmount,
        type: 'number',
      },
      {
        selector: '[data-testid="lock-period-select"], #lockPeriod, select[name="lockPeriod"]',
        value: data.lockPeriod,
        type: 'select',
      },
    ];

    // Add optional fields
    if (data.riskLevel) {
      fields.push({
        selector: '[data-testid="risk-level-select"], #riskLevel, select[name="riskLevel"]',
        value: data.riskLevel,
        type: 'select',
      });
    }

    if (data.autoCompound !== undefined) {
      fields.push({
        selector: '[data-testid="auto-compound-checkbox"], #autoCompound, input[name="autoCompound"]',
        value: data.autoCompound.toString(),
        type: 'checkbox',
      });
    }

    try {
      await this.uiAutomation.fillForm(fields, options);
      this.logger.info('Vault form filled successfully');
    } catch (error) {
      this.logger.error('Failed to fill vault form', { error });
      throw error;
    }
  }

  /**
   * Submit form by clicking submit button
   */
  async submitForm(options: ElementInteractionOptions = {}): Promise<void> {
    this.logger.info('Submitting form');

    const submitSelectors = [
      '[data-testid="submit-button"]',
      'button[type="submit"]',
      '#submit',
      '.submit-btn',
      'button:has-text("Submit")',
      'button:has-text("Create")',
      'button:has-text("Save")',
      'button:has-text("Confirm")',
    ];

    try {
      for (const selector of submitSelectors) {
        if (await this.uiAutomation.isElementVisible(selector, 1000)) {
          await this.uiAutomation.clickElement(selector, options);
          this.logger.info('Form submitted successfully');
          return;
        }
      }

      throw new Error('Submit button not found');
    } catch (error) {
      this.logger.error('Failed to submit form', { error });
      throw error;
    }
  }

  /**
   * Cancel form by clicking cancel button
   */
  async cancelForm(options: ElementInteractionOptions = {}): Promise<void> {
    this.logger.info('Canceling form');

    const cancelSelectors = [
      '[data-testid="cancel-button"]',
      'button[type="button"]:has-text("Cancel")',
      '#cancel',
      '.cancel-btn',
      'button:has-text("Cancel")',
      'button:has-text("Close")',
    ];

    try {
      for (const selector of cancelSelectors) {
        if (await this.uiAutomation.isElementVisible(selector, 1000)) {
          await this.uiAutomation.clickElement(selector, options);
          this.logger.info('Form canceled successfully');
          return;
        }
      }

      throw new Error('Cancel button not found');
    } catch (error) {
      this.logger.error('Failed to cancel form', { error });
      throw error;
    }
  }

  /**
   * Wait for form validation messages
   */
  async waitForValidation(timeout: number = 5000): Promise<string[]> {
    this.logger.debug('Waiting for form validation messages');

    const validationSelectors = [
      '.error-message',
      '.validation-error',
      '[data-testid="error-message"]',
      '.form-error',
      '.invalid-feedback',
    ];

    const errors: string[] = [];

    try {
      for (const selector of validationSelectors) {
        if (await this.uiAutomation.isElementVisible(selector, timeout)) {
          const errorText = await this.uiAutomation.getElementText(selector);
          if (errorText.trim()) {
            errors.push(errorText.trim());
          }
        }
      }

      if (errors.length > 0) {
        this.logger.warn('Form validation errors found', { errors });
      } else {
        this.logger.debug('No validation errors found');
      }

      return errors;
    } catch (error) {
      this.logger.error('Failed to check form validation', { error });
      return [];
    }
  }

  /**
   * Add members to group (helper method)
   */
  private async addGroupMembers(members: string[], options: ElementInteractionOptions = {}): Promise<void> {
    this.logger.info('Adding group members', { count: members.length });

    try {
      for (const member of members) {
        // Look for add member button
        const addMemberSelectors = [
          '[data-testid="add-member-button"]',
          '#addMember',
          '.add-member-btn',
          'button:has-text("Add Member")',
        ];

        let addButtonFound = false;
        for (const selector of addMemberSelectors) {
          if (await this.uiAutomation.isElementVisible(selector, 1000)) {
            await this.uiAutomation.clickElement(selector, options);
            addButtonFound = true;
            break;
          }
        }

        if (!addButtonFound) {
          this.logger.warn('Add member button not found, skipping member addition');
          continue;
        }

        // Fill member email/address
        const memberInputSelectors = [
          '[data-testid="member-input"]',
          '#memberEmail',
          'input[name="memberEmail"]',
          '.member-input',
        ];

        let inputFound = false;
        for (const selector of memberInputSelectors) {
          if (await this.uiAutomation.isElementVisible(selector, 1000)) {
            await this.uiAutomation.fillField(selector, member, options);
            inputFound = true;
            break;
          }
        }

        if (!inputFound) {
          this.logger.warn('Member input field not found');
          continue;
        }

        // Confirm member addition
        const confirmSelectors = [
          '[data-testid="confirm-member-button"]',
          'button:has-text("Add")',
          'button:has-text("Invite")',
        ];

        for (const selector of confirmSelectors) {
          if (await this.uiAutomation.isElementVisible(selector, 1000)) {
            await this.uiAutomation.clickElement(selector, options);
            break;
          }
        }

        // Small delay between member additions
        await this.uiAutomation.getPage()?.waitForTimeout(500);
      }

      this.logger.info('Group members added successfully');
    } catch (error) {
      this.logger.error('Failed to add group members', { error });
      throw error;
    }
  }

  /**
   * Validate form field values
   */
  async validateFormFields(expectedValues: Record<string, string>): Promise<boolean> {
    this.logger.info('Validating form field values', { fields: Object.keys(expectedValues) });

    try {
      for (const [fieldName, expectedValue] of Object.entries(expectedValues)) {
        const selectors = [
          `[data-testid="${fieldName}-input"]`,
          `#${fieldName}`,
          `input[name="${fieldName}"]`,
          `textarea[name="${fieldName}"]`,
          `select[name="${fieldName}"]`,
        ];

        let actualValue = '';
        let fieldFound = false;

        for (const selector of selectors) {
          if (await this.uiAutomation.isElementVisible(selector, 1000)) {
            const element = await this.uiAutomation.waitForElement(selector);
            const tagName = await element.evaluate(el => el.tagName.toLowerCase());
            
            if (tagName === 'input' || tagName === 'textarea') {
              actualValue = await this.uiAutomation.getElementAttribute(selector, 'value') || '';
            } else if (tagName === 'select') {
              actualValue = await this.uiAutomation.getElementAttribute(selector, 'value') || '';
            }
            
            fieldFound = true;
            break;
          }
        }

        if (!fieldFound) {
          this.logger.warn(`Field not found: ${fieldName}`);
          return false;
        }

        if (actualValue !== expectedValue) {
          this.logger.error(`Field validation failed: ${fieldName}`, {
            expected: expectedValue,
            actual: actualValue,
          });
          return false;
        }
      }

      this.logger.info('All form fields validated successfully');
      return true;
    } catch (error) {
      this.logger.error('Failed to validate form fields', { error });
      return false;
    }
  }
}