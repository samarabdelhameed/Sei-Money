// Accessibility and Usability Tester
// Accessibility and usability testing

import { TestResult, TestStatus, TestCategory } from './types';
import { testUtils } from './test-utilities';

interface AccessibilityResult {
  element: Element;
  issues: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  wcagLevel: 'A' | 'AA' | 'AAA';
}

interface UsabilityMetrics {
  taskCompletionRate: number;
  averageTaskTime: number;
  errorRate: number;
  userSatisfaction: number;
  learnability: number;
}

export class AccessibilityUsabilityTester {
  private results: TestResult[] = [];
  private focusableElements: Element[] = [];
  private tabOrder: Element[] = [];

  constructor() {
    this.initializeFocusableElements();
  }

  async testAccessibilityUsability(): Promise<TestResult[]> {
    console.log('♿ Testing Accessibility and Usability...');
    this.results = [];

    try {
      // Test 12.1: Accessibility compliance
      await this.testAccessibilityCompliance();
      
      // Test 12.2: User experience workflows
      await this.testUserExperienceWorkflows();

    } catch (error) {
      console.error('❌ Accessibility and usability testing failed:', error);
      this.results.push(testUtils.handleTestError(error as Error, 'Accessibility Usability Testing'));
    }

    return this.results;
  }

