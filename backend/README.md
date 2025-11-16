# Fynteq Backend API

Backend API for Fynteq SaaS application using Node.js, Express, and MongoDB.

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

The `.env` file is already created with your MongoDB connection. Make sure to:

- Update `JWT_SECRET` to a strong random string (use a password generator)
- Update `FRONTEND_URL` when you deploy your frontend

### 3. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Sign in user
- `GET /api/auth/me` - Get current user (requires auth)

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

## Database Collections

- `users` - User accounts
- `saaspayments` - SaaS subscription payments
- `setuprequests` - Setup service requests
- `setuppayments` - Setup service payments
- `connectedproviders` - Connected payment providers

## Next Steps

1. Test the API endpoints using Postman or curl
2. Update your frontend to use these API endpoints
3. Add Stripe webhook handling (optional)
4. Deploy to a hosting service (Render, Railway, etc.)

