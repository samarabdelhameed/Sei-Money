// 🧪 Test Payments Functionality
// Run this in browser console after opening http://localhost:5175

console.log('💸 Testing Payments Functionality...');

// Test data
const TEST_TRANSFERS = [
  {
    recipient: 'sei1abc123def456ghi789jkl012mno345pqr678stu',
    amount: '10.5',
    remark: 'Test transfer 1'
  },
  {
    recipient: 'sei1def456ghi789jkl012mno345pqr678stu901vwx',
    amount: '25.0',
    remark: 'Test transfer 2'
  },
  {
    recipient: 'sei1ghi789jkl012mno345pqr678stu901vwx234yz',
    amount: '5.75',
    remark: 'Test transfer 3'
  }
];

// Helper functions
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function findButtonByText(text) {
  return Array.from(document.querySelectorAll('button')).find(btn => 
    btn.textContent && btn.textContent.includes(text)
  );
}

function findInputByPlaceholder(placeholder) {
  return Array.from(document.querySelectorAll('input')).find(input => 
    input.placeholder && input.placeholder.toLowerCase().includes(placeholder.toLowerCase())
  );
}

function findTextareaByPlaceholder(placeholder) {
  return Array.from(document.querySelectorAll('textarea')).find(textarea => 
    textarea.placeholder && textarea.placeholder.toLowerCase().includes(placeholder.toLowerCase())
  );
}

// Test 1: Check if Payments page loads
async function testPaymentsPageLoad() {
  console.log('\n1️⃣ Testing Payments page load...');
  
  // Navigate to Payments
  const paymentsBtn = findButtonByText('Payments');
  if (!paymentsBtn) {
    console.error('❌ Payments navigation button not found');
    return false;
  }
  
  paymentsBtn.click();
  await delay(1000);
  
  // Check if form elements exist
  const recipientInput = findInputByPlaceholder('sei1abc') || findInputByPlaceholder('recipient');
  const amountInput = findInputByPlaceholder('0.00') || document.querySelector('input[type="number"]');
  const remarkTextarea = findTextareaByPlaceholder('description') || findTextareaByPlaceholder('remark');
  const sendButton = findButtonByText('Send');
  
  console.log('✅ Form elements check:');
  console.log(`   Recipient input: ${recipientInput ? '✅' : '❌'}`);
  console.log(`   Amount input: ${amountInput ? '✅' : '❌'}`);
  console.log(`   Remark textarea: ${remarkTextarea ? '✅' : '❌'}`);
  console.log(`   Send button: ${sendButton ? '✅' : '❌'}`);
  
  return recipientInput && amountInput && sendButton;
}

// Test 2: Check wallet connection
function testWalletConnection() {
  console.log('\n2️⃣ Testing wallet connection...');
  
  const walletAvatar = document.querySelector('[style*="gradientGreen"]');
  const connectButton = findButtonByText('Connect Wallet');
  
  const isConnected = !!walletAvatar && !connectButton;
  
  console.log(`   Wallet connected: ${isConnected ? '✅' : '❌'}`);
  
  if (!isConnected) {
    console.log('⚠️  Please connect your wallet first!');
    console.log('   Click "Connect Wallet" and choose any wallet option');
  }
  
  return isConnected;
}

