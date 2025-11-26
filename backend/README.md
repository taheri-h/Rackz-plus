# Rackz Backend API

Backend API for Rackz SaaS application using Node.js, Express, and MongoDB.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
Create/update `.env` file:
```env
MONGODB_URI="mongodb://username:password@host:port/database?authSource=admin"
MONGODB_DB="rackz_saas"
PORT=5001
NODE_ENV=development
JWT_SECRET="your-strong-secret-key"
FRONTEND_URL="http://localhost:3000"
```

### 3. Start Server
```bash
# Development
npm run dev

# Production
npm start
```

Server runs on `http://localhost:5001`

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Sign in user
- `GET /api/auth/me` - Get current user (requires auth)

### Password Reset
- `POST /api/password-reset/forgot` - Request password reset
- `POST /api/password-reset/verify` - Verify reset token
- `POST /api/password-reset/reset` - Reset password with token
- `POST /api/password-reset/change` - Change password (authenticated)

### SaaS Payments
- `POST /api/payments/saas` - Create SaaS payment record
- `GET /api/payments/saas` - Get user's SaaS payments

### Setup Services
- `POST /api/setup/request` - Create setup request
- `POST /api/setup/payment` - Create setup payment (upfront/final)
- `GET /api/setup/requests` - Get user's setup requests
- `GET /api/setup/status/:requestId` - Get setup request status

### Payment Providers
- `POST /api/providers/connect` - Connect a payment provider
- `DELETE /api/providers/:provider` - Disconnect a provider
- `GET /api/providers` - Get user's connected providers

---

## 📦 Database Collections

- `users` - User accounts
- `saaspayments` - SaaS subscription payments
- `setuprequests` - Setup service requests
- `setuppayments` - Setup service payments
- `connectedproviders` - Connected payment providers
- `passwordresets` - Password reset tokens

---

## 🔒 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT authentication
- ✅ User data isolation
- ✅ Secure password reset tokens
- ✅ Token expiration (1 hour)
- ✅ One-time use tokens

---

## 🚨 Important Notes

1. **JWT Secret**: Change `JWT_SECRET` to a strong random string before production
2. **CORS**: Update `FRONTEND_URL` when you deploy your frontend
3. **MongoDB**: Ensure MongoDB server is accessible
4. **Amounts**: All prices stored in **cents** (e.g., $29 = 2900 cents)

---

## 🐛 Troubleshooting

**MongoDB Connection Error**:
- Check if MongoDB server is running
- Verify `MONGODB_URI` and `MONGODB_DB` in `.env`
- Check firewall/network settings

**Port Already in Use**:
- Change `PORT` in `.env` to a different port

**CORS Errors**:
- Update `FRONTEND_URL` in `.env` to match your frontend URL

---

## 📝 License

ISC
