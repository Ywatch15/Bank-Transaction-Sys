const express = require("express");
const cookieParser = require("cookie-parser");
const { auditLogMiddleware } = require("./middleware/auditLog.middleware");

const app = express();

app.use(express.json());
app.use(cookieParser());

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

// ── 404 handler for unmatched routes ─────────────────────────
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
