const express = require('express');
const authMiddleware = require("../middleware/auth.middleware");
const transactionController = require("../controllers/transaction.controller");

const transactionRoutes = Router();

/**
 * - POST /api/transactions/
 * - Create a new transaction between two accounts.
 */
transactionRoutes.post("/",authMiddleware.authMiddleware, transactionController.createTransaction);


module.exports = transactionRoutes;