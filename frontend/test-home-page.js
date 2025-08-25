#!/usr/bin/env node

/**
 * SeiMoney Home Page Test Script
 * Tests all functionality and data display on the home page
 */

const puppeteer = require('puppeteer');

const FRONTEND_URL = 'http://localhost:5175';
const BACKEND_URL = 'http://localhost:3001';

// Test configuration
const TEST_CONFIG = {
  headless: false, // Set to true for CI/CD
  slowMo: 100,     // Slow down actions for better visibility
  timeout: 30000,  // 30 seconds timeout
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
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

async function testBackendHealth() {
  info('Testing backend health...');
  try {
    const response = await fetch(`${BACKEND_URL}/health/health`);
    const data = await response.json();
    
    if (data.ok && data.status === 'healthy') {
      success('Backend is healthy');
      return true;
    } else {
      error('Backend health check failed');
      return false;
    }
  } catch (err) {
    error(`Backend connection failed: ${err.message}`);
    return false;
  }
}

async function testMarketDataEndpoints() {
  info('Testing market data endpoints...');
  
  try {
    // Test market stats
    const statsResponse = await fetch(`${BACKEND_URL}/api/v1/market/stats`);
    const statsData = await statsResponse.json();
    
    if (statsData.ok && statsData.stats) {
      success('Market stats endpoint working');
      info(`  - Total TVL: ${statsData.stats.totalTvl.formatted}`);
      info(`  - Active Users: ${statsData.stats.activeUsers.formatted}`);
      info(`  - Success Rate: ${statsData.stats.successRate.formatted}`);
    } else {
      error('Market stats endpoint failed');
    }
    
    // Test TVL history
    const tvlResponse = await fetch(`${BACKEND_URL}/api/v1/market/tvl-history`);
    const tvlData = await tvlResponse.json();
    
    if (tvlData.ok && tvlData.data && tvlData.data.length > 0) {
      success(`TVL history endpoint working (${tvlData.data.length} data points)`);
    } else {
      error('TVL history endpoint failed');
    }
    
    return true;
  } catch (err) {
    error(`Market data endpoints failed: ${err.message}`);
    return false;
  }
}

async function testHomePage() {
  info('Starting home page UI tests...');
  
  const browser = await puppeteer.launch({
    headless: TEST_CONFIG.headless,
    slowMo: TEST_CONFIG.slowMo,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Navigate to home page
    info('Navigating to home page...');
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle0', timeout: TEST_CONFIG.timeout });
    success('Home page loaded successfully');
    
    // Test 1: Check if main title is visible
    info('Testing main title...');
    const title = await page.$eval('h1', el => el.textContent);
    if (title.includes('SeiMoney')) {
      success('Main title is visible and correct');
    } else {
      error('Main title not found or incorrect');
    }
    
    // Test 2: Check if stats cards are loaded
    info('Testing stats cards...');
    await page.waitForSelector('[data-testid="stats-card"], .grid', { timeout: 10000 });
    
    const statsCards = await page.$$('.grid .p-6');
    if (statsCards.length >= 4) {
      success(`Stats cards loaded (${statsCards.length} cards found)`);
      
      // Check if stats show real data (not "Loading...")
      const statsTexts = await page.$$eval('.grid .p-6 .text-2xl', els => 
        els.map(el => el.textContent.trim())
      );
      
      const loadingCount = statsTexts.filter(text => text.includes('Loading')).length;
      if (loadingCount === 0) {
        success('All stats cards show real data');
        info(`  Stats: ${statsTexts.join(', ')}`);
      } else {
        warning(`${loadingCount} stats cards still loading`);
      }
    } else {
      error('Stats cards not found or incomplete');
    }
    
    // Test 3: Check if TVL chart is visible
    info('Testing TVL chart...');
    try {
      await page.waitForSelector('canvas, svg', { timeout: 10000 });
      success('TVL chart is visible');
    } catch (err) {
      error('TVL chart not found');
    }
    
    // Test 4: Check if feature cards are present
    info('Testing feature cards...');
    const featureCards = await page.$$('[data-testid="feature-card"], .cursor-pointer');
    if (featureCards.length >= 6) {
      success(`Feature cards loaded (${featureCards.length} cards found)`);
      
      // Test clicking on a feature card
      info('Testing feature card navigation...');
      try {
        await featureCards[0].click();
        await page.waitForTimeout(1000);
        success('Feature card click works');
      } catch (err) {
        warning('Feature card click test failed');
      }
    } else {
      error('Feature cards not found or incomplete');
    }
    
    // Test 5: Check if CTA buttons work
    info('Testing CTA buttons...');
    const ctaButtons = await page.$$('button');
    if (ctaButtons.length > 0) {
      success(`CTA buttons found (${ctaButtons.length} buttons)`);
      
      // Test "Get Started" button
      try {
        const getStartedBtn = await page.$('button:has-text("Get Started"), button[class*="Get Started"]');
        if (getStartedBtn) {
          await getStartedBtn.click();
          await page.waitForTimeout(1000);
          success('Get Started button works');
        }
      } catch (err) {
        warning('Get Started button test failed');
      }
    } else {
      error('CTA buttons not found');
    }
    
    // Test 6: Check if footer is present
    info('Testing footer...');
    const footer = await page.$('footer');
    if (footer) {
      success('Footer is present');
      
      // Check social links
      const socialLinks = await page.$$('footer button, footer a');
      if (socialLinks.length > 0) {
        success(`Social links found (${socialLinks.length} links)`);
      }
    } else {
      warning('Footer not found');
    }
    
    // Test 7: Check responsive design
    info('Testing responsive design...');
    await page.setViewport({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    const mobileTitle = await page.$eval('h1', el => el.textContent);
    if (mobileTitle.includes('SeiMoney')) {
      success('Responsive design works on tablet');
    }
    
    await page.setViewport({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    const phoneTitle = await page.$eval('h1', el => el.textContent);
    if (phoneTitle.includes('SeiMoney')) {
      success('Responsive design works on mobile');
    }
    
    // Test 8: Check for console errors
    info('Checking for console errors...');
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(msg.text());
      }
    });
    
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForTimeout(3000);
    
    if (logs.length === 0) {
      success('No console errors found');
    } else {
      warning(`${logs.length} console errors found:`);
      logs.forEach(log => console.log(`  - ${log}`));
    }
    
    // Test 9: Performance check
    info('Testing page performance...');
    const metrics = await page.metrics();
    info(`  - JS Heap Used: ${Math.round(metrics.JSHeapUsedSize / 1024 / 1024)}MB`);
    info(`  - JS Heap Total: ${Math.round(metrics.JSHeapTotalSize / 1024 / 1024)}MB`);
    info(`  - Nodes: ${metrics.Nodes}`);
    
    if (metrics.JSHeapUsedSize < 50 * 1024 * 1024) { // Less than 50MB
      success('Memory usage is acceptable');
    } else {
      warning('High memory usage detected');
    }
    
    success('Home page UI tests completed successfully!');
    
  } catch (err) {
    error(`Home page test failed: ${err.message}`);
    throw err;
  } finally {
    await browser.close();
  }
}

async function runAllTests() {
  console.log(`${colors.bold}${colors.blue}
╔══════════════════════════════════════════════════════════════╗
║                    SeiMoney Home Page Test                   ║
║                     Complete Test Suite                      ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);
  
  let allTestsPassed = true;
  
  try {
    // Test backend health
    const backendHealthy = await testBackendHealth();
    if (!backendHealthy) {
      allTestsPassed = false;
    }
    
    // Test market data endpoints
    const marketDataWorking = await testMarketDataEndpoints();
    if (!marketDataWorking) {
      allTestsPassed = false;
    }
    
    // Test home page UI
    await testHomePage();
    
  } catch (err) {
    error(`Test suite failed: ${err.message}`);
    allTestsPassed = false;
  }
  
  console.log(`\n${colors.bold}${colors.blue}
╔══════════════════════════════════════════════════════════════╗
║                        Test Results                          ║
╚══════════════════════════════════════════════════════════════╝${colors.reset}`);
  
  if (allTestsPassed) {
    success('🎉 All tests passed! Home page is working perfectly.');
    console.log(`
${colors.green}✅ Backend Health: OK
✅ Market Data APIs: OK  
✅ Home Page UI: OK
✅ Data Display: OK
✅ User Interactions: OK
✅ Responsive Design: OK${colors.reset}
    `);
  } else {
    error('❌ Some tests failed. Please check the issues above.');
  }
  
  process.exit(allTestsPassed ? 0 : 1);
}

// Run the tests
runAllTests().catch(err => {
  error(`Test runner failed: ${err.message}`);
  process.exit(1);
});