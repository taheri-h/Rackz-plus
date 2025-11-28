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
  max: 10, // Limit auth endpoints to 10 requests per windowMs (increased from 5)
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
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
            if (process.env.NODE_ENV === "development") {
              console.log(
                `🔄 Invalidating cache due to ${type} event for account ${stripeAccountId}`
              );
            }
            await invalidateStripeAccountCache(
              stripeAccountId,
              `Webhook: ${type}`
            );
            break;

          case "customer.subscription.created":
          case "customer.subscription.updated":
          case "customer.subscription.deleted":
          case "customer.subscription.trial_will_end":
          case "invoice.payment_succeeded":
          case "invoice.payment_failed":
            // Invalidate subscriptions and summary cache
            if (process.env.NODE_ENV === "development") {
              console.log(
                `🔄 Invalidating subscription cache due to ${type} event for account ${stripeAccountId}`
              );
            }
            await invalidateStripeAccountCache(
              stripeAccountId,
              `Webhook: ${type}`
            );
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
      const forceRefresh =
        req.query.forceRefresh === "true" || req.query.forceRefresh === "1";

      // Cache TTL: 5 minutes (300 seconds)
      const CACHE_TTL_MS = 5 * 60 * 1000;

      // If force refresh, delete cache first
      if (forceRefresh) {
        await StripeChargesCache.deleteMany({
          userId: user._id,
          rangeDays: effectiveRange,
        });
        if (process.env.NODE_ENV === "development") {
          console.log(
            `🔄 Force refresh requested - cleared cache for user ${user._id}, rangeDays: ${effectiveRange}`
          );
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
            if (process.env.NODE_ENV === "development") {
              console.log(
                `✅ Returning cached charges for user ${user._id}, rangeDays: ${effectiveRange}`
              );
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
      if (process.env.NODE_ENV === "development") {
        console.log(
          `🔄 Fetching fresh charges from Stripe for user ${user._id}, rangeDays: ${effectiveRange}`
        );
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
          if (process.env.NODE_ENV === "development") {
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
      const forceRefresh =
        req.query.forceRefresh === "true" || req.query.forceRefresh === "1";

      // Cache TTL: 5 minutes (300 seconds)
      const CACHE_TTL_MS = 5 * 60 * 1000;

      // If force refresh, delete cache first
      if (forceRefresh) {
        await StripeSubscriptionsCache.deleteMany({
          userId: user._id,
        });
        if (process.env.NODE_ENV === "development") {
          console.log(
            `🔄 Force refresh requested - cleared subscriptions cache for user ${user._id}`
          );
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
            if (process.env.NODE_ENV === "development") {
              console.log(
                `✅ Returning cached subscriptions for user ${user._id}`
              );
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
      if (process.env.NODE_ENV === "development") {
        console.log(
          `🔄 Fetching fresh subscriptions from Stripe for user ${user._id}`
        );
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
          if (process.env.NODE_ENV === "development") {
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
    const forceRefresh =
      req.query.forceRefresh === "true" || req.query.forceRefresh === "1";

    // Cache TTL: 5 minutes (300 seconds)
    const CACHE_TTL_MS = 5 * 60 * 1000;

    // If force refresh, delete cache first
    if (forceRefresh) {
      await StripeSummaryCache.deleteMany({
        userId: user._id,
        rangeDays: effectiveRange,
        offsetDays: offsetDays,
      });
      if (process.env.NODE_ENV === "development") {
        console.log(
          `🔄 Force refresh requested - cleared summary cache for user ${user._id}, rangeDays: ${effectiveRange}, offsetDays: ${offsetDays}`
        );
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
          if (process.env.NODE_ENV === "development") {
            console.log(
              `✅ Returning cached summary for user ${user._id}, rangeDays: ${effectiveRange}, offsetDays: ${offsetDays}`
            );
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
    if (process.env.NODE_ENV === "development") {
      console.log(
        `🔄 Fetching fresh summary from Stripe for user ${user._id}, rangeDays: ${effectiveRange}, offsetDays: ${offsetDays}`
      );
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
          if (process.env.NODE_ENV === "development") {
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

// 8) Get Stripe disputes/chargebacks for Pro plan
app.get("/api/stripe/disputes", auth, async (req, res) => {
  try {
    const user = req.user;

    if (!user.stripeAccountId) {
      return res.status(400).json({
        error: "No Stripe account connected",
      });
    }

    try {
      const rangeDays = parseInt(req.query.rangeDays, 10) || 90;
      const nowSeconds = Math.floor(Date.now() / 1000);
      const sinceSeconds = nowSeconds - rangeDays * 24 * 60 * 60;

      const disputes = await stripe.disputes.list(
        {
          limit: 100,
          created: { gte: sinceSeconds },
        },
        {
          stripeAccount: user.stripeAccountId,
        }
      );

      // Group by status
      const statusCounts = {
        warning_needs_response: 0,
        warning_under_review: 0,
        needs_response: 0,
        under_review: 0,
        charge_refunded: 0,
        won: 0,
        lost: 0,
      };

      let totalAmount = 0;
      let wonAmount = 0;
      let lostAmount = 0;
      let evidenceDueCount = 0;
      const now = Date.now() / 1000;

      disputes.data.forEach((dispute) => {
        const status = dispute.status;
        if (statusCounts.hasOwnProperty(status)) {
          statusCounts[status] += 1;
        }

        const amount = dispute.amount || 0;
        totalAmount += amount;

        if (status === "won") {
          wonAmount += amount;
        } else if (status === "lost" || status === "charge_refunded") {
          lostAmount += amount;
        }

        // Check if evidence is due soon (within 3 days)
        if (
          dispute.evidence_details?.due_by &&
          dispute.evidence_details.due_by > now
        ) {
          const daysUntilDue =
            (dispute.evidence_details.due_by - now) / (24 * 60 * 60);
          if (daysUntilDue <= 3) {
            evidenceDueCount += 1;
          }
        }
      });

      const winRate =
        wonAmount + lostAmount > 0
          ? (wonAmount / (wonAmount + lostAmount)) * 100
          : 0;

      return res.json({
        connected: true,
        disputes: disputes.data.map((d) => ({
          id: d.id,
          amount: d.amount,
          currency: d.currency,
          status: d.status,
          reason: d.reason,
          created: d.created,
          evidenceDueBy: d.evidence_details?.due_by || null,
          chargeId: typeof d.charge === "string" ? d.charge : d.charge?.id,
        })),
        summary: {
          total: disputes.data.length,
          statusCounts: {
            new:
              statusCounts.warning_needs_response + statusCounts.needs_response,
            evidence:
              statusCounts.warning_under_review + statusCounts.under_review,
            won: statusCounts.won,
            lost: statusCounts.lost + statusCounts.charge_refunded,
          },
          totalAmount,
          wonAmount,
          lostAmount,
          winRate: Math.round(winRate * 10) / 10,
          evidenceDueCount,
        },
        rangeDays,
      });
    } catch (stripeErr) {
      console.error("Error fetching Stripe disputes:", stripeErr);
      return res.status(500).json({
        error: "Failed to fetch Stripe disputes",
      });
    }
  } catch (err) {
    console.error("Stripe disputes route error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 9) Get subscription renewal analysis for Pro plan
app.get("/api/stripe/renewal-analysis", auth, async (req, res) => {
  try {
    const user = req.user;

    if (!user.stripeAccountId) {
      return res.status(400).json({
        error: "No Stripe account connected",
      });
    }

    try {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const next7Days = nowSeconds + 7 * 24 * 60 * 60;
      const last7Days = nowSeconds - 7 * 24 * 60 * 60;

      // Get all subscriptions
      const subscriptions = await stripe.subscriptions.list(
        {
          limit: 100,
          status: "all",
          expand: ["data.customer", "data.items.data.price"],
        },
        {
          stripeAccount: user.stripeAccountId,
        }
      );

      let upcomingRenewals = 0;
      let failedRenewals = 0;
      let atRiskCustomers = 0;
      let cardExpirations = 0;
      let activeSubscribers = 0;
      let cancellations = 0;
      let totalMRR = 0;
      let successfulRenewals = 0;
      let totalRenewals = 0;

      // Get invoices for renewal analysis (last 30 days for better coverage)
      const invoices = await stripe.invoices.list(
        {
          limit: 100,
          created: { gte: nowSeconds - 30 * 24 * 60 * 60 }, // Last 30 days
        },
        {
          stripeAccount: user.stripeAccountId,
        }
      );

      // Get upcoming invoices for better renewal predictions
      const upcomingInvoices = [];
      for (const sub of subscriptions.data) {
        if (sub.status === "active" || sub.status === "trialing") {
          try {
            const upcoming = await stripe.invoices.retrieveUpcoming(
              {
                subscription: sub.id,
              },
              {
                stripeAccount: user.stripeAccountId,
              }
            );
            if (upcoming) {
              upcomingInvoices.push(upcoming);
            }
          } catch (err) {
            // Some subscriptions may not have upcoming invoices yet
            if (
              process.env.NODE_ENV === "development" &&
              err.code !== "invoice_upcoming_none"
            ) {
              console.log(
                `No upcoming invoice for subscription ${sub.id}:`,
                err.message
              );
            }
          }
        }
      }

      // Fetch payment methods for card expiry detection
      const customerIds = new Set();
      subscriptions.data.forEach((sub) => {
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
        if (customerId) {
          customerIds.add(customerId);
        }
      });

      // Fetch payment methods for all customers
      const paymentMethodsByCustomer = new Map();
      for (const customerId of customerIds) {
        try {
          const paymentMethods = await stripe.paymentMethods.list(
            {
              customer: customerId,
              type: "card",
            },
            {
              stripeAccount: user.stripeAccountId,
            }
          );
          paymentMethodsByCustomer.set(customerId, paymentMethods.data);
        } catch (err) {
          if (process.env.NODE_ENV === "development") {
            console.log(
              `Error fetching payment methods for customer ${customerId}:`,
              err.message
            );
          }
        }
      }

      // High-risk customer scoring factors
      const highRiskCustomers = [];
      const customerRiskScores = new Map();

      subscriptions.data.forEach((sub) => {
        const isActive = ["active", "trialing"].includes(sub.status);
        const isCanceled = sub.cancel_at_period_end || sub.canceled_at;
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer?.id;

        // High-risk customer scoring
        let riskScore = 0;
        const riskFactors = [];

        if (isActive && !isCanceled) {
          activeSubscribers += 1;

          // Calculate MRR
          let subscriptionMRR = 0;
          sub.items.data.forEach((item) => {
            const priceObj = typeof item.price === "string" ? null : item.price;
            if (priceObj?.unit_amount && priceObj?.recurring) {
              let monthlyAmount = priceObj.unit_amount;
              if (priceObj.recurring.interval === "year") {
                monthlyAmount = monthlyAmount / 12;
              } else if (priceObj.recurring.interval === "week") {
                monthlyAmount = monthlyAmount * 4;
              } else if (priceObj.recurring.interval === "day") {
                monthlyAmount = monthlyAmount * 30;
              }
              subscriptionMRR += monthlyAmount;
              totalMRR += monthlyAmount;
            }
          });

          // Check upcoming renewals (next 7 days) - use upcoming invoices if available
          const hasUpcomingInvoice = upcomingInvoices.some(
            (inv) => inv.subscription === sub.id && inv.amount_due > 0
          );
          // Count as upcoming if period ends in next 7 days OR has upcoming invoice
          if (
            (sub.current_period_end && sub.current_period_end <= next7Days) ||
            hasUpcomingInvoice
          ) {
            upcomingRenewals += 1;
          }

          // Check card expiry from payment methods
          const customerPaymentMethods = customerId
            ? paymentMethodsByCustomer.get(customerId)
            : [];
          if (customerPaymentMethods && customerPaymentMethods.length > 0) {
            customerPaymentMethods.forEach((pm) => {
              if (pm.type === "card" && pm.card) {
                const expMonth = pm.card.exp_month;
                const expYear = pm.card.exp_year;
                if (expMonth && expYear) {
                  const expiryDate = new Date(expYear, expMonth - 1, 1);
                  const now = new Date();
                  const daysUntilExpiry = Math.ceil(
                    (expiryDate - now) / (1000 * 60 * 60 * 24)
                  );

                  // Count cards expiring in next 30 days
                  if (daysUntilExpiry > 0 && daysUntilExpiry <= 30) {
                    cardExpirations += 1;
                    riskScore += 30; // High risk factor
                    riskFactors.push(
                      `Card expiring in ${daysUntilExpiry} days`
                    );
                  }

                  // Count expired cards
                  if (daysUntilExpiry <= 0) {
                    riskScore += 50; // Very high risk
                    riskFactors.push("Card expired");
                  }
                }
              }
            });
          }

          // Check for past due status
          if (sub.status === "past_due") {
            atRiskCustomers += 1;
            riskScore += 40;
            riskFactors.push("Subscription past due");
          }

          // Check for recent failed invoices
          const recentFailedInvoices = invoices.data.filter(
            (inv) =>
              inv.subscription === sub.id &&
              (inv.status === "open" ||
                inv.status === "uncollectible" ||
                inv.status === "void")
          );
          if (recentFailedInvoices.length > 0) {
            riskScore += 25 * recentFailedInvoices.length;
            riskFactors.push(
              `${recentFailedInvoices.length} recent failed invoice(s)`
            );
          }

          // Check subscription age (newer subscriptions are higher risk)
          const subscriptionAge = nowSeconds - sub.created;
          const daysOld = subscriptionAge / (24 * 60 * 60);
          if (daysOld < 30) {
            riskScore += 10;
            riskFactors.push("New subscription (< 30 days)");
          }

          // Store risk score for customer
          if (customerId && riskScore > 0) {
            const existingScore = customerRiskScores.get(customerId) || {
              score: 0,
              factors: [],
              mrr: 0,
            };
            customerRiskScores.set(customerId, {
              score: existingScore.score + riskScore,
              factors: [...existingScore.factors, ...riskFactors],
              mrr: existingScore.mrr + subscriptionMRR,
            });
          }

          // Flag as high-risk if score > 50
          if (riskScore >= 50) {
            highRiskCustomers.push({
              customerId,
              subscriptionId: sub.id,
              riskScore,
              factors: riskFactors,
              mrr: subscriptionMRR,
            });
          }
        }

        if (isCanceled) {
          cancellations += 1;
        }
      });

      // Analyze invoices for failed renewals
      invoices.data.forEach((invoice) => {
        if (invoice.subscription) {
          totalRenewals += 1;
          if (invoice.status === "paid") {
            successfulRenewals += 1;
          } else if (
            invoice.status === "open" ||
            invoice.status === "uncollectible"
          ) {
            failedRenewals += 1;
          }
        }
      });

      const renewalSuccessRate =
        totalRenewals > 0 ? (successfulRenewals / totalRenewals) * 100 : 0;

      // Enhanced prediction: based on historical failure rate + risk factors
      let predictedFailures = Math.round(
        upcomingRenewals * (1 - renewalSuccessRate / 100)
      );

      // Adjust prediction based on high-risk customers
      const highRiskUpcoming = highRiskCustomers.filter((hr) => {
        const sub = subscriptions.data.find((s) => s.id === hr.subscriptionId);
        return (
          sub && sub.current_period_end && sub.current_period_end <= next7Days
        );
      }).length;

      // Increase prediction if high-risk customers have upcoming renewals
      if (highRiskUpcoming > 0) {
        predictedFailures = Math.max(
          predictedFailures,
          Math.round(highRiskUpcoming * 0.7)
        );
      }

      // Calculate MRR at risk (from high-risk customers)
      const mrrAtRisk = highRiskCustomers.reduce((sum, hr) => sum + hr.mrr, 0);
      const mrrRiskPercentage = totalMRR > 0 ? (mrrAtRisk / totalMRR) * 100 : 0;

      // Enhanced Dunning Insights Analysis
      const dunningInsights = [];

      // Analyze failed renewals by reason
      const failedRenewalsByReason = new Map();
      const subscriptionsWithFailedInvoices = new Map();

      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 Dunning Analysis: Found ${invoices.data.length} invoices, ${failedRenewals} failed renewals, ${highRiskCustomers.length} high-risk customers`);
      }

      invoices.data.forEach((invoice) => {
        if (invoice.subscription && (invoice.status === "open" || invoice.status === "uncollectible" || invoice.status === "void")) {
          const subId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription.id;
          const sub = subscriptions.data.find((s) => s.id === subId);
          if (sub) {
            const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
            const reason = invoice.last_finalization_error?.message || 
                          invoice.charge?.outcome?.reason || 
                          invoice.charge?.failure_code || 
                          "unknown";
            
            const key = reason.toLowerCase();
            const existing = failedRenewalsByReason.get(key) || { count: 0, subscriptions: [], amount: 0 };
            existing.count += 1;
            existing.amount += invoice.amount_due || 0;
            if (!existing.subscriptions.includes(subId)) {
              existing.subscriptions.push(subId);
            }
            failedRenewalsByReason.set(key, existing);

            if (!subscriptionsWithFailedInvoices.has(subId)) {
              subscriptionsWithFailedInvoices.set(subId, {
                subscriptionId: subId,
                customerId: customerId,
                invoiceId: invoice.id,
                amount: invoice.amount_due || 0,
                reason: reason,
                currency: invoice.currency,
              });
            }
          }
        }
      });

      // Generate actionable insights
      // 1. Expired cards
      const expiredCardSubscriptions = highRiskCustomers
        .filter((hr) => hr.factors.some((f) => f.includes("Card expired")))
        .map((hr) => hr.subscriptionId);
      if (expiredCardSubscriptions.length > 0) {
        const expiredCardMRR = highRiskCustomers
          .filter((hr) => hr.factors.some((f) => f.includes("Card expired")))
          .reduce((sum, hr) => sum + hr.mrr, 0);
        dunningInsights.push({
          type: "expired_card",
          priority: "high",
          title: `${expiredCardSubscriptions.length} subscription${expiredCardSubscriptions.length !== 1 ? 's' : ''} with expired cards`,
          description: `These customers need to update their payment method. MRR at risk: $${(expiredCardMRR / 100).toFixed(2)}`,
          action: "send_card_update_email",
          actionLabel: "Send Card Update Email",
          affectedSubscriptions: expiredCardSubscriptions,
          affectedCount: expiredCardSubscriptions.length,
          mrrAtRisk: expiredCardMRR,
        });
      }

      // 2. Cards expiring soon
      const expiringCardSubscriptions = highRiskCustomers
        .filter((hr) => hr.factors.some((f) => f.includes("Card expiring")))
        .map((hr) => hr.subscriptionId);
      if (expiringCardSubscriptions.length > 0) {
        const expiringCardMRR = highRiskCustomers
          .filter((hr) => hr.factors.some((f) => f.includes("Card expiring")))
          .reduce((sum, hr) => sum + hr.mrr, 0);
        dunningInsights.push({
          type: "expiring_card",
          priority: "medium",
          title: `${expiringCardSubscriptions.length} subscription${expiringCardSubscriptions.length !== 1 ? 's' : ''} with cards expiring soon`,
          description: `Proactively request updated payment methods before renewal. MRR at risk: $${(expiringCardMRR / 100).toFixed(2)}`,
          action: "send_card_update_email",
          actionLabel: "Send Card Update Email",
          affectedSubscriptions: expiringCardSubscriptions,
          affectedCount: expiringCardSubscriptions.length,
          mrrAtRisk: expiringCardMRR,
        });
      }

      // 3. Insufficient funds failures
      const insufficientFunds = failedRenewalsByReason.get("insufficient_funds") || 
                                failedRenewalsByReason.get("your card has insufficient funds") ||
                                failedRenewalsByReason.get("card_declined");
      if (insufficientFunds && insufficientFunds.count > 0) {
        dunningInsights.push({
          type: "insufficient_funds",
          priority: "high",
          title: `${insufficientFunds.count} renewal${insufficientFunds.count !== 1 ? 's' : ''} failed due to insufficient funds`,
          description: `Retry these payments in 2-3 days when customer's account may have funds. Revenue at risk: $${(insufficientFunds.amount / 100).toFixed(2)}`,
          action: "retry_payment",
          actionLabel: "Retry Payment in 3 Days",
          affectedSubscriptions: insufficientFunds.subscriptions,
          affectedCount: insufficientFunds.count,
          mrrAtRisk: insufficientFunds.amount,
        });
      }

      // 4. Past due subscriptions
      const pastDueSubscriptions = subscriptions.data
        .filter((sub) => sub.status === "past_due")
        .map((sub) => sub.id);
      if (pastDueSubscriptions.length > 0) {
        const pastDueMRR = subscriptions.data
          .filter((sub) => sub.status === "past_due")
          .reduce((sum, sub) => {
            let subMRR = 0;
            sub.items.data.forEach((item) => {
              const priceObj = typeof item.price === "string" ? null : item.price;
              if (priceObj?.unit_amount && priceObj?.recurring) {
                let monthlyAmount = priceObj.unit_amount;
                if (priceObj.recurring.interval === "year") {
                  monthlyAmount = monthlyAmount / 12;
                } else if (priceObj.recurring.interval === "week") {
                  monthlyAmount = monthlyAmount * 4;
                } else if (priceObj.recurring.interval === "day") {
                  monthlyAmount = monthlyAmount * 30;
                }
                subMRR += monthlyAmount;
              }
            });
            return sum + subMRR;
          }, 0);
        dunningInsights.push({
          type: "past_due",
          priority: "high",
          title: `${pastDueSubscriptions.length} subscription${pastDueSubscriptions.length !== 1 ? 's' : ''} past due`,
          description: `Contact these customers immediately to update payment method or resolve issue. MRR at risk: $${(pastDueMRR / 100).toFixed(2)}`,
          action: "contact_customer",
          actionLabel: "Contact Customers",
          affectedSubscriptions: pastDueSubscriptions,
          affectedCount: pastDueSubscriptions.length,
          mrrAtRisk: pastDueMRR,
        });
      }

      // 5. Generic failed renewals (if we have failed renewals but no specific insights)
      if (failedRenewals > 0 && dunningInsights.length === 0) {
        const failedSubscriptions = Array.from(subscriptionsWithFailedInvoices.keys());
        if (failedSubscriptions.length > 0) {
          dunningInsights.push({
            type: "generic_failure",
            priority: "medium",
            title: `${failedRenewals} renewal${failedRenewals !== 1 ? 's' : ''} failed`,
            description: `Review these failures and contact customers to update payment methods.`,
            action: "review_failures",
            actionLabel: "Review Failures",
            affectedSubscriptions: failedSubscriptions,
            affectedCount: failedRenewals,
            mrrAtRisk: 0,
          });
        }
      }

      // 6. If we have at-risk customers but no other insights, create a general insight
      if (atRiskCustomers > 0 && dunningInsights.length === 0) {
        const atRiskSubscriptions = subscriptions.data
          .filter((sub) => sub.status === "past_due" || highRiskCustomers.some(hr => hr.subscriptionId === sub.id))
          .map((sub) => sub.id);
        
        if (atRiskSubscriptions.length > 0) {
          const atRiskMRR = subscriptions.data
            .filter((sub) => atRiskSubscriptions.includes(sub.id))
            .reduce((sum, sub) => {
              let subMRR = 0;
              sub.items.data.forEach((item) => {
                const priceObj = typeof item.price === "string" ? null : item.price;
                if (priceObj?.unit_amount && priceObj?.recurring) {
                  let monthlyAmount = priceObj.unit_amount;
                  if (priceObj.recurring.interval === "year") {
                    monthlyAmount = monthlyAmount / 12;
                  } else if (priceObj.recurring.interval === "week") {
                    monthlyAmount = monthlyAmount * 4;
                  } else if (priceObj.recurring.interval === "day") {
                    monthlyAmount = monthlyAmount * 30;
                  }
                  subMRR += monthlyAmount;
                }
              });
              return sum + subMRR;
            }, 0);
          
          dunningInsights.push({
            type: "at_risk",
            priority: "medium",
            title: `${atRiskCustomers} customer${atRiskCustomers !== 1 ? 's' : ''} at risk`,
            description: `These customers may need attention. MRR at risk: $${(atRiskMRR / 100).toFixed(2)}`,
            action: "contact_customer",
            actionLabel: "Review Customers",
            affectedSubscriptions: atRiskSubscriptions,
            affectedCount: atRiskCustomers,
            mrrAtRisk: atRiskMRR,
          });
        }
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`💡 Generated ${dunningInsights.length} dunning insights`);
      }

      // Sort by priority (high first) and MRR at risk
      dunningInsights.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return b.mrrAtRisk - a.mrrAtRisk;
      });

      return res.json({
        connected: true,
        metrics: {
          upcomingRenewals,
          failedRenewals,
          atRiskCustomers,
          cardExpirations,
          activeSubscribers,
          cancellations,
          mrr: Math.round(totalMRR),
          mrrAtRisk: Math.round(mrrAtRisk),
          mrrRiskPercentage: Math.round(mrrRiskPercentage * 10) / 10,
          renewalSuccessRate: Math.round(renewalSuccessRate * 10) / 10,
          predictedFailures,
          highRiskCustomersCount: highRiskCustomers.length,
          highRiskCustomers: highRiskCustomers.slice(0, 10), // Return top 10 for UI
        },
        dunningInsights: dunningInsights.slice(0, 5), // Return top 5 insights
      });
    } catch (stripeErr) {
      console.error("Error fetching renewal analysis:", stripeErr);
      return res.status(500).json({
        error: "Failed to fetch renewal analysis",
      });
    }
  } catch (err) {
    console.error("Renewal analysis route error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 10) Manual cache invalidation endpoint (for testing/admin)
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
