// Auto Test ID Generator
// Automatically adds test IDs to elements for easier testing

export function setupAutoTestIds(): void {
  console.log('🏷️ Setting up auto test IDs...');
  
  // Add test IDs to common elements
  const selectors = [
    { selector: 'button', prefix: 'btn' },
    { selector: 'input', prefix: 'input' },
    { selector: 'form', prefix: 'form' },
    { selector: 'nav', prefix: 'nav' },
    { selector: '[role="button"]', prefix: 'btn' },
    { selector: '.card', prefix: 'card' },
    { selector: '.modal', prefix: 'modal' }
  ];

  let idCounter = 0;
  
  selectors.forEach(({ selector, prefix }) => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element, index) => {
      if (!element.getAttribute('data-testid')) {
        const testId = `${prefix}-${index + 1}`;
        element.setAttribute('data-testid', testId);
        idCounter++;
      }
    });
  });

  console.log(`✅ Added ${idCounter} test IDs to elements`);
}

// Observer to add test IDs to dynamically created elements
export function startTestIdObserver(): void {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          if (element.tagName === 'BUTTON' && !element.getAttribute('data-testid')) {
            const buttons = document.querySelectorAll('button').length;
            element.setAttribute('data-testid', `btn-dynamic-${buttons}`);
          }
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log('👀 Test ID observer started');
}