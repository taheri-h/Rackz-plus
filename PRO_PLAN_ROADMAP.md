# Pro Plan Implementation Roadmap

## Pro Plan Requirements (TIER 2 — PRO)

**Target:** SaaS, memberships, subscription businesses  
**Promise:** Protect recurring revenue. Reduce churn. Prevent renewal failures.

### Problems This Tier Solves
- Involuntary churn
- Failed renewals
- Poor dunning performance
- Card expirations
- Subscription status drifts
- Customer high-risk scoring
- Chargebacks discovered too late
- Incorrect invoice/renewal logic

### Required Stripe Endpoints
- ✅ GET /v1/subscriptions
- ✅ GET /v1/invoices
- ✅ GET /v1/customers
- ❌ GET /v1/invoices/upcoming (MISSING)
- ❌ GET /v1/payment_methods?type=card (MISSING - CRITICAL)
- ✅ GET /v1/disputes
- ❌ GET /v1/radar/early_fraud_warnings (MISSING - Optional)

### Required Pro Features
- ✅ Everything in Starter
- ⚠️ Renewal failure predictions (basic - needs improvement)
- ⚠️ Smart dunning insights (basic - needs enhancement)
- ❌ Card expiry alerts (NOT WORKING - shows 0)
- ❌ High-risk customer scoring (MISSING)
- ⚠️ Chargeback Watch (basic - needs details)
- ⚠️ Subscription performance insights (partial)
- ❌ Weekly subscription health report (MISSING)
- ⚠️ Expanded Payment Health Score including MRR risk (partial)

---

## Current Status ✅
- ✅ ProDashboard component created with Starter features included
- ✅ Backend endpoints for disputes and renewal analysis
- ✅ Basic data fetching and display
- ✅ UI structure in place
- ✅ Subscriptions, invoices, customers fetching
- ✅ Disputes fetching

## Missing Critical Features ❌
- ❌ Payment methods fetching (needed for card expiry)
- ❌ Upcoming invoices fetching (needed for renewal predictions)
- ❌ High-risk customer scoring
- ❌ Weekly subscription health report
- ❌ Radar fraud warnings (optional)

---

## Phase 1: Core Data & Accuracy (Priority: HIGH) 🔴

### 1.1 Enhance Card Expiry Detection
**Current Issue:** Card expiry is not accurately detected (shows 0)
**Solution:**
- Fetch payment methods from Stripe for each subscription
- Check card expiry dates from payment methods
- Count cards expiring in next 30 days
- Cache payment method data

**Files to Update:**
- `backend/server.js` - `/api/stripe/renewal-analysis` endpoint
- Add payment method fetching logic

**Expected Outcome:** Accurate card expiry count

---

### 1.2 Improve Renewal Prediction Algorithm
**Current Issue:** Simple prediction based on historical rate
**Solution:**
- Analyze past 30 days of renewal patterns
- Factor in subscription age, payment method age
- Consider failure reasons (insufficient funds, expired card, etc.)
- Weight recent failures more heavily

**Files to Update:**
- `backend/server.js` - `/api/stripe/renewal-analysis` endpoint
- Add prediction logic

**Expected Outcome:** More accurate failure predictions

---

### 1.3 Add Loading & Error States
**Current Issue:** No loading indicators or error handling
**Solution:**
- Add loading states for Pro data fetching
- Add error messages if data fails to load
- Add retry mechanism
- Show empty states when no data available

**Files to Update:**
- `src/pages/Dashboard.tsx` - Add loading/error states
- `src/components/dashboard/ProDashboard.tsx` - Handle empty states

**Expected Outcome:** Better UX with clear feedback

---

## Phase 2: Enhanced Features (Priority: MEDIUM) 🟡

### 2.1 Real-Time Renewal Predictions Chart
**Current Issue:** Chart shows mock data (actual is always 0)
**Solution:**
- Track actual failures as they happen
- Store historical prediction vs actual data
- Update chart with real comparison data
- Show prediction accuracy over time

