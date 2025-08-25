// Simple MetaMask Integration Test
// Run this in the browser console to test MetaMask integration

console.log('🦊 Starting MetaMask Integration Test...');

// Sei Network Configuration
const SEI_CONFIG = {
    evmChainId: '0x531', // 1329 in decimal
    evmChainName: 'Sei Testnet EVM',
    evmRpcUrl: 'https://evm-rpc-testnet.sei-apis.com',
    cosmosChainId: 'atlantic-2',
    cosmosRpcUrl: 'https://rpc.atlantic-2.seinetwork.io:443',
    nativeCurrency: {
        name: 'SEI',
        symbol: 'SEI',
        decimals: 18
    }
};

// Test functions
async function testMetaMaskIntegration() {
    try {
        // 1. Check if MetaMask is installed
        console.log('1️⃣ Checking MetaMask installation...');
        if (typeof window.ethereum === 'undefined' || !window.ethereum.isMetaMask) {
            throw new Error('MetaMask not detected. Please install MetaMask extension.');
        }
        console.log('✅ MetaMask detected');

        // 2. Request account access
        console.log('2️⃣ Requesting account access...');
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });
        
        if (accounts.length === 0) {
            throw new Error('No accounts found');
        }
        
        const evmAddress = accounts[0];
        console.log('✅ Connected to account:', evmAddress);

        // 3. Check current network
        console.log('3️⃣ Checking current network...');
        const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
        console.log('Current chain ID:', currentChainId);
        
        if (currentChainId !== SEI_CONFIG.evmChainId) {
            console.log('⚠️ Not on Sei network, attempting to switch...');
            await switchToSeiNetwork();
        } else {
            console.log('✅ Already on Sei network');
        }

        // 4. Get balance
        console.log('4️⃣ Getting account balance...');
        const balance = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [evmAddress, 'latest']
        });
        
        const balanceInWei = BigInt(balance);
        const balanceInSei = Number(balanceInWei) / Math.pow(10, 18);
        console.log('✅ Balance:', balanceInSei.toFixed(6), 'SEI');

        // 5. Test message signing
        console.log('5️⃣ Testing message signing...');
        const message = `SeiMoney test message - ${new Date().toISOString()}`;
        const signature = await window.ethereum.request({
            method: 'personal_sign',
            params: [message, evmAddress]
        });
        console.log('✅ Message signed:', signature.substring(0, 20) + '...');

        // 6. Convert to Cosmos address (simplified)
        console.log('6️⃣ Converting to Cosmos address...');
        const cosmosAddress = evmToCosmosAddress(evmAddress);
        console.log('✅ Cosmos address:', cosmosAddress);

        // 7. Test results
        console.log('🎉 All tests passed!');
        console.log('📊 Test Results:');
        console.log('   EVM Address:', evmAddress);
        console.log('   Cosmos Address:', cosmosAddress);
        console.log('   Balance:', balanceInSei.toFixed(6), 'SEI');
        console.log('   Network:', SEI_CONFIG.evmChainName);
        console.log('   Chain ID:', currentChainId);

        return {
            success: true,
            evmAddress,
            cosmosAddress,
            balance: balanceInSei,
            chainId: currentChainId,
            signature
        };

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

async function switchToSeiNetwork() {
    try {
        // Try to switch to existing network
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: SEI_CONFIG.evmChainId }],
        });
        console.log('✅ Switched to Sei network');
    } catch (switchError) {
        // Network not added, add it
        if (switchError.code === 4902) {
            console.log('➕ Adding Sei network to MetaMask...');
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: SEI_CONFIG.evmChainId,
                    chainName: SEI_CONFIG.evmChainName,
                    nativeCurrency: SEI_CONFIG.nativeCurrency,
                    rpcUrls: [SEI_CONFIG.evmRpcUrl],
                    blockExplorerUrls: ['https://seitrace.com'],
                    iconUrls: ['https://sei.io/favicon.ico']
                }]
            });
            console.log('✅ Sei network added and switched');
        } else {
            throw switchError;
        }
    }
}

// Simple EVM to Cosmos address conversion (for testing)
function evmToCosmosAddress(evmAddress) {
    // This is a simplified conversion for demo purposes
    // In production, use proper bech32 encoding
    const addressBytes = evmAddress.slice(2).toLowerCase(); // Remove 0x
    const cosmosAddress = 'sei1' + addressBytes.slice(0, 38);
    return cosmosAddress;
}

// Test sending a transaction (be careful with this!)
async function testSendTransaction(recipient, amountInSei) {
    if (!recipient || !amountInSei) {
        console.error('❌ Please provide recipient address and amount');
        return;
    }

    try {
        console.log(`💸 Sending ${amountInSei} SEI to ${recipient}...`);
        
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length === 0) {
            throw new Error('No connected accounts');
        }

        const txHash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [{
                from: accounts[0],
                to: recipient,
                value: `0x${BigInt(Math.floor(parseFloat(amountInSei) * Math.pow(10, 18))).toString(16)}`,
            }],
        });

        console.log('✅ Transaction sent!');
        console.log('📝 Transaction hash:', txHash);
        console.log('🔗 View on explorer: https://seitrace.com/tx/' + txHash);
        
        return txHash;
    } catch (error) {
        console.error('❌ Transaction failed:', error.message);
        throw error;
    }
}

// Export functions for manual testing
window.testMetaMaskIntegration = testMetaMaskIntegration;
window.switchToSeiNetwork = switchToSeiNetwork;
window.testSendTransaction = testSendTransaction;

// Auto-run the test
console.log('🚀 Running automatic test...');
testMetaMaskIntegration().then(result => {
    if (result.success) {
        console.log('🎉 MetaMask integration is working perfectly!');
        console.log('💡 You can now use the following functions:');
        console.log('   - testMetaMaskIntegration() - Run full test');
        console.log('   - switchToSeiNetwork() - Switch to Sei network');
        console.log('   - testSendTransaction(recipient, amount) - Send test transaction');
    } else {
        console.log('❌ MetaMask integration test failed');
        console.log('🔧 Please check the error above and try again');
    }
});

console.log('📋 Test script loaded. Check the results above.');