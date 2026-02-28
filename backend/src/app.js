const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const fs = require("fs");
const { auditLogMiddleware } = require("./middleware/auditLog.middleware");

const app = express();

app.use(express.json());
app.use(cookieParser());

// ── CORS — supports comma-separated list of allowed origins ──────────────
// Set CORS_ORIGIN=https://your-app.vercel.app in Render env vars.
// Multiple origins: CORS_ORIGIN=https://a.vercel.app,https://b.vercel.app
const _rawOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173").split(",").map((o) => o.trim()).filter(Boolean);
const ALLOWED_ORIGINS = new Set(_rawOrigins);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
  }
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ── Audit logging — runs on every request ─────────────────────
// Placed after body-parsing so req.body is available for meta extraction.
app.use(auditLogMiddleware);

// ── Health check endpoint — needed for Render health monitoring ─────────
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

/**
 * - Routes required here
 */
const authRouter = require("./routes/auth.routes");
const accountRouter = require("./routes/account.routes");
const transactionRouter = require("./routes/transaction.routes");
const profileRouter = require("./routes/profile.routes");
const adminRouter = require("./routes/admin.routes");

/**
 * - User Routes
 */
app.use("/api/auth", authRouter);
app.use("/api/account", accountRouter);
app.use("/api/transactions", transactionRouter);
app.use("/api/profile", profileRouter);
app.use("/api/admin", adminRouter);

// ── Serve React build in production ───────────────────────────
// After `npm run build` the built SPA lives in ../frontend/dist.
// Express serves static assets and falls back to index.html for SPA routes.
if (process.env.NODE_ENV === "production") {
  const clientDist = path.join(__dirname, "..", "..", "frontend", "dist");
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.use((req, res, next) => {
      if (req.path.startsWith("/api/")) return next();
      res.sendFile(path.join(clientDist, "index.html"));
    });
  }
}

// ── 404 handler for unmatched API routes ─────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// ── Global error handler (must be registered last, 4 params) ──
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message,
  });
});

module.exports = app;
