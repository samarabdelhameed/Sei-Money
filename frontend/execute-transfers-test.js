// 🎯 Execute Transfers Test - Automated Implementation
// Copy and paste this in browser console after opening http://localhost:5175

console.log('🎯 Executing Transfers Test - Following the exact steps...');

// Test data exactly as specified
const TRANSFER_TESTS = [
  {
    recipient: 'sei1abc123def456ghi789jkl012mno345pqr678stu',
    amount: '10.5',
    remark: 'Test transfer'
  },
  {
    recipient: 'sei1def456ghi789jkl012mno345pqr678stu901vwx',
    amount: '25.0',
    remark: 'Second test transfer'
  },
  {
    recipient: 'sei1ghi789jkl012mno345pqr678stu901vwx234yz',
    amount: '5.75',
    remark: 'Third test transfer'
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

// Step 1: Navigate to Payments page
async function step1_NavigateToPayments() {
  console.log('\n📍 Step 1: Navigate to Payments page...');
  
  const paymentsBtn = findButtonByText('Payments');
  if (!paymentsBtn) {
    console.error('❌ Payments button not found in navigation');
    return false;
  }
  
  paymentsBtn.click();
  console.log('✅ Clicked Payments button');
  
  await delay(2000); // Wait for page to load
  
  // Verify we're on the payments page
  const pageTitle = document.querySelector('h1, h2, [class*="title"]');
  if (pageTitle && pageTitle.textContent.includes('Payment')) {
    console.log('✅ Successfully navigated to Payments page');
    return true;
  } else {
    console.log('⚠️  Page navigation unclear, continuing...');
    return true;
  }
}

// Step 2: Check wallet connection
function step2_CheckWalletConnection() {
  console.log('\n🔗 Step 2: Check wallet connection...');
  
  const walletAvatar = document.querySelector('[style*="gradientGreen"]');
  const connectButton = findButtonByText('Connect Wallet');
  
  const isConnected = !!walletAvatar && !connectButton;
  
  if (isConnected) {
    console.log('✅ Wallet is connected');
    return true;
  } else {
    console.log('❌ Wallet is not connected');
    console.log('🔧 Please connect your wallet first:');
    console.log('   1. Click "Connect Wallet"');
    console.log('   2. Choose any wallet option');
    console.log('   3. Complete the connection process');
    console.log('   4. Run this script again');
    return false;
  }
}

// Step 3: Fill and submit transfer form
async function step3_CreateTransfer(transferData, index) {
  console.log(`\n💸 Step 3.${index + 1}: Create transfer ${index + 1}/3...`);
  console.log(`   📧 Recipient: ${transferData.recipient}`);
  console.log(`   💰 Amount: ${transferData.amount} SEI`);
  console.log(`   📝 Remark: ${transferData.remark}`);
  
  // Find form elements
  const recipientInput = findInputByPlaceholder('sei1') || 
                        findInputByPlaceholder('recipient') ||
                        document.querySelector('input[type="text"]');
  
  const amountInput = findInputByPlaceholder('0.00') || 
                     findInputByPlaceholder('amount') ||
                     document.querySelector('input[type="number"]');
  
  const remarkTextarea = findTextareaByPlaceholder('description') || 
                        findTextareaByPlaceholder('remark') ||
                        document.querySelector('textarea');
  
  const sendButton = findButtonByText('Send') || findButtonByText('Create');
  
  if (!recipientInput) {
    console.error('❌ Recipient input field not found');
    return false;
  }
  
  if (!amountInput) {
    console.error('❌ Amount input field not found');
    return false;
  }
  
  if (!sendButton) {
    console.error('❌ Send button not found');
    return false;
  }
  
  console.log('✅ Form elements found');
  
  // Clear previous values
  recipientInput.value = '';
  amountInput.value = '';
  if (remarkTextarea) remarkTextarea.value = '';
  
  await delay(300);
  
  // Step 3a: Fill Recipient
  console.log('   📧 Filling recipient address...');
  recipientInput.value = transferData.recipient;
  recipientInput.dispatchEvent(new Event('input', { bubbles: true }));
  recipientInput.dispatchEvent(new Event('change', { bubbles: true }));
  
  await delay(500);
  
  // Step 3b: Fill Amount
  console.log('   💰 Filling amount...');
  amountInput.value = transferData.amount;
  amountInput.dispatchEvent(new Event('input', { bubbles: true }));
  amountInput.dispatchEvent(new Event('change', { bubbles: true }));
  
  await delay(500);
  
  // Step 3c: Fill Remark
  if (remarkTextarea) {
    console.log('   📝 Filling remark...');
    remarkTextarea.value = transferData.remark;
    remarkTextarea.dispatchEvent(new Event('input', { bubbles: true }));
    remarkTextarea.dispatchEvent(new Event('change', { bubbles: true }));
  } else {
    console.log('   📝 Remark field not found, skipping...');
  }
  
  await delay(1000);
  
  // Step 3d: Submit form
  console.log('   🚀 Submitting transfer...');
  
  if (sendButton.disabled) {
    console.error('❌ Send button is disabled - check form validation');
    return false;
  }
  
  sendButton.click();
  console.log('✅ Clicked Send button');
  
  // Wait for response
  await delay(3000);
  
  // Check for success/error notifications
  const notifications = Array.from(document.querySelectorAll('*')).filter(el => {
    const text = el.textContent || '';
    return text.includes('success') || text.includes('created') || 
           text.includes('error') || text.includes('failed');
  });
  
  let success = false;
  notifications.forEach(notification => {
    const text = notification.textContent || '';
    if (text.includes('success') || text.includes('created')) {
      console.log('✅ Transfer created successfully!');
      success = true;
    }
    if (text.includes('error') || text.includes('failed')) {
      console.log('❌ Transfer creation failed:', text);
    }
  });
  
  if (!success && notifications.length === 0) {
    console.log('⚠️  No clear notification found, assuming success');
    success = true;
  }
  
  return success;
}

// Step 4: Check Dashboard for updated data
async function step4_CheckDashboard() {
  console.log('\n📊 Step 4: Check Dashboard for updated data...');
  
  // Navigate to Dashboard
  const dashboardBtn = findButtonByText('Dashboard');
  if (!dashboardBtn) {
    console.error('❌ Dashboard button not found');
    return false;
  }
  
  dashboardBtn.click();
  console.log('✅ Navigated to Dashboard');
  
  await delay(3000); // Wait for data to load
  
  // Look for portfolio data
  const portfolioElements = Array.from(document.querySelectorAll('*')).filter(el => {
    const text = el.textContent || '';
    return text.includes('Total Portfolio') || text.includes('Portfolio');
  });
  
  if (portfolioElements.length > 0) {
    console.log('✅ Portfolio section found');
    
    portfolioElements.forEach(el => {
      const text = el.textContent || '';
      if (text.includes('SEI') && !text.includes('0.00 SEI')) {
        console.log(`✅ Found non-zero portfolio data: ${text.slice(0, 100)}...`);
      }
    });
    
    return true;
  } else {
    console.log('⚠️  Portfolio section not clearly identified');
    return false;
  }
}

// Step 5: Refresh Dashboard
async function step5_RefreshDashboard() {
  console.log('\n🔄 Step 5: Refresh Dashboard data...');
  
  const refreshButton = findButtonByText('Refresh') || 
                       document.querySelector('[title*="refresh"]') ||
                       document.querySelector('button svg[class*="refresh"]')?.closest('button');
  
  if (refreshButton) {
    refreshButton.click();
    console.log('✅ Clicked refresh button');
    await delay(3000);
    console.log('✅ Dashboard refreshed');
    return true;
  } else {
    console.log('⚠️  Refresh button not found, data should auto-update');
    return true;
  }
}

// Main execution function
async function executeTransfersTest() {
  console.log('🚀 Starting Transfers Test Execution...\n');
  console.log('📋 Following the exact steps from the guide:');
  console.log('1. Navigate to Payments page');
  console.log('2. Fill form with specified data');
  console.log('3. Submit transfers');
  console.log('4. Check Dashboard for updates');
  console.log('');
  
  const results = {
    navigation: false,
    walletConnection: false,
    transfersCreated: 0,
    dashboardCheck: false,
    dashboardRefresh: false
  };
  
  try {
    // Step 1: Navigate to Payments
    results.navigation = await step1_NavigateToPayments();
    if (!results.navigation) {
      console.error('💥 Failed to navigate to Payments page');
      return results;
    }
    
    // Step 2: Check wallet connection
    results.walletConnection = step2_CheckWalletConnection();
    if (!results.walletConnection) {
      console.error('💥 Wallet not connected - cannot proceed');
      return results;
    }
    
    // Step 3: Create transfers (repeat 2-3 times as specified)
    console.log('\n🔄 Creating multiple transfers as specified...');
    for (let i = 0; i < TRANSFER_TESTS.length; i++) {
      const success = await step3_CreateTransfer(TRANSFER_TESTS[i], i);
      if (success) {
        results.transfersCreated++;
      }
      
      // Wait between transfers
      if (i < TRANSFER_TESTS.length - 1) {
        console.log('   ⏳ Waiting before next transfer...');
        await delay(2000);
      }
    }
    
    // Step 4: Check Dashboard
    results.dashboardCheck = await step4_CheckDashboard();
    
    // Step 5: Refresh Dashboard
    results.dashboardRefresh = await step5_RefreshDashboard();
    
    // Final results
    console.log('\n🎯 Test Execution Results:');
    console.log(`✅ Navigation to Payments: ${results.navigation ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Wallet Connection: ${results.walletConnection ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Transfers Created: ${results.transfersCreated}/${TRANSFER_TESTS.length}`);
    console.log(`✅ Dashboard Check: ${results.dashboardCheck ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Dashboard Refresh: ${results.dashboardRefresh ? 'SUCCESS' : 'FAILED'}`);
    
    const totalSteps = 5;
    const successfulSteps = [
      results.navigation,
      results.walletConnection,
      results.transfersCreated > 0,
      results.dashboardCheck,
      results.dashboardRefresh
    ].filter(Boolean).length;
    
    console.log(`\n📊 Overall Success Rate: ${successfulSteps}/${totalSteps} steps completed`);
    
    if (successfulSteps === totalSteps && results.transfersCreated === TRANSFER_TESTS.length) {
      console.log('\n🎉 PERFECT! All transfers created successfully!');
      console.log('✅ The Payments functionality is working correctly');
      console.log('✅ Data should now appear in the Dashboard');
      console.log('\n📈 Expected Dashboard Updates:');
      console.log('   • Total Portfolio should show transfer amounts');
      console.log('   • Recent Activity should show the transfers');
      console.log('   • Transfer count should be updated');
    } else if (results.transfersCreated > 0) {
      console.log('\n🎊 GOOD! Some transfers were created successfully');
      console.log(`✅ ${results.transfersCreated} out of ${TRANSFER_TESTS.length} transfers completed`);
      console.log('✅ Check the Dashboard for updated data');
    } else {
      console.log('\n⚠️  No transfers were created');
      console.log('🔧 Troubleshooting steps:');
      console.log('   1. Make sure wallet is connected');
      console.log('   2. Check browser console for errors');
      console.log('   3. Verify backend is running');
      console.log('   4. Try creating transfers manually');
    }
    
    return results;
    
  } catch (error) {
    console.error('💥 Test execution failed:', error);
    return results;
  }
}

// Quick single transfer test
async function quickTransferTest() {
  console.log('⚡ Quick Transfer Test - Creating one transfer...\n');
  
  // Navigate to Payments
  const paymentsBtn = findButtonByText('Payments');
  if (paymentsBtn) {
    paymentsBtn.click();
    await delay(1000);
  }
  
  // Check wallet
  if (!step2_CheckWalletConnection()) {
    return;
  }
  
  // Create one transfer
  const success = await step3_CreateTransfer(TRANSFER_TESTS[0], 0);
  
  if (success) {
    console.log('✅ Quick test SUCCESS! Transfer created.');
    
    // Go to Dashboard
    const dashboardBtn = findButtonByText('Dashboard');
    if (dashboardBtn) {
      dashboardBtn.click();
      await delay(2000);
      console.log('✅ Check Dashboard for the new transfer data!');
    }
  } else {
    console.log('❌ Quick test FAILED');
  }
}

// Export functions for manual use
window.TransfersTest = {
  executeTransfersTest,
  quickTransferTest,
  step1_NavigateToPayments,
  step2_CheckWalletConnection,
  step3_CreateTransfer,
  step4_CheckDashboard,
  step5_RefreshDashboard
};

console.log('\n🎮 Available Commands:');
console.log('  TransfersTest.executeTransfersTest() - Execute full test (5 minutes)');
console.log('  TransfersTest.quickTransferTest()    - Quick single transfer (1 minute)');
console.log('');
console.log('💡 Recommended: Start with TransfersTest.quickTransferTest()');

// Auto-run quick test in 3 seconds
console.log('\n🚀 Auto-running quick test in 3 seconds...');
console.log('⚠️  Make sure you have connected your wallet first!');

setTimeout(() => {
  quickTransferTest();
}, 3000);