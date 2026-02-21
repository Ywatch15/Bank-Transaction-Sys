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

module.exports = app;
