require("dotenv").config();
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const Stripe = require("stripe");
const connectDB = require("./config/database");
const { getRecentPayments } = require("./utils/stripePayments");
const auth = require("./middleware/auth");
const User = require("./models/User");
const ConnectedProvider = require("./models/ConnectedProvider");

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

// Simple in-memory state store mapping state -> userId (sufficient for development)
const validStates = new Map();

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

// 1) Get Stripe Connect URL (requires authenticated user)
app.get("/api/stripe/connect-url", auth, (req, res) => {
  try {
    const state = crypto.randomBytes(16).toString("hex");
    // Associate this state with the current user
    validStates.set(state, req.user._id.toString());

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
  const userId = validStates.get(stateStr);
  if (!userId) {
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

    // Persist connectedAccountId (and other details) to your DB with the current user
    if (userId && connectedAccountId) {
      try {
        const user = await User.findById(userId);
        if (user) {
          user.stripeAccountId = connectedAccountId;
          await user.save();
        }

        // Upsert ConnectedProvider document for Stripe
        await ConnectedProvider.findOneAndUpdate(
          { userId, provider: "stripe" },
          {
            userId,
            provider: "stripe",
            status: "connected",
            metadata: {
              stripeAccountId: connectedAccountId,
              scope,
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } catch (dbErr) {
        console.error("Error saving Stripe account to user:", dbErr);
      }
    }

    // After successful connection, redirect back to the frontend dashboard
    const frontendBase = process.env.FRONTEND_URL || "http://localhost:3000";

    // You can read this flag on the frontend (e.g. from query params) to show a success toast
    const redirectUrl = `${frontendBase}/dashboard?stripeConnected=1`;

    return res.redirect(302, redirectUrl);
  } catch (err) {
    console.error("Stripe OAuth error:", err);
    res.status(500).send("Stripe OAuth failed");
  }
});

// 3) Get basic Stripe account data for the authenticated user
app.get("/api/stripe/account", auth, async (req, res) => {
  try {
    const user = req.user;

    if (!user.stripeAccountId) {
      return res.json({ connected: false });
    }

    try {
      const account = await stripe.accounts.retrieve(user.stripeAccountId);
      return res.json({
        connected: true,
        account,
      });
    } catch (stripeErr) {
      console.error("Error fetching Stripe account:", stripeErr);
      return res.status(500).json({
        connected: false,
        error: "Failed to fetch Stripe account",
      });
    }
  } catch (err) {
    console.error("Stripe account route error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 4) Get recent Stripe charges for the authenticated user's connected account
app.get("/api/stripe/charges", auth, async (req, res) => {
  try {
    const user = req.user;

    if (!user.stripeAccountId) {
      return res.status(400).json({
        error: "No Stripe account connected",
      });
    }

    try {
      // Optional time range filter (days). Defaults to 30 if not provided.
      const rangeDays = parseInt(req.query.rangeDays, 10);
      const allowedRanges = [7, 30, 90, 180, 365];
      const effectiveRange =
        !isNaN(rangeDays) && allowedRanges.includes(rangeDays) ? rangeDays : 30;

      const nowSeconds = Math.floor(Date.now() / 1000);
      const sinceSeconds = nowSeconds - effectiveRange * 24 * 60 * 60;

      const { payments } = await getRecentPayments(
        stripe,
        user.stripeAccountId,
        {
          limit: 20,
          createdGte: sinceSeconds,
        }
      );

      const mapped = payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        created: p.created,
        description: null,
        customer: p.customer,
        paid: p.paid,
        failure_code: p.failure_code,
        failure_message: p.failure_message,
      }));

      return res.json({
        connected: true,
        charges: mapped,
        rangeDays: effectiveRange,
      });
    } catch (stripeErr) {
      console.error("Error fetching Stripe charges:", stripeErr);
      return res.status(500).json({
        error: "Failed to fetch Stripe charges",
      });
    }
  } catch (err) {
    console.error("Stripe charges route error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 5) Get subscriptions for the authenticated user's connected account
app.get("/api/stripe/subscriptions", auth, async (req, res) => {
  try {
    const user = req.user;

    if (!user.stripeAccountId) {
      return res.status(400).json({
        error: "No Stripe account connected",
      });
    }

    try {
      const subscriptions = await stripe.subscriptions.list(
        {
          limit: 20,
          status: "all",
          expand: ["data.customer", "data.items.data.price"],
        },
        {
          stripeAccount: user.stripeAccountId,
        }
      );

      // Collect unique product IDs from prices
      const productIds = new Set();
      for (const sub of subscriptions.data) {
        for (const item of sub.items.data) {
          const priceObj = typeof item.price === "string" ? null : item.price;
          const productId =
            priceObj && typeof priceObj.product === "string"
              ? priceObj.product
              : null;
          if (productId) {
            productIds.add(productId);
          }
        }
      }

      // Fetch product details to get human-readable names
      const productNameMap = new Map();
      if (productIds.size > 0) {
        try {
          const products = await stripe.products.list(
            {
              ids: Array.from(productIds),
              limit: productIds.size,
            },
            {
              stripeAccount: user.stripeAccountId,
            }
          );
          for (const product of products.data) {
            productNameMap.set(product.id, product.name);
          }
        } catch (productErr) {
          console.error("Error fetching Stripe products:", productErr);
        }
      }

      const mapped = subscriptions.data.map((sub) => {
        const customerObj =
          typeof sub.customer === "string" ? null : sub.customer;

        return {
          id: sub.id,
          status: sub.status,
          created: sub.created,
          current_period_end: sub.current_period_end,
          cancel_at_period_end: sub.cancel_at_period_end,
          canceled_at: sub.canceled_at,
          customerId:
            typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
          customerEmail: customerObj?.email || null,
          customerName: customerObj?.name || null,
          items: sub.items.data.map((item) => {
            const priceObj = typeof item.price === "string" ? null : item.price;
            const rawProductId =
              priceObj && typeof priceObj.product === "string"
                ? priceObj.product
                : null;

            return {
              id: item.id,
              priceId: priceObj?.id || null,
              priceNickname: priceObj?.nickname || null,
              productId: rawProductId,
              productName: rawProductId
                ? productNameMap.get(rawProductId) || null
                : null,
              amount: priceObj?.unit_amount || null,
              currency: priceObj?.currency || null,
              interval: priceObj?.recurring?.interval || null,
            };
          }),
        };
      });

      return res.json({
        connected: true,
        subscriptions: mapped,
      });
    } catch (stripeErr) {
      console.error("Error fetching Stripe subscriptions:", stripeErr);
      return res.status(500).json({
        error: "Failed to fetch Stripe subscriptions",
      });
    }
  } catch (err) {
    console.error("Stripe subscriptions route error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 6) Get summary metrics (last 30 days) for the authenticated user's connected account
app.get("/api/stripe/summary", auth, async (req, res) => {
  try {
    const user = req.user;

    if (!user.stripeAccountId) {
      return res.status(400).json({
        error: "No Stripe account connected",
      });
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    const rangeDays = parseInt(req.query.rangeDays, 10);
    const allowedRanges = [7, 30, 90, 180, 365];
    const effectiveRange =
      !isNaN(rangeDays) && allowedRanges.includes(rangeDays) ? rangeDays : 30;

    const offsetDaysRaw = parseInt(req.query.offsetDays, 10);
    const offsetDays =
      !isNaN(offsetDaysRaw) && offsetDaysRaw >= 0 ? offsetDaysRaw : 0;

    const periodEnd = nowSeconds - offsetDays * 24 * 60 * 60;
    const periodStart = periodEnd - effectiveRange * 24 * 60 * 60;

    try {
      const { payments } = await getRecentPayments(
        stripe,
        user.stripeAccountId,
        {
          limit: 100,
          createdGte: periodStart,
          createdLte: periodEnd,
        }
      );

      let totalVolume = 0;
      let totalCount = 0;
      let failedCount = 0;

      for (const p of payments) {
        totalCount += 1;
        if (p.paid) {
          totalVolume += p.amount;
        } else {
          failedCount += 1;
        }
      }

      return res.json({
        connected: true,
        totalVolume, // in smallest currency unit (e.g. cents)
        currency: payments[0]?.currency || null,
        totalCount,
        failedCount,
        periodStart,
        periodEnd,
        rangeDays: effectiveRange,
      });
    } catch (stripeErr) {
      console.error("Error fetching Stripe summary:", stripeErr);
      return res.status(500).json({
        error: "Failed to fetch Stripe summary",
      });
    }
  } catch (err) {
    console.error("Stripe summary route error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 7) Get failure reasons and revenue at risk for the authenticated user's connected account
app.get("/api/stripe/failures-summary", auth, async (req, res) => {
  try {
    const user = req.user;

    if (!user.stripeAccountId) {
      return res.status(400).json({
        error: "No Stripe account connected",
      });
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    const rangeDays = parseInt(req.query.rangeDays, 10);
    const allowedRanges = [7, 30, 90];
    const effectiveRange =
      !isNaN(rangeDays) && allowedRanges.includes(rangeDays) ? rangeDays : 7;
    const sinceSeconds = nowSeconds - effectiveRange * 24 * 60 * 60;

    try {
      const { payments } = await getRecentPayments(
        stripe,
        user.stripeAccountId,
        {
          limit: 100,
          createdGte: sinceSeconds,
        }
      );

      const reasonsMap = new Map();
      let totalFailedAmount = 0;

      for (const p of payments) {
        if (p.paid) continue;

        const reason =
          p.failure_code ||
          (p.failure_message &&
            p.failure_message.toLowerCase().includes("insufficient"))
            ? "insufficient_funds"
            : p.failure_code || "other";

        const amount = p.amount || 0;
        totalFailedAmount += amount;

        const existing = reasonsMap.get(reason) || {
          reason,
          count: 0,
          amount: 0,
        };
        existing.count += 1;
        existing.amount += amount;
        reasonsMap.set(reason, existing);
      }

      const reasons = Array.from(reasonsMap.values()).sort(
        (a, b) => b.amount - a.amount
      );

      return res.json({
        connected: true,
        rangeDays: effectiveRange,
        totalFailedAmount,
        currency: payments[0]?.currency || null,
        reasons,
      });
    } catch (stripeErr) {
      console.error("Error fetching Stripe failures summary:", stripeErr);
      return res.status(500).json({
        error: "Failed to fetch Stripe failures summary",
      });
    }
  } catch (err) {
    console.error("Stripe failures summary route error:", err);
    res.status(500).json({ error: "Internal server error" });
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
