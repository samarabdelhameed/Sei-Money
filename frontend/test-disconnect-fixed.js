// Test Disconnect Fix - Run in browser console

console.log('🔧 Testing Fixed Disconnect Feature...');

function testDisconnectFixed() {
  console.log('\n1. Checking current wallet status...');
  
  // Check if wallet is connected
  const walletAvatar = document.querySelector('[style*="gradientGreen"]');
  const connectButton = Array.from(document.querySelectorAll('button')).find(btn => 
    btn.textContent && btn.textContent.includes('Connect Wallet')
  );
  
  const isConnected = !!walletAvatar && !connectButton;
  console.log(`✅ Wallet Connected: ${isConnected}`);
  
  if (!isConnected) {
    console.log('⚠️  Please connect wallet first');
    return;
  }
  
  console.log('\n2. Opening wallet dropdown...');
  
  // Click wallet avatar
  if (walletAvatar) {
    walletAvatar.click();
    console.log('✅ Clicked wallet avatar');
    
    setTimeout(() => {
      // Check dropdown
      const dropdown = document.querySelector('[style*="backdrop-filter: blur(20px)"]');
      console.log(`✅ Dropdown opened: ${!!dropdown}`);
      
      if (dropdown) {
        // Find disconnect button
        const disconnectBtn = Array.from(dropdown.querySelectorAll('button')).find(btn => 
          btn.textContent && btn.textContent.includes('Disconnect Wallet')
        );
        
        console.log(`✅ Disconnect button found: ${!!disconnectBtn}`);
        
        if (disconnectBtn) {
          console.log('\n3. Testing disconnect...');
          
          // Click disconnect
          disconnectBtn.click();
          console.log('✅ Clicked disconnect button');
          
          // Check after disconnect
          setTimeout(() => {
            const stillConnected = !!document.querySelector('[style*="gradientGreen"]');
            const connectButtonAppeared = !!Array.from(document.querySelectorAll('button')).find(btn => 
              btn.textContent && btn.textContent.includes('Connect Wallet')
            );
            
            console.log(`✅ Wallet still connected: ${stillConnected}`);
            console.log(`✅ Connect button appeared: ${connectButtonAppeared}`);
            
            if (!stillConnected && connectButtonAppeared) {
              console.log('🎉 Disconnect working perfectly!');
            } else {
              console.log('⚠️  Disconnect may have issues');
            }
            
            // Check for success notification
            const notification = Array.from(document.querySelectorAll('*')).find(el => 
              el.textContent && el.textContent.includes('disconnected successfully')
            );
            
            console.log(`✅ Success notification: ${notification ? 'Shown' : 'Missing'}`);
            
          }, 2000);
        }
      }
    }, 500);
  }
}

// Test reconnection
function testReconnection() {
  console.log('\n4. Testing reconnection...');
  
  setTimeout(() => {
    const connectBtn = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent && btn.textContent.includes('Connect Wallet')
    );
    
    if (connectBtn) {
      console.log('✅ Connect button available for reconnection');
      console.log('🔄 You can now test reconnecting manually');
    } else {
      console.log('⚠️  Connect button not found');
    }
  }, 3000);
}

// Run tests
testDisconnectFixed();
testReconnection();