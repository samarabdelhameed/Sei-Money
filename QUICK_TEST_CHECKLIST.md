# ⚡ Quick Test Checklist - 15 Minutes

## 🚀 Quick Start
```bash
./start-all.sh
```
Wait until you see: "🚀 All Services Started Successfully!"

---

## ✅ Quick Test (15 minutes)

### 1. Homepage (2 minutes)
- [ ] Open http://localhost:5175
- [ ] "SeiMoney" logo is visible
- [ ] "Connect Wallet" button exists
- [ ] Hero Section displays correctly
- [ ] Features Cards are visible

### 2. Wallet Connection (3 minutes)
- [ ] Click "Connect Wallet"
- [ ] Choose MetaMask (or any available wallet)
- [ ] Wallet address appears in Navbar
- [ ] Balance shows (even if 0.00 SEI)

### 3. Browse Pages (5 minutes)
- [ ] Dashboard - Stats and Charts are visible
- [ ] Payments - Sending form is visible
- [ ] Groups - Groups list is visible
- [ ] Pots - Pots list is visible
- [ ] Vaults - Vaults list is visible

### 4. Test One Function (3 minutes)
- [ ] Go to Payments
- [ ] Fill out transfer form (dummy data)
- [ ] Click "Send"
- [ ] Verify success message or transfer appears in list

### 5. Disconnect (2 minutes)
- [ ] Click wallet icon
- [ ] Click "Disconnect Wallet"
- [ ] Verify "Connect Wallet" appears again
- [ ] Verify wallet data disappears

---

## 🎯 Expected Result
If all points above succeed, the project is working correctly! 🎉

## 🐛 If You Encounter Issues
1. Ensure `./start-all.sh` is running
2. Check http://localhost:3001/health/health
3. Open Developer Console (F12) and look for errors
4. Try reloading the page (Ctrl+F5)

---

## 📱 Additional Testing (Optional)
- [ ] Test website on mobile (F12 > Device Toolbar)
- [ ] Try other pages (Escrow, Usernames, AI Agent)
- [ ] Try creating a group or savings pot

**Total Test Time: 15 minutes ⏱️**