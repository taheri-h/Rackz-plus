require("dotenv").config();
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const Stripe = require("stripe");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/database");
const { getRecentPayments } = require("./utils/stripePayments");
const { sendAlertEmail } = require("./utils/email");
const {
  invalidateUserStripeCache,
  invalidateStripeAccountCache,
  invalidateSpecificCache,
} = require("./utils/cacheInvalidation");
const auth = require("./middleware/auth");
const User = require("./models/User");
const ConnectedProvider = require("./models/ConnectedProvider");
const WebhookEvent = require("./models/WebhookEvent");
const StripeChargesCache = require("./models/StripeChargesCache");
const StripeSubscriptionsCache = require("./models/StripeSubscriptionsCache");
const StripeSummaryCache = require("./models/StripeSummaryCache");

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

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit auth endpoints to 5 requests per windowMs
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(
  cors({
    origin: getCorsOrigin(),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Apply rate limiting to all API routes except webhooks
app.use("/api/", apiLimiter);

// Stripe webhook endpoint must use raw body, so register it before JSON parser
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || null;

app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    let event;

    const sig = req.headers["stripe-signature"];

    if (stripeWebhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          stripeWebhookSecret
        );
      } catch (err) {
        console.error("❌ Stripe webhook signature verification failed:", err);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
    } else {
      // No secret configured – accept the event without verification (dev only)
      try {
        event = JSON.parse(req.body);
      } catch (err) {
        console.error("❌ Failed to parse Stripe webhook body:", err);
        return res.status(400).send("Invalid webhook payload");
      }
    }

    try {
      const { id, type, created, data, livemode, account, request } = event;

      const relatedObjectId =
        data && data.object && (data.object.id || data.object.payment_intent);

      await WebhookEvent.create({
        eventId: id,
        type,
        account: account || null,
        apiVersion: event.api_version || null,
        createdAt: new Date(created * 1000),
        livemode: !!livemode,
        requestId: request && request.id ? request.id : null,
        relatedObjectId: relatedObjectId || null,
        raw: event,
        status: "received",
      });

      // Basic routing for important events – invalidate cache when transactions change
      const stripeAccountId = account || null;
      
      if (stripeAccountId) {
        // Invalidate cache for this Stripe account when relevant events occur
        switch (type) {
          case "payment_intent.succeeded":
          case "payment_intent.payment_failed":
          case "payment_intent.canceled":
          case "charge.succeeded":
          case "charge.failed":
          case "charge.refunded":
          case "charge.updated":
          case "checkout.session.completed":
          case "checkout.session.expired":
          case "checkout.session.async_payment_succeeded":
          case "checkout.session.async_payment_failed":
            // Invalidate charges and summary cache (subscriptions might be affected too)
            if (process.env.NODE_ENV === 'development') {
              console.log(`🔄 Invalidating cache due to ${type} event for account ${stripeAccountId}`);
            }
            await invalidateStripeAccountCache(stripeAccountId, `Webhook: ${type}`);
            break;
          
          case "customer.subscription.created":
          case "customer.subscription.updated":
          case "customer.subscription.deleted":
          case "customer.subscription.trial_will_end":
          case "invoice.payment_succeeded":
          case "invoice.payment_failed":
            // Invalidate subscriptions and summary cache
            if (process.env.NODE_ENV === 'development') {
              console.log(`🔄 Invalidating subscription cache due to ${type} event for account ${stripeAccountId}`);
            }
            await invalidateStripeAccountCache(stripeAccountId, `Webhook: ${type}`);
            break;
          
          default:
            // For other events, we still store them but don't invalidate cache
            break;
        }
      }

      res.json({ received: true });
    } catch (err) {
      console.error("❌ Error handling Stripe webhook:", err);
      res.status(500).send("Webhook handler error");
    }
  }
);