**Files to Update:**
- `backend/server.js` - Add historical tracking
- `src/components/dashboard/ProDashboard.tsx` - Update chart logic

**Expected Outcome:** Working prediction vs actual comparison

---

### 2.2 Smart Dunning Insights Enhancement
**Current Issue:** Generic suggestions
**Solution:**
- Analyze specific failure reasons
- Provide actionable recommendations:
  - "8 subscriptions failed due to expired cards - send update email"
  - "3 subscriptions with insufficient funds - retry in 3 days"
- Link to specific subscriptions/customers
- Add "Take Action" buttons

**Files to Update:**
- `backend/server.js` - Add detailed failure analysis
- `src/components/dashboard/ProDashboard.tsx` - Enhanced suggestions

**Expected Outcome:** Actionable, specific recommendations

---

### 2.3 Chargeback Details & Actions
**Current Issue:** Only shows counts, no details
**Solution:**
- Show list of active disputes
- Display dispute amount, reason, status
- Show evidence due dates prominently
- Add links to Stripe dispute pages
- Add filter by status

**Files to Update:**
- `src/components/dashboard/ProDashboard.tsx` - Add disputes table
- Create `DisputesTable.tsx` component

**Expected Outcome:** Full chargeback management view

---

## Phase 3: Advanced Features (Priority: LOW) 🟢

### 3.1 Subscription Health Trends
**Solution:**
- Add 30/90 day trend charts for:
  - MRR growth/decline
  - Renewal success rate over time
  - Churn rate trends
- Show month-over-month comparisons

**Files to Create:**
- `src/components/dashboard/SubscriptionTrends.tsx`

---

### 3.2 At-Risk Customer List
**Solution:**
- Show list of at-risk customers
- Display customer name, email, subscription details
- Show why they're at risk (past due, card expiring, etc.)
- Add "Contact Customer" action

**Files to Create:**
- `src/components/dashboard/AtRiskCustomers.tsx`

---

### 3.3 Weekly Subscription Report (Email)
**Solution:**
- Generate weekly report with:
  - MRR summary
  - Renewal metrics
  - Top failure reasons
  - Chargeback summary
- Send via email (using existing email system)
- Add preference to enable/disable

**Files to Update:**
- `backend/utils/email.js` - Add report template
- `backend/server.js` - Add report generation endpoint

---

## Phase 4: Polish & Optimization (Priority: LOW) 🟢

### 4.1 Performance Optimization
- Add caching for renewal analysis (like charges/subscriptions)
- Optimize payment method fetching (batch requests)
- Add pagination for large subscription lists

### 4.2 UI/UX Improvements
- Add tooltips explaining metrics
- Add help icons with explanations
- Improve mobile responsiveness
- Add skeleton loaders

### 4.3 Data Validation
- Validate all Stripe API responses
- Handle edge cases (no subscriptions, no disputes, etc.)
- Add fallback values for missing data

---

## Implementation Order (Recommended)

1. **Phase 1.1** - Card Expiry Detection (Critical for Pro value)
2. **Phase 1.3** - Loading & Error States (Better UX)
3. **Phase 1.2** - Renewal Prediction (Core feature)
4. **Phase 2.2** - Smart Dunning Insights (High value)
5. **Phase 2.3** - Chargeback Details (Useful)
6. **Phase 2.1** - Real-Time Predictions Chart (Nice to have)
7. **Phase 3+** - Advanced features (Future enhancements)

---

## Testing Checklist

- [ ] Test with account that has no subscriptions
- [ ] Test with account that has no disputes
- [ ] Test with account that has expired cards
- [ ] Test with account that has failed renewals
- [ ] Test loading states
- [ ] Test error handling
- [ ] Test mobile responsiveness
- [ ] Test with large datasets (100+ subscriptions)

---

## Notes

- All Pro features should gracefully handle empty states
- All data should be cached appropriately (5 min TTL)
- All API calls should have proper error handling
- All UI should be responsive and accessible

