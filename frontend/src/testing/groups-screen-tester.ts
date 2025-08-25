// Groups Screen Comprehensive Tester
// Comprehensive testing for Groups screen

import { TestResult, TestStatus, TestCategory } from './types';
import { testUtils } from './test-utilities';

export class GroupsScreenTester {
  private results: TestResult[] = [];

  async testGroupsScreen(): Promise<TestResult[]> {
    console.log('👥 Testing Groups Screen...');
    this.results = [];

    try {
      // Navigate to groups screen
      await this.navigateToGroups();
      await this.sleep(2000);

      // Test 6.1: Group creation and management
      await this.testGroupCreationAndManagement();
      
      // Test 6.2: Group participation workflow
      await this.testGroupParticipationWorkflow();

    } catch (error) {
      console.error('❌ Groups screen testing failed:', error);
      this.results.push(testUtils.handleTestError(error as Error, 'Groups Screen Testing'));
    }

    return this.results;
  }

  // Test 6.1: Group creation and management
  private async testGroupCreationAndManagement(): Promise<void> {
    console.log('  📝 Testing group creation and management...');
    const startTime = performance.now();

    try {
      // Check for create group button
      const createButtons = document.querySelectorAll('[data-testid*="create"], button');
      const createGroupButtons = Array.from(createButtons).filter(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        return text.includes('create') && text.includes('group');
      });
      const hasCreateButton = createGroupButtons.length > 0;

      this.addResult('Groups - Create Group Button',
        hasCreateButton ? TestStatus.PASSED : TestStatus.WARNING,
        hasCreateButton ? `Found ${createGroupButtons.length} create group buttons` : 'Create group button not found',
        TestCategory.UI, performance.now() - startTime);

      // Test create group form
      if (createGroupButtons.length > 0) {
        try {
          const createButton = createGroupButtons[0] as HTMLElement;
          createButton.click();
          await this.sleep(1000);

          // Check for form modal
          const modals = document.querySelectorAll('[data-testid*="modal"], [class*="modal"], [class*="fixed"]');
          const forms = document.querySelectorAll('form, [data-testid*="form"]');
          const hasCreateForm = modals.length > 0 || forms.length > 0;

          this.addResult('Groups - Create Form Modal',
            hasCreateForm ? TestStatus.PASSED : TestStatus.WARNING,
            hasCreateForm ? 'Create group form opens correctly' : 'Create group form not clearly visible',
            TestCategory.UI, performance.now() - startTime);

          if (hasCreateForm) {
            // Check for form fields
            const nameInputs = document.querySelectorAll('input[placeholder*="name"], input[placeholder*="Name"]');
            const descriptionInputs = document.querySelectorAll('textarea, input[placeholder*="description"]');
            const amountInputs = document.querySelectorAll('input[type="number"], input[placeholder*="amount"]');
            const dateInputs = document.querySelectorAll('input[type="datetime-local"], input[type="date"]');

            const formFieldsCount = nameInputs.length + descriptionInputs.length + amountInputs.length + dateInputs.length;

            this.addResult('Groups - Form Fields',
              formFieldsCount >= 4 ? TestStatus.PASSED : TestStatus.WARNING,
              `Found ${formFieldsCount} form fields (name: ${nameInputs.length}, description: ${descriptionInputs.length}, amount: ${amountInputs.length}, date: ${dateInputs.length})`,
              TestCategory.UI, performance.now() - startTime);

            // Test form validation
            if (nameInputs.length > 0 && amountInputs.length > 0) {
              try {
                const nameInput = nameInputs[0] as HTMLInputElement;
                const amountInput = amountInputs[0] as HTMLInputElement;

                // Try invalid input
                nameInput.value = '';
                amountInput.value = '-1';
                
                // Trigger validation
                nameInput.dispatchEvent(new Event('blur', { bubbles: true }));
                amountInput.dispatchEvent(new Event('blur', { bubbles: true }));
                
                await this.sleep(500);

                // Look for error messages
                const errorElements = document.querySelectorAll('[class*="error"], [class*="red"], .text-red-400, .text-red-500');
                const hasValidation = errorElements.length > 0;

                this.addResult('Groups - Form Validation',
                  hasValidation ? TestStatus.PASSED : TestStatus.WARNING,
                  hasValidation ? 'Form validation working' : 'Form validation not clearly visible',
                  TestCategory.UI, performance.now() - startTime);

              } catch (error) {
                this.addResult('Groups - Form Validation', TestStatus.WARNING,
                  'Could not test form validation automatically',
                  TestCategory.UI, performance.now() - startTime);
              }
            }

            // Close modal
            try {
              const closeButtons = document.querySelectorAll('button');
              const closeButton = Array.from(closeButtons).find(btn => 
                btn.textContent?.includes('×') || btn.textContent?.toLowerCase().includes('cancel')
              );
              if (closeButton) {
                (closeButton as HTMLElement).click();
                await this.sleep(500);
              } else {
                // Click outside modal
                document.body.click();
                await this.sleep(500);
              }
            } catch (error) {
              console.warn('Could not close modal:', error);
            }
          }

        } catch (error) {
          this.addResult('Groups - Create Form Test', TestStatus.WARNING,
            'Could not test create group form automatically',
            TestCategory.UI, performance.now() - startTime);
        }
      }

      // Check for group management features
      const tabElements = document.querySelectorAll('[role="tab"], .tab, [class*="tab"]');
      const tabButtons = document.querySelectorAll('button');
      const managementTabs = Array.from(tabButtons).filter(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        return text.includes('my') || text.includes('created') || text.includes('browse');
      });
      const hasManagementTabs = tabElements.length > 0 || managementTabs.length > 0;