// JSON parsers for the rest of the API
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
app.use("/api/auth", authLimiter, authRoutes);
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

      // Check if force refresh is requested
      const forceRefresh = req.query.forceRefresh === "true" || req.query.forceRefresh === "1";
      
      // Cache TTL: 5 minutes (300 seconds)
      const CACHE_TTL_MS = 5 * 60 * 1000;

      // If force refresh, delete cache first
      if (forceRefresh) {
        await StripeChargesCache.deleteMany({
          userId: user._id,
          rangeDays: effectiveRange,
        });
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔄 Force refresh requested - cleared cache for user ${user._id}, rangeDays: ${effectiveRange}`);
        }
      }

      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        let cachedData = await StripeChargesCache.findOne({
          userId: user._id,
          rangeDays: effectiveRange,
        });

        // If cache exists and is fresh, return it
        if (cachedData && cachedData.cachedAt) {
          const cacheAge = Date.now() - new Date(cachedData.cachedAt).getTime();
        if (cacheAge < CACHE_TTL_MS) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Returning cached charges for user ${user._id}, rangeDays: ${effectiveRange}`);
          }
          return res.json({
              connected: true,
              charges: cachedData.charges,
              rangeDays: effectiveRange,
              cached: true,
            });
          }
        }
      }

      // Cache miss or stale - fetch from Stripe
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔄 Fetching fresh charges from Stripe for user ${user._id}, rangeDays: ${effectiveRange}`);
      }
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

      // Save to cache (upsert)
      await StripeChargesCache.findOneAndUpdate(
        { userId: user._id, rangeDays: effectiveRange },
        {
          userId: user._id,
          stripeAccountId: user.stripeAccountId,
          rangeDays: effectiveRange,
          charges: mapped,
          cachedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      return res.json({
        connected: true,
        charges: mapped,
        rangeDays: effectiveRange,
        cached: false,
      });
    } catch (stripeErr) {
      console.error("Error fetching Stripe charges:", stripeErr);
      
      // Try to return stale cache if available
      try {
        const staleCache = await StripeChargesCache.findOne({
          userId: user._id,
          rangeDays: parseInt(req.query.rangeDays, 10) || 30,
        });
        if (staleCache && staleCache.charges) {
          if (process.env.NODE_ENV === 'development') {
            console.log("⚠️ Returning stale cache due to Stripe API error");
          }
          return res.json({
            connected: true,
            charges: staleCache.charges,
            rangeDays: staleCache.rangeDays,
            cached: true,
            stale: true,
          });
        }
      } catch (cacheErr) {
        // Ignore cache errors
      }
      
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
      // Check if force refresh is requested
      const forceRefresh = req.query.forceRefresh === "true" || req.query.forceRefresh === "1";
      
      // Cache TTL: 5 minutes (300 seconds)
      const CACHE_TTL_MS = 5 * 60 * 1000;

      // If force refresh, delete cache first
      if (forceRefresh) {
        await StripeSubscriptionsCache.deleteMany({
          userId: user._id,
        });
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔄 Force refresh requested - cleared subscriptions cache for user ${user._id}`);
        }
      }

      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        let cachedData = await StripeSubscriptionsCache.findOne({
          userId: user._id,
        });

        // If cache exists and is fresh, return it
        if (cachedData && cachedData.cachedAt) {
          const cacheAge = Date.now() - new Date(cachedData.cachedAt).getTime();
        if (cacheAge < CACHE_TTL_MS) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Returning cached subscriptions for user ${user._id}`);
          }
          return res.json({
              connected: true,
              subscriptions: cachedData.subscriptions,
              cached: true,
            });
          }
        }
      }

      // Cache miss or stale - fetch from Stripe
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔄 Fetching fresh subscriptions from Stripe for user ${user._id}`);
      }
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

      // Save to cache (upsert)
      await StripeSubscriptionsCache.findOneAndUpdate(
        { userId: user._id },
        {
          userId: user._id,
          stripeAccountId: user.stripeAccountId,
          subscriptions: mapped,
          cachedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      return res.json({
        connected: true,
        subscriptions: mapped,
        cached: false,
      });
    } catch (stripeErr) {
      console.error("Error fetching Stripe subscriptions:", stripeErr);
      
      // Try to return stale cache if available
      try {
        const staleCache = await StripeSubscriptionsCache.findOne({
          userId: user._id,
        });
        if (staleCache && staleCache.subscriptions) {
          if (process.env.NODE_ENV === 'development') {
            console.log("⚠️ Returning stale cache due to Stripe API error");
          }
          return res.json({
            connected: true,
            subscriptions: staleCache.subscriptions,
            cached: true,
            stale: true,
          });
        }
      } catch (cacheErr) {
        // Ignore cache errors
      }
      
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

    // Check if force refresh is requested
    const forceRefresh = req.query.forceRefresh === "true" || req.query.forceRefresh === "1";
    
    // Cache TTL: 5 minutes (300 seconds)
    const CACHE_TTL_MS = 5 * 60 * 1000;

    // If force refresh, delete cache first
    if (forceRefresh) {
      await StripeSummaryCache.deleteMany({
        userId: user._id,
        rangeDays: effectiveRange,
        offsetDays: offsetDays,
      });
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔄 Force refresh requested - cleared summary cache for user ${user._id}, rangeDays: ${effectiveRange}, offsetDays: ${offsetDays}`);
      }
    }

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      let cachedData = await StripeSummaryCache.findOne({
        userId: user._id,
        rangeDays: effectiveRange,
        offsetDays: offsetDays,
      });

      // If cache exists and is fresh, return it
      if (cachedData && cachedData.cachedAt) {
        const cacheAge = Date.now() - new Date(cachedData.cachedAt).getTime();
        if (cacheAge < CACHE_TTL_MS) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Returning cached summary for user ${user._id}, rangeDays: ${effectiveRange}, offsetDays: ${offsetDays}`);
          }
          return res.json({
            connected: true,
            ...cachedData.summary,
            rangeDays: effectiveRange,
            offsetDays: offsetDays,
            cached: true,
          });
        }
      }
    }

    // Cache miss or stale - fetch from Stripe
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 Fetching fresh summary from Stripe for user ${user._id}, rangeDays: ${effectiveRange}, offsetDays: ${offsetDays}`);
    }
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
      let currency = null;

      for (const p of payments) {
        totalCount += 1;
        if (!currency && p.currency) {
          currency = p.currency;
        }
        if (p.paid) {
          totalVolume += p.amount;
        } else {
          failedCount += 1;
        }
      }

      const summary = {
        totalVolume,
        currency,
        totalCount,
        failedCount,
      };

      // Save to cache (upsert)
      await StripeSummaryCache.findOneAndUpdate(
        { userId: user._id, rangeDays: effectiveRange, offsetDays: offsetDays },
        {
          userId: user._id,
          stripeAccountId: user.stripeAccountId,
          rangeDays: effectiveRange,
          offsetDays: offsetDays,
          summary: summary,
          cachedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      return res.json({
        connected: true,
        ...summary,
        periodStart,
        periodEnd,
        rangeDays: effectiveRange,
        offsetDays: offsetDays,
        cached: false,
      });
    } catch (stripeErr) {
      console.error("Error fetching Stripe summary:", stripeErr);
      
      // Try to return stale cache if available
      try {
        const staleCache = await StripeSummaryCache.findOne({
          userId: user._id,
          rangeDays: effectiveRange,
          offsetDays: offsetDays,
        });
        if (staleCache && staleCache.summary) {
          if (process.env.NODE_ENV === 'development') {
            console.log("⚠️ Returning stale cache due to Stripe API error");
          }
          return res.json({
            connected: true,
            ...staleCache.summary,
            rangeDays: effectiveRange,
            offsetDays: offsetDays,
            cached: true,
            stale: true,
          });
        }
      } catch (cacheErr) {
        // Ignore cache errors
      }
      
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

// 8) Manual cache invalidation endpoint (for testing/admin)
app.post("/api/stripe/invalidate-cache", auth, async (req, res) => {
  try {
    const user = req.user;

    if (!user.stripeAccountId) {
      return res.status(400).json({
        error: "No Stripe account connected",
      });
    }

    const { type, rangeDays } = req.body; // type: 'all' | 'charges' | 'subscriptions' | 'summary'

    let result;
    if (type === "all") {
      result = await invalidateUserStripeCache(user._id, "Manual API call");
    } else {
      result = await invalidateSpecificCache(user._id, {
        charges: type === "charges" || !type,
        subscriptions: type === "subscriptions" || !type,
        summary: type === "summary" || !type,
        rangeDays: rangeDays || null,
      });
    }

    return res.json({
      success: true,
      message: "Cache invalidated successfully",
      deleted: result,
    });
  } catch (err) {
    console.error("Cache invalidation error:", err);
    res.status(500).json({ error: "Failed to invalidate cache" });
  }
});

// 9) Check failed payment alerts (24h) and send emails if threshold exceeded
// Intended to be called by a cron/uptime monitor with a shared secret key
app.post("/api/alerts/check-failed-payments", async (req, res) => {
  try {
    const cronKey = process.env.ALERT_CRON_KEY;
    if (cronKey && req.query.key !== cronKey) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const threshold =
      parseFloat(process.env.ALERT_FAILURE_RATE_THRESHOLD || "0.05") || 0.05;

    const nowSeconds = Math.floor(Date.now() / 1000);
    const sinceSeconds = nowSeconds - 24 * 60 * 60;

    const users = await User.find({
      stripeAccountId: { $ne: null },
      email: { $ne: null },
    });

    let alertsSent = 0;

    for (const user of users) {
      try {
        const { payments } = await getRecentPayments(
          stripe,
          user.stripeAccountId,
          {
            limit: 200,
            createdGte: sinceSeconds,
          }
        );

        if (!payments.length) continue;

        let total = 0;
        let failed = 0;
        let failedAmount = 0;
        let currency = null;

        for (const p of payments) {
          total += 1;
          if (!currency && p.currency) {
            currency = p.currency.toUpperCase();
          }
          if (!p.paid) {
            failed += 1;
            failedAmount += p.amount || 0;
          }
        }

        if (total === 0 || failed === 0) continue;

        const failureRate = failed / total;
        if (failureRate <= threshold) continue;

        const pct = (failureRate * 100).toFixed(2);
        const amountStr = (failedAmount / 100).toFixed(2);

        const subject = `Rackz Alert: Failed payments ${pct}% in last 24h`;
        const text = [
          `Hi ${user.name || ""},`,
          ``,
          `In the last 24 hours, your connected Stripe account had:`,
          `- Total payments: ${total}`,
          `- Failed payments: ${failed}`,
          `- Failure rate: ${pct}%`,
          `- Revenue at risk: ${amountStr} ${currency || ""}`,
          ``,
          `Log into your Rackz dashboard for details by failure reason and affected customers.`,
        ].join("\n");

        if (process.env.SMTP_HOST) {
          await sendAlertEmail(user.email, subject, text);
          alertsSent += 1;
        }
      } catch (err) {
        console.error(
          `Error checking failed payments for user ${user._id}:`,
          err
        );
      }
    }

    res.json({
      processedUsers: users.length,
      alertsSent,
      threshold,
    });
  } catch (err) {
    console.error("Failed payment alert check error:", err);
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
