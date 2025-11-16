# Database Structure Review & Optimization

## 🔍 Current Issues Found

1. **Duplicate Collections**: Mongoose creates collections with different naming conventions
   - `saaspayments` vs `saas_payments`
   - `setuprequests` vs `setup_requests`
   - `setuppayments` vs `setup_payments`
   - `connectedproviders` vs `connected_providers`

2. **Missing Fields in SetupRequest**: Frontend collects more data than database stores
   - Missing: phone, industry, businessType, website, monthlyRevenue, country, currentPaymentProvider, platform, crm, additionalRequirements, timeline, timezone

3. **User Model**: Missing company field (used in signup)

4. **Collection Naming**: Need to standardize to one naming convention

## ✅ Required Database Structure

### 1. Users Collection
**Purpose**: Store user accounts with authentication
**Fields**:
- `_id` (ObjectId)
- `email` (String, unique, indexed)
- `passwordHash` (String, hashed)
- `name` (String)
- `company` (String, optional) ← ADD THIS
- `avatarUrl` (String, optional)
- `entitlements.saasPlan` (String: 'starter'|'pro'|'scale'|null)
- `entitlements.setupEligible` (Boolean)
- `createdAt` (Date)
- `updatedAt` (Date)

**Indexes**:
- `email` (unique)
- `entitlements.saasPlan`

**Relationships**:
- One-to-Many: User → SaasPayments
- One-to-Many: User → SetupRequests
- One-to-Many: User → ConnectedProviders

---

### 2. SaasPayments Collection
**Purpose**: Store SaaS subscription payments
**Fields**:
- `_id` (ObjectId)
- `userId` (ObjectId, ref: User, indexed)
- `plan` (String: 'starter'|'pro'|'scale')
- `billingCycle` (String: 'monthly'|'yearly')
- `amountCents` (Number)
- `currency` (String, default: 'EUR')
- `status` (String: 'pending'|'succeeded'|'failed'|'refunded')
- `provider` (String: 'stripe'|'manual')
- `providerPaymentId` (String, optional)
- `createdAt` (Date)
- `updatedAt` (Date)

**Indexes**:
- `userId + createdAt` (compound, descending)
- `status`

**Relationships**:
- Many-to-One: SaasPayment → User

---

### 3. SetupRequests Collection
**Purpose**: Store setup service requests
**Fields**:
- `_id` (ObjectId)
- `userId` (ObjectId, ref: User, indexed)
- `packageName` (String: 'checkout'|'subscriptions'|'crm'|'marketplace')
- `fullPriceCents` (Number)
- `upfrontPaidCents` (Number, default: 0)
- `remainingCents` (Number)
- `status` (String: 'initiated'|'upfront_paid'|'in_progress'|'delivered'|'completed'|'cancelled')
- `contactMethod` (String: 'email'|'phone'|'whatsapp')
- `details.company` (String) ← Already exists
- `details.website` (String) ← Already exists
- `details.notes` (String) ← Already exists
- **NEW FIELDS NEEDED**:
  - `details.phone` (String)
  - `details.industry` (String)
  - `details.businessType` (String)
  - `details.monthlyRevenue` (String)
  - `details.country` (String)
  - `details.currentPaymentProvider` (String)
  - `details.platform` (String)
  - `details.crm` (String)
  - `details.additionalRequirements` (String)
  - `details.timeline` (String)
  - `details.timezone` (String)
- `createdAt` (Date)
- `updatedAt` (Date)

**Indexes**:
- `userId + createdAt` (compound, descending)
- `status`

**Relationships**:
- Many-to-One: SetupRequest → User
- One-to-Many: SetupRequest → SetupPayments

---

### 4. SetupPayments Collection
**Purpose**: Store setup service payments (upfront and final)
**Fields**:
- `_id` (ObjectId)
- `userId` (ObjectId, ref: User, indexed)
- `setupRequestId` (ObjectId, ref: SetupRequest, indexed)
- `chargeType` (String: 'upfront'|'final')
- `amountCents` (Number)
- `currency` (String, default: 'EUR')
- `status` (String: 'pending'|'succeeded'|'failed'|'refunded')
- `provider` (String: 'stripe'|'manual')
- `providerPaymentId` (String, optional)
- `createdAt` (Date)
- `updatedAt` (Date)

**Indexes**:
- `setupRequestId + chargeType` (compound)
- `userId + createdAt` (compound, descending)

**Relationships**:
- Many-to-One: SetupPayment → User
- Many-to-One: SetupPayment → SetupRequest

---

### 5. ConnectedProviders Collection
**Purpose**: Store connected payment providers
**Fields**:
- `_id` (ObjectId)
- `userId` (ObjectId, ref: User, indexed)
- `provider` (String: 'stripe'|'paypal'|'shopify'|'adyen')
- `status` (String: 'connected'|'disconnected'|'error')
- `metadata` (Object/Mixed) - Can store provider-specific data
- `createdAt` (Date)
- `updatedAt` (Date)

**Indexes**:
- `userId + provider` (compound, unique) - One connection per provider per user
- `status`

**Relationships**:
- Many-to-One: ConnectedProvider → User

---

## 🔄 Data Flow

### User Signup Flow:
1. User signs up → `POST /api/auth/signup`
2. User created in `users` collection
3. JWT token returned
4. User data stored in frontend localStorage

### SaaS Payment Flow:
1. User selects plan → `POST /api/payments/saas`
2. Payment created in `saaspayments` collection
3. User `entitlements.saasPlan` updated
4. User redirected to dashboard

### Setup Request Flow:
1. User fills form → `POST /api/setup/request`
2. SetupRequest created in `setuprequests` collection
3. User pays upfront → `POST /api/setup/payment` (chargeType: 'upfront')
4. SetupPayment created in `setuppayments` collection
5. SetupRequest status updated to 'upfront_paid'
6. User redirected to setup-dashboard

### Dashboard Access:
- **SaaS Dashboard**: Users with `entitlements.saasPlan` → `/dashboard`
- **Setup Dashboard**: Users with `entitlements.setupEligible: true` → `/setup-dashboard`

---

## 🛠️ Required Fixes

1. ✅ Add `company` field to User model
2. ✅ Add missing fields to SetupRequest model
3. ✅ Standardize collection names (use Mongoose collection name option)
4. ✅ Add proper indexes for performance
5. ✅ Ensure all relationships are correct
6. ✅ Clean up duplicate collections (migration script)

---

## 📊 Data Isolation (User-Based Access)

All collections properly isolate data by `userId`:
- ✅ `saaspayments`: Filtered by `userId`
- ✅ `setuprequests`: Filtered by `userId`
- ✅ `setuppayments`: Filtered by `userId`
- ✅ `connectedproviders`: Filtered by `userId`

**API Routes ensure user isolation**:
- All routes use `auth` middleware
- All queries filter by `req.user._id`
- Users can only access their own data

---

## 🎯 Frontend Data Requirements

### Dashboard Needs:
- User entitlements (saasPlan)
- Payment history (from `saaspayments`)
- Connected providers (from `connectedproviders`)

### SetupDashboard Needs:
- Setup requests with all details (from `setuprequests`)
- Payment history (from `setuppayments`)
- Status tracking

### Payment Page Needs:
- User info
- Package info
- Payment creation

---

## ✅ Next Steps

1. Update User model to include `company`
2. Update SetupRequest model to include all form fields
3. Standardize collection names
4. Test all relationships
5. Create migration script to clean duplicates

