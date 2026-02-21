const rateLimit = require("express-rate-limit");

/**
 * Configurable rate limiters.
 * All limits are read from env vars so they can be tuned per environment:
 *
 *  AUTH_RATE_LIMIT_WINDOW_MIN  — window in minutes for auth routes (default 15)
 *  AUTH_RATE_LIMIT_MAX         — max requests per window for auth routes (default 20)
 *  TRANSFER_RATE_LIMIT_WINDOW_MIN — window in minutes for transfer route (default 15)
 *  TRANSFER_RATE_LIMIT_MAX     — max requests per window for transfer (default 30)
 */

const authWindowMin = parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MIN ?? "15", 10);
const authMax = parseInt(process.env.AUTH_RATE_LIMIT_MAX ?? "20", 10);

const transferWindowMin = parseInt(process.env.TRANSFER_RATE_LIMIT_WINDOW_MIN ?? "15", 10);
const transferMax = parseInt(process.env.TRANSFER_RATE_LIMIT_MAX ?? "30", 10);

/**
 * Rate limiter for authentication routes (/api/auth/*).
 * Tighter limit — prevents brute-force login attacks.
 */
const authRateLimiter = rateLimit({
  windowMs: authWindowMin * 60 * 1000,
  max: authMax,
  standardHeaders: true,  // Return RateLimit-* headers
  legacyHeaders: false,
  message: {
    success: false,
    message: `Too many requests from this IP. Try again after ${authWindowMin} minutes.`,
  },
});

/**
 * Rate limiter for the transaction / transfer route.
 * Prevents automated bulk-transfer abuse.
 */
const transferRateLimiter = rateLimit({
  windowMs: transferWindowMin * 60 * 1000,
  max: transferMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: `Too many transfer requests. Try again after ${transferWindowMin} minutes.`,
  },
});

module.exports = { authRateLimiter, transferRateLimiter };
