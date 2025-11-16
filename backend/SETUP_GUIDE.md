# Backend Setup Guide

## ✅ What's Been Created

Your backend is fully set up with:

1. **MongoDB Models** (5 collections):
   - `User` - User accounts with authentication
   - `SaasPayment` - SaaS subscription payments
   - `SetupRequest` - Setup service requests
   - `SetupPayment` - Setup service payments (upfront/final)
   - `ConnectedProvider` - Connected payment providers

2. **API Routes**:
   - `/api/auth` - Signup, Signin, Get current user
   - `/api/payments` - SaaS payment management
   - `/api/setup` - Setup service requests and payments
   - `/api/providers` - Payment provider connections

3. **Authentication**: JWT-based authentication middleware

## 🚀 Quick Start

### 1. Install Dependencies (Already Done)
```bash
cd backend
npm install
```

### 2. Configure Environment
The `.env` file is already created with your MongoDB connection:
- `MONGODB_URI="mongodb://api.waybanq.com:27017"`
- `MONGODB_DB="fynteq_saas"`

**⚠️ Important**: Change `JWT_SECRET` to a strong random string before production!

### 3. Start the Server

**Development mode (auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server will run on `http://localhost:5000`

## 📡 API Endpoints

### Authentication
```
POST /api/auth/signup
Body: { email, password, name }
Response: { token, user: { id, email, name, entitlements } }

POST /api/auth/signin
Body: { email, password }
Response: { token, user: { id, email, name, entitlements } }

GET /api/auth/me
Headers: Authorization: Bearer <token>
Response: { user: { id, email, name, entitlements } }
```

### SaaS Payments
```
POST /api/payments/saas
Headers: Authorization: Bearer <token>
Body: { plan: 'starter'|'pro'|'scale', billingCycle: 'monthly'|'yearly', amountCents, status?, providerPaymentId? }
Response: { payment: { id, plan, billingCycle, amountCents, status, createdAt } }

GET /api/payments/saas
Headers: Authorization: Bearer <token>
Response: { payments: [...] }
```

### Setup Services
```
POST /api/setup/request
Headers: Authorization: Bearer <token>
Body: { packageName: 'checkout'|'subscriptions'|'crm'|'marketplace', contactMethod: 'email'|'phone'|'whatsapp', details? }
Response: { setupRequest: { id, packageName, fullPriceCents, upfrontPaidCents, remainingCents, status, ... } }

POST /api/setup/payment
Headers: Authorization: Bearer <token>
Body: { setupRequestId, chargeType: 'upfront'|'final', amountCents, status?, providerPaymentId? }
Response: { payment: {...}, setupRequest: {...} }

GET /api/setup/requests
Headers: Authorization: Bearer <token>
Response: { requests: [...] }

GET /api/setup/status/:requestId
Headers: Authorization: Bearer <token>
Response: { setupRequest: {...}, payments: [...] }
```

### Payment Providers
```
POST /api/providers/connect
Headers: Authorization: Bearer <token>
Body: { provider: 'stripe'|'paypal'|'shopify'|'adyen', metadata? }
Response: { provider: { id, provider, status, metadata } }

DELETE /api/providers/:provider
Headers: Authorization: Bearer <token>
Response: { message: 'Provider disconnected', provider: {...} }

GET /api/providers
Headers: Authorization: Bearer <token>
Response: { providers: [...] }
```

## 🧪 Testing the API

### Test Health Endpoint
```bash
curl http://localhost:5000/health
```

### Test Signup
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'
```

### Test Signin
```bash
curl -X POST http://localhost:5000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

Save the `token` from the response, then use it:

### Test Protected Route
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🔗 Next Steps: Connect Frontend

1. **Update Frontend Environment**:
   Create/update `.env` in your frontend root:
   ```
   REACT_APP_API_URL=http://localhost:5000
   ```

2. **Update AuthContext** to use the API:
   - Replace local storage auth with API calls
   - Store JWT token in sessionStorage
   - Send `Authorization: Bearer <token>` header on API calls

3. **Update Payment Pages** to save to database:
   - After payment success, call `POST /api/payments/saas` or `POST /api/setup/payment`
   - Update user entitlements

4. **Update Dashboard** to load from database:
   - Load payments from `GET /api/payments/saas`
   - Load setup requests from `GET /api/setup/requests`
   - Load connected providers from `GET /api/providers`

## 📦 Database Collections

Your MongoDB database `fynteq_saas` will have these collections:
- `users`
- `saaspayments`
- `setuprequests`
- `setuppayments`
- `connectedproviders`

## 🚨 Important Notes

1. **JWT Secret**: Change `JWT_SECRET` in `.env` to a strong random string before production
2. **CORS**: Update `FRONTEND_URL` in `.env` when you deploy your frontend
3. **MongoDB**: Make sure your MongoDB server is accessible from where you're running the backend
4. **Amounts**: All prices are stored in **cents** (e.g., €29 = 2900 cents)

## 🐛 Troubleshooting

**MongoDB Connection Error**:
- Check if MongoDB server is running
- Verify `MONGODB_URI` and `MONGODB_DB` in `.env`
- Check firewall/network settings

**Port Already in Use**:
- Change `PORT` in `.env` to a different port (e.g., 5001)

**CORS Errors**:
- Update `FRONTEND_URL` in `.env` to match your frontend URL

