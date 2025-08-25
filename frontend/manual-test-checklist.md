# SeiMoney Home Page Manual Test Checklist

## 🏠 Home Page Complete Test Scenario

### Pre-Test Setup
- [ ] Backend running on http://localhost:3001
- [ ] Frontend running on http://localhost:5175
- [ ] Browser opened to http://localhost:5175

---

## 📊 Backend API Tests

### 1. Health Check
```bash
curl http://localhost:3001/health/health
```
**Expected:** `{"ok":true,"status":"healthy",...}`

### 2. Market Stats API
```bash
curl http://localhost:3001/api/v1/market/stats
```
**Expected:** Real TVL, user count, success rate data

### 3. TVL History API
```bash
curl http://localhost:3001/api/v1/market/tvl-history
```
**Expected:** Array of historical TVL data points

---

## 🎨 Frontend UI Tests

### 1. Page Load & Hero Section
- [ ] Page loads without errors
- [ ] "SeiMoney" title visible with neon effect
- [ ] "Next-Gen DeFi Platform" subtitle visible
- [ ] Description text readable
- [ ] "Get Started" button visible and styled
- [ ] "Learn More" button visible and styled

### 2. Stats Cards Section
- [ ] 4 stats cards visible in grid layout
- [ ] Cards show real data (not "Loading...")
- [ ] Expected stats:
  - [ ] Total TVL: ~$24.7M
  - [ ] Active Users: ~12,447
  - [ ] Success Rate: ~95%
  - [ ] Avg APY: Shows percentage
- [ ] Cards have hover effects
- [ ] Change percentages visible (green/red indicators)

### 3. TVL Chart Section
- [ ] Chart container visible
- [ ] "Total Value Locked" title
- [ ] Current TVL value displayed
- [ ] Line chart renders properly
- [ ] Chart shows historical data (30 data points)
- [ ] Chart has proper styling (green theme)
- [ ] No error messages in chart area

### 4. Features Grid Section
- [ ] "Explore Features" title visible
- [ ] 6 feature cards in grid layout:
  - [ ] Smart Payments (green, TrendingUp icon)
  - [ ] Group Pools (purple, Users icon)
  - [ ] Savings Pots (green, Target icon)
  - [ ] AI Vaults (purple, Zap icon)
  - [ ] Escrow Service (green, Shield icon)
  - [ ] AI Assistant (purple, Bot icon)
- [ ] Each card has proper icon and colors
- [ ] Cards have hover effects (scale up)
- [ ] Cards are clickable

### 5. Getting Started Section
- [ ] "Start Your DeFi Journey in 3 Steps" title
- [ ] 3 step cards visible:
  - [ ] Step 1: Connect Wallet (green circle)
  - [ ] Step 2: Choose Strategy (purple circle)
  - [ ] Step 3: Start Earning (neon circle)
- [ ] "View Documentation" button visible
- [ ] Cards have hover effects

### 6. Footer Section
- [ ] Footer border visible
- [ ] SeiMoney brand section with logo
- [ ] Description text readable
- [ ] Social media icons (4 icons):
  - [ ] Twitter (blue)
  - [ ] GitHub (white)
  - [ ] Discord (purple)
  - [ ] Email (green)
- [ ] Social icons have hover effects
- [ ] Products column with 6 links
- [ ] Resources column with 6 links
- [ ] Company column with 6 links
- [ ] Newsletter signup section
- [ ] Email input field functional
- [ ] Subscribe button styled
- [ ] Bottom bar with copyright
- [ ] "Made with ❤️ on Sei Network" text
- [ ] Privacy/Terms/Settings links

---

## 🔄 Interactive Tests

### 1. Button Interactions
- [ ] Click "Get Started" → Should navigate/trigger action
- [ ] Click "Learn More" → Should navigate to help
- [ ] Click feature cards → Should navigate to respective pages
- [ ] Click "View Documentation" → Should navigate to help
- [ ] Click social media icons → Should have hover effects
- [ ] Click footer links → Should navigate appropriately

### 2. Navigation Tests
- [ ] Feature card clicks change URL/state
- [ ] Navigation maintains state
- [ ] Back button works properly

### 3. Data Loading Tests
- [ ] Page loads with "Loading..." initially
- [ ] Stats update to real data within 3 seconds
- [ ] Chart renders after data loads
- [ ] No infinite loading states
- [ ] Error handling for offline backend

---

## 📱 Responsive Design Tests

### 1. Desktop (1920x1080)
- [ ] All elements properly spaced
- [ ] Grid layouts work correctly
- [ ] Text is readable
- [ ] Buttons are properly sized

### 2. Tablet (768x1024)
- [ ] Stats cards stack properly
- [ ] Feature grid adjusts to 2 columns
- [ ] Text remains readable
- [ ] Navigation works

### 3. Mobile (375x667)
- [ ] Single column layout
- [ ] Stats cards stack vertically
- [ ] Feature cards stack vertically
- [ ] Text scales appropriately
- [ ] Buttons remain accessible

---

## 🚀 Performance Tests

### 1. Loading Performance
- [ ] Initial page load < 3 seconds
- [ ] API calls complete < 2 seconds
- [ ] Smooth animations
- [ ] No layout shifts

### 2. Memory Usage
- [ ] No memory leaks
- [ ] Smooth scrolling
- [ ] Responsive interactions

---

## 🐛 Error Handling Tests

### 1. Backend Offline
- [ ] Page still loads
- [ ] Shows demo data
- [ ] Error message displayed
- [ ] No crashes

### 2. Network Issues
- [ ] Graceful degradation
- [ ] Retry mechanisms work
- [ ] User feedback provided

---

## ✅ Success Criteria

**All tests pass if:**
1. ✅ Backend APIs return real data
2. ✅ Frontend displays data correctly
3. ✅ All interactive elements work
4. ✅ Responsive design functions
5. ✅ No console errors
6. ✅ Performance is acceptable
7. ✅ Error handling works

---

## 🔧 Quick Test Commands

```bash
# Test backend health
curl http://localhost:3001/health/health

# Test market stats
curl http://localhost:3001/api/v1/market/stats | jq '.stats.totalTvl'

# Test TVL history
curl http://localhost:3001/api/v1/market/tvl-history | jq '.data | length'

# Check frontend
curl -I http://localhost:5175
```

---

## 📝 Test Results Log

**Date:** ___________
**Tester:** ___________

### Backend Tests
- [ ] Health Check: ✅/❌
- [ ] Market Stats: ✅/❌  
- [ ] TVL History: ✅/❌

### Frontend Tests
- [ ] Page Load: ✅/❌
- [ ] Stats Display: ✅/❌
- [ ] Chart Render: ✅/❌
- [ ] Feature Cards: ✅/❌
- [ ] Interactions: ✅/❌
- [ ] Responsive: ✅/❌

### Issues Found
1. ________________________________
2. ________________________________
3. ________________________________

### Overall Result: ✅ PASS / ❌ FAIL

---

**Notes:**
- Test on Chrome, Firefox, Safari
- Test with different screen sizes
- Test with slow network conditions
- Test with backend offline scenario