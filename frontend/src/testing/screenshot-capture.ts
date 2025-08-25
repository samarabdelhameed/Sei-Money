// Screenshot Capture Utility for SeiMoney Frontend Testing

import { ScreenshotCapture, Annotation } from './types';

export class ScreenshotCaptureImpl implements ScreenshotCapture {
  private static instance: ScreenshotCaptureImpl;
  private screenshotCounter = 0;
  private baselineScreenshots: Map<string, string> = new Map();

  static getInstance(): ScreenshotCaptureImpl {
    if (!ScreenshotCaptureImpl.instance) {
      ScreenshotCaptureImpl.instance = new ScreenshotCaptureImpl();
    }
    return ScreenshotCaptureImpl.instance;
  }

  async capture(elementSelector?: string): Promise<string> {
    try {
      // Dynamic import to avoid bundling issues
      const html2canvas = await this.loadHtml2Canvas();
      
      let targetElement: HTMLElement;
      
      if (elementSelector) {
        const element = document.querySelector(elementSelector) as HTMLElement;
        if (!element) {
          throw new Error(`Element not found: ${elementSelector}`);
        }
        targetElement = element;
      } else {
        targetElement = document.body;
      }

      // Check element dimensions to avoid canvas errors
      const rect = targetElement.getBoundingClientRect();
      const width = Math.max(targetElement.scrollWidth, rect.width, 1);
      const height = Math.max(targetElement.scrollHeight, rect.height, 1);

      if (width === 0 || height === 0) {
        console.warn(`Element has zero dimensions (${width}x${height}), using fallback`);
        return this.createFallbackScreenshot(`Element: ${elementSelector || 'body'} (${width}x${height})`);
      }

      const canvas = await html2canvas(targetElement, {
        useCORS: true,
        allowTaint: true,
        scale: 1,
        logging: false,
        width: width,
        height: height,
        backgroundColor: null,
        removeContainer: true,
        ignoreElements: (element) => {
          // Skip elements that might cause issues
          const rect = element.getBoundingClientRect();
          return rect.width === 0 || rect.height === 0;
        }
      });

      const screenshotId = `screenshot_${++this.screenshotCounter}_${Date.now()}`;
      const dataUrl = canvas.toDataURL('image/png');
      
      // Store screenshot in session storage for later retrieval
      try {
        sessionStorage.setItem(`seiMoney_screenshot_${screenshotId}`, dataUrl);
      } catch (error) {
        console.warn('Failed to store screenshot in session storage:', error);
      }

      return dataUrl;
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      return this.createFallbackScreenshot(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async compare(baseline: string, current: string): Promise<number> {
    try {
      // For now, return a simple comparison
      // In a full implementation, this would use pixelmatch
      if (baseline === current) return 0;
      
      // Simple length-based comparison as fallback
      const baselineLength = baseline.length;
      const currentLength = current.length;
      const diff = Math.abs(baselineLength - currentLength);
      
      return diff / Math.max(baselineLength, currentLength);
    } catch (error) {
      console.error('Failed to compare screenshots:', error);
      return 1; // Maximum difference on error
    }
  }

  async annotate(screenshot: string, annotations: Annotation[]): Promise<string> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      // Load the screenshot image
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = screenshot;
      });

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw the original screenshot
      ctx.drawImage(img, 0, 0);

      // Add annotations
      annotations.forEach(annotation => {
        // Draw rectangle
        ctx.strokeStyle = annotation.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height);

        // Draw text
        ctx.fillStyle = annotation.color;
        ctx.font = '14px Arial';
        ctx.fillText(annotation.text, annotation.x, annotation.y - 5);
      });

      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Failed to annotate screenshot:', error);
      return screenshot; // Return original on error
    }
  }

  // Utility methods

  async captureFullPage(): Promise<string> {
    return this.capture();
  }

  async captureElement(selector: string): Promise<string> {
    return this.capture(selector);
  }

  async captureScreen(screenName: string): Promise<string> {
    const screenshot = await this.capture();
    this.storeBaseline(screenName, screenshot);
    return screenshot;
  }

  async compareWithBaseline(screenName: string, currentScreenshot?: string): Promise<number> {
    const baseline = this.baselineScreenshots.get(screenName);
    if (!baseline) {
      console.warn(`No baseline found for screen: ${screenName}`);
      return 0;
    }

    const current = currentScreenshot || await this.capture();
    return this.compare(baseline, current);
  }

  storeBaseline(screenName: string, screenshot: string): void {
    this.baselineScreenshots.set(screenName, screenshot);
    try {
      sessionStorage.setItem(`seiMoney_baseline_${screenName}`, screenshot);
    } catch (error) {
      console.warn('Failed to store baseline screenshot:', error);
    }
  }

  loadBaseline(screenName: string): string | null {
    try {
      const stored = sessionStorage.getItem(`seiMoney_baseline_${screenName}`);
      if (stored) {
        this.baselineScreenshots.set(screenName, stored);
        return stored;
      }
    } catch (error) {
      console.warn('Failed to load baseline screenshot:', error);
    }
    return null;
  }

  clearBaselines(): void {
    this.baselineScreenshots.clear();
    try {
      const keys = Object.keys(sessionStorage).filter(key => key.startsWith('seiMoney_baseline_'));
      keys.forEach(key => sessionStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear baseline screenshots:', error);
    }
  }

  getStoredScreenshots(): string[] {
    try {
      const keys = Object.keys(sessionStorage).filter(key => key.startsWith('seiMoney_screenshot_'));
      return keys.map(key => sessionStorage.getItem(key)!).filter(Boolean);
    } catch (error) {
      console.warn('Failed to get stored screenshots:', error);
      return [];
    }
  }

  clearStoredScreenshots(): void {
    try {
      const keys = Object.keys(sessionStorage).filter(key => key.startsWith('seiMoney_screenshot_'));
      keys.forEach(key => sessionStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear stored screenshots:', error);
    }
  }

  private async loadHtml2Canvas(): Promise<any> {
    try {
      // Try to load html2canvas dynamically
      if (typeof window !== 'undefined' && (window as any).html2canvas) {
        return (window as any).html2canvas;
      }

      // Fallback: try to import if available
      const html2canvas = await import('html2canvas');
      return html2canvas.default || html2canvas;
    } catch (error) {
      console.warn('html2canvas not available, using fallback screenshot method');
      throw new Error('html2canvas not available');
    }
  }

  private createFallbackScreenshot(reason?: string): string {
    // Create a simple canvas with screen info as fallback
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 400;
    canvas.height = 300;
    
    if (ctx) {
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#333';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Screenshot Capture Failed', canvas.width / 2, canvas.height / 2 - 40);
      
      if (reason) {
        ctx.font = '12px Arial';
        ctx.fillText(reason, canvas.width / 2, canvas.height / 2 - 10);
      }
      
      ctx.font = '12px Arial';
      ctx.fillText(`Screen: ${window.innerWidth}x${window.innerHeight}`, canvas.width / 2, canvas.height / 2 + 20);
      ctx.fillText(new Date().toLocaleTimeString(), canvas.width / 2, canvas.height / 2 + 40);
    }
    
    return canvas.toDataURL('image/png');
  }
}

// Export singleton instance
export const screenshotCapture = ScreenshotCaptureImpl.getInstance();