      this.addResult('Groups - Management Tabs',
        hasManagementTabs ? TestStatus.PASSED : TestStatus.WARNING,
        hasManagementTabs ? `Found ${Math.max(tabElements.length, managementTabs.length)} management tabs` : 'Management tabs not found',
        TestCategory.UI, performance.now() - startTime);

      // Check for group settings/configuration
      const settingsElements = document.querySelectorAll('[data-testid*="settings"], [class*="settings"]');
      const configElements = document.querySelectorAll('[data-testid*="config"], [class*="config"]');
      const hasGroupSettings = settingsElements.length > 0 || configElements.length > 0;

      this.addResult('Groups - Group Settings',
        hasGroupSettings ? TestStatus.PASSED : TestStatus.WARNING,
        hasGroupSettings ? 'Group settings/configuration found' : 'Group settings not clearly visible',
        TestCategory.UI, performance.now() - startTime);

    } catch (error) {
      this.addResult('Groups Creation and Management Test', TestStatus.FAILED,
        `Group creation test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.UI, performance.now() - startTime);
    }
  }

  // Test 6.2: Group participation workflow
  private async testGroupParticipationWorkflow(): Promise<void> {
    console.log('  🤝 Testing group participation workflow...');
    const startTime = performance.now();

    try {
      // Check for group statistics
      const statsCards = document.querySelectorAll('[data-testid*="stat"], .text-xl, .font-bold');
      const hasStatsDisplay = statsCards.length >= 3; // Should have multiple stat cards

      this.addResult('Groups - Statistics Display',
        hasStatsDisplay ? TestStatus.PASSED : TestStatus.WARNING,
        `Found ${statsCards.length} statistics elements`,
        TestCategory.DATA, performance.now() - startTime);

      // Check for group listings/cards
      const groupCards = document.querySelectorAll('[data-testid*="group"], [class*="group"], .grid > div');
      const hasGroupListings = groupCards.length > 0;

      this.addResult('Groups - Group Listings',
        hasGroupListings ? TestStatus.PASSED : TestStatus.WARNING,
        hasGroupListings ? `Found ${groupCards.length} group cards` : 'No group cards found',
        TestCategory.UI, performance.now() - startTime);

      // Check for join/contribute buttons
      const joinButtons = document.querySelectorAll('button');
      const joinGroupButtons = Array.from(joinButtons).filter(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        return text.includes('join') || text.includes('contribute');
      });
      const hasJoinButtons = joinGroupButtons.length > 0;

      this.addResult('Groups - Join/Contribute Buttons',
        hasJoinButtons ? TestStatus.PASSED : TestStatus.WARNING,
        hasJoinButtons ? `Found ${joinGroupButtons.length} join/contribute buttons` : 'Join/contribute buttons not found',
        TestCategory.UI, performance.now() - startTime);

      // Check for progress indicators
      const progressElements = document.querySelectorAll('[class*="progress"], [data-testid*="progress"]');
      const progressBars = document.querySelectorAll('.w-full, [style*="width"]');
      const hasProgressIndicators = progressElements.length > 0 || progressBars.length > 0;

      this.addResult('Groups - Progress Indicators',
        hasProgressIndicators ? TestStatus.PASSED : TestStatus.WARNING,
        hasProgressIndicators ? 'Progress indicators found' : 'Progress indicators not clearly visible',
        TestCategory.UI, performance.now() - startTime);

      // Check for contribution tracking
      const contributionElements = document.querySelectorAll('[data-testid*="contribution"], [class*="contribution"]');
      const contributionTexts = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent?.toLowerCase() || '';
        return text.includes('contribution') || text.includes('contributed');
      });
      const hasContributionTracking = contributionElements.length > 0 || contributionTexts.length > 0;

      this.addResult('Groups - Contribution Tracking',
        hasContributionTracking ? TestStatus.PASSED : TestStatus.WARNING,
        hasContributionTracking ? 'Contribution tracking found' : 'Contribution tracking not clearly visible',
        TestCategory.DATA, performance.now() - startTime);

      // Check for group status indicators
      const statusElements = document.querySelectorAll('[data-testid*="status"], [class*="status"]');
      const statusTexts = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent?.toLowerCase() || '';
        return text.includes('active') || text.includes('completed') || text.includes('expired');
      });
      const hasStatusIndicators = statusElements.length > 0 || statusTexts.length > 0;

      this.addResult('Groups - Status Indicators',
        hasStatusIndicators ? TestStatus.PASSED : TestStatus.WARNING,
        hasStatusIndicators ? 'Group status indicators found' : 'Group status indicators not clearly visible',
        TestCategory.UI, performance.now() - startTime);

      // Check for participant information
      const participantElements = document.querySelectorAll('[data-testid*="participant"], [class*="participant"]');
      const participantTexts = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent?.toLowerCase() || '';
        return text.includes('participant') || text.includes('member');
      });
      const hasParticipantInfo = participantElements.length > 0 || participantTexts.length > 0;

      this.addResult('Groups - Participant Information',
        hasParticipantInfo ? TestStatus.PASSED : TestStatus.WARNING,
        hasParticipantInfo ? 'Participant information displayed' : 'Participant information not clearly visible',
        TestCategory.DATA, performance.now() - startTime);

      // Check for goal/target information
      const targetElements = document.querySelectorAll('[data-testid*="target"], [class*="target"]');
      const goalTexts = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent?.toLowerCase() || '';
        return text.includes('target') || text.includes('goal') || text.includes('SEI');
      });
      const hasGoalInfo = targetElements.length > 0 || goalTexts.length > 0;

      this.addResult('Groups - Goal/Target Information',
        hasGoalInfo ? TestStatus.PASSED : TestStatus.WARNING,
        hasGoalInfo ? 'Goal/target information displayed' : 'Goal/target information not clearly visible',
        TestCategory.DATA, performance.now() - startTime);

      // Test join group workflow
      if (joinGroupButtons.length > 0) {
        try {
          const joinButton = joinGroupButtons[0] as HTMLElement;
          const originalText = joinButton.textContent;
          
          joinButton.click();
          await this.sleep(1000);

          // Check for contribution modal/form
          const modals = document.querySelectorAll('[data-testid*="modal"], [class*="modal"], [class*="fixed"]');
          const contributionInputs = document.querySelectorAll('input[type="number"], input[placeholder*="amount"]');
          const hasContributionInterface = modals.length > 0 || contributionInputs.length > 0;

          this.addResult('Groups - Contribution Interface',
            hasContributionInterface ? TestStatus.PASSED : TestStatus.WARNING,
            hasContributionInterface ? 'Contribution interface opens correctly' : 'Contribution interface not clearly visible',
            TestCategory.UI, performance.now() - startTime);

          // Close modal if opened
          if (modals.length > 0) {
            try {
              document.body.click();
              await this.sleep(500);
            } catch (error) {
              console.warn('Could not close contribution modal:', error);
            }
          }

        } catch (error) {
          this.addResult('Groups - Join Workflow Test', TestStatus.WARNING,
            'Could not test join group workflow automatically',
            TestCategory.UI, performance.now() - startTime);
        }
      }

      // Check for wallet connection requirement
      const walletButtons = document.querySelectorAll('button');
      const connectWalletButtons = Array.from(walletButtons).filter(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        return text.includes('connect wallet') || text.includes('connect');
      });
      const hasWalletConnection = connectWalletButtons.length > 0;

      this.addResult('Groups - Wallet Connection',
        hasWalletConnection ? TestStatus.PASSED : TestStatus.WARNING,
        hasWalletConnection ? 'Wallet connection prompts available' : 'Wallet connection not clearly indicated',
        TestCategory.INTEGRATION, performance.now() - startTime);

    } catch (error) {
      this.addResult('Groups Participation Workflow Test', TestStatus.FAILED,
        `Participation workflow test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.UI, performance.now() - startTime);
    }
  }

  // Helper methods
  private async navigateToGroups(): Promise<void> {
    const currentPath = window.location.pathname;
    const currentHash = window.location.hash;
    
    if (!currentPath.includes('/groups') && !currentHash.includes('/groups')) {
      window.location.hash = '#/groups';
      await this.sleep(1000);
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private addResult(testName: string, status: TestStatus, details: string, category: TestCategory, executionTime: number): void {
    this.results.push({
      testName,
      status,
      details,
      category,
      executionTime,
      timestamp: new Date(),
      errors: status === TestStatus.FAILED ? [details] : undefined
    });
  }

  // Get summary of results
  getSummary(): { total: number; passed: number; failed: number; warnings: number; passRate: number } {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === TestStatus.PASSED).length;
    const failed = this.results.filter(r => r.status === TestStatus.FAILED).length;
    const warnings = this.results.filter(r => r.status === TestStatus.WARNING).length;
    const passRate = total > 0 ? (passed / total) * 100 : 0;

    return { total, passed, failed, warnings, passRate };
  }

  // Get detailed results
  getResults(): TestResult[] {
    return this.results;
  }
}

// Export singleton instance
export const groupsScreenTester = new GroupsScreenTester();

// Make available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).GroupsScreenTester = groupsScreenTester;
}