// Developer note from me: I wrote and maintain this file for the KGL system, and I keep this logic explicit so future updates are safer.
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const branchRoutes = require("./routes/branches");
const procurementRoutes = require("./routes/procurements");
const stockRoutes = require("./routes/stocks");
const salesRoutes = require("./routes/sales");
const creditPaymentRoutes = require("./routes/credit-payments");
const reportRoutes = require("./routes/reports");
const docsRoutes = require("./routes/docs");
const { notFound, errorHandler } = require("./middleware/error-handler");
const { attachStockRealtime } = require("./realtime/stockRealtime");
const User = require("./models/User");

const app = express();
let helmetMiddleware = null;
try {
  helmetMiddleware = require("helmet");
} catch (error) {
  console.warn("helmet package is missing. Run `npm install` in backend for full security headers.");
}

// I allow one CORS origin from env, else allow local development.
const allowedOrigin = process.env.CORS_ORIGIN || "";
const localAllowedOrigins = new Set([
  "http://localhost:3000",
  "http://localhost:4000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:4000",
  "http://127.0.0.1:5173"
]);
// Basic security headers with explicit CSP allow-list for trusted frontend CDNs.
if (helmetMiddleware) {
  app.use(
    helmetMiddleware({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'self'"],
          objectSrc: ["'none'"],
          scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
          styleSrc: ["'self'", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
          fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "data:"],
          imgSrc: ["'self'", "data:", "blob:"],
          connectSrc: [
            "'self'",
            "http://localhost:4000",
            "http://127.0.0.1:4000",
            "ws://localhost:4000",
            "ws://127.0.0.1:4000"
          ]
        }
      },
      crossOriginResourcePolicy: { policy: "cross-origin" }
    })
  );
}
app.use(
  // This limits too many requests in a short time.
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false
  })
);
app.use(
  // This allows frontend to call backend API.
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigin && origin === allowedOrigin) return callback(null, true);
      if (!allowedOrigin && localAllowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error("CORS blocked for this origin."));
    },
    credentials: true
  })
);
// Parse JSON body; allow image payloads (base64) from profile/procurement forms.
app.use(express.json({ limit: "8mb" }));

// Health endpoint for quick server check.
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Main API routes.
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/procurements", procurementRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/credit-payments", creditPaymentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api", docsRoutes);

// Serve frontend files from the same server.
app.use("/", express.static(path.join(__dirname, "../frontend/public")));
app.get(["/", "/index.html"], (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/public/index.html"));
});

// Handle not found routes and unexpected errors.
app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT || 4000);

async function start() {
  // Stop startup if JWT secret is missing or still default.
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "change_this_secret_in_production") {
    throw new Error("JWT_SECRET must be set to a secure value in .env.");
  }
  // Connect DB before accepting traffic.
  await connectDB();
  // One-time cleanup for legacy insecure plaintext field.
  await User.updateMany(
    { passwordText: { $exists: true } },
    { $unset: { passwordText: 1 } }
  );
  const server = app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
  attachStockRealtime(server);
  server.on("error", (error) => {
    if (error && error.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use. Stop the other server or change PORT in backend/.env.`);
      process.exit(1);
    }
  });
}

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

