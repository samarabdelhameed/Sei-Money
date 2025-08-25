// Workflow Testers - Quick Implementation
import { WorkflowResult, WorkflowStep, TestResult } from './types';
import { TestUtilities } from './test-utilities';

export class WorkflowTesters {
  private utils = TestUtilities.getInstance();

  async testCompleteUserFlow(): Promise<WorkflowResult> {
    const steps: WorkflowStep[] = [];
    const startTime = performance.now();

    try {
      // Step 1: Navigate to home
      const homeStep = await this.testHomeNavigation();
      steps.push(homeStep);

      // Step 2: Navigate to dashboard
      const dashboardStep = await this.testDashboardNavigation();
      steps.push(dashboardStep);

      // Step 3: Test payments
      const paymentsStep = await this.testPaymentsNavigation();
      steps.push(paymentsStep);

      const overallStatus = steps.every(s => s.status === 'completed') ? 'completed' : 'partial';

      return {
        workflowName: 'Complete User Flow',
        steps,
        overallStatus,
        totalTime: performance.now() - startTime,
        failurePoint: overallStatus === 'partial' ? steps.find(s => s.status === 'failed')?.stepName : undefined
      };

    } catch (error) {
      return {
        workflowName: 'Complete User Flow',
        steps,
        overallStatus: 'failed',
        totalTime: performance.now() - startTime,
        failurePoint: 'Workflow execution error'
      };
    }
  }

  private async testHomeNavigation(): Promise<WorkflowStep> {
    const startTime = performance.now();
    try {
      // Check if we're on home or navigate to it
      const isHome = window.location.pathname === '/' || window.location.pathname === '/home';
      return {
        stepName: 'Navigate to Home',
        status: isHome ? 'completed' : 'failed',
        duration: performance.now() - startTime,
        details: isHome ? 'Successfully on home page' : 'Not on home page'
      };
    } catch (error) {
      return {
        stepName: 'Navigate to Home',
        status: 'failed',
        duration: performance.now() - startTime,
        details: `Error: ${error}`
      };
    }
  }

  private async testDashboardNavigation(): Promise<WorkflowStep> {
    const startTime = performance.now();
    try {
      const dashboardBtn = document.querySelector('button:contains("Get Started")') || 
                          document.querySelector('[data-testid="nav-dashboard"]');
      
      if (dashboardBtn) {
        await this.utils.simulateClick('button:contains("Get Started")');
        await this.utils.waitForCondition(() => 
          window.location.pathname.includes('dashboard'), 3000);
      }

      const isDashboard = window.location.pathname.includes('dashboard');
      return {
        stepName: 'Navigate to Dashboard',
        status: isDashboard ? 'completed' : 'failed',
        duration: performance.now() - startTime,
        details: isDashboard ? 'Successfully navigated to dashboard' : 'Failed to navigate to dashboard'
      };
    } catch (error) {
      return {
        stepName: 'Navigate to Dashboard',
        status: 'failed',
        duration: performance.now() - startTime,
        details: `Error: ${error}`
      };
    }
  }

  private async testPaymentsNavigation(): Promise<WorkflowStep> {
    const startTime = performance.now();
    try {
      const paymentsBtn = document.querySelector('[data-testid="nav-payments"]') ||
                         document.querySelector('button:contains("New Transfer")');
      
      if (paymentsBtn) {
        await this.utils.simulateClick('[data-testid="nav-payments"]');
        await this.utils.waitForCondition(() => 
          window.location.pathname.includes('payments'), 3000);
      }

      const isPayments = window.location.pathname.includes('payments');
      return {
        stepName: 'Navigate to Payments',
        status: isPayments ? 'completed' : 'failed',
        duration: performance.now() - startTime,
        details: isPayments ? 'Successfully navigated to payments' : 'Failed to navigate to payments'
      };
    } catch (error) {
      return {
        stepName: 'Navigate to Payments',
        status: 'failed',
        duration: performance.now() - startTime,
        details: `Error: ${error}`
      };
    }
  }
}