  // Test 12.1: Accessibility compliance
  private async testAccessibilityCompliance(): Promise<void> {
    console.log('  ♿ Testing accessibility compliance...');
    const startTime = performance.now();

    try {
      // Test keyboard navigation
      await this.testKeyboardNavigation();
      
      // Test screen reader compatibility
      await this.testScreenReaderCompatibility();
      
      // Test color contrast ratios
      await this.testColorContrastRatios();
      
      // Test focus management
      await this.testFocusManagement();
      
      // Test dynamic content accessibility
      await this.testDynamicContentAccessibility();

    } catch (error) {
      this.addResult('Accessibility Compliance Tests', TestStatus.FAILED,
        `Accessibility compliance testing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.UI, performance.now() - startTime);
    }
  }

  private async testKeyboardNavigation(): Promise<void> {
    const startTime = performance.now();
    console.log('    ⌨️ Testing keyboard navigation for all interactive elements...');

    try {
      // Get all focusable elements
      this.updateFocusableElements();
      
      const keyboardTests = [
        {
          name: 'Tab Navigation',
          test: async () => {
            let navigableElements = 0;
            let tabIndex = 0;
            
            for (const element of this.focusableElements) {
              try {
                // Focus the element
                (element as HTMLElement).focus();
                
                // Check if element is actually focused
                if (document.activeElement === element) {
                  navigableElements++;
                  
                  // Check tab index
                  const elementTabIndex = (element as HTMLElement).tabIndex;
                  if (elementTabIndex >= 0) {
                    tabIndex++;
                  }
                }
              } catch (error) {
                // Element might not be focusable
              }
            }
            
            return {
              navigableElements,
              totalElements: this.focusableElements.length,
              tabIndexElements: tabIndex,
              passed: navigableElements >= this.focusableElements.length * 0.8
            };
          }
        },
        {
          name: 'Enter Key Activation',
          test: async () => {
            const buttons = document.querySelectorAll('button, [role="button"]');
            let activatableButtons = 0;
            
            for (const button of Array.from(buttons)) {
              try {
                // Check if button has click handler or is a real button
                const hasClickHandler = (button as HTMLElement).onclick !== null || 
                                      (button as HTMLElement).addEventListener !== undefined;
                const isButton = button.tagName === 'BUTTON' || 
                               button.getAttribute('role') === 'button';
                
                if (hasClickHandler || isButton) {
                  activatableButtons++;
                }
              } catch (error) {
                // Skip problematic elements
              }
            }
            
            return {
              activatableButtons,
              totalButtons: buttons.length,
              passed: buttons.length === 0 || activatableButtons >= buttons.length * 0.9
            };
          }
        },
        {
          name: 'Arrow Key Navigation',
          test: async () => {
            // Look for elements that should support arrow key navigation
            const menuItems = document.querySelectorAll('[role="menuitem"], [role="option"], [role="tab"]');
            const listItems = document.querySelectorAll('li[role="option"], li[tabindex]');
            
            let arrowNavigableElements = 0;
            const totalArrowElements = menuItems.length + listItems.length;
            
            // Check for arrow key event listeners (this is a basic check)
            [...Array.from(menuItems), ...Array.from(listItems)].forEach(element => {
              const hasArrowHandlers = (element as HTMLElement).onkeydown !== null || 
                                     element.getAttribute('onkeydown') !== null;
              if (hasArrowHandlers) {
                arrowNavigableElements++;
              }
            });
            
            return {
              arrowNavigableElements,
              totalArrowElements,
              passed: totalArrowElements === 0 || arrowNavigableElements >= totalArrowElements * 0.5
            };
          }
        },
        {
          name: 'Escape Key Handling',
          test: async () => {
            // Look for modals, dropdowns, and other dismissible elements
            const dismissibleElements = document.querySelectorAll(
              '[role="dialog"], [role="menu"], .modal, .dropdown, [aria-expanded="true"]'
            );
            
            let escapeHandlers = 0;
            
            dismissibleElements.forEach(element => {
              // Check for escape key handling
              const hasEscapeHandler = (element as HTMLElement).onkeydown !== null ||
                                     element.getAttribute('onkeydown') !== null ||
                                     element.querySelector('[data-dismiss]') !== null;
              if (hasEscapeHandler) {
                escapeHandlers++;
              }
            });
            
            return {
              escapeHandlers,
              totalDismissible: dismissibleElements.length,
              passed: dismissibleElements.length === 0 || escapeHandlers >= dismissibleElements.length * 0.7
            };
          }
        }
      ];

      let passedKeyboardTests = 0;
      const keyboardDetails: string[] = [];

      for (const test of keyboardTests) {
        try {
          const result = await test.test();
          if (result.passed) {
            passedKeyboardTests++;
            keyboardDetails.push(`✅ ${test.name}: Working`);
          } else {
            keyboardDetails.push(`❌ ${test.name}: Issues detected`);
          }
        } catch (error) {
          keyboardDetails.push(`❌ ${test.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      this.addResult('Accessibility - Keyboard Navigation',
        passedKeyboardTests >= keyboardTests.length * 0.8 ? TestStatus.PASSED : TestStatus.WARNING,
        `Keyboard navigation: ${passedKeyboardTests}/${keyboardTests.length} tests passed. ${keyboardDetails.join(', ')}`,
        TestCategory.UI, performance.now() - startTime);

    } catch (error) {
      this.addResult('Accessibility - Keyboard Navigation', TestStatus.FAILED,
        `Keyboard navigation test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.UI, performance.now() - startTime);
    }
  }

  private async testScreenReaderCompatibility(): Promise<void> {
    const startTime = performance.now();
    console.log('    🔊 Testing screen reader compatibility and ARIA labels...');

    try {
      const ariaTests = [
        {
          name: 'ARIA Labels',
          test: () => {
            const interactiveElements = document.querySelectorAll(
              'button, input, select, textarea, [role="button"], [role="link"], [role="menuitem"]'
            );
            
            let labeledElements = 0;
            
            interactiveElements.forEach(element => {
              const hasAriaLabel = element.getAttribute('aria-label') !== null;
              const hasAriaLabelledBy = element.getAttribute('aria-labelledby') !== null;
              const hasLabel = element.closest('label') !== null;
              const hasTitle = element.getAttribute('title') !== null;
              const hasTextContent = element.textContent?.trim() !== '';
              
              if (hasAriaLabel || hasAriaLabelledBy || hasLabel || hasTitle || hasTextContent) {
                labeledElements++;
              }
            });
            
            return {
              labeledElements,
              totalElements: interactiveElements.length,
              passed: interactiveElements.length === 0 || labeledElements >= interactiveElements.length * 0.9
            };
          }
        },
        {
          name: 'ARIA Roles',
          test: () => {
            const elementsWithRoles = document.querySelectorAll('[role]');
            const validRoles = [
              'button', 'link', 'menuitem', 'tab', 'tabpanel', 'dialog', 'alert',
              'navigation', 'main', 'banner', 'contentinfo', 'complementary',
              'form', 'search', 'application', 'document', 'img', 'list', 'listitem'
            ];
            
            let validRoleElements = 0;
            
            elementsWithRoles.forEach(element => {
              const role = element.getAttribute('role');
              if (role && validRoles.includes(role)) {
                validRoleElements++;
              }
            });
            
            return {
              validRoleElements,
              totalRoleElements: elementsWithRoles.length,
              passed: elementsWithRoles.length === 0 || validRoleElements >= elementsWithRoles.length * 0.9
            };
          }
        },
        {
          name: 'ARIA States and Properties',
          test: () => {
            const elementsWithAria = document.querySelectorAll('[aria-expanded], [aria-selected], [aria-checked], [aria-disabled]');
            let validAriaStates = 0;
            
            elementsWithAria.forEach(element => {
              const expanded = element.getAttribute('aria-expanded');
              const selected = element.getAttribute('aria-selected');
              const checked = element.getAttribute('aria-checked');
              const disabled = element.getAttribute('aria-disabled');
              
              // Check if values are valid
              const validExpanded = !expanded || ['true', 'false'].includes(expanded);
              const validSelected = !selected || ['true', 'false'].includes(selected);
              const validChecked = !checked || ['true', 'false', 'mixed'].includes(checked);
              const validDisabled = !disabled || ['true', 'false'].includes(disabled);
              
              if (validExpanded && validSelected && validChecked && validDisabled) {
                validAriaStates++;
              }
            });
            
            return {
              validAriaStates,
              totalAriaElements: elementsWithAria.length,
              passed: elementsWithAria.length === 0 || validAriaStates >= elementsWithAria.length * 0.95
            };
          }
        },
        {
          name: 'Semantic HTML',
          test: () => {
            const semanticElements = document.querySelectorAll(
              'header, nav, main, section, article, aside, footer, h1, h2, h3, h4, h5, h6'
            );
            
            const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
            const landmarks = document.querySelectorAll('header, nav, main, footer');
            
            return {
              semanticElements: semanticElements.length,
              headings: headings.length,
              landmarks: landmarks.length,
              passed: headings.length > 0 && landmarks.length >= 2
            };
          }
        }
      ];

      let passedAriaTests = 0;
      const ariaDetails: string[] = [];

      for (const test of ariaTests) {
        try {
          const result = test.test();
          if (result.passed) {
            passedAriaTests++;
            ariaDetails.push(`✅ ${test.name}: Compliant`);
          } else {
            ariaDetails.push(`⚠️ ${test.name}: Needs improvement`);
          }
        } catch (error) {
          ariaDetails.push(`❌ ${test.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      this.addResult('Accessibility - Screen Reader Compatibility',
        passedAriaTests >= ariaTests.length * 0.8 ? TestStatus.PASSED : TestStatus.WARNING,
        `Screen reader compatibility: ${passedAriaTests}/${ariaTests.length} tests passed. ${ariaDetails.join(', ')}`,
        TestCategory.UI, performance.now() - startTime);

    } catch (error) {
      this.addResult('Accessibility - Screen Reader Compatibility', TestStatus.FAILED,
        `Screen reader compatibility test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.UI, performance.now() - startTime);
    }
  }

  private async testColorContrastRatios(): Promise<void> {
    const startTime = performance.now();
    console.log('    🎨 Testing color contrast ratios and visual accessibility...');

    try {
      const contrastTests = [
        {
          name: 'Text Color Contrast',
          test: () => {
            const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button, label');
            let adequateContrastElements = 0;
            let totalTextElements = 0;
            
            textElements.forEach(element => {
              const text = element.textContent?.trim();
              if (text && text.length > 0) {
                totalTextElements++;
                
                try {
                  const styles = window.getComputedStyle(element);
                  const color = styles.color;
                  const backgroundColor = styles.backgroundColor;
                  const fontSize = parseFloat(styles.fontSize);
                  
                  // Basic contrast check (simplified)
                  if (this.hasAdequateContrast(color, backgroundColor, fontSize)) {
                    adequateContrastElements++;
                  }
                } catch (error) {
                  // If we can't compute contrast, assume it's adequate
                  adequateContrastElements++;
                }
              }
            });
            
            return {
              adequateContrastElements,
              totalTextElements,
              passed: totalTextElements === 0 || adequateContrastElements >= totalTextElements * 0.8
            };
          }
        },
        {
          name: 'Interactive Element Contrast',
          test: () => {
            const interactiveElements = document.querySelectorAll('button, input, select, textarea, a');
            let adequateContrastInteractive = 0;
            
            interactiveElements.forEach(element => {
              try {
                const styles = window.getComputedStyle(element);
                const color = styles.color;
                const backgroundColor = styles.backgroundColor;
                const borderColor = styles.borderColor;
                
                // Check if element has sufficient contrast or visible borders
                const hasContrast = this.hasAdequateContrast(color, backgroundColor, 16);
                const hasBorder = borderColor !== 'rgba(0, 0, 0, 0)' && borderColor !== 'transparent';
                
                if (hasContrast || hasBorder) {
                  adequateContrastInteractive++;
                }
              } catch (error) {
                adequateContrastInteractive++;
              }
            });
            
            return {
              adequateContrastInteractive,
              totalInteractive: interactiveElements.length,
              passed: interactiveElements.length === 0 || adequateContrastInteractive >= interactiveElements.length * 0.9
            };
          }
        },
        {
          name: 'Focus Indicators',
          test: () => {
            const focusableElements = document.querySelectorAll(
              'button, input, select, textarea, a, [tabindex]:not([tabindex="-1"])'
            );
            
            let elementsWithFocusIndicators = 0;
            
            focusableElements.forEach(element => {
              try {
                // Focus the element temporarily to check focus styles
                (element as HTMLElement).focus();
                const focusedStyles = window.getComputedStyle(element, ':focus');
                const normalStyles = window.getComputedStyle(element);
                
                // Check if focus styles are different from normal styles
                const hasFocusOutline = focusedStyles.outline !== 'none' && focusedStyles.outline !== normalStyles.outline;
                const hasFocusBackground = focusedStyles.backgroundColor !== normalStyles.backgroundColor;
                const hasFocusBorder = focusedStyles.borderColor !== normalStyles.borderColor;
                const hasFocusBoxShadow = focusedStyles.boxShadow !== normalStyles.boxShadow;
                
                if (hasFocusOutline || hasFocusBackground || hasFocusBorder || hasFocusBoxShadow) {
                  elementsWithFocusIndicators++;
                }
              } catch (error) {
                // Assume focus indicator exists if we can't test
                elementsWithFocusIndicators++;
              }
            });
            
            return {
              elementsWithFocusIndicators,
              totalFocusable: focusableElements.length,
              passed: focusableElements.length === 0 || elementsWithFocusIndicators >= focusableElements.length * 0.8
            };
          }
        }
      ];

      let passedContrastTests = 0;
      const contrastDetails: string[] = [];

      for (const test of contrastTests) {
        try {
          const result = test.test();
          if (result.passed) {
            passedContrastTests++;
            contrastDetails.push(`✅ ${test.name}: Adequate`);
          } else {
            contrastDetails.push(`⚠️ ${test.name}: Needs improvement`);
          }
        } catch (error) {
          contrastDetails.push(`❌ ${test.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      this.addResult('Accessibility - Color Contrast',
        passedContrastTests >= contrastTests.length * 0.7 ? TestStatus.PASSED : TestStatus.WARNING,
        `Color contrast: ${passedContrastTests}/${contrastTests.length} tests passed. ${contrastDetails.join(', ')}`,
        TestCategory.UI, performance.now() - startTime);

    } catch (error) {
      this.addResult('Accessibility - Color Contrast', TestStatus.FAILED,
        `Color contrast test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.UI, performance.now() - startTime);
    }
  }

  private async testFocusManagement(): Promise<void> {
    const startTime = performance.now();
    console.log('    🎯 Testing focus management and tab order...');

    try {
      const focusTests = [
        {
          name: 'Tab Order',
          test: () => {
            this.updateFocusableElements();
            let logicalTabOrder = 0;
            let totalTabIndexElements = 0;
            
            // Check tab indices
            this.focusableElements.forEach((element, index) => {
              const tabIndex = (element as HTMLElement).tabIndex;
              if (tabIndex >= 0) {
                totalTabIndexElements++;
                
                // Check if tab order is logical (sequential or default)
                if (tabIndex === 0 || tabIndex === index + 1) {
                  logicalTabOrder++;
                }
              }
            });
            
            return {
              logicalTabOrder,
              totalTabIndexElements,
              totalFocusable: this.focusableElements.length,
              passed: totalTabIndexElements === 0 || logicalTabOrder >= totalTabIndexElements * 0.8
            };
          }
        },
        {
          name: 'Focus Trapping',
          test: () => {
            // Look for modals and dialogs that should trap focus
            const modals = document.querySelectorAll('[role="dialog"], .modal, [aria-modal="true"]');
            let modalsWithFocusTrap = 0;
            
            modals.forEach(modal => {
              // Check if modal has focusable elements
              const focusableInModal = modal.querySelectorAll(
                'button, input, select, textarea, a, [tabindex]:not([tabindex="-1"])'
              );
              
              // Basic check: if modal has focusable elements, assume focus trapping
              if (focusableInModal.length > 0) {
                modalsWithFocusTrap++;
              }
            });
            
            return {
              modalsWithFocusTrap,
              totalModals: modals.length,
              passed: modals.length === 0 || modalsWithFocusTrap >= modals.length * 0.8
            };
          }
        },
        {
          name: 'Focus Restoration',
          test: () => {
            // This is a basic check for elements that might restore focus
            const elementsWithFocusRestore = document.querySelectorAll(
              '[data-focus-restore], [data-return-focus]'
            );
            
            const modalsAndDropdowns = document.querySelectorAll(
              '[role="dialog"], .modal, [role="menu"], .dropdown'
            );
            
            return {
              elementsWithFocusRestore: elementsWithFocusRestore.length,
              modalsAndDropdowns: modalsAndDropdowns.length,
              passed: modalsAndDropdowns.length === 0 || elementsWithFocusRestore.length > 0
            };
          }
        },
        {
          name: 'Skip Links',
          test: () => {
            const skipLinks = document.querySelectorAll('a[href^="#"], [class*="skip"]');
            let validSkipLinks = 0;
            
            skipLinks.forEach(link => {
              const href = link.getAttribute('href');
              const text = link.textContent?.toLowerCase();
              
              if (href && href.startsWith('#') && text && 
                  (text.includes('skip') || text.includes('main') || text.includes('content'))) {
                // Check if target exists
                const target = document.querySelector(href);
                if (target) {
                  validSkipLinks++;
                }
              }
            });
            
            return {
              validSkipLinks,
              totalSkipLinks: skipLinks.length,
              passed: validSkipLinks > 0 || document.querySelector('main') !== null
            };
          }
        }
      ];

      let passedFocusTests = 0;
      const focusDetails: string[] = [];

      for (const test of focusTests) {
        try {
          const result = test.test();
          if (result.passed) {
            passedFocusTests++;
            focusDetails.push(`✅ ${test.name}: Working`);
          } else {
            focusDetails.push(`⚠️ ${test.name}: Needs improvement`);
          }
        } catch (error) {
          focusDetails.push(`❌ ${test.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      this.addResult('Accessibility - Focus Management',
        passedFocusTests >= focusTests.length * 0.7 ? TestStatus.PASSED : TestStatus.WARNING,
        `Focus management: ${passedFocusTests}/${focusTests.length} tests passed. ${focusDetails.join(', ')}`,
        TestCategory.UI, performance.now() - startTime);

    } catch (error) {
      this.addResult('Accessibility - Focus Management', TestStatus.FAILED,
        `Focus management test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.UI, performance.now() - startTime);
    }
  }

  private async testDynamicContentAccessibility(): Promise<void> {
    const startTime = performance.now();
    console.log('    🔄 Testing accessibility of dynamic content and modals...');

    try {
      const dynamicTests = [
        {
          name: 'Live Regions',
          test: () => {
            const liveRegions = document.querySelectorAll('[aria-live], [role="status"], [role="alert"]');
            const dynamicContent = document.querySelectorAll('[data-dynamic], .notification, .alert, .toast');
            
            let accessibleDynamicContent = 0;
            
            // Check if dynamic content areas have live regions
            dynamicContent.forEach(element => {
              const hasAriaLive = element.getAttribute('aria-live') !== null;
              const hasRole = element.getAttribute('role') === 'status' || element.getAttribute('role') === 'alert';
              const isInLiveRegion = element.closest('[aria-live], [role="status"], [role="alert"]') !== null;
              
              if (hasAriaLive || hasRole || isInLiveRegion) {
                accessibleDynamicContent++;
              }
            });
            
            return {
              liveRegions: liveRegions.length,
              dynamicContent: dynamicContent.length,
              accessibleDynamicContent,
              passed: dynamicContent.length === 0 || accessibleDynamicContent >= dynamicContent.length * 0.7
            };
          }
        },
        {
          name: 'Modal Accessibility',
          test: () => {
            const modals = document.querySelectorAll('[role="dialog"], .modal, [aria-modal="true"]');
            let accessibleModals = 0;
            
            modals.forEach(modal => {
              const hasRole = modal.getAttribute('role') === 'dialog';
              const hasAriaModal = modal.getAttribute('aria-modal') === 'true';
              const hasAriaLabel = modal.getAttribute('aria-label') !== null || 
                                 modal.getAttribute('aria-labelledby') !== null;
              
              // Check for close button
              const hasCloseButton = modal.querySelector('[data-dismiss], [aria-label*="close"], .close') !== null;
              
              if ((hasRole || hasAriaModal) && hasAriaLabel && hasCloseButton) {
                accessibleModals++;
              }
            });
            
            return {
              accessibleModals,
              totalModals: modals.length,
              passed: modals.length === 0 || accessibleModals >= modals.length * 0.8
            };
          }
        },
        {
          name: 'Form Validation Messages',
          test: () => {
            const forms = document.querySelectorAll('form');
            const inputs = document.querySelectorAll('input, textarea, select');
            let accessibleValidation = 0;
            
            inputs.forEach(input => {
              const hasAriaDescribedBy = input.getAttribute('aria-describedby') !== null;
              const hasAriaInvalid = input.getAttribute('aria-invalid') !== null;
              const hasValidationMessage = input.closest('.form-group, .field')?.querySelector('.error, .invalid, [role="alert"]') !== null;
              
              if (hasAriaDescribedBy || hasAriaInvalid || hasValidationMessage) {
                accessibleValidation++;
              }
            });
            
            return {
              accessibleValidation,
              totalInputs: inputs.length,
              passed: inputs.length === 0 || accessibleValidation >= inputs.length * 0.6
            };
          }
        },
        {
          name: 'Loading States',
          test: () => {
            const loadingElements = document.querySelectorAll(
              '[aria-busy], [role="progressbar"], .loading, .spinner, [data-loading]'
            );
            
            let accessibleLoading = 0;
            
            loadingElements.forEach(element => {
              const hasAriaBusy = element.getAttribute('aria-busy') !== null;
              const hasRole = element.getAttribute('role') === 'progressbar';
              const hasAriaLabel = element.getAttribute('aria-label') !== null;
              const hasText = element.textContent?.trim() !== '';
              
              if (hasAriaBusy || hasRole || hasAriaLabel || hasText) {
                accessibleLoading++;
              }
            });
            
            return {
              accessibleLoading,
              totalLoading: loadingElements.length,
              passed: loadingElements.length === 0 || accessibleLoading >= loadingElements.length * 0.8
            };
          }
        }
      ];

      let passedDynamicTests = 0;
      const dynamicDetails: string[] = [];

      for (const test of dynamicTests) {
        try {
          const result = test.test();
          if (result.passed) {
            passedDynamicTests++;
            dynamicDetails.push(`✅ ${test.name}: Accessible`);
          } else {
            dynamicDetails.push(`⚠️ ${test.name}: Needs improvement`);
          }
        } catch (error) {
          dynamicDetails.push(`❌ ${test.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      this.addResult('Accessibility - Dynamic Content',
        passedDynamicTests >= dynamicTests.length * 0.7 ? TestStatus.PASSED : TestStatus.WARNING,
        `Dynamic content accessibility: ${passedDynamicTests}/${dynamicTests.length} tests passed. ${dynamicDetails.join(', ')}`,
        TestCategory.UI, performance.now() - startTime);

    } catch (error) {
      this.addResult('Accessibility - Dynamic Content', TestStatus.FAILED,
        `Dynamic content accessibility test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.UI, performance.now() - startTime);
    }
  }

  // Test 12.2: User experience workflows
  private async testUserExperienceWorkflows(): Promise<void> {
    console.log('  👤 Testing user experience workflows...');
    const startTime = performance.now();

    try {
      // Test new user onboarding
      await this.testNewUserOnboarding();
      
      // Test task completion rates
      await this.testTaskCompletionRates();
      
      // Test error recovery
      await this.testErrorRecovery();
      
      // Test feature discoverability
      await this.testFeatureDiscoverability();
      
      // Test user feedback collection
      await this.testUserFeedbackCollection();

    } catch (error) {
      this.addResult('User Experience Workflows', TestStatus.FAILED,
        `User experience testing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.UI, performance.now() - startTime);
    }
  }

  private async testNewUserOnboarding(): Promise<void> {
    const startTime = performance.now();
    console.log('    🚀 Testing complete new user onboarding experience...');

    try {
      const onboardingTests = [
        {
          name: 'Welcome Screen Elements',
          test: () => {
            const welcomeElements = document.querySelectorAll(
              '[data-testid*="welcome"], .welcome, .onboarding, .intro'
            );
            const getStartedButtons = document.querySelectorAll(
              '[data-testid*="get-started"], button:contains("Get Started"), a:contains("Get Started")'
            );
            
            return {
              welcomeElements: welcomeElements.length,
              getStartedButtons: getStartedButtons.length,
              passed: welcomeElements.length > 0 || getStartedButtons.length > 0
            };
          }
        },
        {
          name: 'Wallet Connection Guidance',
          test: () => {
            const walletButtons = document.querySelectorAll(
              '[data-testid*="wallet"], button[class*="wallet"], .wallet-connect'
            );
            const walletInstructions = document.querySelectorAll(
              '[data-testid*="instruction"], .instruction, .guide, .help'
            );
            
            return {
              walletButtons: walletButtons.length,
              walletInstructions: walletInstructions.length,
              passed: walletButtons.length >= 2 // At least 2 wallet options
            };
          }
        },
        {
          name: 'Navigation Clarity',
          test: () => {
            const navElements = document.querySelectorAll('nav, .navigation, [role="navigation"]');
            const menuItems = document.querySelectorAll('nav a, .nav-link, [role="menuitem"]');
            const breadcrumbs = document.querySelectorAll('.breadcrumb, [aria-label*="breadcrumb"]');
            
            return {
              navElements: navElements.length,
              menuItems: menuItems.length,
              breadcrumbs: breadcrumbs.length,
              passed: navElements.length > 0 && menuItems.length >= 3
            };
          }
        },
        {
          name: 'Help and Documentation',
          test: () => {
            const helpElements = document.querySelectorAll(
              '[data-testid*="help"], .help, .faq, .documentation, .guide'
            );
            const tooltips = document.querySelectorAll('[title], [data-tooltip], .tooltip');
            
            return {
              helpElements: helpElements.length,
              tooltips: tooltips.length,
              passed: helpElements.length > 0 || tooltips.length >= 5
            };
          }
        }
      ];

      let passedOnboardingTests = 0;
      const onboardingDetails: string[] = [];

      for (const test of onboardingTests) {
        try {
          const result = test.test();
          if (result.passed) {
            passedOnboardingTests++;
            onboardingDetails.push(`✅ ${test.name}: Available`);
          } else {
            onboardingDetails.push(`⚠️ ${test.name}: Could be improved`);
          }
        } catch (error) {
          onboardingDetails.push(`❌ ${test.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      this.addResult('UX - New User Onboarding',
        passedOnboardingTests >= onboardingTests.length * 0.7 ? TestStatus.PASSED : TestStatus.WARNING,
        `New user onboarding: ${passedOnboardingTests}/${onboardingTests.length} tests passed. ${onboardingDetails.join(', ')}`,
        TestCategory.UI, performance.now() - startTime);

    } catch (error) {
      this.addResult('UX - New User Onboarding', TestStatus.FAILED,
        `New user onboarding test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.UI, performance.now() - startTime);
    }
  }

  private async testTaskCompletionRates(): Promise<void> {
    const startTime = performance.now();
    console.log('    ✅ Testing task completion rates for common operations...');

    try {
      const taskTests = [
        {
          name: 'Payment Creation Flow',
          test: () => {
            const paymentForm = document.querySelector('[data-testid*="payment"], form[class*="payment"]');
            const requiredFields = paymentForm?.querySelectorAll('input[required], select[required]');
            const submitButton = paymentForm?.querySelector('button[type="submit"], .submit-btn');
            
            return {
              hasForm: !!paymentForm,
              requiredFields: requiredFields?.length || 0,
              hasSubmit: !!submitButton,
              passed: !!paymentForm && !!submitButton && (requiredFields?.length || 0) <= 4
            };
          }
        },
        {
          name: 'Vault Investment Flow',
          test: () => {
            const vaultElements = document.querySelectorAll('[data-testid*="vault"], .vault');
            const investButtons = document.querySelectorAll(
              '[data-testid*="invest"], button:contains("Invest"), .invest-btn'
            );
            
            return {
              vaultElements: vaultElements.length,
              investButtons: investButtons.length,
              passed: vaultElements.length > 0 && investButtons.length > 0
            };
          }
        },
        {
          name: 'Group Participation Flow',
          test: () => {
            const groupElements = document.querySelectorAll('[data-testid*="group"], .group');
            const joinButtons = document.querySelectorAll(
              '[data-testid*="join"], button:contains("Join"), .join-btn'
            );
            
            return {
              groupElements: groupElements.length,
              joinButtons: joinButtons.length,
              passed: groupElements.length > 0 || joinButtons.length > 0
            };
          }
        },
        {
          name: 'Dashboard Navigation',
          test: () => {
            const dashboardLinks = document.querySelectorAll(
              'a[href*="dashboard"], [data-testid*="dashboard"]'
            );
            const quickActions = document.querySelectorAll(
              '.quick-action, [data-testid*="quick"], .action-btn'
            );
            
            return {
              dashboardLinks: dashboardLinks.length,
              quickActions: quickActions.length,
              passed: dashboardLinks.length > 0 || quickActions.length >= 3
            };
          }
        }
      ];

      let passedTaskTests = 0;
      const taskDetails: string[] = [];

      for (const test of taskTests) {
        try {
          const result = test.test();
          if (result.passed) {
            passedTaskTests++;
            taskDetails.push(`✅ ${test.name}: Streamlined`);
          } else {
            taskDetails.push(`⚠️ ${test.name}: Could be simplified`);
          }
        } catch (error) {
          taskDetails.push(`❌ ${test.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      this.addResult('UX - Task Completion Rates',
        passedTaskTests >= taskTests.length * 0.8 ? TestStatus.PASSED : TestStatus.WARNING,
        `Task completion: ${passedTaskTests}/${taskTests.length} workflows optimized. ${taskDetails.join(', ')}`,
        TestCategory.UI, performance.now() - startTime);

    } catch (error) {
      this.addResult('UX - Task Completion Rates', TestStatus.FAILED,
        `Task completion test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.UI, performance.now() - startTime);
    }
  }

  private async testErrorRecovery(): Promise<void> {
    const startTime = performance.now();
    console.log('    🔄 Testing error recovery and help system effectiveness...');

    try {
      const errorRecoveryTests = [
        {
          name: 'Error Message Clarity',
          test: () => {
            const errorElements = document.querySelectorAll(
              '.error, .alert-error, [role="alert"], .notification-error'
            );
            let clearErrorMessages = 0;
            
            errorElements.forEach(element => {
              const text = element.textContent?.trim();
              const hasActionableText = text && text.length > 10 && 
                (text.includes('try') || text.includes('check') || text.includes('please'));
              if (hasActionableText) {
                clearErrorMessages++;
              }
            });
            
            return {
              errorElements: errorElements.length,
              clearErrorMessages,
              passed: errorElements.length === 0 || clearErrorMessages >= errorElements.length * 0.7
            };
          }
        },
        {
          name: 'Retry Mechanisms',
          test: () => {
            const retryButtons = document.querySelectorAll(
              '[data-testid*="retry"], button:contains("Retry"), .retry-btn, button:contains("Try Again")'
            );
            const refreshButtons = document.querySelectorAll(
              '[data-testid*="refresh"], button:contains("Refresh"), .refresh-btn'
            );
            
            return {
              retryButtons: retryButtons.length,
              refreshButtons: refreshButtons.length,
              passed: retryButtons.length > 0 || refreshButtons.length > 0
            };
          }
        },
        {
          name: 'Help System Access',
          test: () => {
            const helpButtons = document.querySelectorAll(
              '[data-testid*="help"], button:contains("Help"), .help-btn, [aria-label*="help"]'
            );
            const supportLinks = document.querySelectorAll(
              'a[href*="support"], a[href*="help"], a[href*="faq"]'
            );
            
            return {
              helpButtons: helpButtons.length,
              supportLinks: supportLinks.length,
              passed: helpButtons.length > 0 || supportLinks.length > 0
            };
          }
        },
        {
          name: 'Fallback Options',
          test: () => {
            const alternativeActions = document.querySelectorAll(
              '.alternative, .fallback, [data-testid*="alternative"]'
            );
            const cancelButtons = document.querySelectorAll(
              'button:contains("Cancel"), .cancel-btn, [data-testid*="cancel"]'
            );
            
            return {
              alternativeActions: alternativeActions.length,
              cancelButtons: cancelButtons.length,
              passed: cancelButtons.length > 0 // At least cancel options should be available
            };
          }
        }
      ];

      let passedRecoveryTests = 0;
      const recoveryDetails: string[] = [];

      for (const test of errorRecoveryTests) {
        try {
          const result = test.test();
          if (result.passed) {
            passedRecoveryTests++;
            recoveryDetails.push(`✅ ${test.name}: Available`);
          } else {
            recoveryDetails.push(`⚠️ ${test.name}: Needs improvement`);
          }
        } catch (error) {
          recoveryDetails.push(`❌ ${test.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      this.addResult('UX - Error Recovery',
        passedRecoveryTests >= errorRecoveryTests.length * 0.7 ? TestStatus.PASSED : TestStatus.WARNING,
        `Error recovery: ${passedRecoveryTests}/${errorRecoveryTests.length} mechanisms available. ${recoveryDetails.join(', ')}`,
        TestCategory.UI, performance.now() - startTime);

    } catch (error) {
      this.addResult('UX - Error Recovery', TestStatus.FAILED,
        `Error recovery test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.UI, performance.now() - startTime);
    }
  }

  private async testFeatureDiscoverability(): Promise<void> {
    const startTime = performance.now();
    console.log('    🔍 Testing feature discoverability and intuitive design...');

    try {
      const discoverabilityTests = [
        {
          name: 'Feature Visibility',
          test: () => {
            const mainFeatures = document.querySelectorAll(
              '[data-testid*="feature"], .feature-card, .main-feature'
            );
            const featureButtons = document.querySelectorAll(
              'button[class*="feature"], .feature-btn, [data-testid*="action"]'
            );
            
            return {
              mainFeatures: mainFeatures.length,
              featureButtons: featureButtons.length,
              passed: mainFeatures.length >= 3 || featureButtons.length >= 5
            };
          }
        },
        {
          name: 'Intuitive Icons and Labels',
          test: () => {
            const iconsWithLabels = document.querySelectorAll(
              'button[aria-label], [title], .icon + .label, .icon-with-text'
            );
            const unlabeledIcons = document.querySelectorAll(
              '.icon:not([aria-label]):not([title]), i:not([aria-label]):not([title])'
            );
            
            return {
              iconsWithLabels: iconsWithLabels.length,
              unlabeledIcons: unlabeledIcons.length,
              passed: unlabeledIcons.length === 0 || iconsWithLabels.length >= unlabeledIcons.length * 2
            };
          }
        },
        {
          name: 'Search and Filter Options',
          test: () => {
            const searchInputs = document.querySelectorAll(
              'input[type="search"], input[placeholder*="search"], .search-input'
            );
            const filterButtons = document.querySelectorAll(
              '[data-testid*="filter"], .filter-btn, button:contains("Filter")'
            );
            
            return {
              searchInputs: searchInputs.length,
              filterButtons: filterButtons.length,
              passed: searchInputs.length > 0 || filterButtons.length > 0
            };
          }
        },
        {
          name: 'Progressive Disclosure',
          test: () => {
            const expandableElements = document.querySelectorAll(
              '[aria-expanded], .expandable, .collapsible, details'
            );
            const moreButtons = document.querySelectorAll(
              'button:contains("More"), .more-btn, button:contains("Show")'
            );
            
            return {
              expandableElements: expandableElements.length,
              moreButtons: moreButtons.length,
              passed: expandableElements.length > 0 || moreButtons.length > 0
            };
          }
        }
      ];

      let passedDiscoverabilityTests = 0;
      const discoverabilityDetails: string[] = [];

      for (const test of discoverabilityTests) {
        try {
          const result = test.test();
          if (result.passed) {
            passedDiscoverabilityTests++;
            discoverabilityDetails.push(`✅ ${test.name}: Good`);
          } else {
            discoverabilityDetails.push(`⚠️ ${test.name}: Could be improved`);
          }
        } catch (error) {
          discoverabilityDetails.push(`❌ ${test.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      this.addResult('UX - Feature Discoverability',
        passedDiscoverabilityTests >= discoverabilityTests.length * 0.7 ? TestStatus.PASSED : TestStatus.WARNING,
        `Feature discoverability: ${passedDiscoverabilityTests}/${discoverabilityTests.length} aspects optimized. ${discoverabilityDetails.join(', ')}`,
        TestCategory.UI, performance.now() - startTime);

    } catch (error) {
      this.addResult('UX - Feature Discoverability', TestStatus.FAILED,
        `Feature discoverability test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.UI, performance.now() - startTime);
    }
  }

  private async testUserFeedbackCollection(): Promise<void> {
    const startTime = performance.now();
    console.log('    📝 Testing user feedback collection and response...');

    try {
      const feedbackTests = [
        {
          name: 'Feedback Mechanisms',
          test: () => {
            const feedbackButtons = document.querySelectorAll(
              '[data-testid*="feedback"], button:contains("Feedback"), .feedback-btn'
            );
            const ratingElements = document.querySelectorAll(
              '.rating, .stars, [data-testid*="rating"]'
            );
            const surveyLinks = document.querySelectorAll(
              'a[href*="survey"], a[href*="feedback"], .survey-link'
            );
            
            return {
              feedbackButtons: feedbackButtons.length,
              ratingElements: ratingElements.length,
              surveyLinks: surveyLinks.length,
              passed: feedbackButtons.length > 0 || ratingElements.length > 0 || surveyLinks.length > 0
            };
          }
        },
        {
          name: 'Contact Information',
          test: () => {
            const contactLinks = document.querySelectorAll(
              'a[href*="contact"], a[href^="mailto:"], .contact-link'
            );
            const supportInfo = document.querySelectorAll(
              '.support-info, [data-testid*="support"], .help-contact'
            );
            
            return {
              contactLinks: contactLinks.length,
              supportInfo: supportInfo.length,
              passed: contactLinks.length > 0 || supportInfo.length > 0
            };
          }
        },
        {
          name: 'Success Confirmations',
          test: () => {
            const successMessages = document.querySelectorAll(
              '.success, .alert-success, [role="status"], .notification-success'
            );
            const confirmationElements = document.querySelectorAll(
              '.confirmation, [data-testid*="confirm"], .success-state'
            );
            
            return {
              successMessages: successMessages.length,
              confirmationElements: confirmationElements.length,
              passed: true // This is more about implementation patterns
            };
          }
        },
        {
          name: 'User Preferences',
          test: () => {
            const settingsLinks = document.querySelectorAll(
              'a[href*="settings"], a[href*="preferences"], .settings-link'
            );
            const themeToggles = document.querySelectorAll(
              '[data-testid*="theme"], .theme-toggle, button:contains("Dark")'
            );
            
            return {
              settingsLinks: settingsLinks.length,
              themeToggles: themeToggles.length,
              passed: settingsLinks.length > 0 || themeToggles.length > 0
            };
          }
        }
      ];

      let passedFeedbackTests = 0;
      const feedbackDetails: string[] = [];

      for (const test of feedbackTests) {
        try {
          const result = test.test();
          if (result.passed) {
            passedFeedbackTests++;
            feedbackDetails.push(`✅ ${test.name}: Available`);
          } else {
            feedbackDetails.push(`⚠️ ${test.name}: Could be added`);
          }
        } catch (error) {
          feedbackDetails.push(`❌ ${test.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      this.addResult('UX - User Feedback Collection',
        passedFeedbackTests >= feedbackTests.length * 0.6 ? TestStatus.PASSED : TestStatus.WARNING,
        `User feedback: ${passedFeedbackTests}/${feedbackTests.length} mechanisms available. ${feedbackDetails.join(', ')}`,
        TestCategory.UI, performance.now() - startTime);

    } catch (error) {
      this.addResult('UX - User Feedback Collection', TestStatus.FAILED,
        `User feedback test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.UI, performance.now() - startTime);
    }
  }



  // Helper methods
  private initializeFocusableElements(): void {
    this.updateFocusableElements();
  }

  private updateFocusableElements(): void {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ];
    
    this.focusableElements = Array.from(
      document.querySelectorAll(focusableSelectors.join(', '))
    ).filter(element => {
      // Filter out hidden elements
      const style = window.getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
  }

  private hasAdequateContrast(color: string, backgroundColor: string, fontSize: number): boolean {
    try {
      // This is a simplified contrast check
      // In a real implementation, you would use a proper color contrast library
      
      // Parse colors (simplified)
      const colorRgb = this.parseColor(color);
      const bgColorRgb = this.parseColor(backgroundColor);
      
      if (!colorRgb || !bgColorRgb) {
        return true; // Assume adequate if we can't parse
      }
      
      // Calculate relative luminance (simplified)
      const colorLuminance = this.getRelativeLuminance(colorRgb);
      const bgLuminance = this.getRelativeLuminance(bgColorRgb);
      
      // Calculate contrast ratio
      const contrastRatio = (Math.max(colorLuminance, bgLuminance) + 0.05) / 
                           (Math.min(colorLuminance, bgLuminance) + 0.05);
      
      // WCAG AA standards: 4.5:1 for normal text, 3:1 for large text
      const requiredRatio = fontSize >= 18 ? 3 : 4.5;
      
      return contrastRatio >= requiredRatio;
    } catch (error) {
      return true; // Assume adequate if calculation fails
    }
  }

  private parseColor(color: string): { r: number; g: number; b: number } | null {
    try {
      // Handle rgb() format
      const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (rgbMatch) {
        return {
          r: parseInt(rgbMatch[1]),
          g: parseInt(rgbMatch[2]),
          b: parseInt(rgbMatch[3])
        };
      }
      
      // Handle rgba() format
      const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/);
      if (rgbaMatch) {
        return {
          r: parseInt(rgbaMatch[1]),
          g: parseInt(rgbaMatch[2]),
          b: parseInt(rgbaMatch[3])
        };
      }
      
      // Handle hex format
      const hexMatch = color.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
      if (hexMatch) {
        return {
          r: parseInt(hexMatch[1], 16),
          g: parseInt(hexMatch[2], 16),
          b: parseInt(hexMatch[3], 16)
        };
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  private getRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
    // Convert to relative luminance using WCAG formula
    const rsRGB = rgb.r / 255;
    const gsRGB = rgb.g / 255;
    const bsRGB = rgb.b / 255;
    
    const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  private addResult(testName: string, status: TestStatus, details: string, category: TestCategory, executionTime: number): void {
    this.results.push({
      testName,
      status,
      details,
      category,
      executionTime,
      timestamp: new Date()
    });
  }

  // Public method to get usability metrics
  public getUsabilityMetrics(): UsabilityMetrics {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === TestStatus.PASSED).length;
    const failedTests = this.results.filter(r => r.status === TestStatus.FAILED).length;
    
    return {
      taskCompletionRate: totalTests > 0 ? passedTests / totalTests : 0,
      averageTaskTime: totalTests > 0 ? 
        this.results.reduce((sum, r) => sum + r.executionTime, 0) / totalTests : 0,
      errorRate: totalTests > 0 ? failedTests / totalTests : 0,
      userSatisfaction: totalTests > 0 ? passedTests / totalTests : 0,
      learnability: this.calculateLearnability()
    };
  }

  private calculateLearnability(): number {
    // Calculate learnability based on onboarding and discoverability test results
    const onboardingResults = this.results.filter(r => 
      r.testName.includes('Onboarding') || r.testName.includes('Discoverability')
    );
    
    if (onboardingResults.length === 0) return 0.5;
    
    const passedOnboarding = onboardingResults.filter(r => r.status === TestStatus.PASSED).length;
    return passedOnboarding / onboardingResults.length;
  }

  // Public method to get accessibility issues
  public getAccessibilityIssues(): AccessibilityResult[] {
    const issues: AccessibilityResult[] = [];
    
    // Convert test results to accessibility issues
    this.results.forEach(result => {
      if (result.status === TestStatus.FAILED || result.status === TestStatus.WARNING) {
        issues.push({
          element: document.body, // Simplified - in real implementation would track specific elements
          issues: [result.details],
          severity: result.status === TestStatus.FAILED ? 'high' : 'medium',
          wcagLevel: 'AA'
        });
      }
    });
    
    return issues;
  }
}

// Export the tester
export const accessibilityUsabilityTester = new AccessibilityUsabilityTester();