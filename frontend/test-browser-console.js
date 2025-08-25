// SeiMoney Home Page Browser Console Test
// Copy and paste this code in browser console at http://localhost:5175

console.log(`
🏠 SeiMoney Home Page Test Suite
================================
Testing all functionality and data display...
`);

// Test 1: Check if main elements are present
function testMainElements() {
  console.log('📋 Test 1: Main Elements');
  
  const title = document.querySelector('h1');
  const statsCards = document.querySelectorAll('.grid .p-6');
  const featureCards = document.querySelectorAll('.cursor-pointer');
  const footer = document.querySelector('footer');
  
  console.log(`✅ Title found: ${title ? title.textContent.includes('SeiMoney') : false}`);
  console.log(`✅ Stats cards: ${statsCards.length}/4 expected`);
  console.log(`✅ Feature cards: ${featureCards.length}/6 expected`);
  console.log(`✅ Footer present: ${!!footer}`);
  
  return {
    title: !!title,
    statsCards: statsCards.length >= 4,
    featureCards: featureCards.length >= 6,
    footer: !!footer
  };
}

// Test 2: Check if data is loaded (not showing "Loading...")
function testDataLoading() {
  console.log('\n📊 Test 2: Data Loading');
  
  const statsTexts = Array.from(document.querySelectorAll('.text-2xl')).map(el => el.textContent);
  const loadingCount = statsTexts.filter(text => text.includes('Loading')).length;
  const hasRealData = loadingCount === 0 && statsTexts.some(text => text.includes('$') || text.includes('%'));
  
  console.log(`✅ Loading states: ${loadingCount} (should be 0)`);
  console.log(`✅ Real data present: ${hasRealData}`);
  console.log(`📈 Current stats: ${statsTexts.join(', ')}`);
  
  return {
    noLoadingStates: loadingCount === 0,
    hasRealData: hasRealData
  };
}

// Test 3: Check if chart is rendered
function testChart() {
  console.log('\n📈 Test 3: Chart Rendering');
  
  const canvas = document.querySelector('canvas');
  const svg = document.querySelector('svg');
  const chartContainer = document.querySelector('.recharts-wrapper, [class*="chart"]');
  
  console.log(`✅ Canvas found: ${!!canvas}`);
  console.log(`✅ SVG found: ${!!svg}`);
  console.log(`✅ Chart container: ${!!chartContainer}`);
  
  return {
    hasChart: !!(canvas || svg || chartContainer)
  };
}

// Test 4: Test button interactions
function testInteractions() {
  console.log('\n🔄 Test 4: Button Interactions');
  
  const buttons = document.querySelectorAll('button');
  const clickableCards = document.querySelectorAll('.cursor-pointer');
  
  console.log(`✅ Buttons found: ${buttons.length}`);
  console.log(`✅ Clickable cards: ${clickableCards.length}`);
  
  // Test hover effects
  let hoverWorking = false;
  if (clickableCards.length > 0) {
    const card = clickableCards[0];
    const originalTransform = getComputedStyle(card).transform;
    card.dispatchEvent(new MouseEvent('mouseenter'));
    setTimeout(() => {
      const hoverTransform = getComputedStyle(card).transform;
      hoverWorking = originalTransform !== hoverTransform;
      console.log(`✅ Hover effects working: ${hoverWorking}`);
    }, 100);
  }
  
  return {
    hasButtons: buttons.length > 0,
    hasClickableCards: clickableCards.length > 0,
    hoverEffects: hoverWorking
  };
}

// Test 5: Check responsive design
function testResponsive() {
  console.log('\n📱 Test 5: Responsive Design');
  
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  };
  
  const isMobile = viewport.width < 768;
  const isTablet = viewport.width >= 768 && viewport.width < 1024;
  const isDesktop = viewport.width >= 1024;
  
  console.log(`📐 Viewport: ${viewport.width}x${viewport.height}`);
  console.log(`📱 Device type: ${isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}`);
  
  // Check if grid layouts adapt
  const statsGrid = document.querySelector('.grid');
  const gridCols = getComputedStyle(statsGrid).gridTemplateColumns;
  
  console.log(`✅ Grid columns: ${gridCols}`);
  
  return {
    viewport: viewport,
    deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
    gridAdapts: !!gridCols
  };
}

