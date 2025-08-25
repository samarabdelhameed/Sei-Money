// 🎯 Sample Data Creator for SeiMoney Testing
// Run this in browser console after connecting wallet

console.log('🚀 SeiMoney Sample Data Creator');

// Sample data templates
const SAMPLE_DATA = {
  transfers: [
    { recipient: 'sei1abc123def456ghi789jkl012mno345pqr678stu', amount: '25.5', remark: 'Payment for services' },
    { recipient: 'sei1def456ghi789jkl012mno345pqr678stu901vwx', amount: '100.0', remark: 'Monthly rent' },
    { recipient: 'sei1ghi789jkl012mno345pqr678stu901vwx234yz', amount: '15.75', remark: 'Dinner split' },
    { recipient: 'sei1jkl012mno345pqr678stu901vwx234yz567abc', amount: '50.0', remark: 'Gift money' }
  ],
  
  groups: [
    { name: 'Emergency Fund Group', description: 'Collective emergency savings', targetAmount: '10000', type: 'emergency' },
    { name: 'Vacation Pool', description: 'Group vacation fund', targetAmount: '5000', type: 'goal' },
    { name: 'Investment Club', description: 'Joint investment opportunities', targetAmount: '25000', type: 'investment' }
  ],
  
  pots: [
    { name: 'Emergency Fund', targetAmount: '5000', targetDate: '2024-12-31', description: 'Personal emergency savings' },
    { name: 'New Car Fund', targetAmount: '15000', targetDate: '2025-06-30', description: 'Saving for a new car' },
    { name: 'Vacation Fund', targetAmount: '3000', targetDate: '2024-08-15', description: 'Summer vacation savings' },
    { name: 'Home Deposit', targetAmount: '50000', targetDate: '2025-12-31', description: 'House down payment' }
  ],
  
  vaults: [
    { name: 'High Yield Vault', strategy: 'yield-farming', initialDeposit: '1000', lockPeriod: '30' },
    { name: 'Stable Coin Vault', strategy: 'lending', initialDeposit: '2500', lockPeriod: '90' },
    { name: 'DeFi Growth Vault', strategy: 'liquidity-mining', initialDeposit: '500', lockPeriod: '60' }
  ]
};

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

