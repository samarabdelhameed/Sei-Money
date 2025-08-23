# 🦊 MetaMask Setup with Sei Network

## Adding Sei Networks to MetaMask

### Quick Method (Recommended) ⭐
1. Go to [Official Sei Networks Page](https://docs.sei.io/dev-tools/wallets)
2. Click "Add to MetaMask" for the network you want
3. Confirm the addition in MetaMask

### Manual Method

#### Sei Testnet (Atlantic-2)
1. Open MetaMask
2. Click on the network dropdown (usually shows "Ethereum Mainnet")
3. Click "Add Network" → "Add a network manually"
4. Enter the following details:

```
Network Name: Sei Testnet (Atlantic-2)
New RPC URL: https://evm-rpc-testnet.sei-apis.com
Chain ID: 1328
Currency Symbol: SEI
Block Explorer URL: https://seitrace.com
```

5. Click "Save"

#### Sei Mainnet
```
Network Name: Sei Network
New RPC URL: https://evm-rpc.sei-apis.com
Chain ID: 1329
Currency Symbol: SEI
Block Explorer URL: https://seitrace.com
```

## Getting Testnet Tokens

### From Faucet
1. Go to [Sei Faucet](https://faucet.seinetwork.io/)
2. Connect your MetaMask wallet
3. Request testnet tokens
4. Wait for confirmation

### Alternative Faucets
- [Atlantic-2 Faucet](https://faucet.seinetwork.io/)
- [Discord Faucet](https://discord.gg/sei) - Use `!faucet <your-address>` in #faucet channel

## Exporting Private Key

⚠️ **Security Warning**: Never share your private key with anyone!

1. Open MetaMask
2. Click on the account menu (three dots)
3. Select "Account Details"
4. Click "Export Private Key"
5. Enter your MetaMask password
6. Copy the private key (starts with 0x)
7. Add it to your `.env` file:
   ```
   PRIVATE_KEY=0x1234567890abcdef...
   ```

## Verifying Setup

### Check Network Connection
1. Switch to Sei Testnet in MetaMask
2. Your balance should show in SEI
3. Network should show "Sei Testnet (Atlantic-2)"

### Test Transaction
1. Try sending a small amount to another address
2. Check transaction on [SeiTrace Explorer](https://seitrace.com)

## Troubleshooting

### Common Issues

#### Network Not Showing
- Make sure you added the correct RPC URL
- Try refreshing MetaMask
- Check if the network is down on [Sei Status](https://status.sei.io)

#### No Balance After Faucet
- Wait a few minutes for confirmation
- Check transaction on explorer
- Try a different faucet

#### Transaction Fails
- Check if you have enough SEI for gas fees
- Increase gas limit if needed
- Make sure you're on the correct network

### Getting Help
- [Sei Discord](https://discord.gg/sei)
- [Sei Documentation](https://docs.sei.io)
- [GitHub Issues](https://github.com/sei-protocol/sei-chain/issues)

## Next Steps

After setting up MetaMask:
1. Fund your wallet with testnet tokens
2. Deploy your contract using `./contracts/scripts/deploy-metamask.sh`
3. Interact with your contract using the web app

---

**Security Reminder**: Always verify network details and never share your private keys!