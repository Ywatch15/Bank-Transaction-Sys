const express = require('express');
const authMiddleware = require("../middleware/auth.middleware");


const transactionRoutes = Router();

/**
 * - POST /api/transactions/
 * - Create a new transaction between two accounts.
 */
transactionRoutes.post("/",authMiddleware.authMiddleware);


module.exports = transactionRoutes;