function fillForm(formData) {
  Object.keys(formData).forEach(key => {
    const input = findInputByPlaceholder(key) || 
                 document.querySelector(`input[name="${key}"]`) ||
                 document.querySelector(`input[id="${key}"]`);
    
    if (input) {
      input.value = formData[key];
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
}

// Navigation helper
async function navigateToPage(pageName) {
  const navButton = findButtonByText(pageName);
  if (navButton) {
    navButton.click();
    await delay(1000);
    return true;
  }
  return false;
}

// Create transfers
async function createSampleTransfers() {
  console.log('📤 Creating sample transfers...');
  
  const success = await navigateToPage('Payments');
  if (!success) {
    console.error('❌ Could not navigate to Payments page');
    return;
  }
  
  for (let i = 0; i < SAMPLE_DATA.transfers.length; i++) {
    const transfer = SAMPLE_DATA.transfers[i];
    console.log(`Creating transfer ${i + 1}/${SAMPLE_DATA.transfers.length}...`);
    
    // Fill form
    const recipientInput = findInputByPlaceholder('recipient') || findInputByPlaceholder('address');
    const amountInput = findInputByPlaceholder('amount');
    const remarkInput = findInputByPlaceholder('remark') || findInputByPlaceholder('note');
    
    if (recipientInput) {
      recipientInput.value = transfer.recipient;
      recipientInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    if (amountInput) {
      amountInput.value = transfer.amount;
      amountInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    if (remarkInput) {
      remarkInput.value = transfer.remark;
      remarkInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    await delay(500);
    
    // Submit form
    const sendButton = findButtonByText('Send') || findButtonByText('Create');
    if (sendButton && !sendButton.disabled) {
      sendButton.click();
      await delay(2000); // Wait for transaction
    }
    
    await delay(1000);
  }
  
  console.log('✅ Sample transfers created');
}

// Create groups
async function createSampleGroups() {
  console.log('👥 Creating sample groups...');
  
  const success = await navigateToPage('Groups');
  if (!success) {
    console.error('❌ Could not navigate to Groups page');
    return;
  }
  
  for (let i = 0; i < SAMPLE_DATA.groups.length; i++) {
    const group = SAMPLE_DATA.groups[i];
    console.log(`Creating group ${i + 1}/${SAMPLE_DATA.groups.length}...`);
    
    // Click create button
    const createButton = findButtonByText('Create Group') || findButtonByText('New Group');
    if (createButton) {
      createButton.click();
      await delay(1000);
    }
    
    // Fill form
    const nameInput = findInputByPlaceholder('name');
    const descInput = findInputByPlaceholder('description');
    const targetInput = findInputByPlaceholder('target') || findInputByPlaceholder('amount');
    
    if (nameInput) {
      nameInput.value = group.name;
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    if (descInput) {
      descInput.value = group.description;
      descInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    if (targetInput) {
      targetInput.value = group.targetAmount;
      targetInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    await delay(500);
    
    // Submit
    const saveButton = findButtonByText('Save') || findButtonByText('Create');
    if (saveButton && !saveButton.disabled) {
      saveButton.click();
      await delay(2000);
    }
    
    await delay(1000);
  }
  
  console.log('✅ Sample groups created');
}

// Create pots
async function createSamplePots() {
  console.log('🏺 Creating sample pots...');
  
  const success = await navigateToPage('Pots');
  if (!success) {
    console.error('❌ Could not navigate to Pots page');
    return;
  }
  
  for (let i = 0; i < SAMPLE_DATA.pots.length; i++) {
    const pot = SAMPLE_DATA.pots[i];
    console.log(`Creating pot ${i + 1}/${SAMPLE_DATA.pots.length}...`);
    
    // Click create button
    const createButton = findButtonByText('Create Pot') || findButtonByText('New Pot');
    if (createButton) {
      createButton.click();
      await delay(1000);
    }
    
    // Fill form
    const nameInput = findInputByPlaceholder('name');
    const targetAmountInput = findInputByPlaceholder('target amount');
    const targetDateInput = findInputByPlaceholder('target date') || document.querySelector('input[type="date"]');
    const descInput = findInputByPlaceholder('description');
    
    if (nameInput) {
      nameInput.value = pot.name;
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    if (targetAmountInput) {
      targetAmountInput.value = pot.targetAmount;
      targetAmountInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    if (targetDateInput) {
      targetDateInput.value = pot.targetDate;
      targetDateInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    if (descInput) {
      descInput.value = pot.description;
      descInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    await delay(500);
    
    // Submit
    const saveButton = findButtonByText('Save') || findButtonByText('Create');
    if (saveButton && !saveButton.disabled) {
      saveButton.click();
      await delay(2000);
    }
    
    await delay(1000);
  }
  
  console.log('✅ Sample pots created');
}

// Create vaults
async function createSampleVaults() {
  console.log('🔒 Creating sample vaults...');
  
  const success = await navigateToPage('Vaults');
  if (!success) {
    console.error('❌ Could not navigate to Vaults page');
    return;
  }
  
  for (let i = 0; i < SAMPLE_DATA.vaults.length; i++) {
    const vault = SAMPLE_DATA.vaults[i];
    console.log(`Creating vault ${i + 1}/${SAMPLE_DATA.vaults.length}...`);
    
    // Click create button
    const createButton = findButtonByText('Create Vault') || findButtonByText('New Vault');
    if (createButton) {
      createButton.click();
      await delay(1000);
    }
    
    // Fill form (this will depend on your actual form structure)
    const nameInput = findInputByPlaceholder('name');
    const depositInput = findInputByPlaceholder('deposit') || findInputByPlaceholder('amount');
    
    if (nameInput) {
      nameInput.value = vault.name;
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    if (depositInput) {
      depositInput.value = vault.initialDeposit;
      depositInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    await delay(500);
    
    // Submit
    const saveButton = findButtonByText('Save') || findButtonByText('Create');
    if (saveButton && !saveButton.disabled) {
      saveButton.click();
      await delay(2000);
    }
    
    await delay(1000);
  }
  
  console.log('✅ Sample vaults created');
}

// Main function to create all sample data
async function createAllSampleData() {
  console.log('🎯 Starting sample data creation...');
  console.log('⚠️  Make sure your wallet is connected first!');
  
  // Check if wallet is connected
  const walletConnected = document.querySelector('[style*="gradientGreen"]') || 
                         !document.querySelector('button:contains("Connect Wallet")');
  
  if (!walletConnected) {
    console.error('❌ Please connect your wallet first!');
    return;
  }
  
  try {
    await createSampleTransfers();
    await delay(2000);
    
    await createSampleGroups();
    await delay(2000);
    
    await createSamplePots();
    await delay(2000);
    
    await createSampleVaults();
    await delay(2000);
    
    // Navigate back to dashboard
    await navigateToPage('Dashboard');
    
    // Refresh dashboard data
    const refreshButton = document.querySelector('button[title*="refresh"]') || 
                         findButtonByText('Refresh');
    if (refreshButton) {
      refreshButton.click();
    }
    
    console.log('🎉 All sample data created successfully!');
    console.log('📊 Check your dashboard - it should now show real data!');
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  }
}

// Quick test function
async function quickDataTest() {
  console.log('⚡ Quick data test - creating 2 transfers only...');
  
  const success = await navigateToPage('Payments');
  if (!success) {
    console.error('❌ Could not navigate to Payments page');
    return;
  }
  
  // Create just 2 transfers for quick test
  for (let i = 0; i < 2; i++) {
    const transfer = SAMPLE_DATA.transfers[i];
    console.log(`Creating transfer ${i + 1}/2...`);
    
    const recipientInput = findInputByPlaceholder('recipient') || findInputByPlaceholder('address');
    const amountInput = findInputByPlaceholder('amount');
    
    if (recipientInput && amountInput) {
      recipientInput.value = transfer.recipient;
      recipientInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      amountInput.value = transfer.amount;
      amountInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      await delay(500);
      
      const sendButton = findButtonByText('Send');
      if (sendButton && !sendButton.disabled) {
        sendButton.click();
        await delay(2000);
      }
    }
    
    await delay(1000);
  }
  
  // Go back to dashboard
  await navigateToPage('Dashboard');
  
  console.log('✅ Quick test completed! Check dashboard for data.');
}

// Export functions for manual use
window.SeiMoneySampleData = {
  createAllSampleData,
  quickDataTest,
  createSampleTransfers,
  createSampleGroups,
  createSamplePots,
  createSampleVaults
};

console.log('\n🎮 Available commands:');
console.log('  SeiMoneySampleData.createAllSampleData() - Create all sample data (5 minutes)');
console.log('  SeiMoneySampleData.quickDataTest()       - Quick test with 2 transfers (30 seconds)');
console.log('  SeiMoneySampleData.createSampleTransfers() - Create transfers only');
console.log('  SeiMoneySampleData.createSampleGroups()    - Create groups only');
console.log('  SeiMoneySampleData.createSamplePots()      - Create pots only');
console.log('  SeiMoneySampleData.createSampleVaults()    - Create vaults only');

console.log('\n💡 Recommended: Start with SeiMoneySampleData.quickDataTest()');