#!/usr/bin/env node

/**
 * SeiMoney Complete Frontend Test Script
 * Tests all pages and functionality
 */

const FRONTEND_URL = 'http://localhost:5175';
const BACKEND_URL = 'http://localhost:3001';

// Test configuration
const TEST_PAGES = [
  { name: 'Home', path: '/', key: 'home' },
  { name: 'Dashboard', path: '/dashboard', key: 'dashboard' },
  { name: 'Payments', path: '/payments', key: 'payments' },
  { name: 'Vaults', path: '/vaults', key: 'vaults' },
  { name: 'Groups', path: '/groups', key: 'groups' },
  { name: 'Pots', path: '/pots', key: 'pots' },
  { name: 'Escrow', path: '/escrow', key: 'escrow' },
  { name: 'AI Agent', path: '/ai-agent', key: 'ai-agent' },
  { name: 'Settings', path: '/settings', key: 'settings' },
  { name: 'Help', path: '/help', key: 'help' }
];

const API_ENDPOINTS = [
  { name: 'Health Check', url: '/health/health', expected: 'healthy' },
  { name: 'Market Stats', url: '/api/v1/market/stats', expected: 'stats' },
  { name: 'TVL History', url: '/api/v1/market/tvl-history', expected: 'data' },
  { name: 'Market Overview', url: '/api/v1/market/overview', expected: 'data' },
  { name: 'Transfers', url: '/api/v1/transfers?address=sei1test123456789012345678901234567890123456', expected: 'response' },
  { name: 'Vaults', url: '/api/v1/vaults', expected: 'data' },
  { name: 'Groups', url: '/api/v1/groups', expected: 'data' },
  { name: 'Pots', url: '/api/v1/pots', expected: 'data' },
  { name: 'Escrow', url: '/api/v1/escrow', expected: 'data' }
];

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function warning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function header(message) {
  log(`\n${colors.bold}${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  log(`${colors.bold}${colors.cyan}${message.toUpperCase()}${colors.reset}`);
  log(`${colors.bold}${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
}

// Test backend APIs
async function testBackendAPIs() {
  header('Testing Backend APIs');
  
  const results = [];
  
  for (const endpoint of API_ENDPOINTS) {
    try {
      info(`Testing ${endpoint.name}...`);
      const response = await fetch(`${BACKEND_URL}${endpoint.url}`);
      
      if (!response.ok) {
        error(`${endpoint.name}: HTTP ${response.status}`);
        results.push({ name: endpoint.name, status: 'fail', error: `HTTP ${response.status}` });
        continue;
      }
      
      const data = await response.json();
      
      // Validate response structure
      let isValid = false;
      switch (endpoint.expected) {
        case 'healthy':
          isValid = data.status === 'healthy';
          break;
        case 'stats':
          isValid = data.ok && data.stats;
          break;
        case 'data':
          isValid = data.ok && data.data;
          break;
        case 'array':
          isValid = Array.isArray(data);
          break;
        case 'response':
          isValid = data.hasOwnProperty('ok');
          break;
        default:
          isValid = true;
      }
      
      if (isValid) {
        success(`${endpoint.name}: OK`);
        results.push({ name: endpoint.name, status: 'pass' });
      } else {
        error(`${endpoint.name}: Invalid response structure`);
        results.push({ name: endpoint.name, status: 'fail', error: 'Invalid response' });
      }
      
    } catch (err) {
      error(`${endpoint.name}: ${err.message}`);
      results.push({ name: endpoint.name, status: 'fail', error: err.message });
    }
  }
  
  return results;
}

// Test frontend accessibility
async function testFrontendAccessibility() {
  header('Testing Frontend Accessibility');
  
  try {
    info('Testing frontend server...');
    const response = await fetch(FRONTEND_URL);
    
    if (response.ok) {
      success('Frontend server is accessible');
      
      const html = await response.text();
      
      // Check for essential HTML elements
      const checks = [
        { name: 'HTML DOCTYPE', test: html.includes('<!doctype html>') },
        { name: 'Title tag', test: html.includes('<title>') },
        { name: 'Meta viewport', test: html.includes('viewport') },
        { name: 'Root div', test: html.includes('id="root"') },
        { name: 'React scripts', test: html.includes('react') || html.includes('vite') }
      ];
      
      checks.forEach(check => {
        if (check.test) {
          success(`${check.name}: Found`);
        } else {
          warning(`${check.name}: Not found`);
        }
      });
      
      return { status: 'pass', checks };
    } else {
      error(`Frontend server returned HTTP ${response.status}`);
      return { status: 'fail', error: `HTTP ${response.status}` };
    }
  } catch (err) {
    error(`Frontend accessibility test failed: ${err.message}`);
    return { status: 'fail', error: err.message };
  }
}

// Test specific page functionality
async function testPageFunctionality() {
  header('Testing Page Functionality');
  
  info('This test requires manual browser testing. Here\'s what to check:');
  
  TEST_PAGES.forEach((page, index) => {
    log(`\n${colors.bold}${index + 1}. ${page.name} Page (${page.path})${colors.reset}`);
    
    switch (page.key) {
      case 'home':
        log('  📋 Check: Hero section with SeiMoney title');
        log('  📋 Check: 4 stats cards with real data');
        log('  📋 Check: TVL chart rendering');
        log('  📋 Check: 6 feature cards');
        log('  📋 Check: Get Started and Learn More buttons');
        log('  📋 Check: Footer with social links');
        break;
        
      case 'dashboard':
        log('  📋 Check: Portfolio overview');
        log('  📋 Check: Recent activity feed');
        log('  📋 Check: Quick actions');
        log('  📋 Check: Performance charts');
        break;
        
      case 'payments':
        log('  📋 Check: Transfer creation form');
        log('  📋 Check: Transfer history list');
        log('  📋 Check: Stats cards (sent/received/pending)');
        log('  📋 Check: Claim/Refund buttons work');
        break;
        
      case 'vaults':
        log('  📋 Check: Vault list with APY data');
        log('  📋 Check: Deposit/Withdraw modals');
        log('  📋 Check: Performance charts');
        log('  📋 Check: Risk level indicators');
        break;
        
      case 'groups':
        log('  📋 Check: Group creation form');
        log('  📋 Check: Group list with progress');
        log('  📋 Check: Join/Leave functionality');
        log('  📋 Check: Contribution tracking');
        break;
        
      case 'pots':
        log('  📋 Check: Savings pot creation');
        log('  📋 Check: Goal tracking');
        log('  📋 Check: Auto-save settings');
        log('  📋 Check: Progress visualization');
        break;
        
      case 'escrow':
        log('  📋 Check: Escrow case creation');
        log('  📋 Check: Case status tracking');
        log('  📋 Check: Dispute resolution');
        log('  📋 Check: Multi-party approval');
        break;
        
      case 'ai-agent':
        log('  📋 Check: Chat interface');
        log('  📋 Check: AI responses');
        log('  📋 Check: Market analysis');
        log('  📋 Check: Strategy recommendations');
        break;
        
      case 'settings':
        log('  📋 Check: Wallet connection');
        log('  📋 Check: Notification preferences');
        log('  📋 Check: Theme settings');
        log('  📋 Check: Account management');
        break;
        
      case 'help':
        log('  📋 Check: Documentation sections');
        log('  📋 Check: FAQ content');
        log('  📋 Check: Contact information');
        log('  📋 Check: Tutorial links');
        break;
        
      default:
        log('  📋 Check: Page loads without errors');
        log('  📋 Check: Navigation works');
        log('  📋 Check: Content is displayed');
    }
  });
}

// Test wallet integration
async function testWalletIntegration() {
  header('Testing Wallet Integration');
  
  info('Wallet integration tests (manual):');
  log('  🔗 Connect MetaMask wallet');
  log('  🔗 Connect Keplr wallet');
  log('  🔗 Connect Leap wallet');
  log('  🔗 Check balance display');
  log('  🔗 Test transaction signing');
  log('  🔗 Test wallet disconnection');
  log('  🔗 Test wallet switching');
  
  warning('These tests require manual interaction with wallet extensions');
}

// Test responsive design
async function testResponsiveDesign() {
  header('Testing Responsive Design');
  
  info('Responsive design tests (manual):');
  log('  📱 Desktop (1920x1080): All elements properly spaced');
  log('  📱 Laptop (1366x768): Content fits without horizontal scroll');
  log('  📱 Tablet (768x1024): Grid layouts adapt to 2 columns');
  log('  📱 Mobile (375x667): Single column layout');
  log('  📱 Mobile (320x568): Minimum width support');
  
  log('\n  🔧 Test using browser dev tools:');
  log('    1. Open browser dev tools (F12)');
  log('    2. Click device toolbar icon');
  log('    3. Test different screen sizes');
  log('    4. Check for layout breaks');
}

// Test performance
async function testPerformance() {
  header('Testing Performance');
  
  info('Performance tests (manual):');
  log('  ⚡ Page load time < 3 seconds');
  log('  ⚡ API response time < 2 seconds');
  log('  ⚡ Smooth animations and transitions');
  log('  ⚡ No memory leaks during navigation');
  log('  ⚡ Efficient re-renders');
  
  log('\n  🔧 Test using browser dev tools:');
  log('    1. Open Performance tab');
  log('    2. Record page interactions');
  log('    3. Check for performance bottlenecks');
  log('    4. Monitor memory usage');
}

// Generate test report
function generateTestReport(backendResults, frontendResult) {
  header('Test Report Summary');
  
  // Backend API results
  log(`${colors.bold}Backend API Tests:${colors.reset}`);
  const backendPassed = backendResults.filter(r => r.status === 'pass').length;
  const backendTotal = backendResults.length;
  log(`  Passed: ${backendPassed}/${backendTotal} (${Math.round(backendPassed/backendTotal*100)}%)`);
  
  if (backendPassed === backendTotal) {
    success('  All backend APIs working correctly');
  } else {
    warning(`  ${backendTotal - backendPassed} backend APIs need attention`);
  }
  
  // Frontend accessibility
  log(`\n${colors.bold}Frontend Accessibility:${colors.reset}`);
  if (frontendResult.status === 'pass') {
    success('  Frontend server accessible');
  } else {
    error(`  Frontend accessibility issues: ${frontendResult.error}`);
  }
  
  // Overall status
  log(`\n${colors.bold}Overall Status:${colors.reset}`);
  const overallScore = (backendPassed / backendTotal) * 100;
  
  if (overallScore >= 90) {
    success('🎉 EXCELLENT - System is working great!');
  } else if (overallScore >= 75) {
    success('✅ GOOD - Minor issues to address');
  } else if (overallScore >= 50) {
    warning('⚠️  FAIR - Several issues need attention');
  } else {
    error('❌ POOR - Major issues require immediate attention');
  }
  
  // Next steps
  log(`\n${colors.bold}Next Steps:${colors.reset}`);
  log('1. Run manual browser tests for each page');
  log('2. Test wallet integration with real wallets');
  log('3. Test responsive design on different devices');
  log('4. Perform load testing with multiple users');
  log('5. Test error handling scenarios');
  
  // Quick test commands
  log(`\n${colors.bold}Quick Test Commands:${colors.reset}`);
  log(`${colors.dim}# Test all backend APIs${colors.reset}`);
  log('curl -s http://localhost:3001/health/health | jq');
  log('curl -s http://localhost:3001/api/v1/market/stats | jq .stats');
  log('curl -s http://localhost:3001/api/v1/transfers | jq length');
  
  log(`\n${colors.dim}# Test frontend${colors.reset}`);
  log('curl -I http://localhost:5175');
  log('open http://localhost:5175');
  
  log(`\n${colors.dim}# Browser console test${colors.reset}`);
  log('// Copy and paste in browser console:');
  log('// (See test-browser-console.js for complete test suite)');
}

// Main test runner
async function runComprehensiveTests() {
  console.log(`${colors.bold}${colors.magenta}
╔══════════════════════════════════════════════════════════════╗
║                  SeiMoney Complete Test Suite                ║
║                     Frontend & Backend                       ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);
  
  try {
    // Test backend APIs
    const backendResults = await testBackendAPIs();
    
    // Test frontend accessibility
    const frontendResult = await testFrontendAccessibility();
    
    // Test page functionality (manual)
    testPageFunctionality();
    
    // Test wallet integration (manual)
    testWalletIntegration();
    
    // Test responsive design (manual)
    testResponsiveDesign();
    
    // Test performance (manual)
    testPerformance();
    
    // Generate report
    generateTestReport(backendResults, frontendResult);
    
  } catch (err) {
    error(`Test suite failed: ${err.message}`);
    process.exit(1);
  }
}

// Run the comprehensive tests
runComprehensiveTests().catch(err => {
  error(`Test runner failed: ${err.message}`);
  process.exit(1);
});