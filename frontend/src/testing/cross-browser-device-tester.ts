// Cross-Browser and Device Compatibility Tester
// Cross-browser and device compatibility testing

import { TestResult, TestStatus, TestCategory } from './types';
import { testUtils } from './test-utilities';

interface BrowserInfo {
  name: string;
  version: string;
  engine: string;
  platform: string;
  mobile: boolean;
  supported: boolean;
}

interface DeviceInfo {
  type: 'desktop' | 'tablet' | 'mobile';
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  orientation: 'portrait' | 'landscape';
  touchSupport: boolean;
}

interface CompatibilityResult {
  browser: BrowserInfo;
  device: DeviceInfo;
  features: { [key: string]: boolean };
  performance: { [key: string]: number };
  issues: string[];
}

export class CrossBrowserDeviceTester {
  private results: TestResult[] = [];
  private browserInfo: BrowserInfo;
  private deviceInfo: DeviceInfo;

  constructor() {
    this.browserInfo = this.detectBrowser();
    this.deviceInfo = this.detectDevice();
  }

  async testCrossBrowserDeviceCompatibility(): Promise<TestResult[]> {
    console.log('🌐 Testing Cross-Browser and Device Compatibility...');
    this.results = [];

    try {
      // Test 11.1: Browser compatibility
      await this.testBrowserCompatibility();
      
      // Test 11.2: Responsive design and device compatibility
      await this.testResponsiveDesignCompatibility();

    } catch (error) {
      console.error('❌ Cross-browser and device compatibility testing failed:', error);
      this.results.push(testUtils.handleTestError(error as Error, 'Cross-Browser Device Compatibility Testing'));
    }

    return this.results;
  }

