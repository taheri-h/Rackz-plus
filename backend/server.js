require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");

// Import routes
const authRoutes = require("./routes/auth");
const paymentRoutes = require("./routes/payments");
const setupRoutes = require("./routes/setup");
const providerRoutes = require("./routes/providers");
const passwordResetRoutes = require("./routes/passwordReset");

// Initialize Express app
const app = express();

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