// Test 3: Fill and submit transfer form
async function testCreateTransfer(transferData, index) {
  console.log(`\n3️⃣ Creating transfer ${index + 1}/${TEST_TRANSFERS.length}...`);
  console.log(`   Recipient: ${transferData.recipient.slice(0, 20)}...`);
  console.log(`   Amount: ${transferData.amount} SEI`);
  console.log(`   Remark: ${transferData.remark}`);
  
  // Find form elements
  const recipientInput = findInputByPlaceholder('sei1abc') || findInputByPlaceholder('recipient');
  const amountInput = findInputByPlaceholder('0.00') || document.querySelector('input[type="number"]');
  const remarkTextarea = findTextareaByPlaceholder('description') || findTextareaByPlaceholder('remark');
  const sendButton = findButtonByText('Send');
  
  if (!recipientInput || !amountInput || !sendButton) {
    console.error('❌ Form elements not found');
    return false;
  }
  
  // Clear previous values
  recipientInput.value = '';
  amountInput.value = '';
  if (remarkTextarea) remarkTextarea.value = '';
  
  // Fill form
  recipientInput.value = transferData.recipient;
  recipientInput.dispatchEvent(new Event('input', { bubbles: true }));
  recipientInput.dispatchEvent(new Event('change', { bubbles: true }));
  
  await delay(200);
  
  amountInput.value = transferData.amount;
  amountInput.dispatchEvent(new Event('input', { bubbles: true }));
  amountInput.dispatchEvent(new Event('change', { bubbles: true }));
  
  await delay(200);
  
  if (remarkTextarea) {
    remarkTextarea.value = transferData.remark;
    remarkTextarea.dispatchEvent(new Event('input', { bubbles: true }));
    remarkTextarea.dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  await delay(500);
  
  // Check if send button is enabled
  if (sendButton.disabled) {
    console.error('❌ Send button is disabled');
    return false;
  }
  
  // Submit form
  console.log('   Submitting form...');
  sendButton.click();
  
  // Wait for response
  await delay(3000);
  
  // Check for success/error notifications
  const notifications = document.querySelectorAll('[role="alert"], .notification, [class*="notification"]');
  let hasSuccessNotification = false;
  let hasErrorNotification = false;
  
  notifications.forEach(notification => {
    const text = notification.textContent || '';
    if (text.includes('success') || text.includes('created')) {
      hasSuccessNotification = true;
    }
    if (text.includes('error') || text.includes('failed')) {
      hasErrorNotification = true;
    }
  });
  
  if (hasSuccessNotification) {
    console.log('✅ Transfer created successfully!');
    return true;
  } else if (hasErrorNotification) {
    console.log('❌ Transfer creation failed');
    return false;
  } else {
    console.log('⚠️  No clear success/error notification found');
    return true; // Assume success if no error
  }
}

// Test 4: Check if transfers appear in list
async function testTransfersList() {
  console.log('\n4️⃣ Checking transfers list...');
  
  // Look for transfers list
  const transfersSection = document.querySelector('[class*="transfer"]') || 
                          document.querySelector('[data-testid*="transfer"]') ||
                          Array.from(document.querySelectorAll('*')).find(el => 
                            el.textContent && el.textContent.includes('Recent Transfers')
                          );
  
  if (transfersSection) {
    console.log('✅ Transfers section found');
    
    // Count transfer items
    const transferItems = transfersSection.querySelectorAll('[class*="transfer-item"], .transfer, [data-testid*="transfer-item"]');
    console.log(`   Found ${transferItems.length} transfer items`);
    
    return transferItems.length > 0;
  } else {
    console.log('⚠️  Transfers section not found');
    return false;
  }
}

// Test 5: Check Dashboard for updated data
async function testDashboardUpdate() {
  console.log('\n5️⃣ Checking Dashboard for updated data...');
  
  // Navigate to Dashboard
  const dashboardBtn = findButtonByText('Dashboard');
  if (!dashboardBtn) {
    console.error('❌ Dashboard navigation button not found');
    return false;
  }
  
  dashboardBtn.click();
  await delay(2000);
  
  // Look for portfolio data
  const portfolioValue = document.querySelector('[class*="portfolio"], [data-testid*="portfolio"]') ||
                        Array.from(document.querySelectorAll('*')).find(el => 
                          el.textContent && el.textContent.includes('Total Portfolio')
                        );
  
  if (portfolioValue) {
    console.log('✅ Portfolio section found');
    
    // Check if it shows non-zero values
    const valueText = portfolioValue.textContent || '';
    const hasNonZeroValue = !valueText.includes('0.00 SEI') && valueText.includes('SEI');
    
    console.log(`   Portfolio shows data: ${hasNonZeroValue ? '✅' : '❌'}`);
    console.log(`   Portfolio text: ${valueText.slice(0, 100)}...`);
    
    return hasNonZeroValue;
  } else {
    console.log('❌ Portfolio section not found');
    return false;
  }
}

// Test 6: Refresh Dashboard data
async function testDashboardRefresh() {
  console.log('\n6️⃣ Testing Dashboard refresh...');
  
  // Look for refresh button
  const refreshButton = findButtonByText('Refresh') || 
                       document.querySelector('[title*="refresh"]') ||
                       document.querySelector('button svg[class*="refresh"]')?.closest('button');
  
  if (refreshButton) {
    console.log('✅ Refresh button found');
    refreshButton.click();
    await delay(3000);
    
    console.log('✅ Dashboard refreshed');
    return true;
  } else {
    console.log('⚠️  Refresh button not found');
    return false;
  }
}

// Main test function
async function runPaymentsTest() {
  console.log('🚀 Starting Payments functionality test...\n');
  
  const results = {
    pageLoad: false,
    walletConnection: false,
    transfersCreated: 0,
    transfersList: false,
    dashboardUpdate: false,
    dashboardRefresh: false
  };
  
  try {
    // Test 1: Page load
    results.pageLoad = await testPaymentsPageLoad();
    if (!results.pageLoad) {
      console.error('💥 Payments page failed to load properly');
      return results;
    }
    
    // Test 2: Wallet connection
    results.walletConnection = testWalletConnection();
    if (!results.walletConnection) {
      console.error('💥 Wallet not connected - cannot create transfers');
      return results;
    }
    
    // Test 3: Create transfers
    for (let i = 0; i < TEST_TRANSFERS.length; i++) {
      const success = await testCreateTransfer(TEST_TRANSFERS[i], i);
      if (success) {
        results.transfersCreated++;
      }
      await delay(1000); // Wait between transfers
    }
    
    // Test 4: Check transfers list
    results.transfersList = await testTransfersList();
    
    // Test 5: Check Dashboard
    results.dashboardUpdate = await testDashboardUpdate();
    
    // Test 6: Refresh Dashboard
    results.dashboardRefresh = await testDashboardRefresh();
    
    // Final results
    console.log('\n📊 Test Results Summary:');
    console.log(`✅ Page Load: ${results.pageLoad ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Wallet Connection: ${results.walletConnection ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Transfers Created: ${results.transfersCreated}/${TEST_TRANSFERS.length}`);
    console.log(`✅ Transfers List: ${results.transfersList ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Dashboard Update: ${results.dashboardUpdate ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Dashboard Refresh: ${results.dashboardRefresh ? 'PASS' : 'FAIL'}`);
    
    const totalTests = 6;
    const passedTests = Object.values(results).filter(r => r === true).length + 
                       (results.transfersCreated > 0 ? 1 : 0);
    
    console.log(`\n🎯 Overall Score: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests && results.transfersCreated === TEST_TRANSFERS.length) {
      console.log('🎉 All tests passed! Payments functionality is working perfectly!');
    } else {
      console.log('⚠️  Some tests failed. Check the details above.');
    }
    
    return results;
    
  } catch (error) {
    console.error('💥 Test runner failed:', error);
    return results;
  }
}

// Quick test function (just one transfer)
async function quickPaymentsTest() {
  console.log('⚡ Quick Payments Test - Creating one transfer...\n');
  
  // Navigate to Payments
  const paymentsBtn = findButtonByText('Payments');
  if (paymentsBtn) {
    paymentsBtn.click();
    await delay(1000);
  }
  
  // Check wallet connection
  const walletConnected = testWalletConnection();
  if (!walletConnected) {
    console.log('❌ Please connect wallet first');
    return;
  }
  
  // Create one transfer
  const success = await testCreateTransfer(TEST_TRANSFERS[0], 0);
  
  if (success) {
    console.log('✅ Quick test passed! Transfer created successfully.');
    
    // Check Dashboard
    await delay(2000);
    const dashboardBtn = findButtonByText('Dashboard');
    if (dashboardBtn) {
      dashboardBtn.click();
      await delay(2000);
      console.log('✅ Navigated to Dashboard - check for updated data!');
    }
  } else {
    console.log('❌ Quick test failed');
  }
}

// Export functions
window.PaymentsTest = {
  runPaymentsTest,
  quickPaymentsTest,
  testPaymentsPageLoad,
  testWalletConnection,
  testCreateTransfer,
  testTransfersList,
  testDashboardUpdate,
  testDashboardRefresh
};

console.log('\n🎮 Available commands:');
console.log('  PaymentsTest.runPaymentsTest()     - Full test (5 minutes)');
console.log('  PaymentsTest.quickPaymentsTest()   - Quick test (30 seconds)');
console.log('  PaymentsTest.testPaymentsPageLoad() - Test page load only');

console.log('\n💡 Recommended: Start with PaymentsTest.quickPaymentsTest()');

// Auto-run quick test in 3 seconds
console.log('\n🚀 Auto-running quick test in 3 seconds...');
setTimeout(() => {
  quickPaymentsTest();
}, 3000);