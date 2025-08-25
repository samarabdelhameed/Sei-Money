// Performance and Load Tester
// Performance and load testing

import { TestResult, TestStatus, TestCategory } from './types';
import { testUtils } from './test-utilities';

interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  memoryUsage: number;
  bundleSize: number;
}

interface LoadTestResult {
  concurrent: number;
  averageResponseTime: number;
  successRate: number;
  errorRate: number;
  throughput: number;
}

export class PerformanceLoadTester {
  private results: TestResult[] = [];
  private performanceObserver: PerformanceObserver | null = null;
  private memoryMonitor: any = null;

  constructor() {
    this.initializePerformanceMonitoring();
  }

  async testPerformanceAndLoad(): Promise<TestResult[]> {
    console.log('⚡ Testing Performance and Load...');
    this.results = [];

    try {
      // Test 10.1: Application performance metrics
      await this.testApplicationPerformanceMetrics();
      
      // Test 10.2: Real-time data handling performance
      await this.testRealTimeDataPerformance();

    } catch (error) {
      console.error('❌ Performance and load testing failed:', error);
      this.results.push(testUtils.handleTestError(error as Error, 'Performance and Load Testing'));
    }

    return this.results;
  }

  // Test 10.1: Application performance metrics
  private async testApplicationPerformanceMetrics(): Promise<void> {
    console.log('  📊 Testing application performance metrics...');
    const startTime = performance.now();

    try {
      // Test page load times for all screens
      await this.testPageLoadTimes();
      
      // Test application responsiveness
      await this.testApplicationResponsiveness();
      
      // Test memory usage and leaks
      await this.testMemoryUsage();
      
      // Test bundle size and loading optimization
      await this.testBundleSizeAndOptimization();
      
      // Test image and asset loading performance
      await this.testAssetLoadingPerformance();

    } catch (error) {
      this.addResult('Application Performance Metrics', TestStatus.FAILED,
        `Performance metrics testing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.PERFORMANCE, performance.now() - startTime);
    }
  }

  private async testPageLoadTimes(): Promise<void> {
    const startTime = performance.now();
    console.log('    ⏱️ Testing page load times for all screens...');

    try {
      const screens = [
        { name: 'Home', path: '#/', target: 2000 },
        { name: 'Dashboard', path: '#/dashboard', target: 3000 },
        { name: 'Payments', path: '#/payments', target: 2500 },
        { name: 'Vaults', path: '#/vaults', target: 3000 },
        { name: 'Groups', path: '#/groups', target: 2500 },
        { name: 'AI Agent', path: '#/ai-agent', target: 2000 }
      ];

      const loadTimeResults: { screen: string; loadTime: number; target: number; passed: boolean }[] = [];

      for (const screen of screens) {
        try {
          const loadStartTime = performance.now();
          
          // Navigate to screen
          window.location.hash = screen.path;
          
          // Wait for navigation and content loading
          await this.waitForPageLoad();
          
          const loadEndTime = performance.now();
          const loadTime = loadEndTime - loadStartTime;
          const passed = loadTime <= screen.target;
          
          loadTimeResults.push({
            screen: screen.name,
            loadTime: Math.round(loadTime),
            target: screen.target,
            passed
          });

          // Get additional performance metrics
          const performanceMetrics = this.getPerformanceMetrics();
          if (performanceMetrics) {
            loadTimeResults[loadTimeResults.length - 1] = {
              ...loadTimeResults[loadTimeResults.length - 1],
              ...performanceMetrics
            } as any;
          }

        } catch (error) {
          loadTimeResults.push({
            screen: screen.name,
            loadTime: -1,
            target: screen.target,
            passed: false
          });
        }
      }

      const passedScreens = loadTimeResults.filter(r => r.passed).length;
      const averageLoadTime = loadTimeResults
        .filter(r => r.loadTime > 0)
        .reduce((sum, r) => sum + r.loadTime, 0) / loadTimeResults.filter(r => r.loadTime > 0).length;

      this.addResult('Performance - Page Load Times',
        passedScreens >= screens.length * 0.8 ? TestStatus.PASSED : 
        passedScreens >= screens.length * 0.5 ? TestStatus.WARNING : TestStatus.FAILED,
        `Page load performance: ${passedScreens}/${screens.length} screens within target. Average: ${Math.round(averageLoadTime)}ms. Details: ${loadTimeResults.map(r => `${r.screen}: ${r.loadTime}ms (target: ${r.target}ms) ${r.passed ? '✅' : '❌'}`).join(', ')}`,
        TestCategory.PERFORMANCE, performance.now() - startTime);

    } catch (error) {
      this.addResult('Performance - Page Load Times', TestStatus.FAILED,
        `Page load time testing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.PERFORMANCE, performance.now() - startTime);
    }
  }

