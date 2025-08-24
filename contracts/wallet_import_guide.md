# 🔐 Wallet Import Guide

## Your Wallet Details
- **Address**: `sei174zezekzgevcnkrdax3grty7ewzuj20y6vm9nk`
- **Mnemonic**: `draft dinner stadium few report aim museum deny recall brave cattle lumber saddle slight equip ridge naive capital violin sudden merry inch between eye`

⚠️ **IMPORTANT**: Keep this mnemonic phrase private and secure!

## Import Options

### Option 1: Sei Wallet (Recommended)
1. Go to: https://wallet.sei.io/
2. Click "Import Wallet"
3. Enter the mnemonic phrase above
4. Set a password
5. Use the built-in faucet to get testnet tokens

### Option 2: Keplr Wallet
1. Install Keplr browser extension
2. Add Sei Testnet network
3. Import wallet using mnemonic
4. Request tokens from community

### Option 3: Discord Faucet Bot
1. Join Sei Discord: https://discord.gg/sei
2. Go to #faucet channel
3. Type: `!faucet sei174zezekzgevcnkrdax3grty7ewzuj20y6vm9nk`
4. Wait for bot response

## After Getting Tokens

Check balance:
```bash
./scripts/check_balance.sh
```

Deploy contract:
```bash
./scripts/deploy_sei.sh
```

Test contract:
```bash
./scripts/test_contract.sh
```

## Network Details
- **Chain ID**: atlantic-2
- **RPC**: https://rpc.atlantic-2.seinetwork.io:443
- **Denom**: usei (1 SEI = 1,000,000 usei)