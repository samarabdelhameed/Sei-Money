// Network Connection Tester for SeiMoney

export class NetworkTester {
  
  // Test Sei Network connectivity
  static async testSeiNetwork(): Promise<{
    mainnet: boolean;
    testnet: boolean;
    evm: boolean;
    cosmos: boolean;
    details: any;
  }> {
    console.log('🌐 Testing Sei Network connectivity...');
    
    const results = {
      mainnet: false,
      testnet: false,
      evm: false,
      cosmos: false,
      details: {} as any
    };

    // Test Mainnet RPC
    try {
      const mainnetResponse = await fetch('https://rpc.sei-apis.com/status');
      results.mainnet = mainnetResponse.ok;
      if (results.mainnet) {
        const data = await mainnetResponse.json();
        results.details.mainnet = data;
        console.log('✅ Sei Mainnet RPC: Online');
      }
    } catch (error) {
      console.log('❌ Sei Mainnet RPC: Offline');
      results.details.mainnetError = error;
    }

    // Test Testnet RPC
    try {
      const testnetResponse = await fetch('https://rpc.atlantic-2.seinetwork.io/status');
      results.testnet = testnetResponse.ok;
      if (results.testnet) {
        const data = await testnetResponse.json();
        results.details.testnet = data;
        console.log('✅ Sei Testnet RPC: Online');
      }
    } catch (error) {
      console.log('❌ Sei Testnet RPC: Offline');
      results.details.testnetError = error;
    }

    // Test EVM RPC
    try {
      const evmResponse = await fetch('https://evm-rpc.sei-apis.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_chainId',
          params: [],
          id: 1
        })
      });
      results.evm = evmResponse.ok;
      if (results.evm) {
        const data = await evmResponse.json();
        results.details.evm = data;
        console.log('✅ Sei EVM RPC: Online');
      }
    } catch (error) {
      console.log('❌ Sei EVM RPC: Offline');
      results.details.evmError = error;
    }

    // Test Cosmos REST
    try {
      const cosmosResponse = await fetch('https://rest.sei-apis.com/cosmos/base/tendermint/v1beta1/node_info');
      results.cosmos = cosmosResponse.ok;
      if (results.cosmos) {
        const data = await cosmosResponse.json();
        results.details.cosmos = data;
        console.log('✅ Sei Cosmos REST: Online');
      }
    } catch (error) {
      console.log('❌ Sei Cosmos REST: Offline');
      results.details.cosmosError = error;
    }

    return results;
  }

  // Test MetaMask Sei Network configuration
  static async testMetaMaskSeiConfig(): Promise<{
    metamaskInstalled: boolean;
    seiNetworkAdded: boolean;
    currentNetwork: string | null;
    canAddNetwork: boolean;
  }> {
    console.log('🦊 Testing MetaMask Sei Network configuration...');
    
    const results = {
      metamaskInstalled: false,
      seiNetworkAdded: false,
      currentNetwork: null as string | null,
      canAddNetwork: false
    };

    // Check if MetaMask is installed
    const ethereum = (window as any).ethereum;
    results.metamaskInstalled = !!(ethereum && ethereum.isMetaMask);
    
    if (!results.metamaskInstalled) {
      console.log('❌ MetaMask not installed');
      return results;
    }

    console.log('✅ MetaMask detected');

    try {
      // Get current chain ID
      const chainId = await ethereum.request({ method: 'eth_chainId' });
      results.currentNetwork = chainId;
      console.log(`📡 Current network: ${chainId}`);

      // Check if current network is Sei (0x531 = 1329)
      results.seiNetworkAdded = chainId === '0x531';
      
      if (results.seiNetworkAdded) {
        console.log('✅ Already connected to Sei Network');
      } else {
        console.log('⚠️ Not connected to Sei Network');
        
        // Test if we can add the network
        try {
          // This will fail if network already exists, which is fine
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x531',
              chainName: 'Sei Network Test',
              nativeCurrency: { name: 'SEI', symbol: 'SEI', decimals: 18 },
              rpcUrls: ['https://evm-rpc.sei-apis.com'],
              blockExplorerUrls: ['https://seitrace.com']
            }]
          });
          results.canAddNetwork = true;
          console.log('✅ Can add Sei Network to MetaMask');
        } catch (error: any) {
          if (error.code === 4902) {
            results.canAddNetwork = true;
            console.log('✅ Can add Sei Network to MetaMask');
          } else if (error.code === -32602) {
            results.seiNetworkAdded = true;
            console.log('✅ Sei Network already added to MetaMask');
          } else {
            console.log('❌ Cannot add Sei Network:', error.message);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error checking MetaMask configuration:', error);
    }

    return results;
  }

  // Auto-fix MetaMask Sei Network issues
  static async autoFixMetaMaskSei(): Promise<boolean> {
    console.log('🔧 Auto-fixing MetaMask Sei Network configuration...');
    
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      console.log('❌ MetaMask not found');
      return false;
    }

    try {
      // Try to add Sei Network
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x531',
          chainName: 'Sei Network',
          nativeCurrency: {
            name: 'SEI',
            symbol: 'SEI',
            decimals: 18,
          },
          rpcUrls: ['https://evm-rpc.sei-apis.com'],
          blockExplorerUrls: ['https://seitrace.com'],
          iconUrls: ['https://assets.coingecko.com/coins/images/28205/large/Sei_Logo_-_Transparent.png']
        }]
      });

      console.log('✅ Sei Network added successfully');

      // Try to switch to Sei Network
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x531' }],
      });

      console.log('✅ Switched to Sei Network');
      return true;

    } catch (error: any) {
      if (error.code === 4902) {
        console.log('⚠️ Network already exists, trying to switch...');
        
        try {
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x531' }],
          });
          console.log('✅ Switched to existing Sei Network');
          return true;
        } catch (switchError) {
          console.error('❌ Failed to switch to Sei Network:', switchError);
          return false;
        }
      } else {
        console.error('❌ Failed to add Sei Network:', error);
        return false;
      }
    }
  }

  // Comprehensive network diagnostics
  static async runNetworkDiagnostics(): Promise<void> {
    console.log('🔍 Running comprehensive network diagnostics...');
    console.log('================================================');

    // Test Sei Network connectivity
    const seiResults = await this.testSeiNetwork();
    console.log('\n📊 Sei Network Status:');
    console.log(`  Mainnet RPC: ${seiResults.mainnet ? '✅' : '❌'}`);
    console.log(`  Testnet RPC: ${seiResults.testnet ? '✅' : '❌'}`);
    console.log(`  EVM RPC: ${seiResults.evm ? '✅' : '❌'}`);
    console.log(`  Cosmos REST: ${seiResults.cosmos ? '✅' : '❌'}`);

    // Test MetaMask configuration
    const metamaskResults = await this.testMetaMaskSeiConfig();
    console.log('\n🦊 MetaMask Status:');
    console.log(`  Installed: ${metamaskResults.metamaskInstalled ? '✅' : '❌'}`);
    console.log(`  Sei Network Added: ${metamaskResults.seiNetworkAdded ? '✅' : '❌'}`);
    console.log(`  Current Network: ${metamaskResults.currentNetwork || 'Unknown'}`);
    console.log(`  Can Add Network: ${metamaskResults.canAddNetwork ? '✅' : '❌'}`);

    // Provide recommendations
    console.log('\n💡 Recommendations:');
    
    if (!metamaskResults.metamaskInstalled) {
      console.log('  📥 Install MetaMask browser extension');
    }
    
    if (metamaskResults.metamaskInstalled && !metamaskResults.seiNetworkAdded) {
      console.log('  🔧 Run NetworkTester.autoFixMetaMaskSei() to add Sei Network');
    }
    
    if (!seiResults.evm && !seiResults.cosmos) {
      console.log('  🌐 Check your internet connection');
      console.log('  🔄 Try again in a few minutes');
    }

    console.log('\n🎯 Quick Fix Command:');
    console.log('  await NetworkTester.autoFixMetaMaskSei()');
    console.log('================================================');
  }
}

// Make available globally for console use
if (typeof window !== 'undefined') {
  (window as any).NetworkTester = NetworkTester;
  console.log('🌐 NetworkTester loaded! Use NetworkTester.runNetworkDiagnostics()');
}