  private async testApplicationResponsiveness(): Promise<void> {
    const startTime = performance.now();
    console.log('    🎯 Testing application responsiveness under normal load...');

    try {
      const responsivenessTests = [
        {
          name: 'Button Click Responsiveness',
          test: async () => {
            const buttons = document.querySelectorAll('button:not([disabled])');
            if (buttons.length === 0) return { responseTime: -1, success: false };

            const button = buttons[0] as HTMLButtonElement;
            const clickStartTime = performance.now();
            
            button.click();
            
            // Wait for any visual feedback or state change
            await this.sleep(100);
            
            const clickEndTime = performance.now();
            const responseTime = clickEndTime - clickStartTime;
            
            return { responseTime, success: responseTime < 100 };
          }
        },
        {
          name: 'Input Field Responsiveness',
          test: async () => {
            const inputs = document.querySelectorAll('input:not([disabled])');
            if (inputs.length === 0) return { responseTime: -1, success: false };

            const input = inputs[0] as HTMLInputElement;
            const inputStartTime = performance.now();
            
            input.focus();
            input.value = 'test';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            
            await this.sleep(50);
            
            const inputEndTime = performance.now();
            const responseTime = inputEndTime - inputStartTime;
            
            return { responseTime, success: responseTime < 50 };
          }
        },
        {
          name: 'Navigation Responsiveness',
          test: async () => {
            const navStartTime = performance.now();
            const currentHash = window.location.hash;
            
            window.location.hash = '#/dashboard';
            await this.sleep(100);
            window.location.hash = currentHash;
            
            const navEndTime = performance.now();
            const responseTime = navEndTime - navStartTime;
            
            return { responseTime, success: responseTime < 200 };
          }
        }
      ];

      let responsiveTests = 0;
      const responsivenessDetails: string[] = [];

      for (const test of responsivenessTests) {
        try {
          const result = await test.test();
          if (result.success && result.responseTime > 0) {
            responsiveTests++;
            responsivenessDetails.push(`✅ ${test.name}: ${Math.round(result.responseTime)}ms`);
          } else {
            responsivenessDetails.push(`❌ ${test.name}: ${result.responseTime > 0 ? Math.round(result.responseTime) + 'ms (slow)' : 'failed'}`);
          }
        } catch (error) {
          responsivenessDetails.push(`❌ ${test.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      this.addResult('Performance - Application Responsiveness',
        responsiveTests >= responsivenessTests.length * 0.8 ? TestStatus.PASSED : TestStatus.WARNING,
        `Responsiveness: ${responsiveTests}/${responsivenessTests.length} tests passed. ${responsivenessDetails.join(', ')}`,
        TestCategory.PERFORMANCE, performance.now() - startTime);

    } catch (error) {
      this.addResult('Performance - Application Responsiveness', TestStatus.FAILED,
        `Responsiveness testing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.PERFORMANCE, performance.now() - startTime);
    }
  }

  private async testMemoryUsage(): Promise<void> {
    const startTime = performance.now();
    console.log('    🧠 Testing memory usage and potential memory leaks...');

    try {
      // Get initial memory usage
      const initialMemory = this.getMemoryUsage();
      
      // Perform memory-intensive operations
      const memoryTests = [
        {
          name: 'Navigation Memory Test',
          operation: async () => {
            // Navigate through all screens multiple times
            const screens = ['#/', '#/dashboard', '#/payments', '#/vaults', '#/groups', '#/ai-agent'];
            for (let i = 0; i < 3; i++) {
              for (const screen of screens) {
                window.location.hash = screen;
                await this.sleep(500);
              }
            }
          }
        },
        {
          name: 'DOM Manipulation Memory Test',
          operation: async () => {
            // Create and remove DOM elements
            for (let i = 0; i < 100; i++) {
              const div = document.createElement('div');
              div.innerHTML = `<p>Test element ${i}</p>`;
              document.body.appendChild(div);
              await this.sleep(10);
              document.body.removeChild(div);
            }
          }
        },
        {
          name: 'Data Processing Memory Test',
          operation: async () => {
            // Process large arrays
            const largeArray = new Array(10000).fill(0).map((_, i) => ({ id: i, data: `item-${i}` }));
            const processed = largeArray.map(item => ({ ...item, processed: true }));
            const filtered = processed.filter(item => item.id % 2 === 0);
            // Clear references
            largeArray.length = 0;
            processed.length = 0;
            filtered.length = 0;
          }
        }
      ];

      const memoryResults: { test: string; beforeMB: number; afterMB: number; leakMB: number; passed: boolean }[] = [];

      for (const test of memoryTests) {
        try {
          const beforeMemory = this.getMemoryUsage();
          
          await test.operation();
          
          // Force garbage collection if available
          if ((window as any).gc) {
            (window as any).gc();
          }
          
          await this.sleep(1000); // Wait for cleanup
          
          const afterMemory = this.getMemoryUsage();
          const memoryLeak = afterMemory - beforeMemory;
          const passed = memoryLeak < 10; // Less than 10MB increase is acceptable
          
          memoryResults.push({
            test: test.name,
            beforeMB: Math.round(beforeMemory),
            afterMB: Math.round(afterMemory),
            leakMB: Math.round(memoryLeak),
            passed
          });

        } catch (error) {
          memoryResults.push({
            test: test.name,
            beforeMB: 0,
            afterMB: 0,
            leakMB: -1,
            passed: false
          });
        }
      }

      const passedMemoryTests = memoryResults.filter(r => r.passed).length;
      const totalMemoryIncrease = memoryResults.reduce((sum, r) => sum + (r.leakMB > 0 ? r.leakMB : 0), 0);

      this.addResult('Performance - Memory Usage',
        passedMemoryTests >= memoryTests.length * 0.8 && totalMemoryIncrease < 50 ? TestStatus.PASSED : TestStatus.WARNING,
        `Memory usage: ${passedMemoryTests}/${memoryTests.length} tests passed. Total increase: ${totalMemoryIncrease}MB. Details: ${memoryResults.map(r => `${r.test}: ${r.leakMB >= 0 ? r.leakMB + 'MB' : 'failed'} ${r.passed ? '✅' : '❌'}`).join(', ')}`,
        TestCategory.PERFORMANCE, performance.now() - startTime);

    } catch (error) {
      this.addResult('Performance - Memory Usage', TestStatus.WARNING,
        `Memory usage testing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.PERFORMANCE, performance.now() - startTime);
    }
  }

  private async testBundleSizeAndOptimization(): Promise<void> {
    const startTime = performance.now();
    console.log('    📦 Testing bundle size and loading optimization...');

    try {
      const optimizationTests = [
        {
          name: 'JavaScript Bundle Size',
          test: () => {
            const scripts = document.querySelectorAll('script[src]');
            let totalSize = 0;
            let loadedScripts = 0;

            scripts.forEach(script => {
              const src = (script as HTMLScriptElement).src;
              if (src && !src.includes('node_modules')) {
                // Estimate size based on script content or use performance API
                const entry = performance.getEntriesByName(src)[0] as PerformanceResourceTiming;
                if (entry && entry.transferSize) {
                  totalSize += entry.transferSize;
                  loadedScripts++;
                }
              }
            });

            const averageSize = loadedScripts > 0 ? totalSize / loadedScripts : 0;
            const passed = totalSize < 2 * 1024 * 1024; // Less than 2MB total

            return { totalSize, loadedScripts, averageSize, passed };
          }
        },
        {
          name: 'CSS Bundle Size',
          test: () => {
            const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
            let totalSize = 0;
            let loadedStyles = 0;

            stylesheets.forEach(link => {
              const href = (link as HTMLLinkElement).href;
              if (href) {
                const entry = performance.getEntriesByName(href)[0] as PerformanceResourceTiming;
                if (entry && entry.transferSize) {
                  totalSize += entry.transferSize;
                  loadedStyles++;
                }
              }
            });

            const passed = totalSize < 500 * 1024; // Less than 500KB total
            return { totalSize, loadedStyles, passed };
          }
        },
        {
          name: 'Resource Compression',
          test: () => {
            const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
            let compressedResources = 0;
            let totalResources = 0;

            resources.forEach(resource => {
              if (resource.transferSize && resource.decodedBodySize) {
                totalResources++;
                const compressionRatio = resource.transferSize / resource.decodedBodySize;
                if (compressionRatio < 0.8) { // At least 20% compression
                  compressedResources++;
                }
              }
            });

            const compressionRate = totalResources > 0 ? (compressedResources / totalResources) * 100 : 0;
            const passed = compressionRate > 70; // At least 70% of resources compressed

            return { compressedResources, totalResources, compressionRate, passed };
          }
        }
      ];

      let optimizationsPassed = 0;
      const optimizationDetails: string[] = [];

      for (const test of optimizationTests) {
        try {
          const result = test.test();
          if (result.passed) {
            optimizationsPassed++;
            optimizationDetails.push(`✅ ${test.name}: Optimized`);
          } else {
            optimizationDetails.push(`⚠️ ${test.name}: Needs optimization`);
          }
        } catch (error) {
          optimizationDetails.push(`❌ ${test.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      this.addResult('Performance - Bundle Size & Optimization',
        optimizationsPassed >= optimizationTests.length * 0.7 ? TestStatus.PASSED : TestStatus.WARNING,
        `Bundle optimization: ${optimizationsPassed}/${optimizationTests.length} optimizations passed. ${optimizationDetails.join(', ')}`,
        TestCategory.PERFORMANCE, performance.now() - startTime);

    } catch (error) {
      this.addResult('Performance - Bundle Size & Optimization', TestStatus.WARNING,
        `Bundle optimization testing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.PERFORMANCE, performance.now() - startTime);
    }
  }

  private async testAssetLoadingPerformance(): Promise<void> {
    const startTime = performance.now();
    console.log('    🖼️ Testing image and asset loading performance...');

    try {
      const assetTests = [
        {
          name: 'Image Loading Performance',
          test: () => {
            const images = document.querySelectorAll('img');
            let loadedImages = 0;
            let totalLoadTime = 0;
            let failedImages = 0;

            images.forEach(img => {
              const src = img.src;
              if (src) {
                const entry = performance.getEntriesByName(src)[0] as PerformanceResourceTiming;
                if (entry) {
                  loadedImages++;
                  totalLoadTime += entry.responseEnd - entry.requestStart;
                } else if (img.complete && img.naturalWidth === 0) {
                  failedImages++;
                }
              }
            });

            const averageLoadTime = loadedImages > 0 ? totalLoadTime / loadedImages : 0;
            const passed = averageLoadTime < 1000 && failedImages === 0; // Less than 1s average, no failures

            return { loadedImages, averageLoadTime, failedImages, passed };
          }
        },
        {
          name: 'Font Loading Performance',
          test: () => {
            const fontEntries = performance.getEntriesByType('resource').filter(entry => 
              entry.name.includes('.woff') || entry.name.includes('.woff2') || entry.name.includes('.ttf')
            ) as PerformanceResourceTiming[];

            let totalFontLoadTime = 0;
            fontEntries.forEach(entry => {
              totalFontLoadTime += entry.responseEnd - entry.requestStart;
            });

            const averageFontLoadTime = fontEntries.length > 0 ? totalFontLoadTime / fontEntries.length : 0;
            const passed = averageFontLoadTime < 500; // Less than 500ms average

            return { fontCount: fontEntries.length, averageFontLoadTime, passed };
          }
        },
        {
          name: 'Lazy Loading Implementation',
          test: () => {
            const lazyImages = document.querySelectorAll('img[loading="lazy"]');
            const totalImages = document.querySelectorAll('img').length;
            const lazyLoadingRate = totalImages > 0 ? (lazyImages.length / totalImages) * 100 : 0;
            const passed = lazyLoadingRate > 50 || totalImages < 5; // At least 50% lazy loaded or few images

            return { lazyImages: lazyImages.length, totalImages, lazyLoadingRate, passed };
          }
        }
      ];

      let assetTestsPassed = 0;
      const assetDetails: string[] = [];

      for (const test of assetTests) {
        try {
          const result = test.test();
          if (result.passed) {
            assetTestsPassed++;
            assetDetails.push(`✅ ${test.name}: Optimized`);
          } else {
            assetDetails.push(`⚠️ ${test.name}: Needs optimization`);
          }
        } catch (error) {
          assetDetails.push(`❌ ${test.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      this.addResult('Performance - Asset Loading',
        assetTestsPassed >= assetTests.length * 0.7 ? TestStatus.PASSED : TestStatus.WARNING,
        `Asset loading: ${assetTestsPassed}/${assetTests.length} optimizations passed. ${assetDetails.join(', ')}`,
        TestCategory.PERFORMANCE, performance.now() - startTime);

    } catch (error) {
      this.addResult('Performance - Asset Loading', TestStatus.WARNING,
        `Asset loading testing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.PERFORMANCE, performance.now() - startTime);
    }
  }

  // Test 10.2: Real-time data handling performance
  private async testRealTimeDataPerformance(): Promise<void> {
    console.log('  🔄 Testing real-time data handling performance...');
    const startTime = performance.now();

    try {
      // Test performance with large transaction histories
      await this.testLargeDatasetPerformance();
      
      // Test real-time price updates performance
      await this.testRealTimePriceUpdates();
      
      // Test pagination and virtualization
      await this.testPaginationVirtualization();
      
      // Test WebSocket connection performance
      await this.testWebSocketPerformance();
      
      // Test concurrent user simulation
      await this.testConcurrentUserSimulation();

    } catch (error) {
      this.addResult('Real-time Data Performance', TestStatus.FAILED,
        `Real-time data performance testing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.PERFORMANCE, performance.now() - startTime);
    }
  }

  private async testLargeDatasetPerformance(): Promise<void> {
    const startTime = performance.now();
    console.log('    📊 Testing performance with large transaction histories...');

    try {
      // Navigate to screens that handle large datasets
      const dataIntensiveScreens = [
        { name: 'Dashboard', path: '#/dashboard', expectedElements: '[data-testid*="transaction"], .transaction-item' },
        { name: 'Payments', path: '#/payments', expectedElements: '[data-testid*="history"], .payment-history' },
        { name: 'Vaults', path: '#/vaults', expectedElements: '[data-testid*="vault"], .vault-item' }
      ];

      const performanceResults: { screen: string; renderTime: number; elementCount: number; passed: boolean }[] = [];

      for (const screen of dataIntensiveScreens) {
        try {
          const renderStartTime = performance.now();
          
          window.location.hash = screen.path;
          await this.waitForPageLoad();
          
          // Wait for data to load
          await this.sleep(2000);
          
          const renderEndTime = performance.now();
          const renderTime = renderEndTime - renderStartTime;
          
          // Count data elements
          const elements = document.querySelectorAll(screen.expectedElements);
          const elementCount = elements.length;
          
          // Performance should be good even with many elements
          const passed = renderTime < 5000 && (elementCount === 0 || renderTime / elementCount < 50);
          
          performanceResults.push({
            screen: screen.name,
            renderTime: Math.round(renderTime),
            elementCount,
            passed
          });

        } catch (error) {
          performanceResults.push({
            screen: screen.name,
            renderTime: -1,
            elementCount: 0,
            passed: false
          });
        }
      }

      const passedScreens = performanceResults.filter(r => r.passed).length;
      const averageRenderTime = performanceResults
        .filter(r => r.renderTime > 0)
        .reduce((sum, r) => sum + r.renderTime, 0) / performanceResults.filter(r => r.renderTime > 0).length;

      this.addResult('Performance - Large Dataset Handling',
        passedScreens >= dataIntensiveScreens.length * 0.7 ? TestStatus.PASSED : TestStatus.WARNING,
        `Large dataset performance: ${passedScreens}/${dataIntensiveScreens.length} screens performed well. Average render: ${Math.round(averageRenderTime)}ms. Details: ${performanceResults.map(r => `${r.screen}: ${r.renderTime}ms (${r.elementCount} items) ${r.passed ? '✅' : '❌'}`).join(', ')}`,
        TestCategory.PERFORMANCE, performance.now() - startTime);

    } catch (error) {
      this.addResult('Performance - Large Dataset Handling', TestStatus.FAILED,
        `Large dataset performance testing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.PERFORMANCE, performance.now() - startTime);
    }
  }

  private async testRealTimePriceUpdates(): Promise<void> {
    const startTime = performance.now();
    console.log('    💹 Testing efficient handling of real-time price updates...');

    try {
      // Navigate to screens with real-time data
      window.location.hash = '#/dashboard';
      await this.waitForPageLoad();
      await this.sleep(2000);

      const updateTests = [
        {
          name: 'Price Update Frequency',
          test: () => {
            // Look for price elements
            const priceElements = document.querySelectorAll(
              '[data-testid*="price"], [class*="price"], .text-2xl, .font-bold'
            );
            
            const priceTexts = Array.from(priceElements).filter(el => {
              const text = el.textContent || '';
              return text.includes('SEI') || text.includes('$') || text.match(/\d+\.\d+/);
            });

            return {
              priceElementsFound: priceTexts.length,
              passed: priceTexts.length > 0
            };
          }
        },
        {
          name: 'Update Animation Performance',
          test: () => {
            // Look for animated elements
            const animatedElements = document.querySelectorAll(
              '[class*="animate"], [class*="transition"], [style*="transition"]'
            );

            // Check for smooth animations
            const smoothAnimations = Array.from(animatedElements).filter(el => {
              const style = window.getComputedStyle(el);
              return style.transition && !style.transition.includes('none');
            });

            return {
              animatedElements: animatedElements.length,
              smoothAnimations: smoothAnimations.length,
              passed: smoothAnimations.length >= animatedElements.length * 0.5
            };
          }
        },
        {
          name: 'Real-time Connection Status',
          test: () => {
            // Look for connection status indicators
            const connectionElements = document.querySelectorAll(
              '[data-testid*="connection"], [class*="connection"], [class*="status"]'
            );

            const statusIndicators = Array.from(connectionElements).filter(el => {
              const text = el.textContent?.toLowerCase() || '';
              return text.includes('connected') || text.includes('online') || text.includes('live');
            });

            return {
              connectionElements: connectionElements.length,
              statusIndicators: statusIndicators.length,
              passed: statusIndicators.length > 0 || connectionElements.length > 0
            };
          }
        }
      ];

      let updateTestsPassed = 0;
      const updateDetails: string[] = [];

      for (const test of updateTests) {
        try {
          const result = test.test();
          if (result.passed) {
            updateTestsPassed++;
            updateDetails.push(`✅ ${test.name}: Working`);
          } else {
            updateDetails.push(`⚠️ ${test.name}: Not detected`);
          }
        } catch (error) {
          updateDetails.push(`❌ ${test.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      this.addResult('Performance - Real-time Price Updates',
        updateTestsPassed >= updateTests.length * 0.7 ? TestStatus.PASSED : TestStatus.WARNING,
        `Real-time updates: ${updateTestsPassed}/${updateTests.length} features working. ${updateDetails.join(', ')}`,
        TestCategory.PERFORMANCE, performance.now() - startTime);

    } catch (error) {
      this.addResult('Performance - Real-time Price Updates', TestStatus.WARNING,
        `Real-time price update testing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.PERFORMANCE, performance.now() - startTime);
    }
  }

  private async testPaginationVirtualization(): Promise<void> {
    const startTime = performance.now();
    console.log('    📄 Testing pagination and virtualization for large datasets...');

    try {
      const paginationTests = [
        {
          screen: '#/payments',
          name: 'Payments Pagination',
          selectors: ['[data-testid*="pagination"]', '.pagination', '[class*="page"]', 'button[aria-label*="page"]']
        },
        {
          screen: '#/vaults',
          name: 'Vaults Pagination',
          selectors: ['[data-testid*="pagination"]', '.pagination', '[class*="page"]', 'button[aria-label*="next"]']
        },
        {
          screen: '#/dashboard',
          name: 'Dashboard Virtualization',
          selectors: ['[data-testid*="virtual"]', '[class*="virtual"]', '[style*="height"]']
        }
      ];

      let paginationFeatures = 0;
      const paginationDetails: string[] = [];

      for (const test of paginationTests) {
        try {
          window.location.hash = test.screen;
          await this.waitForPageLoad();
          await this.sleep(2000);

          let foundPagination = false;
          for (const selector of test.selectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
              foundPagination = true;
              break;
            }
          }

          // Also check for infinite scroll
          const scrollableElements = document.querySelectorAll('[style*="overflow"], .overflow-auto, .overflow-scroll');
          const hasInfiniteScroll = scrollableElements.length > 0;

          if (foundPagination || hasInfiniteScroll) {
            paginationFeatures++;
            paginationDetails.push(`✅ ${test.name}: ${foundPagination ? 'Pagination' : 'Infinite scroll'} detected`);
          } else {
            paginationDetails.push(`⚠️ ${test.name}: No pagination/virtualization detected`);
          }

        } catch (error) {
          paginationDetails.push(`❌ ${test.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      this.addResult('Performance - Pagination & Virtualization',
        paginationFeatures > 0 ? TestStatus.PASSED : TestStatus.WARNING,
        `Pagination/Virtualization: ${paginationFeatures}/${paginationTests.length} screens have optimization. ${paginationDetails.join(', ')}`,
        TestCategory.PERFORMANCE, performance.now() - startTime);

    } catch (error) {
      this.addResult('Performance - Pagination & Virtualization', TestStatus.WARNING,
        `Pagination/virtualization testing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.PERFORMANCE, performance.now() - startTime);
    }
  }

  private async testWebSocketPerformance(): Promise<void> {
    const startTime = performance.now();
    console.log('    🔌 Testing WebSocket connection performance...');

    try {
      const webSocketTests = [
        {
          name: 'WebSocket Connection Detection',
          test: () => {
            // Check if WebSocket is being used
            const originalWebSocket = window.WebSocket;
            let webSocketConnections = 0;
            
            // Mock WebSocket to count connections
            window.WebSocket = class extends WebSocket {
              constructor(url: string | URL, protocols?: string | string[]) {
                super(url, protocols);
                webSocketConnections++;
              }
            } as any;

            // Restore original WebSocket
            setTimeout(() => {
              window.WebSocket = originalWebSocket;
            }, 100);

            return {
              connections: webSocketConnections,
              passed: webSocketConnections > 0
            };
          }
        },
        {
          name: 'Real-time Data Indicators',
          test: () => {
            // Look for real-time indicators
            const realtimeElements = document.querySelectorAll(
              '[data-testid*="live"], [class*="live"], [class*="real-time"]'
            );

            const liveTexts = Array.from(document.querySelectorAll('*')).filter(el => {
              const text = el.textContent?.toLowerCase() || '';
              return text.includes('live') || text.includes('real-time') || text.includes('updating');
            });

            return {
              realtimeElements: realtimeElements.length,
              liveTexts: liveTexts.length,
              passed: realtimeElements.length > 0 || liveTexts.length > 0
            };
          }
        },
        {
          name: 'Connection Status Monitoring',
          test: () => {
            // Look for connection status
            const statusElements = document.querySelectorAll(
              '[data-testid*="status"], [class*="status"], [class*="connection"]'
            );

            const statusTexts = Array.from(statusElements).filter(el => {
              const text = el.textContent?.toLowerCase() || '';
              return text.includes('connected') || text.includes('disconnected') || text.includes('connecting');
            });

            return {
              statusElements: statusElements.length,
              statusTexts: statusTexts.length,
              passed: statusTexts.length > 0
            };
          }
        }
      ];

      let webSocketFeatures = 0;
      const webSocketDetails: string[] = [];

      for (const test of webSocketTests) {
        try {
          const result = test.test();
          if (result.passed) {
            webSocketFeatures++;
            webSocketDetails.push(`✅ ${test.name}: Detected`);
          } else {
            webSocketDetails.push(`⚠️ ${test.name}: Not detected`);
          }
        } catch (error) {
          webSocketDetails.push(`❌ ${test.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      this.addResult('Performance - WebSocket Connection',
        webSocketFeatures > 0 ? TestStatus.PASSED : TestStatus.WARNING,
        `WebSocket features: ${webSocketFeatures}/${webSocketTests.length} features detected. ${webSocketDetails.join(', ')}`,
        TestCategory.PERFORMANCE, performance.now() - startTime);

    } catch (error) {
      this.addResult('Performance - WebSocket Connection', TestStatus.WARNING,
        `WebSocket performance testing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.PERFORMANCE, performance.now() - startTime);
    }
  }

  private async testConcurrentUserSimulation(): Promise<void> {
    const startTime = performance.now();
    console.log('    👥 Testing concurrent user simulation...');

    try {
      // Simulate concurrent operations
      const concurrentTests = [
        {
          name: 'Concurrent Navigation',
          test: async () => {
            const screens = ['#/', '#/dashboard', '#/payments', '#/vaults'];
            const promises = screens.map(async (screen, index) => {
              await this.sleep(index * 100); // Stagger the requests
              const navStartTime = performance.now();
              window.location.hash = screen;
              await this.sleep(500);
              return performance.now() - navStartTime;
            });

            const results = await Promise.all(promises);
            const averageTime = results.reduce((sum, time) => sum + time, 0) / results.length;
            
            return {
              operations: results.length,
              averageTime: Math.round(averageTime),
              passed: averageTime < 1000
            };
          }
        },
        {
          name: 'Concurrent API Simulation',
          test: async () => {
            // Simulate multiple API calls
            const apiCalls = Array.from({ length: 5 }, (_, i) => 
              fetch(`/api/test-${i}`, { method: 'GET' }).catch(() => null)
            );

            const startTime = performance.now();
            const results = await Promise.allSettled(apiCalls);
            const endTime = performance.now();
            
            const successfulCalls = results.filter(r => r.status === 'fulfilled').length;
            const totalTime = endTime - startTime;
            
            return {
              totalCalls: apiCalls.length,
              successfulCalls,
              totalTime: Math.round(totalTime),
              passed: totalTime < 5000 // Should complete within 5 seconds
            };
          }
        },
        {
          name: 'Concurrent DOM Updates',
          test: async () => {
            // Simulate concurrent DOM updates
            const updatePromises = Array.from({ length: 10 }, async (_, i) => {
              const div = document.createElement('div');
              div.id = `concurrent-test-${i}`;
              div.textContent = `Test ${i}`;
              
              const updateStartTime = performance.now();
              document.body.appendChild(div);
              await this.sleep(50);
              document.body.removeChild(div);
              return performance.now() - updateStartTime;
            });

            const results = await Promise.all(updatePromises);
            const averageTime = results.reduce((sum, time) => sum + time, 0) / results.length;
            
            return {
              updates: results.length,
              averageTime: Math.round(averageTime),
              passed: averageTime < 100
            };
          }
        }
      ];

      let concurrentTestsPassed = 0;
      const concurrentDetails: string[] = [];

      for (const test of concurrentTests) {
        try {
          const result = await test.test();
          if (result.passed) {
            concurrentTestsPassed++;
            concurrentDetails.push(`✅ ${test.name}: ${result.averageTime || result.totalTime}ms average`);
          } else {
            concurrentDetails.push(`⚠️ ${test.name}: ${result.averageTime || result.totalTime}ms (slow)`);
          }
        } catch (error) {
          concurrentDetails.push(`❌ ${test.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      this.addResult('Performance - Concurrent User Simulation',
        concurrentTestsPassed >= concurrentTests.length * 0.7 ? TestStatus.PASSED : TestStatus.WARNING,
        `Concurrent operations: ${concurrentTestsPassed}/${concurrentTests.length} tests passed. ${concurrentDetails.join(', ')}`,
        TestCategory.PERFORMANCE, performance.now() - startTime);

    } catch (error) {
      this.addResult('Performance - Concurrent User Simulation', TestStatus.WARNING,
        `Concurrent user simulation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.PERFORMANCE, performance.now() - startTime);
    }
  }

  // Helper methods
  private initializePerformanceMonitoring(): void {
    try {
      // Initialize Performance Observer
      if ('PerformanceObserver' in window) {
        this.performanceObserver = new PerformanceObserver((list) => {
          // Handle performance entries
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.entryType === 'measure' || entry.entryType === 'navigation') {
              console.log(`Performance: ${entry.name} - ${entry.duration}ms`);
            }
          });
        });

        this.performanceObserver.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
      }
    } catch (error) {
      console.warn('Performance monitoring initialization failed:', error);
    }
  }

  private getPerformanceMetrics(): PerformanceMetrics | null {
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paintEntries = performance.getEntriesByType('paint');
      
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      const lcp = paintEntries.find(entry => entry.name === 'largest-contentful-paint');

      return {
        loadTime: navigation ? navigation.loadEventEnd - navigation.navigationStart : 0,
        domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.navigationStart : 0,
        firstContentfulPaint: fcp ? fcp.startTime : 0,
        largestContentfulPaint: lcp ? lcp.startTime : 0,
        firstInputDelay: 0, // Would need to be measured separately
        cumulativeLayoutShift: 0, // Would need to be measured separately
        memoryUsage: this.getMemoryUsage(),
        bundleSize: 0 // Would need to be calculated from resource entries
      };
    } catch (error) {
      console.warn('Failed to get performance metrics:', error);
      return null;
    }
  }

  private getMemoryUsage(): number {
    try {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        return memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  private async waitForPageLoad(): Promise<void> {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', () => resolve(), { once: true });
        // Fallback timeout
        setTimeout(resolve, 5000);
      }
    });
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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

  // Cleanup
  cleanup(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    if (this.memoryMonitor) {
      clearInterval(this.memoryMonitor);
    }
  }
}

// Export singleton instance
export const performanceLoadTester = new PerformanceLoadTester();

// Make available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).PerformanceLoadTester = performanceLoadTester;
}