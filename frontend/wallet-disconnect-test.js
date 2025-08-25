// Wallet Disconnect Test - Run in browser console

console.log('🔧 Testing Wallet Disconnect Feature...');

function testWalletDisconnect() {
  console.log('\n1. Checking wallet connection status...');
  
  // Check if wallet is connected
  const walletAvatar = document.querySelector('[style*="gradientGreen"]');
  const isConnected = !!walletAvatar;
  
  console.log(`✅ Wallet Connected: ${isConnected}`);
  
  if (!isConnected) {
    console.log('⚠️  Please connect wallet first to test disconnect');
    return;
  }
  
  console.log('\n2. Testing wallet dropdown...');
  
  // Click on wallet avatar to open dropdown
  if (walletAvatar) {
    walletAvatar.click();
    console.log('✅ Clicked wallet avatar');
    
    setTimeout(() => {
      // Check if dropdown appeared
      const dropdown = document.querySelector('[style*="backdrop-filter: blur(20px)"]');
      console.log(`✅ Dropdown opened: ${!!dropdown}`);
      
      if (dropdown) {
        // Look for disconnect button
        const disconnectBtn = Array.from(document.querySelectorAll('button')).find(btn => 
          btn.textContent && btn.textContent.includes('Disconnect Wallet')
        );
        
        console.log(`✅ Disconnect button found: ${!!disconnectBtn}`);
        
        if (disconnectBtn) {
          console.log('\n3. Testing disconnect functionality...');
          disconnectBtn.click();
          console.log('✅ Clicked disconnect button');
          
          setTimeout(() => {
            // Check if wallet is disconnected
            const stillConnected = !!document.querySelector('[style*="gradientGreen"]');
            console.log(`✅ Wallet disconnected: ${!stillConnected}`);
            
            if (!stillConnected) {
              console.log('🎉 Disconnect feature working perfectly!');
            } else {
              console.log('⚠️  Disconnect may not have worked');
            }
          }, 1000);
        }
      }
    }, 500);
  }
}

// Test other dropdown features
function testDropdownFeatures() {
  console.log('\n🔧 Testing other dropdown features...');
  
  const walletAvatar = document.querySelector('[style*="gradientGreen"]');
  if (walletAvatar) {
    walletAvatar.click();
    
    setTimeout(() => {
      // Test copy address
      const copyBtn = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent && btn.textContent.includes('Copy Address')
      );
      
      console.log(`✅ Copy Address button: ${copyBtn ? 'Found' : 'Missing'}`);
      
      // Test account settings
      const settingsBtn = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent && btn.textContent.includes('Account Settings')
      );
      
      console.log(`✅ Account Settings button: ${settingsBtn ? 'Found' : 'Missing'}`);
      
      // Test balance display
      const balanceDisplay = Array.from(document.querySelectorAll('*')).find(el => 
        el.textContent && el.textContent.includes('Balance')
      );
      
      console.log(`✅ Balance display: ${balanceDisplay ? 'Found' : 'Missing'}`);
      
    }, 500);
  }
}

// Auto-run tests
testWalletDisconnect();
setTimeout(() => testDropdownFeatures(), 3000);