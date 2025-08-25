# ✅ User Acceptance Testing Checklist - SeiMoney

## 🎯 Overview

This comprehensive checklist ensures that the SeiMoney application meets all end-user requirements before deployment. It covers all core functionality, user experience, performance, and security.

## 📋 Test Information

- **Test Date**: ___________
- **Application Version**: ___________
- **Tester**: ___________
- **Environment**: [ ] Development [ ] Testing [ ] Production
- **Browser**: ___________
- **Operating System**: ___________

---

## 🏠 Home Screen Testing

### ✅ Basic Loading
- [ ] **Page Loading**: Page loads in less than 3 seconds
- [ ] **Logo Display**: SeiMoney logo appears clearly and in high quality
- [ ] **Main Menu**: All menu items appear (Home, Products, About, Contact)
- [ ] **Main Content**: Text and images display correctly
- [ ] **Footer**: Footer appears with all links

**Notes**: ________________________________

### ✅ Live Data
- [ ] **Market Statistics**: Real and updated data appears (TVL, Volume, Users)
- [ ] **TVL Chart**: Displays correct historical data with interactivity
- [ ] **Feature Cards**: Display accurate product information
- [ ] **Data Updates**: Data updates automatically every 30 seconds
- [ ] **Loading States**: Loading indicators appear when fetching data

**Notes**: ________________________________

### ✅ Interaction and Navigation
- [ ] **"Get Started" Button**: Navigates to wallet connection page
- [ ] **"Learn More" Button**: Opens additional information or separate page
- [ ] **Menu Links**: All main menu links work
- [ ] **Footer Links**: Open correct pages
- [ ] **Social Media Buttons**: Open official accounts

**Notes**: ________________________________

---

## 📊 Dashboard Testing

### ✅ Wallet Connection
- [ ] **Keplr Connection**: Connects successfully with address and balance display
- [ ] **Leap Connection**: Connects successfully with all functionality
- [ ] **MetaMask Connection**: Connects successfully (if supported)
- [ ] **Wallet Switching**: Switching between wallets works smoothly
- [ ] **Disconnection**: Disconnects and hides sensitive data

**Wallet Used**: ___________
**Address**: ___________
**Notes**: ________________________________

### ✅ Data Display
- [ ] **Portfolio Value**: Displays correct total value in dollars
- [ ] **Daily P&L**: Accurate calculations with percentages
- [ ] **Active Vaults Count**: Displays correct number of investments
- [ ] **Groups Data**: Updated information about participations
- [ ] **Balance Updates**: Balances update immediately after transactions

**Displayed Balance**: ___________
**Actual Balance**: ___________
**Notes**: ________________________________

### ✅ Interactive Components
- [ ] **Performance Chart**: Displays real data with time period change capability
- [ ] **Quick Action Buttons**: Send, receive, invest buttons work
- [ ] **Activity Feed**: Shows real transactions with details
- [ ] **Savings Goal Indicators**: Reflect actual progress toward goals
- [ ] **Refresh Function**: Manual and automatic refresh work

**Notes**: ________________________________

---

## 💳 Payment Testing

### ✅ Create New Payment
- [ ] **Open Form**: Payment creation form opens smoothly
- [ ] **Address Input**: Accepts correct SEI addresses and rejects incorrect ones
- [ ] **Amount Input**: Checks available balance and prevents excessive amounts
- [ ] **Expiry Date**: Only accepts future dates
- [ ] **Note Field**: Accepts optional text (maximum 200 characters)

**Test Address**: ___________
**Test Amount**: ___________
**Notes**: ________________________________

### ✅ Send Transaction
- [ ] **Review Details**: Review screen appears with all details
- [ ] **Gas Fee Estimate**: Displays estimated gas fees accurately
- [ ] **Wallet Confirmation**: Wallet confirmation window appears