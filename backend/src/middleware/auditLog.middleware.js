const auditLogModel = require("../models/auditLog.model");

/**
 * auditLogMiddleware
 * Logs each incoming request to the `audit_logs` (auditLog) collection.
 * Runs asynchronously — failures do NOT interrupt the request.
 *
 * Safe fields captured: userId, ip, method, route, meta.
 * Never stores passwords, raw tokens, or card data.
 */
async function auditLogMiddleware(req, _res, next) {
  try {
    // Build a small, safe metadata snapshot from the request body.
    // Only include non-sensitive business fields.
    const meta = buildMeta(req);

    await auditLogModel.create({
      userId: req.user?._id ?? null,
      ip: req.ip || req.connection?.remoteAddress || null,
      method: req.method,
      route: req.originalUrl,
      meta,
    });
  } catch (err) {
    // Audit failures are non-fatal — log to console only.
    console.error("[AuditLog] Failed to write audit entry:", err.message);
  }
  return next();
}

/**
 * Extract only safe, relevant fields from the request body.
 * Deliberately omits password, token, and any sensitive PII.
 */
function buildMeta(req) {
  const safe = {};
  const { amount, fromAccount, toAccount, accountId, currency } = req.body ?? {};

  if (amount !== undefined) safe.amount = amount;
  if (fromAccount !== undefined) safe.fromAccount = fromAccount;
  if (toAccount !== undefined) safe.toAccount = toAccount;
  if (accountId !== undefined) safe.accountId = accountId;
  if (currency !== undefined) safe.currency = currency;

  // Also capture route params that are safe (e.g. :accountId)
  if (req.params?.accountId) safe.paramsAccountId = req.params.accountId;

  return safe;
}

module.exports = { auditLogMiddleware };