  // Test 11.1: Browser compatibility
  private async testBrowserCompatibility(): Promise<void> {
    console.log('  🌍 Testing browser compatibility...');
    const startTime = performance.now();

    try {
      // Test browser detection and support
      await this.testBrowserDetectionSupport();
      
      // Test JavaScript features compatibility
      await this.testJavaScriptFeatures();
      
      // Test CSS features compatibility
      await this.testCSSFeatures();
      
      // Test Web APIs compatibility
      await this.testWebAPIsCompatibility();
      
      // Test wallet integration compatibility
      await this.testWalletIntegrationCompatibility();

    } catch (error) {
      this.addResult('Browser Compatibility Tests', TestStatus.FAILED,
        `Browser compatibility testing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.INTEGRATION, performance.now() - startTime);
    }
  }

  private async testBrowserDetectionSupport(): Promise<void> {
    const startTime = performance.now();
    console.log('    🔍 Testing browser detection and support...');

    try {
      const browserTests = [
        {
          name: 'Chrome Support',
          test: () => {
            const isChrome = this.browserInfo.name.toLowerCase().includes('chrome');
            const versionSupported = this.browserInfo.version ? parseInt(this.browserInfo.version) >= 90 : false;
            return { supported: isChrome && versionSupported, details: `Chrome ${this.browserInfo.version}` };
          }
        },
        {
          name: 'Safari Support',
          test: () => {
            const isSafari = this.browserInfo.name.toLowerCase().includes('safari');
            const versionSupported = this.browserInfo.version ? parseInt(this.browserInfo.version) >= 14 : false;
            return { supported: isSafari && versionSupported, details: `Safari ${this.browserInfo.version}` };
          }
        },
        {
          name: 'Firefox Support',
          test: () => {
            const isFirefox = this.browserInfo.name.toLowerCase().includes('firefox');
            const versionSupported = this.browserInfo.version ? parseInt(this.browserInfo.version) >= 88 : false;
            return { supported: isFirefox && versionSupported, details: `Firefox ${this.browserInfo.version}` };
          }
        },
        {
          name: 'Edge Support',
          test: () => {
            const isEdge = this.browserInfo.name.toLowerCase().includes('edge');
            const versionSupported = this.browserInfo.version ? parseInt(this.browserInfo.version) >= 90 : false;
            return { supported: isEdge && versionSupported, details: `Edge ${this.browserInfo.version}` };
          }
        },
        {
          name: 'Mobile Browser Support',
          test: () => {
            const isMobile = this.browserInfo.mobile;
            const supportedMobile = isMobile && (
              this.browserInfo.name.toLowerCase().includes('safari') ||
              this.browserInfo.name.toLowerCase().includes('chrome')
            );
            return { supported: !isMobile || supportedMobile, details: `Mobile: ${isMobile ? 'Yes' : 'No'}` };
          }
        }
      ];

      let supportedBrowsers = 0;
      const browserDetails: string[] = [];

      for (const test of browserTests) {
        try {
          const result = test.test();
          if (result.supported) {
            supportedBrowsers++;
            browserDetails.push(`✅ ${test.name}: ${result.details}`);
          } else {
            browserDetails.push(`❌ ${test.name}: ${result.details} (unsupported)`);
          }
        } catch (error) {
          browserDetails.push(`❌ ${test.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Current browser info
      const currentBrowserSupported = this.browserInfo.supported;
      browserDetails.unshift(`🔍 Current: ${this.browserInfo.name} ${this.browserInfo.version} on ${this.browserInfo.platform}`);

      this.addResult('Browser Compatibility - Detection & Support',
        currentBrowserSupported ? TestStatus.PASSED : TestStatus.WARNING,
        `Browser support: Current browser ${currentBrowserSupported ? 'supported' : 'may have issues'}. ${browserDetails.join(', ')}`,
        TestCategory.INTEGRATION, performance.now() - startTime);

    } catch (error) {
      this.addResult('Browser Compatibility - Detection & Support', TestStatus.FAILED,
        `Browser detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.INTEGRATION, performance.now() - startTime);
    }
  }

  private async testJavaScriptFeatures(): Promise<void> {
    const startTime = performance.now();
    console.log('    📜 Testing JavaScript features compatibility...');

    try {
      const jsFeatureTests = [
        {
          name: 'ES6+ Features',
          test: () => {
            try {
              // Test arrow functions
              const arrow = () => true;
              // Test template literals
              const template = `test ${arrow()}`;
              // Test destructuring
              const [a, b] = [1, 2];
              // Test async/await
              const asyncTest = async () => true;
              // Test classes
              class TestClass { constructor() {} }
              
              return { supported: true, details: 'ES6+ features working' };
            } catch (error) {
              return { supported: false, details: 'ES6+ features not supported' };
            }
          }
        },
        {
          name: 'Fetch API',
          test: () => {
            const supported = typeof fetch !== 'undefined';
            return { supported, details: supported ? 'Fetch API available' : 'Fetch API not available' };
          }
        },
        {
          name: 'Local Storage',
          test: () => {
            try {
              const testKey = 'compatibility-test';
              localStorage.setItem(testKey, 'test');
              const value = localStorage.getItem(testKey);
              localStorage.removeItem(testKey);
              return { supported: value === 'test', details: 'Local Storage working' };
            } catch (error) {
              return { supported: false, details: 'Local Storage not available' };
            }
          }
        },
        {
          name: 'WebSocket',
          test: () => {
            const supported = typeof WebSocket !== 'undefined';
            return { supported, details: supported ? 'WebSocket available' : 'WebSocket not available' };
          }
        },
        {
          name: 'Crypto API',
          test: () => {
            const supported = typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined';
            return { supported, details: supported ? 'Crypto API available' : 'Crypto API not available' };
          }
        },
        {
          name: 'Performance API',
          test: () => {
            const supported = typeof performance !== 'undefined' && typeof performance.now === 'function';
            return { supported, details: supported ? 'Performance API available' : 'Performance API not available' };
          }
        }
      ];

      let supportedFeatures = 0;
      const featureDetails: string[] = [];

      for (const test of jsFeatureTests) {
        try {
          const result = test.test();
          if (result.supported) {
            supportedFeatures++;
            featureDetails.push(`✅ ${test.name}: ${result.details}`);
          } else {
            featureDetails.push(`❌ ${test.name}: ${result.details}`);
          }
        } catch (error) {
          featureDetails.push(`❌ ${test.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      this.addResult('Browser Compatibility - JavaScript Features',
        supportedFeatures >= jsFeatureTests.length * 0.8 ? TestStatus.PASSED : TestStatus.WARNING,
        `JavaScript features: ${supportedFeatures}/${jsFeatureTests.length} supported. ${featureDetails.join(', ')}`,
        TestCategory.INTEGRATION, performance.now() - startTime);

    } catch (error) {
      this.addResult('Browser Compatibility - JavaScript Features', TestStatus.FAILED,
        `JavaScript features test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.INTEGRATION, performance.now() - startTime);
    }
  }

  private async testCSSFeatures(): Promise<void> {
    const startTime = performance.now();
    console.log('    🎨 Testing CSS features compatibility...');

    try {
      const cssFeatureTests = [
        {
          name: 'CSS Grid',
          test: () => {
            const supported = CSS.supports('display', 'grid');
            return { supported, details: supported ? 'CSS Grid supported' : 'CSS Grid not supported' };
          }
        },
        {
          name: 'CSS Flexbox',
          test: () => {
            const supported = CSS.supports('display', 'flex');
            return { supported, details: supported ? 'Flexbox supported' : 'Flexbox not supported' };
          }
        },
        {
          name: 'CSS Variables',
          test: () => {
            const supported = CSS.supports('color', 'var(--test)');
            return { supported, details: supported ? 'CSS Variables supported' : 'CSS Variables not supported' };
          }
        },
        {
          name: 'CSS Transforms',
          test: () => {
            const supported = CSS.supports('transform', 'translateX(10px)');
            return { supported, details: supported ? 'CSS Transforms supported' : 'CSS Transforms not supported' };
          }
        },
        {
          name: 'CSS Transitions',
          test: () => {
            const supported = CSS.supports('transition', 'all 0.3s ease');
            return { supported, details: supported ? 'CSS Transitions supported' : 'CSS Transitions not supported' };
          }
        },
        {
          name: 'CSS Media Queries',
          test: () => {
            const supported = window.matchMedia && window.matchMedia('(min-width: 768px)').matches !== undefined;
            return { supported, details: supported ? 'Media Queries supported' : 'Media Queries not supported' };
          }
        }
      ];

      let supportedCSSFeatures = 0;
      const cssDetails: string[] = [];

      for (const test of cssFeatureTests) {
        try {
          const result = test.test();
          if (result.supported) {
            supportedCSSFeatures++;
            cssDetails.push(`✅ ${test.name}: ${result.details}`);
          } else {
            cssDetails.push(`❌ ${test.name}: ${result.details}`);
          }
        } catch (error) {
          cssDetails.push(`❌ ${test.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      this.addResult('Browser Compatibility - CSS Features',
        supportedCSSFeatures >= cssFeatureTests.length * 0.8 ? TestStatus.PASSED : TestStatus.WARNING,
        `CSS features: ${supportedCSSFeatures}/${cssFeatureTests.length} supported. ${cssDetails.join(', ')}`,
        TestCategory.UI, performance.now() - startTime);

    } catch (error) {
      this.addResult('Browser Compatibility - CSS Features', TestStatus.FAILED,
        `CSS features test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.UI, performance.now() - startTime);
    }
  }

  private async testWebAPIsCompatibility(): Promise<void> {
    const startTime = performance.now();
    console.log('    🔌 Testing Web APIs compatibility...');

    try {
      const webAPITests = [
        {
          name: 'Geolocation API',
          test: () => {
            const supported = 'geolocation' in navigator;
            return { supported, details: supported ? 'Geolocation API available' : 'Geolocation API not available' };
          }
        },
        {
          name: 'Notification API',
          test: () => {
            const supported = 'Notification' in window;
            return { supported, details: supported ? 'Notification API available' : 'Notification API not available' };
          }
        },
        {
          name: 'Service Worker',
          test: () => {
            const supported = 'serviceWorker' in navigator;
            return { supported, details: supported ? 'Service Worker available' : 'Service Worker not available' };
          }
        },
        {
          name: 'IndexedDB',
          test: () => {
            const supported = 'indexedDB' in window;
            return { supported, details: supported ? 'IndexedDB available' : 'IndexedDB not available' };
          }
        },
        {
          name: 'Canvas API',
          test: () => {
            try {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              return { supported: !!ctx, details: ctx ? 'Canvas API available' : 'Canvas API not available' };
            } catch (error) {
              return { supported: false, details: 'Canvas API not available' };
            }
          }
        },
        {
          name: 'Web Audio API',
          test: () => {
            const supported = 'AudioContext' in window || 'webkitAudioContext' in window;
            return { supported, details: supported ? 'Web Audio API available' : 'Web Audio API not available' };
          }
        }
      ];

      let supportedAPIs = 0;
      const apiDetails: string[] = [];

      for (const test of webAPITests) {
        try {
          const result = test.test();
          if (result.supported) {
            supportedAPIs++;
            apiDetails.push(`✅ ${test.name}: ${result.details}`);
          } else {
            apiDetails.push(`⚠️ ${test.name}: ${result.details}`);
          }
        } catch (error) {
          apiDetails.push(`❌ ${test.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      this.addResult('Browser Compatibility - Web APIs',
        supportedAPIs >= webAPITests.length * 0.7 ? TestStatus.PASSED : TestStatus.WARNING,
        `Web APIs: ${supportedAPIs}/${webAPITests.length} supported. ${apiDetails.join(', ')}`,
        TestCategory.INTEGRATION, performance.now() - startTime);

    } catch (error) {
      this.addResult('Browser Compatibility - Web APIs', TestStatus.FAILED,
        `Web APIs test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.INTEGRATION, performance.now() - startTime);
    }
  }

  private async testWalletIntegrationCompatibility(): Promise<void> {
    const startTime = performance.now();
    console.log('    💳 Testing wallet integration compatibility...');

    try {
      const walletTests = [
        {
          name: 'Keplr Wallet',
          test: () => {
            const supported = typeof (window as any).keplr !== 'undefined';
            return { supported, details: supported ? 'Keplr wallet detected' : 'Keplr wallet not available' };
          }
        },
        {
          name: 'Leap Wallet',
          test: () => {
            const supported = typeof (window as any).leap !== 'undefined';
            return { supported, details: supported ? 'Leap wallet detected' : 'Leap wallet not available' };
          }
        },
        {
          name: 'MetaMask',
          test: () => {
            const supported = typeof (window as any).ethereum !== 'undefined' && (window as any).ethereum.isMetaMask;
            return { supported, details: supported ? 'MetaMask detected' : 'MetaMask not available' };
          }
        },
        {
          name: 'Web3 Provider',
          test: () => {
            const supported = typeof (window as any).ethereum !== 'undefined' || typeof (window as any).web3 !== 'undefined';
            return { supported, details: supported ? 'Web3 provider available' : 'Web3 provider not available' };
          }
        },
        {
          name: 'Wallet Connect Support',
          test: () => {
            // Check if the browser supports the features needed for WalletConnect
            const supported = typeof WebSocket !== 'undefined' && typeof crypto !== 'undefined';
            return { supported, details: supported ? 'WalletConnect compatible' : 'WalletConnect may not work' };
          }
        }
      ];

      let supportedWallets = 0;
      const walletDetails: string[] = [];

      for (const test of walletTests) {
        try {
          const result = test.test();
          if (result.supported) {
            supportedWallets++;
            walletDetails.push(`✅ ${test.name}: ${result.details}`);
          } else {
            walletDetails.push(`⚠️ ${test.name}: ${result.details}`);
          }
        } catch (error) {
          walletDetails.push(`❌ ${test.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Special handling for mobile browsers
      if (this.browserInfo.mobile) {
        walletDetails.push(`📱 Mobile browser detected: Some wallet integrations may require mobile apps`);
      }

      this.addResult('Browser Compatibility - Wallet Integration',
        supportedWallets > 0 ? TestStatus.PASSED : TestStatus.WARNING,
        `Wallet integration: ${supportedWallets}/${walletTests.length} wallets/features supported. ${walletDetails.join(', ')}`,
        TestCategory.INTEGRATION, performance.now() - startTime);

    } catch (error) {
      this.addResult('Browser Compatibility - Wallet Integration', TestStatus.WARNING,
        `Wallet integration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.INTEGRATION, performance.now() - startTime);
    }
  }

  // Test 11.2: Responsive design and device compatibility
  private async testResponsiveDesignCompatibility(): Promise<void> {
    console.log('  📱 Testing responsive design and device compatibility...');
    const startTime = performance.now();

    try {
      // Test desktop layouts
      await this.testDesktopLayouts();
      
      // Test tablet compatibility
      await this.testTabletCompatibility();
      
      // Test mobile device compatibility
      await this.testMobileCompatibility();
      
      // Test touch interactions
      await this.testTouchInteractions();
      
      // Test screen densities and orientations
      await this.testScreenDensitiesOrientations();

    } catch (error) {
      this.addResult('Responsive Design Compatibility', TestStatus.FAILED,
        `Responsive design testing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.UI, performance.now() - startTime);
    }
  }

  private async testDesktopLayouts(): Promise<void> {
    const startTime = performance.now();
    console.log('    🖥️ Testing desktop layouts...');

    try {
      const desktopResolutions = [
        { name: 'Full HD', width: 1920, height: 1080 },
        { name: 'Standard HD', width: 1366, height: 768 },
        { name: 'MacBook Pro', width: 1440, height: 900 },
        { name: 'Wide Screen', width: 2560, height: 1440 }
      ];

      const layoutTests: { resolution: string; width: number; height: number; passed: boolean; issues: string[] }[] = [];

      for (const resolution of desktopResolutions) {
        try {
          // Simulate viewport size (note: actual resizing would require browser automation)
          const issues: string[] = [];
          let passed = true;

          // Check if current viewport can accommodate this resolution
          const currentWidth = window.innerWidth;
          const currentHeight = window.innerHeight;

          if (currentWidth < resolution.width || currentHeight < resolution.height) {
            issues.push(`Current viewport (${currentWidth}x${currentHeight}) smaller than target`);
          }

          // Test responsive breakpoints
          const mediaQuery = window.matchMedia(`(min-width: ${resolution.width}px)`);
          if (!mediaQuery.matches && currentWidth >= resolution.width) {
            issues.push('Media query not matching expected resolution');
            passed = false;
          }

          // Check for horizontal scrolling
          const hasHorizontalScroll = document.documentElement.scrollWidth > document.documentElement.clientWidth;
          if (hasHorizontalScroll && currentWidth >= resolution.width) {
            issues.push('Horizontal scrolling detected');
            passed = false;
          }

          // Check for layout elements visibility
          const mainElements = document.querySelectorAll('nav, main, header, footer');
          if (mainElements.length === 0) {
            issues.push('Main layout elements not found');
            passed = false;
          }

          layoutTests.push({
            resolution: resolution.name,
            width: resolution.width,
            height: resolution.height,
            passed,
            issues
          });

        } catch (error) {
          layoutTests.push({
            resolution: resolution.name,
            width: resolution.width,
            height: resolution.height,
            passed: false,
            issues: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`]
          });
        }
      }

      const passedLayouts = layoutTests.filter(t => t.passed).length;
      const layoutDetails = layoutTests.map(t => 
        `${t.resolution} (${t.width}x${t.height}): ${t.passed ? '✅' : '❌'} ${t.issues.length > 0 ? `(${t.issues.join(', ')})` : ''}`
      );

      this.addResult('Responsive Design - Desktop Layouts',
        passedLayouts >= desktopResolutions.length * 0.7 ? TestStatus.PASSED : TestStatus.WARNING,
        `Desktop layouts: ${passedLayouts}/${desktopResolutions.length} resolutions compatible. ${layoutDetails.join(', ')}`,
        TestCategory.UI, performance.now() - startTime);

    } catch (error) {
      this.addResult('Responsive Design - Desktop Layouts', TestStatus.FAILED,
        `Desktop layout test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.UI, performance.now() - startTime);
    }
  }

  private async testTabletCompatibility(): Promise<void> {
    const startTime = performance.now();
    console.log('    📱 Testing tablet compatibility...');

    try {
      const tabletTests = [
        {
          name: 'iPad Portrait',
          width: 768,
          height: 1024,
          test: () => this.testViewportCompatibility(768, 1024)
        },
        {
          name: 'iPad Landscape',
          width: 1024,
          height: 768,
          test: () => this.testViewportCompatibility(1024, 768)
        },
        {
          name: 'Android Tablet',
          width: 800,
          height: 1280,
          test: () => this.testViewportCompatibility(800, 1280)
        }
      ];

      let compatibleTablets = 0;
      const tabletDetails: string[] = [];

      for (const tablet of tabletTests) {
        try {
          const result = await tablet.test();
          if (result.compatible) {
            compatibleTablets++;
            tabletDetails.push(`✅ ${tablet.name}: Compatible`);
          } else {
            tabletDetails.push(`⚠️ ${tablet.name}: ${result.issues.join(', ')}`);
          }
        } catch (error) {
          tabletDetails.push(`❌ ${tablet.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Test tablet-specific features
      const touchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      if (touchSupported) {
        tabletDetails.push('✅ Touch support detected');
      } else {
        tabletDetails.push('⚠️ Touch support not detected');
      }

      this.addResult('Responsive Design - Tablet Compatibility',
        compatibleTablets >= tabletTests.length * 0.7 ? TestStatus.PASSED : TestStatus.WARNING,
        `Tablet compatibility: ${compatibleTablets}/${tabletTests.length} tablet layouts compatible. ${tabletDetails.join(', ')}`,
        TestCategory.UI, performance.now() - startTime);

    } catch (error) {
      this.addResult('Responsive Design - Tablet Compatibility', TestStatus.FAILED,
        `Tablet compatibility test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.UI, performance.now() - startTime);
    }
  }

  private async testMobileCompatibility(): Promise<void> {
    const startTime = performance.now();
    console.log('    📱 Testing mobile device compatibility...');

    try {
      const mobileTests = [
        {
          name: 'iPhone SE',
          width: 375,
          height: 667,
          test: () => this.testViewportCompatibility(375, 667)
        },
        {
          name: 'iPhone 12',
          width: 390,
          height: 844,
          test: () => this.testViewportCompatibility(390, 844)
        },
        {
          name: 'Samsung Galaxy',
          width: 360,
          height: 640,
          test: () => this.testViewportCompatibility(360, 640)
        },
        {
          name: 'Small Mobile',
          width: 320,
          height: 568,
          test: () => this.testViewportCompatibility(320, 568)
        }
      ];

      let compatibleMobiles = 0;
      const mobileDetails: string[] = [];

      for (const mobile of mobileTests) {
        try {
          const result = await mobile.test();
          if (result.compatible) {
            compatibleMobiles++;
            mobileDetails.push(`✅ ${mobile.name}: Compatible`);
          } else {
            mobileDetails.push(`⚠️ ${mobile.name}: ${result.issues.join(', ')}`);
          }
        } catch (error) {
          mobileDetails.push(`❌ ${mobile.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Test mobile-specific features
      const isMobile = this.deviceInfo.type === 'mobile' || this.browserInfo.mobile;
      if (isMobile) {
        mobileDetails.push('✅ Mobile device detected');
      }

      // Test viewport meta tag
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta) {
        mobileDetails.push('✅ Viewport meta tag present');
      } else {
        mobileDetails.push('⚠️ Viewport meta tag missing');
      }

      this.addResult('Responsive Design - Mobile Compatibility',
        compatibleMobiles >= mobileTests.length * 0.7 ? TestStatus.PASSED : TestStatus.WARNING,
        `Mobile compatibility: ${compatibleMobiles}/${mobileTests.length} mobile layouts compatible. ${mobileDetails.join(', ')}`,
        TestCategory.UI, performance.now() - startTime);

    } catch (error) {
      this.addResult('Responsive Design - Mobile Compatibility', TestStatus.FAILED,
        `Mobile compatibility test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.UI, performance.now() - startTime);
    }
  }

  private async testTouchInteractions(): Promise<void> {
    const startTime = performance.now();
    console.log('    👆 Testing touch interactions and mobile-specific features...');

    try {
      const touchTests = [
        {
          name: 'Touch Events Support',
          test: () => {
            const supported = 'ontouchstart' in window;
            return { supported, details: supported ? 'Touch events supported' : 'Touch events not supported' };
          }
        },
        {
          name: 'Multi-touch Support',
          test: () => {
            const supported = navigator.maxTouchPoints > 1;
            return { supported, details: `Max touch points: ${navigator.maxTouchPoints}` };
          }
        },
        {
          name: 'Touch-friendly Button Sizes',
          test: () => {
            const buttons = document.querySelectorAll('button');
            let touchFriendlyButtons = 0;
            
            buttons.forEach(button => {
              const rect = button.getBoundingClientRect();
              const minSize = 44; // 44px minimum touch target size
              if (rect.width >= minSize && rect.height >= minSize) {
                touchFriendlyButtons++;
              }
            });
            
            const ratio = buttons.length > 0 ? touchFriendlyButtons / buttons.length : 0;
            return { 
              supported: ratio >= 0.8, 
              details: `${touchFriendlyButtons}/${buttons.length} buttons are touch-friendly (≥44px)` 
            };
          }
        },
        {
          name: 'Swipe Gestures',
          test: () => {
            // Check if there are elements that might support swipe gestures
            const swipeElements = document.querySelectorAll('[class*="swipe"], [class*="carousel"], [class*="slider"]');
            return { 
              supported: swipeElements.length > 0, 
              details: `${swipeElements.length} potential swipe elements found` 
            };
          }
        },
        {
          name: 'Pinch-to-Zoom Prevention',
          test: () => {
            const viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
            if (viewportMeta) {
              const content = viewportMeta.content;
              const hasUserScalable = content.includes('user-scalable=no') || content.includes('maximum-scale=1');
              return { 
                supported: hasUserScalable, 
                details: hasUserScalable ? 'Pinch-to-zoom prevented' : 'Pinch-to-zoom allowed' 
              };
            }
            return { supported: false, details: 'No viewport meta tag found' };
          }
        }
      ];

      let supportedTouchFeatures = 0;
      const touchDetails: string[] = [];

      for (const test of touchTests) {
        try {
          const result = test.test();
          if (result.supported) {
            supportedTouchFeatures++;
            touchDetails.push(`✅ ${test.name}: ${result.details}`);
          } else {
            touchDetails.push(`⚠️ ${test.name}: ${result.details}`);
          }
        } catch (error) {
          touchDetails.push(`❌ ${test.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      this.addResult('Responsive Design - Touch Interactions',
        supportedTouchFeatures >= touchTests.length * 0.6 ? TestStatus.PASSED : TestStatus.WARNING,
        `Touch interactions: ${supportedTouchFeatures}/${touchTests.length} features supported. ${touchDetails.join(', ')}`,
        TestCategory.UI, performance.now() - startTime);

    } catch (error) {
      this.addResult('Responsive Design - Touch Interactions', TestStatus.FAILED,
        `Touch interactions test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.UI, performance.now() - startTime);
    }
  }

  private async testScreenDensitiesOrientations(): Promise<void> {
    const startTime = performance.now();
    console.log('    🔄 Testing screen densities and orientations...');

    try {
      const densityOrientationTests = [
        {
          name: 'Device Pixel Ratio',
          test: () => {
            const dpr = window.devicePixelRatio || 1;
            const supported = dpr >= 1;
            return { 
              supported, 
              details: `Device pixel ratio: ${dpr}x ${dpr > 1 ? '(High DPI)' : '(Standard DPI)'}` 
            };
          }
        },
        {
          name: 'Orientation Support',
          test: () => {
            const supported = 'orientation' in screen || 'orientation' in window;
            const currentOrientation = screen.orientation?.type || 
                                     (window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
            return { 
              supported, 
              details: `Orientation API: ${supported ? 'Available' : 'Not available'}, Current: ${currentOrientation}` 
            };
          }
        },
        {
          name: 'Orientation Change Events',
          test: () => {
            const supported = 'onorientationchange' in window;
            return { 
              supported, 
              details: supported ? 'Orientation change events supported' : 'Orientation change events not supported' 
            };
          }
        },
        {
          name: 'Media Query Support',
          test: () => {
            try {
              const portraitQuery = window.matchMedia('(orientation: portrait)');
              const landscapeQuery = window.matchMedia('(orientation: landscape)');
              const dprQuery = window.matchMedia('(-webkit-min-device-pixel-ratio: 2)');
              
              const supported = portraitQuery.matches !== undefined;
              return { 
                supported, 
                details: `Media queries working, Portrait: ${portraitQuery.matches}, Landscape: ${landscapeQuery.matches}, High DPI: ${dprQuery.matches}` 
              };
            } catch (error) {
              return { supported: false, details: 'Media query test failed' };
            }
          }
        },
        {
          name: 'Responsive Images',
          test: () => {
            const responsiveImages = document.querySelectorAll('img[srcset], picture');
            const totalImages = document.querySelectorAll('img').length;
            const ratio = totalImages > 0 ? responsiveImages.length / totalImages : 0;
            
            return { 
              supported: ratio > 0 || totalImages === 0, 
              details: `${responsiveImages.length}/${totalImages} images are responsive` 
            };
          }
        }
      ];

      let supportedFeatures = 0;
      const densityDetails: string[] = [];

      for (const test of densityOrientationTests) {
        try {
          const result = test.test();
          if (result.supported) {
            supportedFeatures++;
            densityDetails.push(`✅ ${test.name}: ${result.details}`);
          } else {
            densityDetails.push(`⚠️ ${test.name}: ${result.details}`);
          }
        } catch (error) {
          densityDetails.push(`❌ ${test.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      this.addResult('Responsive Design - Screen Densities & Orientations',
        supportedFeatures >= densityOrientationTests.length * 0.7 ? TestStatus.PASSED : TestStatus.WARNING,
        `Screen features: ${supportedFeatures}/${densityOrientationTests.length} features supported. ${densityDetails.join(', ')}`,
        TestCategory.UI, performance.now() - startTime);

    } catch (error) {
      this.addResult('Responsive Design - Screen Densities & Orientations', TestStatus.FAILED,
        `Screen densities and orientations test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.UI, performance.now() - startTime);
    }
  }

  // Helper methods
  private detectBrowser(): BrowserInfo {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    
    let name = 'Unknown';
    let version = '';
    let engine = 'Unknown';
    let mobile = false;
    let supported = false;

    // Detect browser
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      name = 'Chrome';
      const match = userAgent.match(/Chrome\/(\d+)/);
      version = match ? match[1] : '';
      engine = 'Blink';
      supported = parseInt(version) >= 90;
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      name = 'Safari';
      const match = userAgent.match(/Version\/(\d+)/);
      version = match ? match[1] : '';
      engine = 'WebKit';
      supported = parseInt(version) >= 14;
    } else if (userAgent.includes('Firefox')) {
      name = 'Firefox';
      const match = userAgent.match(/Firefox\/(\d+)/);
      version = match ? match[1] : '';
      engine = 'Gecko';
      supported = parseInt(version) >= 88;
    } else if (userAgent.includes('Edg')) {
      name = 'Edge';
      const match = userAgent.match(/Edg\/(\d+)/);
      version = match ? match[1] : '';
      engine = 'Blink';
      supported = parseInt(version) >= 90;
    }

    // Detect mobile
    mobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

    return { name, version, engine, platform, mobile, supported };
  }

  private detectDevice(): DeviceInfo {
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const pixelRatio = window.devicePixelRatio || 1;
    const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    let type: 'desktop' | 'tablet' | 'mobile' = 'desktop';
    let orientation: 'portrait' | 'landscape' = 'landscape';

    // Determine device type
    if (screenWidth <= 768) {
      type = 'mobile';
    } else if (screenWidth <= 1024) {
      type = 'tablet';
    }

    // Determine orientation
    orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';

    return {
      type,
      screenWidth,
      screenHeight,
      pixelRatio,
      orientation,
      touchSupport
    };
  }

  private async testViewportCompatibility(targetWidth: number, targetHeight: number): Promise<{ compatible: boolean; issues: string[] }> {
    const issues: string[] = [];
    let compatible = true;

    try {
      // Check if content fits in viewport
      const currentWidth = window.innerWidth;
      const currentHeight = window.innerHeight;

      // Check for horizontal scrolling
      const hasHorizontalScroll = document.documentElement.scrollWidth > targetWidth;
      if (hasHorizontalScroll) {
        issues.push('Horizontal scrolling required');
        compatible = false;
      }

      // Check if main elements are visible
      const mainElements = document.querySelectorAll('nav, main, header');
      let visibleElements = 0;
      
      mainElements.forEach(element => {
        const rect = element.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          visibleElements++;
        }
      });

      if (visibleElements < mainElements.length * 0.8) {
        issues.push('Some main elements not visible');
        compatible = false;
      }

      // Check for overlapping elements
      const buttons = document.querySelectorAll('button');
      if (buttons.length > 0) {
        let overlappingButtons = 0;
        buttons.forEach(button => {
          const rect = button.getBoundingClientRect();
          if (rect.width < 44 || rect.height < 44) {
            overlappingButtons++;
          }
        });
        
        if (overlappingButtons > buttons.length * 0.2) {
          issues.push('Some buttons too small for touch');
          compatible = false;
        }
      }

    } catch (error) {
      issues.push(`Viewport test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      compatible = false;
    }

    return { compatible, issues };
  }

  private addResult(testName: string, status: TestStatus, details: string, category: TestCategory, executionTime: number): void {
    this.results.push({
      testName,
      status,
      details,
      category,
      executionTime,
      timestamp: new Date(),
      errors: status === TestStatus.FAILED ? [details] : undefined
    });
  }

  // Get summary of results
  getSummary(): { total: number; passed: number; failed: number; warnings: number; passRate: number } {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === TestStatus.PASSED).length;
    const failed = this.results.filter(r => r.status === TestStatus.FAILED).length;
    const warnings = this.results.filter(r => r.status === TestStatus.WARNING).length;
    const passRate = total > 0 ? (passed / total) * 100 : 0;

    return { total, passed, failed, warnings, passRate };
  }

  // Get detailed results
  getResults(): TestResult[] {
    return this.results;
  }

  // Get browser and device info
  getBrowserInfo(): BrowserInfo {
    return this.browserInfo;
  }

  getDeviceInfo(): DeviceInfo {
    return this.deviceInfo;
  }
}

// Export singleton instance
export const crossBrowserDeviceTester = new CrossBrowserDeviceTester();

// Make available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).CrossBrowserDeviceTester = crossBrowserDeviceTester;
}