// Direct Dashboard Test - Run in browser console
// Navigate to dashboard and run this test

console.log('🎯 Testing Dashboard Directly...');

function testDashboard() {
  console.log('\n1. Testing Dashboard Load...');
  
  // Check if we're on dashboard
  const isDashboard = window.location.hash.includes('dashboard') || 
                     document.querySelector('h1')?.textContent?.includes('Welcome back');
  
  console.log(`✅ On Dashboard: ${isDashboard}`);
  
  // Test wallet connection state
  const walletConnected = !document.querySelector('h2')?.textContent?.includes('Connect Your Wallet');
  console.log(`✅ Wallet Connected: ${walletConnected}`);
  
  if (!walletConnected) {
    console.log('⚠️  Need to connect wallet first');
    return;
  }
  
  // Test portfolio cards
  const portfolioCards = document.querySelectorAll('.grid .p-6');
  console.log(`✅ Portfolio Cards: ${portfolioCards.length}/4`);
  
  // Test for real data
  const seiValues = Array.from(document.querySelectorAll('*')).filter(el => 
    el.textContent && el.textContent.includes('SEI') && !el.textContent.includes('Loading')
  );
  console.log(`✅ SEI Values: ${seiValues.length} found`);
  
  // Test chart
  const chart = document.querySelector('canvas, svg, .recharts-wrapper');
  console.log(`✅ Chart: ${chart ? 'Found' : 'Missing'}`);
  
  // Test quick actions
  const quickActions = Array.from(document.querySelectorAll('button')).filter(btn => 
    btn.textContent && (
      btn.textContent.includes('Create Transfer') ||
      btn.textContent.includes('Deposit') ||
      btn.textContent.includes('Join Group')
    )
  );
  console.log(`✅ Quick Actions: ${quickActions.length} buttons`);
  
  // Test recent activity
  const activityItems = document.querySelectorAll('[class*="flex items-center justify-between p-4"]');
  console.log(`✅ Activity Items: ${activityItems.length} found`);
  
  // Test refresh button
  const refreshBtn = Array.from(document.querySelectorAll('button')).find(btn => 
    btn.querySelector('[class*="RefreshCw"]')
  );
  console.log(`✅ Refresh Button: ${refreshBtn ? 'Found' : 'Missing'}`);
  
  // Test for errors
  const errors = document.querySelectorAll('.text-red-400, .error');
  console.log(`✅ Errors: ${errors.length} found`);
  
  console.log('\n🎉 Dashboard Test Complete!');
  
  if (portfolioCards.length >= 4 && seiValues.length > 0 && quickActions.length > 0) {
    console.log('✅ Dashboard is working correctly!');
  } else {
    console.log('⚠️  Dashboard has some issues');
  }
}

// Test navigation to dashboard
function navigateToDashboard() {
  console.log('🧭 Navigating to Dashboard...');
  
  // Find dashboard nav button
  const dashboardBtn = Array.from(document.querySelectorAll('button')).find(btn => 
    btn.textContent && btn.textContent.includes('Dashboard')
  );
  
  if (dashboardBtn) {
    dashboardBtn.click();
    console.log('✅ Clicked Dashboard button');
    
    // Wait for navigation
    setTimeout(() => {
      testDashboard();
    }, 1000);
  } else {
    console.log('⚠️  Dashboard button not found');
    testDashboard(); // Test current page
  }
}

// Auto-run
navigateToDashboard();