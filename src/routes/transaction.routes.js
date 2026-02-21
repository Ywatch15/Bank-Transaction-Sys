const express = require('express');
const authMiddleware = require("../middleware/auth.middleware");
const transactionController = require("../controllers/transaction.controller");
const { transferRateLimiter } = require("../middleware/rateLimiter.middleware");

const transactionRoutes = express.Router();

/**
 * GET /api/transactions/export
 * Stream a CSV of filtered transactions.
 * Must be declared BEFORE the catch-all GET "/" to avoid route collision.
 */
transactionRoutes.get(
    "/export",
    authMiddleware.authMiddleware,
    transactionController.exportTransactionsCsv
);

/**
 * GET /api/transactions/
 * Paginated, filtered transaction history for the authenticated user.
 * Params: startDate, endDate, type, minAmount, maxAmount, page, limit, sort
 */
transactionRoutes.get("/", authMiddleware.authMiddleware, transactionController.getTransactionHistory);

/**
 * POST /api/transactions/
 * Create a new transaction between two accounts.
 */
transactionRoutes.post(
    "/",
    authMiddleware.authMiddleware,
    transferRateLimiter,
    transactionController.createTransaction
);

/**
 * POST /api/transactions/system/initial-funds
 * Create initial funds transaction from system user.
 */
transactionRoutes.post(
    "/system/initial-funds",
    authMiddleware.authSystemUserMiddleware,
    transactionController.createInitialFundsTransaction
);

module.exports = transactionRoutes;
