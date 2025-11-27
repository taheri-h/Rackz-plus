require("dotenv").config();
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const Stripe = require("stripe");
const connectDB = require("./config/database");

// Import routes
const authRoutes = require("./routes/auth");
const paymentRoutes = require("./routes/payments");
const setupRoutes = require("./routes/setup");
const providerRoutes = require("./routes/providers");
const passwordResetRoutes = require("./routes/passwordReset");

// Initialize Express app
const app = express();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// Simple in-memory state store (sufficient for development)
const validStates = new Set();

// Connect to MongoDB
connectDB();

// Dynamic CORS configuration
const getCorsOrigin = () => {
  // If FRONTEND_URL is set, use it
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL;
  }

  // In development, allow localhost
  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }

  // In production, allow same origin (for relative paths)
  return true; // Allow same origin
};

// Middleware
app.use(
  cors({
    origin: getCorsOrigin(),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// Health check route
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Rackz API is running" });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/setup", setupRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/password-reset", passwordResetRoutes);

// ========== STRIPE CONNECT ROUTES ==========

// 1) Get Stripe Connect URL
app.get("/api/stripe/connect-url", (req, res) => {
  try {
    const state = crypto.randomBytes(16).toString("hex");
    validStates.add(state);

    const params = new URLSearchParams({
      response_type: "code",
      client_id: process.env.STRIPE_CLIENT_ID,
      scope: "read_write",
      redirect_uri: process.env.STRIPE_REDIRECT_URI,
      state,
    });

    const url = `https://connect.stripe.com/oauth/authorize?${params.toString()}`;

    res.json({ url });
  } catch (err) {
    console.error("Error creating Stripe connect URL:", err);
    res.status(500).json({ error: "Failed to create Stripe connect URL" });
  }
});

// 2) Stripe OAuth callback
app.get("/api/stripe/callback", async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state) {
    return res.status(400).send("Missing code or state");
  }

  const stateStr = state.toString();
  if (!validStates.has(stateStr)) {
    return res.status(400).send("Invalid state");
  }
  validStates.delete(stateStr);

  try {
    const tokenResponse = await stripe.oauth.token({
      grant_type: "authorization_code",
      code: code.toString(),
    });

    const connectedAccountId = tokenResponse.stripe_user_id; // acct_xxx
    const scope = tokenResponse.scope;

    console.log("✅ Connected Stripe account:", connectedAccountId);
    console.log("scope:", scope);

    // TODO: Persist connectedAccountId (and other details) to your DB with the current user

    res.send(
      "Stripe connected successfully. Check server logs for the connected acct_ id."
    );
    // Or alternatively:
    // res.redirect(`${process.env.APP_URL}/some-frontend-page`);
  } catch (err) {
    console.error("Stripe OAuth error:", err);
    res.status(500).send("Stripe OAuth failed");
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  // Log error details in development, generic message in production
  if (process.env.NODE_ENV === "development") {
    console.error("Error:", err);
  } else {
    console.error("Internal server error");
  }
  res.status(500).json({ error: "Internal server error" });
});

// Start server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  if (process.env.NODE_ENV !== "production") {
    console.log(`📡 API available at http://localhost:${PORT}/api`);
    console.log(
      `🌐 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`
    );
  } else {
    console.log(`📡 API available at /api`);
  }
});
