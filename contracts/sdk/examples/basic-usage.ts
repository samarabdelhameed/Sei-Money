import { SeiMoneyClient } from '../src';

async function main() {
  // Configuration
  const RPC_ENDPOINT = 'https://rpc.atlantic-2.seinetwork.io:443';
  const CONTRACT_ADDRESS = 'sei1...'; // Replace with actual contract address
  const MNEMONIC = 'your mnemonic here'; // Replace with actual mnemonic

  try {
    // Connect with read-only client
    console.log('🔗 Connecting to Sei network...');
    const readOnlyClient = await SeiMoneyClient.connect(RPC_ENDPOINT, CONTRACT_ADDRESS);

    // Query contract config
    console.log('📋 Querying contract configuration...');
    const config = await readOnlyClient.getConfig();
    console.log('Config:', config);

    // Connect with signing client for transactions
    console.log('🔑 Connecting with signing client...');
    const signingClient = await SeiMoneyClient.connectWithSigner(
      RPC_ENDPOINT,
      CONTRACT_ADDRESS,
      MNEMONIC
    );

    // Get wallet address
    const accounts = await signingClient['signingClient']?.getAccounts();
    const senderAddress = accounts?.[0]?.address;
    
    if (!senderAddress) {
      throw new Error('Could not get sender address');
    }

    console.log('👤 Sender address:', senderAddress);

    // Check balance
    const balance = await signingClient.getBalance(senderAddress, 'usei');
    console.log('💰 Balance:', SeiMoneyClient.formatAmount(balance), 'SEI');

    // Create a transfer
    console.log('📤 Creating transfer...');
    const recipientAddress = 'sei1recipient...'; // Replace with actual recipient
    const transferAmount = SeiMoneyClient.parseAmount('1.0'); // 1 SEI
    const expiryTime = SeiMoneyClient.createExpiryTime(24); // 24 hours from now

    const createResult = await signingClient.createTransfer(
      senderAddress,
      {
        recipient: recipientAddress,
        expiry_time: expiryTime,
        memo: 'Test transfer from SDK',
      },
      transferAmount,
      'usei'
    );

    console.log('✅ Transfer created:', createResult.transactionHash);

    // Extract transfer ID from events
    const transferEvent = createResult.logs[0]?.events?.find(
      (e) => e.type === 'wasm' && e.attributes.some((a) => a.key === 'action' && a.value === 'create_transfer')
    );
    const transferId = transferEvent?.attributes?.find((a) => a.key === 'transfer_id')?.value;

    if (transferId) {
      console.log('🆔 Transfer ID:', transferId);

      // Query the created transfer
      console.log('🔍 Querying transfer details...');
      const transfer = await readOnlyClient.getTransfer(transferId);
      console.log('Transfer details:', transfer);

      // Query transfers by sender
      console.log('📋 Querying transfers by sender...');
      const senderTransfers = await readOnlyClient.getTransfersBySender(senderAddress);
      console.log('Sender transfers:', senderTransfers.length);

      // Query transfers by recipient
      console.log('📋 Querying transfers by recipient...');
      const recipientTransfers = await readOnlyClient.getTransfersByRecipient(recipientAddress);
      console.log('Recipient transfers:', recipientTransfers.length);

      // Example: Claim transfer (would be done by recipient)
      // const claimResult = await signingClient.claimTransfer(recipientAddress, { id: transferId });
      // console.log('✅ Transfer claimed:', claimResult.transactionHash);

      // Example: Refund transfer (can be done by sender after expiry)
      // const refundResult = await signingClient.refundTransfer(senderAddress, { id: transferId });
      // console.log('✅ Transfer refunded:', refundResult.transactionHash);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}