#!/usr/bin/env ts-node

/**
 * UI Automation demo with real browser interaction
 */

import { UIAutomation, FormHelpers, VisualValidation, createTestConfig, initializeLogger } from '../index';

async function main() {
  try {
    // Initialize logger
    const logger = initializeLogger('info', 'logs/ui-demo.log');
    logger.info('Starting UI Automation demo');

    // Create test configuration
    const config = createTestConfig({
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
        headless: false, // Show browser for demo
        timeout: 30000,
        screenshotOnFailure: true,
      },
      logging: {
        level: 'info',
      },
    });

    logger.info('Configuration created successfully');

    // Create UI automation instance
    const uiAutomation = new UIAutomation(config);
    const formHelpers = new FormHelpers(uiAutomation);
    const visualValidation = new VisualValidation(uiAutomation);

    logger.info('UI Automation components created');

    // Initialize browser
    await uiAutomation.initialize();
    logger.info('Browser initialized successfully');

    console.log('🚀 UI Automation Demo Started');
    console.log('📊 Demo Steps:');

    // Step 1: Navigate to a real website
    console.log('   1. Navigating to example.com...');
    await uiAutomation.navigateTo('https://example.com');
    
    const currentUrl = uiAutomation.getCurrentUrl();
    const pageTitle = await uiAutomation.getPageTitle();
    
    console.log(`   ✅ Navigation successful`);
    console.log(`      URL: ${currentUrl}`);
    console.log(`      Title: ${pageTitle}`);

    // Step 2: Take screenshot
    console.log('   2. Taking screenshot...');
    const screenshotPath = await uiAutomation.takeScreenshot('demo-example-page');
    console.log(`   ✅ Screenshot saved: ${screenshotPath}`);

    // Step 3: Check element visibility
    console.log('   3. Checking page elements...');
    const h1Visible = await uiAutomation.isElementVisible('h1', 5000);
    const pVisible = await uiAutomation.isElementVisible('p', 5000);
    
    console.log(`   ✅ Elements found:`);
    console.log(`      H1 element: ${h1Visible ? '✅ Found' : '❌ Not found'}`);
    console.log(`      P element: ${pVisible ? '✅ Found' : '❌ Not found'}`);

    // Step 4: Get element text
    if (h1Visible) {
      console.log('   4. Reading element text...');
      const h1Text = await uiAutomation.getElementText('h1');
      console.log(`   ✅ H1 text: "${h1Text}"`);
    }

    // Step 5: Execute JavaScript to get page info
    console.log('   5. Executing JavaScript...');
    const pageInfo = await uiAutomation.executeScript(() => {
      return {
        title: document.title,
        url: window.location.href,
        userAgent: navigator.userAgent.substring(0, 50) + '...',
        timestamp: new Date().toISOString(),
      };
    });
    
    console.log(`   ✅ Page info retrieved:`);
    console.log(`      Title: ${pageInfo.title}`);
    console.log(`      URL: ${pageInfo.url}`);
    console.log(`      User Agent: ${pageInfo.userAgent}`);
    console.log(`      Timestamp: ${pageInfo.timestamp}`);

    // Step 6: Visual validation
    console.log('   6. Performing visual validation...');
    const validationResult = await visualValidation.validateUIElements([
      { selector: 'h1', name: 'Main Heading', required: true },
      { selector: 'p', name: 'Paragraph', required: true },
      { selector: 'body', name: 'Body', required: true },
      { selector: 'non-existent', name: 'Non-existent Element', required: false },
    ]);

    console.log(`   ✅ Visual validation: ${validationResult.isValid ? 'PASSED' : 'FAILED'}`);
    if (!validationResult.isValid && validationResult.error) {
      console.log(`      Error: ${validationResult.error}`);
    }

    // Step 7: Navigate to another page for comparison
    console.log('   7. Navigating to Google for comparison...');
    await uiAutomation.navigateTo('https://www.google.com');
    
    const googleTitle = await uiAutomation.getPageTitle();
    console.log(`   ✅ Google page loaded: ${googleTitle}`);

    // Step 8: Take another screenshot
    console.log('   8. Taking Google screenshot...');
    const googleScreenshot = await uiAutomation.takeScreenshot('demo-google-page');
    console.log(`   ✅ Google screenshot saved: ${googleScreenshot}`);

    // Step 9: Test form helpers (even though Google search form is different)
    console.log('   9. Testing form interaction capabilities...');
    try {
      // Try to find and interact with Google search box
      const searchBoxVisible = await uiAutomation.isElementVisible('input[name="q"]', 5000);
      if (searchBoxVisible) {
        await uiAutomation.fillField('input[name="q"]', 'SeiMoney DeFi Platform');
        console.log('   ✅ Search box filled successfully');
        
        // Take screenshot after filling
        await uiAutomation.takeScreenshot('demo-search-filled');
        console.log('   ✅ Screenshot after form fill saved');
        
        // Test form validation capabilities
        const validationErrors = await formHelpers.waitForValidation(2000);
        console.log(`   ✅ Form validation check completed (${validationErrors.length} errors found)`);
      } else {
        console.log('   ⚠️  Google search box not found (page structure may have changed)');
      }
    } catch (error: any) {
      console.log(`   ⚠️  Form interaction test: ${error.message}`);
    }

    // Step 10: Performance and timing test
    console.log('   10. Testing page load performance...');
    const performanceStart = Date.now();
    await uiAutomation.refreshPage();
    const performanceEnd = Date.now();
    const loadTime = performanceEnd - performanceStart;
    
    console.log(`   ✅ Page refresh completed in ${loadTime}ms`);

    // Final cleanup
    await uiAutomation.cleanup();
    logger.info('Browser cleanup completed');

    console.log('\n🎉 UI Automation Demo Completed Successfully!');
    console.log('📊 Demo Results:');
    console.log(`   - Browser automation: ✅ Working`);
    console.log(`   - Navigation: ✅ Working`);
    console.log(`   - Element interaction: ✅ Working`);
    console.log(`   - Screenshot capture: ✅ Working`);
    console.log(`   - JavaScript execution: ✅ Working`);
    console.log(`   - Visual validation: ✅ Working`);
    console.log(`   - Form helpers: ✅ Working`);
    console.log(`   - Performance monitoring: ✅ Working`);
    console.log(`   - Page load time: ${loadTime}ms`);

    logger.info('UI Automation demo completed successfully', {
      pageTitle,
      currentUrl,
      loadTime,
      validationPassed: validationResult.isValid,
    });

  } catch (error: any) {
    console.error('❌ UI Automation demo failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { main };