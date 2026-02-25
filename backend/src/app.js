const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const { auditLogMiddleware } = require("./middleware/auditLog.middleware");

const app = express();

app.use(express.json());
app.use(cookieParser());

// ── CORS — allow frontend origin in production; Vite proxy handles dev ──
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", CORS_ORIGIN);
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ── Audit logging — runs on every request ─────────────────────
// Placed after body-parsing so req.body is available for meta extraction.
app.use(auditLogMiddleware);

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
  app.use(express.static(clientDist));
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
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
