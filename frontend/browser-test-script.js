// 🧪 SeiMoney Browser Test Script
// Copy and paste this in browser console (F12) after opening http://localhost:5175

console.log('🚀 Starting SeiMoney Automated Browser Test...');

// Test configuration
const TEST_CONFIG = {
  delays: {
    short: 1000,   // 1 second
    medium: 2000,  // 2 seconds
    long: 3000     // 3 seconds
  },
  testData: {
    recipient: 'sei1abc123def456ghi789jkl012mno345pqr678stu',
    amount: '10.5',
    groupName: 'Test Group',
    potName: 'Test Savings Pot',
    potGoal: '1000'
  }
};

// Test results
let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper functions
function logTest(testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${testName}${details ? ' - ' + details : ''}`);
  
  testResults.tests.push({
    name: testName,
    passed,
    details
  });
  
  if (passed) testResults.passed++;
  else testResults.failed++;
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function findElementByText(text, tag = '*') {
  return Array.from(document.querySelectorAll(tag)).find(el => 
    el.textContent && el.textContent.includes(text)
  );
}

function findButtonByText(text) {
  return Array.from(document.querySelectorAll('button')).find(btn => 
    btn.textContent && btn.textContent.includes(text)
  );
}

// Test functions
async function testPageLoad() {
  console.log('\n🏠 Testing Page Load...');
  
  // Test logo
  const logo = findElementByText('SeiMoney');
  logTest('Logo visible', !!logo);
  
  // Test connect wallet button
  const connectBtn = findButtonByText('Connect Wallet');
  logTest('Connect Wallet button visible', !!connectBtn);
  
  // Test navigation
  const navItems = ['Dashboard', 'Payments', 'Groups', 'Pots', 'Vaults'];
  navItems.forEach(item => {
    const navItem = findElementByText(item);
    logTest(`Navigation item "${item}" visible`, !!navItem);
  });
}

async function testWalletConnection() {
  console.log('\n💰 Testing Wallet Connection...');
  
  const connectBtn = findButtonByText('Connect Wallet');
  if (!connectBtn) {
    logTest('Wallet connection', false, 'Connect button not found');
    return false;
  }
  
  // Click connect button
  connectBtn.click();
  await wait(TEST_CONFIG.delays.medium);
  
  // Check if wallet modal opened
  const modal = document.querySelector('[role="dialog"]') || 
                document.querySelector('.modal') ||
                document.querySelector('[class*="modal"]');
  
  logTest('Wallet modal opens', !!modal);
  
  if (modal) {
    // Try to find MetaMask option
    const metamaskBtn = findElementByText('MetaMask', 'button') || 
                       findElementByText('metamask', 'button');
    
    if (metamaskBtn) {
      logTest('MetaMask option available', true);
      // Note: We won't actually connect as it requires MetaMask extension
      console.log('ℹ️  MetaMask connection requires browser extension');
    } else {
      logTest('MetaMask option available', false);
    }
    
    // Close modal by clicking outside or close button
    const closeBtn = modal.querySelector('[aria-label="Close"]') || 
                    modal.querySelector('.close') ||
                    findButtonByText('Close');
    
    if (closeBtn) {
      closeBtn.click();
    } else {
      // Click outside modal
      document.body.click();
    }
    
    await wait(TEST_CONFIG.delays.short);
  }
  
  return !!modal;
}

async function testNavigation() {
  console.log('\n🧭 Testing Navigation...');
  
  const pages = [
    { name: 'Dashboard', selector: 'Dashboard' },
    { name: 'Payments', selector: 'Payments' },
    { name: 'Groups', selector: 'Groups' },
    { name: 'Pots', selector: 'Pots' },
    { name: 'Vaults', selector: 'Vaults' }
  ];
  
  for (const page of pages) {
    const navButton = findButtonByText(page.selector);
    if (navButton) {
      navButton.click();
      await wait(TEST_CONFIG.delays.short);
      
      // Check if page content changed
      const pageContent = document.querySelector('main') || document.body;
      const hasPageContent = pageContent.textContent.includes(page.name);
      
      logTest(`Navigate to ${page.name}`, hasPageContent);
    } else {
      logTest(`Navigate to ${page.name}`, false, 'Navigation button not found');
    }
  }
}

async function testPaymentsPage() {
  console.log('\n💸 Testing Payments Page...');
  
  // Navigate to payments
  const paymentsBtn = findButtonByText('Payments');
  if (paymentsBtn) {
    paymentsBtn.click();
    await wait(TEST_CONFIG.delays.medium);
    
    // Check for payment form
    const recipientInput = document.querySelector('input[placeholder*="recipient"]') ||
                          document.querySelector('input[placeholder*="address"]') ||
                          document.querySelector('input[name*="recipient"]');
    
    logTest('Payment form visible', !!recipientInput);
    
    if (recipientInput) {
      // Test form filling
      recipientInput.value = TEST_CONFIG.testData.recipient;
      recipientInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      const amountInput = document.querySelector('input[placeholder*="amount"]') ||
                         document.querySelector('input[type="number"]');
      
      if (amountInput) {
        amountInput.value = TEST_CONFIG.testData.amount;
        amountInput.dispatchEvent(new Event('input', { bubbles: true }));
        logTest('Form can be filled', true);
      } else {
        logTest('Form can be filled', false, 'Amount input not found');
      }
    }
  } else {
    logTest('Navigate to Payments', false, 'Payments button not found');
  }
}

async function testResponsiveDesign() {
  console.log('\n📱 Testing Responsive Design...');
  
  const originalWidth = window.innerWidth;
  
  // Test mobile view
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 375
  });
  
  window.dispatchEvent(new Event('resize'));
  await wait(TEST_CONFIG.delays.short);
  
  // Check if mobile navigation exists
  const mobileNav = document.querySelector('.lg\\:hidden') ||
                   document.querySelector('[class*="mobile"]') ||
                   document.querySelector('.sm\\:block');
  
  logTest('Mobile responsive design', !!mobileNav);
  
  // Restore original width
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: originalWidth
  });
  
  window.dispatchEvent(new Event('resize'));
}

async function testErrorHandling() {
  console.log('\n🐛 Testing Error Handling...');
  
  // Check console for errors
  const originalError = console.error;
  let errorCount = 0;
  
  console.error = function(...args) {
    errorCount++;
    originalError.apply(console, args);
  };
  
  await wait(TEST_CONFIG.delays.medium);
  
  console.error = originalError;
  
  logTest('No console errors', errorCount === 0, `Found ${errorCount} errors`);
}

// Main test runner
async function runAllTests() {
  console.log('🎯 Starting comprehensive browser tests...\n');
  
  try {
    await testPageLoad();
    await testWalletConnection();
    await testNavigation();
    await testPaymentsPage();
    await testResponsiveDesign();
    await testErrorHandling();
    
    // Final results
    console.log('\n📊 Test Results Summary:');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
    
    if (testResults.failed === 0) {
      console.log('\n🎉 All tests passed! SeiMoney is working perfectly!');
    } else {
      console.log('\n⚠️  Some tests failed. Check the details above.');
      console.log('\nFailed tests:');
      testResults.tests
        .filter(test => !test.passed)
        .forEach(test => console.log(`  - ${test.name}: ${test.details}`));
    }
    
    return testResults;
    
  } catch (error) {
    console.error('❌ Test runner failed:', error);
    return null;
  }
}

// Quick test function
async function quickTest() {
  console.log('⚡ Running quick test (30 seconds)...\n');
  
  await testPageLoad();
  await wait(TEST_CONFIG.delays.short);
  
  const connectBtn = findButtonByText('Connect Wallet');
  logTest('Quick test - Basic functionality', !!connectBtn);
  
  console.log('\n⚡ Quick test completed!');
}

// Export functions for manual use
window.SeiMoneyTest = {
  runAllTests,
  quickTest,
  testPageLoad,
  testWalletConnection,
  testNavigation,
  testPaymentsPage,
  testResponsiveDesign,
  testErrorHandling
};

console.log('\n🎮 Available test commands:');
console.log('  SeiMoneyTest.runAllTests()  - Run all tests (5 minutes)');
console.log('  SeiMoneyTest.quickTest()    - Quick test (30 seconds)');
console.log('  SeiMoneyTest.testPageLoad() - Test page loading only');
console.log('\n💡 Tip: Run SeiMoneyTest.quickTest() for a fast check!');

// Auto-run quick test
console.log('\n🚀 Auto-running quick test in 3 seconds...');
setTimeout(() => {
  quickTest();
}, 3000);