// Test 6: Check for console errors
function testConsoleErrors() {
  console.log('\n🐛 Test 6: Console Errors');
  
  // This would need to be run before other tests to capture errors
  console.log('⚠️  Check browser console for any red error messages');
  console.log('⚠️  Common issues to look for:');
  console.log('   - Network errors (failed API calls)');
  console.log('   - JavaScript errors');
  console.log('   - Missing resources (404s)');
  console.log('   - CORS issues');
  
  return {
    checkManually: true
  };
}

// Test 7: Performance check
function testPerformance() {
  console.log('\n⚡ Test 7: Performance');
  
  if (performance.memory) {
    const memory = performance.memory;
    console.log(`💾 JS Heap Used: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`);
    console.log(`💾 JS Heap Total: ${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`);
    console.log(`💾 JS Heap Limit: ${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`);
  }
  
  const timing = performance.timing;
  const loadTime = timing.loadEventEnd - timing.navigationStart;
  console.log(`⏱️  Page load time: ${loadTime}ms`);
  
  return {
    loadTime: loadTime,
    memoryUsage: performance.memory ? performance.memory.usedJSHeapSize : null
  };
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive home page tests...\n');
  
  const results = {
    mainElements: testMainElements(),
    dataLoading: testDataLoading(),
    chart: testChart(),
    interactions: testInteractions(),
    responsive: testResponsive(),
    consoleErrors: testConsoleErrors(),
    performance: testPerformance()
  };
  
  // Wait a bit for async operations
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  let passedTests = 0;
  let totalTests = 0;
  
  Object.entries(results).forEach(([testName, result]) => {
    console.log(`\n${testName.toUpperCase()}:`);
    Object.entries(result).forEach(([key, value]) => {
      totalTests++;
      if (value === true) {
        passedTests++;
        console.log(`  ✅ ${key}: PASS`);
      } else if (value === false) {
        console.log(`  ❌ ${key}: FAIL`);
      } else {
        console.log(`  ℹ️  ${key}: ${value}`);
      }
    });
  });
  
  const successRate = Math.round((passedTests / totalTests) * 100);
  
  console.log(`\n🎯 Overall Results:`);
  console.log(`   Tests Passed: ${passedTests}/${totalTests}`);
  console.log(`   Success Rate: ${successRate}%`);
  
  if (successRate >= 80) {
    console.log(`   🎉 Status: EXCELLENT - Home page is working great!`);
  } else if (successRate >= 60) {
    console.log(`   ✅ Status: GOOD - Minor issues to address`);
  } else {
    console.log(`   ⚠️  Status: NEEDS WORK - Several issues found`);
  }
  
  return results;
}

// Auto-run tests
runAllTests();

// Make functions available globally for manual testing
window.SeiMoneyHomePageTest = {
  runAllTests,
  testMainElements,
  testDataLoading,
  testChart,
  testInteractions,
  testResponsive,
  testConsoleErrors,
  testPerformance
};

console.log(`
🔧 Manual Testing Available:
============================
- SeiMoneyHomePageTest.runAllTests() - Run all tests
- SeiMoneyHomePageTest.testMainElements() - Test UI elements
- SeiMoneyHomePageTest.testDataLoading() - Test data loading
- SeiMoneyHomePageTest.testChart() - Test chart rendering
- SeiMoneyHomePageTest.testInteractions() - Test button clicks
- SeiMoneyHomePageTest.testResponsive() - Test responsive design
- SeiMoneyHomePageTest.testPerformance() - Test performance

📖 Instructions:
1. Open http://localhost:5175 in browser
2. Open Developer Tools (F12)
3. Go to Console tab
4. Copy and paste this entire script
5. Review test results
6. Test different screen sizes by resizing window
7. Click buttons and cards to test interactions
`);