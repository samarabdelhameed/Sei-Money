// Add Test IDs to Elements Dynamically

export function addTestIds() {
  console.log('🏷️ Adding test IDs to elements...');
  
  // Add test IDs to common elements
  const elementsToTag = [
    // Home screen elements
    { selector: 'h1', testId: 'page-title' },
    { selector: 'nav', testId: 'navbar' },
    
    // Market statistics (look for text patterns)
    { selector: '*', textPattern: /^\$[\d,]+\.?\d*[KMB]?$/, testId: 'tvl-value' },
    { selector: '*', textPattern: /^[\d,]+$/, testId: 'active-users' },
    { selector: '*', textPattern: /^\d+\.\d+%$/, testId: 'success-rate' },
    
    // Buttons
    { selector: 'button', textPattern: /get started/i, testId: 'get-started-btn' },
    { selector: 'button', textPattern: /learn more/i, testId: 'learn-more-btn' },
    { selector: 'button', textPattern: /connect.*keplr/i, testId: 'connect-keplr' },
    { selector: 'button', textPattern: /connect.*leap/i, testId: 'connect-leap' },
    { selector: 'button', textPattern: /connect.*metamask/i, testId: 'connect-metamask' },
    { selector: 'button', textPattern: /new transfer/i, testId: 'new-transfer-btn' },
    { selector: 'button', textPattern: /create transfer/i, testId: 'create-transfer-btn' },
    { selector: 'button', textPattern: /refresh/i, testId: 'refresh-data' },
    
    // Form inputs
    { selector: 'input[placeholder*="sei1"]', testId: 'recipient-input' },
    { selector: 'input[type="number"]', testId: 'amount-input' },
    { selector: 'input[type="datetime-local"]', testId: 'expiry-input' },
    { selector: 'textarea', testId: 'remark-input' },
    
    // Headers
    { selector: 'h1', textPattern: /dashboard/i, testId: 'dashboard-header' },
    { selector: 'h1', textPattern: /payments/i, testId: 'payments-header' },
    { selector: 'h1', textPattern: /ai agent/i, testId: 'ai-agent-header' },
    
    // Charts and data displays
    { selector: '[class*="chart"]', testId: 'tvl-chart' },
    { selector: '[class*="recharts"]', testId: 'tvl-chart' },
    
    // Loading indicators
    { selector: '[class*="animate-spin"]', testId: 'loading-indicator' },
    { selector: '[class*="loading"]', testId: 'loading-indicator' },
    
    // Error messages
    { selector: '[class*="error"]', testId: 'error-message' },
    { selector: '[class*="text-red"]', testId: 'error-message' },
    
    // Success messages
    { selector: '[class*="success"]', testId: 'success-message' },
    { selector: '[class*="text-green"]', testId: 'success-message' },
  ];
  
  let addedCount = 0;
  
  elementsToTag.forEach(({ selector, textPattern, testId }) => {
    try {
      const elements = document.querySelectorAll(selector);
      
      elements.forEach(element => {
        // Skip if already has test ID
        if (element.getAttribute('data-testid')) return;
        
        // Check text pattern if specified
        if (textPattern) {
          const text = element.textContent?.trim() || '';
          if (!textPattern.test(text)) return;
        }
        
        // Add test ID only if it doesn't exist
        if (!element.getAttribute('data-testid')) {
          element.setAttribute('data-testid', testId);
          addedCount++;
        }
      });
    } catch (error) {
      console.warn(`Failed to add test ID for selector ${selector}:`, error);
    }
  });
  
  console.log(`✅ Added ${addedCount} test IDs to elements`);
  
  // Add specific test IDs based on content
  addContentBasedTestIds();
  
  return addedCount;
}

function addContentBasedTestIds() {
  // Find portfolio value elements
  const portfolioElements = document.querySelectorAll('*');
  portfolioElements.forEach(element => {
    const text = element.textContent?.trim() || '';
    
    // Portfolio value (contains SEI and numbers)
    if (text.match(/[\d,]+\.?\d*\s*SEI/) && text.includes('Portfolio')) {
      element.setAttribute('data-testid', 'portfolio-value');
    }
    
    // Wallet balance
    if (text.match(/[\d,]+\.?\d*\s*SEI/) && (text.includes('Balance') || text.includes('Wallet'))) {
      element.setAttribute('data-testid', 'wallet-balance');
    }
    
    // Daily P&L
    if (text.match(/[+-][\d,]+\.?\d*\s*SEI/) && (text.includes('P&L') || text.includes('Daily'))) {
      element.setAttribute('data-testid', 'daily-pnl');
    }
    
    // Transfer statistics
    if (text.includes('Total Sent') || (text.match(/[\d,]+\.?\d*\s*SEI/) && element.closest('*')?.textContent?.includes('Sent'))) {
      element.setAttribute('data-testid', 'total-sent');
    }
    
    if (text.includes('Total Received') || (text.match(/[\d,]+\.?\d*\s*SEI/) && element.closest('*')?.textContent?.includes('Received'))) {
      element.setAttribute('data-testid', 'total-received');
    }
    
    if (text.includes('Pending') && text.match(/^\d+$/)) {
      element.setAttribute('data-testid', 'pending-count');
    }
  });
  
  // Add test IDs to feature cards
  const featureCards = document.querySelectorAll('[class*="card"], [class*="glass"]');
  featureCards.forEach((card, index) => {
    if (!card.getAttribute('data-testid')) {
      const text = card.textContent?.toLowerCase() || '';
      if (text.includes('payment') || text.includes('transfer')) {
        card.setAttribute('data-testid', 'feature-card-payments');
      } else if (text.includes('vault') || text.includes('investment')) {
        card.setAttribute('data-testid', 'feature-card-vaults');
      } else if (text.includes('group') || text.includes('pool')) {
        card.setAttribute('data-testid', 'feature-card-groups');
      } else if (text.includes('ai') || text.includes('agent')) {
        card.setAttribute('data-testid', 'feature-card-ai');
      } else {
        card.setAttribute('data-testid', `feature-card-${index}`);
      }
    }
  });
  
  // Add test ID to transfer list
  const transferLists = document.querySelectorAll('[class*="space-y"], [class*="grid"]');
  transferLists.forEach(list => {
    const hasTransfers = Array.from(list.children).some(child => 
      child.textContent?.includes('SEI') && 
      (child.textContent?.includes('To:') || child.textContent?.includes('From:'))
    );
    
    if (hasTransfers && !list.getAttribute('data-testid')) {
      list.setAttribute('data-testid', 'transfer-list');
    }
  });
}

// Auto-add test IDs when DOM changes
export function setupAutoTestIds() {
  // Add test IDs immediately
  addTestIds();
  
  // Set up mutation observer to add test IDs to new elements
  let debounceTimer: NodeJS.Timeout | null = null;
  
  const observer = new MutationObserver((mutations) => {
    let shouldUpdate = false;
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Only update if new elements don't already have test IDs
        const hasNewElements = Array.from(mutation.addedNodes).some(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            return !element.getAttribute('data-testid') && 
                   !element.querySelector('[data-testid]');
          }
          return false;
        });
        
        if (hasNewElements) {
          shouldUpdate = true;
        }
      }
    });
    
    if (shouldUpdate) {
      // Clear existing timer and set new one
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      
      debounceTimer = setTimeout(() => {
        addTestIds();
        debounceTimer = null;
      }, 1000); // Increased debounce time
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('🔄 Auto test ID setup complete - will add IDs to new elements');
  
  return observer;
}

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).addTestIds = addTestIds;
  (window as any).setupAutoTestIds = setupAutoTestIds;
}