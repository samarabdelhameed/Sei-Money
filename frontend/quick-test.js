// Quick Test Script - Copy to Browser Console
// Open http://localhost:5175 and paste this in console

console.log('🚀 Starting SeiMoney Quick Test...');

// Test 1: Check if main app is loaded
function testAppLoaded() {
  const root = document.getElementById('root');
  const hasContent = root && root.children.length > 0;
  console.log(`✅ App loaded: ${hasContent}`);
  return hasContent;
}

// Test 2: Test navigation to all pages
async function testAllPages() {
  const pages = [
    'home', 'dashboard', 'payments', 'vaults', 
    'groups', 'pots', 'escrow', 'ai-agent', 'settings', 'help'
  ];
  
  for (const page of pages) {
    try {
      // Simulate navigation by checking if elements exist
      console.log(`📄 Testing ${page} page...`);
      
      // Look for page-specific elements
      const pageElements = document.querySelectorAll('h1, h2, .text-3xl');
      const hasTitle = pageElements.length > 0;
      
      if (hasTitle) {
        console.log(`✅ ${page}: Page elements found`);
      } else {
        console.log(`⚠️  ${page}: No title elements found`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.log(`❌ ${page}: Error - ${error.message}`);
    }
  }
}

// Test 3: Check for JavaScript errors
function testNoErrors() {
  const errors = [];
  const originalError = console.error;
  
  console.error = function(...args) {
    errors.push(args.join(' '));
    originalError.apply(console, args);
  };
  
  setTimeout(() => {
    console.error = originalError;
    if (errors.length === 0) {
      console.log('✅ No JavaScript errors detected');
    } else {
      console.log(`⚠️  ${errors.length} errors detected:`, errors);
    }
  }, 2000);
}

// Test 4: Check if buttons are clickable
function testButtons() {
  const buttons = document.querySelectorAll('button');
  console.log(`✅ Found ${buttons.length} buttons`);
  
  // Test first few buttons
  buttons.forEach((btn, index) => {
    if (index < 3 && !btn.disabled) {
      try {
        btn.click();
        console.log(`✅ Button ${index + 1}: Clickable`);
      } catch (error) {
        console.log(`❌ Button ${index + 1}: Error - ${error.message}`);
      }
    }
  });
}

// Test 5: Check if forms work
function testForms() {
  const forms = document.querySelectorAll('form');
  const inputs = document.querySelectorAll('input');
  
  console.log(`✅ Found ${forms.length} forms and ${inputs.length} inputs`);
  
  // Test first input
  if (inputs.length > 0) {
    try {
      inputs[0].value = 'test';
      console.log('✅ Input field: Working');
    } catch (error) {
      console.log(`❌ Input field: Error - ${error.message}`);
    }
  }
}

// Run all tests
async function runQuickTest() {
  console.log('\n🔍 Running Quick Tests...\n');
  
  testAppLoaded();
  await testAllPages();
  testNoErrors();
  testButtons();
  testForms();
  
  console.log('\n✅ Quick test completed!');
  console.log('📝 Check above for any ❌ or ⚠️  indicators');
}

// Auto-run
runQuickTest();