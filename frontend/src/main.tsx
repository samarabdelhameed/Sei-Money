import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Import testing infrastructure for development
if (import.meta.env.DEV) {
  import('./testing').then(({ comprehensiveTester }) => {
    // Make tester available globally for console access
    (window as any).seiMoneyTester = comprehensiveTester;
    console.log('🧪 SeiMoney Testing Suite loaded! Use window.seiMoneyTester in console.');
  });
  
  // Auto-add test IDs to elements
  import('./testing/add-test-ids').then(({ setupAutoTestIds }) => {
    // Wait for initial render
    setTimeout(() => {
      setupAutoTestIds();
    }, 1000);
  });

  // Load network tester
  import('./testing/network-tester').then(() => {
    console.log('🌐 Network diagnostics available! Use NetworkTester.runNetworkDiagnostics()');
  });

  // Load connection diagnostics
  import('./testing/connection-diagnostics').then(() => {
    console.log('🔍 Connection diagnostics loaded! Use ConnectionDiagnostics.quickHealthCheck()');
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
