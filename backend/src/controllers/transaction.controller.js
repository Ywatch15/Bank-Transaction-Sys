const transactionModel = require('../models/transaction.model');
const ledgerModel = require('../models/ledger.model');
const accountModel = require('../models/account.model');
const auditModel = require('../models/audit.model');
const emailService = require('../services/email.service');
const mongoose = require('mongoose');
const crypto = require('crypto');
const { format: csvFormat } = require('fast-csv');

// Import helper utilities
const { 
    validatePositiveAmount, 
    validateDateISO, 
    parseAndValidatePagination,
    validateAmountRange,
    validateIdempotencyKey
} = require('../utils/validation');
const { successResponse, errorResponse } = require('../utils/response');
const constants = require('../config/constants');


async function createTransaction(req, res) {
    /**
     * REQUIREMENT #1: Remove artificial delays (already done in code)
     * REQUIREMENT #2: Proper MongoDB session handling
     * REQUIREMENT #3: Atomic balance updates with conditional DB queries
     * REQUIREMENT #4: Idempotency handling with unique index and 409 responses
     * REQUIREMENT #5: Validation helpers for input validation
     * REQUIREMENT #11: Null/defensive checks (req.user validation)
     */

    // ─────────────────────────────────────────────────────────────────────────
    // Step 1: Input Validation
    // ─────────────────────────────────────────────────────────────────────────
    
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

    // REQUIREMENT #11: Defensive null check for authentication middleware
    if (!req.user || !req.user._id) {
        return errorResponse(res, 401, 'unauthorized', 'Authentication required: user not found in request context.');
    }

    // Check for required fields
    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return errorResponse(res, 400, 'missing_fields', 'Missing required fields: fromAccount, toAccount, amount, idempotencyKey.');
    }

    // REQUIREMENT #5: Use validation helper for positive amount
    try {
        var validAmount = validatePositiveAmount(amount);
    } catch (err) {
        return errorResponse(res, 400, 'invalid_amount', err.message);
    }

    // REQUIREMENT #5: Use validation helper for idempotency key format
    try {
        validateIdempotencyKey(idempotencyKey);
    } catch (err) {
        return errorResponse(res, 400, 'invalid_idempotency_key', err.message);
    }

    // REQUIREMENT #11: Validate account IDs are valid MongoDB ObjectIds
    if (!mongoose.Types.ObjectId.isValid(fromAccount) || !mongoose.Types.ObjectId.isValid(toAccount)) {
        return errorResponse(res, 400, 'invalid_account_id', 'Invalid account ID format.');
    }

    // Prevent same-account transfers — always invalid for debit/credit ledger logic
    if (fromAccount === toAccount) {
        return errorResponse(res, 400, 'same_account_transfer', 'Source and destination accounts must be different.');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 2: Check Idempotency Key (before session to avoid unnecessary work)
    // ─────────────────────────────────────────────────────────────────────────
    
    const existingTxn = await transactionModel.findOne({ idempotencyKey });

    if (existingTxn) {
        if (existingTxn.status === 'COMPLETED') {
            return successResponse(res, { transaction: existingTxn }, 200);
        } else if (existingTxn.status === 'PENDING') {
            return errorResponse(res, 409, 'idempotency_conflict', 'Transaction is pending. Idempotency key already in use.', { idempotencyKey });
        } else if (existingTxn.status === 'FAILED' || existingTxn.status === 'REVERSED') {
            return errorResponse(res, 409, 'idempotency_conflict', `Previous transaction with this key was ${existingTxn.status.toLowerCase()}. Use a new idempotency key.`, { idempotencyKey });
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 3: Fetch Accounts (preliminary check, will verify again in session)
    // ─────────────────────────────────────────────────────────────────────────
    
    const [fromAcctCheck, toAcctCheck] = await Promise.all([
        accountModel.findById(fromAccount),
        accountModel.findById(toAccount)
    ]);

    if (!fromAcctCheck || !toAcctCheck) {
        return errorResponse(res, 404, 'account_not_found', 'One or both accounts not found.');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 4: Execute Transaction with Session (REQUIREMENT #2)
    // ─────────────────────────────────────────────────────────────────────────
    
    const session = await mongoose.startSession();
    let transaction = null;

    try {
        session.startTransaction();

        // REQUIREMENT #11: Defensive re-check of accounts inside session to prevent race condition
        const fromAcct = await accountModel.findOne(
            { _id: fromAccount, status: 'ACTIVE' },
            null,
            { session }
        );

        const toAcct = await accountModel.findOne(
            { _id: toAccount, status: 'ACTIVE' },
            null,
            { session }
        );

        if (!fromAcct || !toAcct) {
            throw new Error('One or both accounts not found or not in ACTIVE status.');
        }

        // REQUIREMENT #3: Atomic balance update using conditional DB query
        // Use updateOne with condition: only update if balance >= amount AND status = ACTIVE
        // This prevents double-spend race condition at the database level
        const updateResult = await accountModel.updateOne(
            {
                _id: fromAccount,
                balance: { $gte: validAmount },
                status: 'ACTIVE'
            },
            {
                $inc: { balance: -validAmount }
            },
            { session }
        );

        if (updateResult.matchedCount === 0) {
            // Could mean balance insufficient, status not ACTIVE, or account doesn't exist
            throw new Error('Insufficient funds or account not eligible for transaction.');
        }

        // Create transaction record
        transaction = await transactionModel.create([{
            fromAccount,
            toAccount,
            amount: validAmount,
            idempotencyKey,
            status: 'PENDING'
        }], { session });
        transaction = transaction[0];

        // Create DEBIT ledger entry
        await ledgerModel.create([{
            account: fromAccount,
            amount: validAmount,
            transaction: transaction._id,
            type: 'DEBIT'
        }], { session });

        // REQUIREMENT #1: No artificial delay. Removed 11-second sleep that broke atomicity.
        // All ledger operations are atomic within this session.

        // Create CREDIT ledger entry
        await ledgerModel.create([{
            account: toAccount,
            amount: validAmount,
            transaction: transaction._id,
            type: 'CREDIT'
        }], { session });

        // Update target account balance
        await accountModel.updateOne(
            { _id: toAccount, status: 'ACTIVE' },
            { $inc: { balance: validAmount } },
            { session }
        );

        // Mark transaction as COMPLETED
        await transactionModel.findByIdAndUpdate(
            transaction._id,
            { status: 'COMPLETED' },
            { session, new: true }
        );

        // REQUIREMENT #10: Audit logging for transaction completion
        try {
            await auditModel.create([{
                actor: req.user._id,
                action: 'TRANSACTION_COMPLETED',
                entityType: 'Transaction',
                entityId: transaction._id,
                meta: {
                    fromAccount,
                    toAccount,
                    amount: validAmount,
                    idempotencyKey
                },
                source: 'transaction_api'
            }], { session });
        } catch (auditErr) {
            console.warn('[Audit] Failed to log transaction completion:', auditErr.message);
            // Don't fail the transaction if audit logging fails; just warn
        }

        await session.commitTransaction();

    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }

        console.error(`[Transaction] Error creating transaction for idempotency key ${idempotencyKey}:`, error.message);

        // Handle MongoDB duplicate key error on idempotencyKey (concurrent request race)
        if (error.code === 11000 && error.keyPattern?.idempotencyKey) {
            const existing = await transactionModel.findOne({ idempotencyKey });
            if (existing?.status === 'COMPLETED') {
                return successResponse(res, { transaction: existing }, 200);
            }
            return errorResponse(res, 409, 'idempotency_conflict', 'Concurrent request detected. Use a new idempotency key or retry.', { idempotencyKey });
        }

        // REQUIREMENT #2: Mark transaction as FAILED if it was created but failed later
        if (transaction && transaction._id) {
            try {
                await transactionModel.findByIdAndUpdate(
                    transaction._id,
                    { status: 'FAILED' },
                    { new: true }
                );
            } catch (updateErr) {
                console.error('[Transaction] Failed to mark transaction as FAILED:', updateErr.message);
            }
        }

        // Send failure notification to user + admin (non-blocking)
        try {
            await emailService.sendTransactionFailureEmail(
                req.user.email, req.user.name, validAmount, toAccount
            );
        } catch (emailErr) {
            console.warn(`[Email] Failure notification failed:`, emailErr.message);
        }

        // Determine appropriate error code and message
        if (error.message.includes('Insufficient funds')) {
            return errorResponse(res, 400, 'insufficient_funds', error.message);
        } else if (error.message.includes('not in ACTIVE status')) {
            return errorResponse(res, 400, 'account_not_eligible', error.message);
        } else {
            return errorResponse(res, 500, 'transaction_failed', 'Transaction failed. Please retry with the same idempotency key.');
        }
    } finally {
        // REQUIREMENT #2: Always end session to prevent connection pool exhaustion
        await session.endSession();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 5: Send notification (non-critical, outside transaction)
    // ─────────────────────────────────────────────────────────────────────────
    
    // REQUIREMENT #4: Handle email failure gracefully (non-blocking)
    try {
        await emailService.sendTransactionEmail(req.user.email, req.user.name, validAmount, toAccount);
    } catch (emailErr) {
        console.warn(`[Email] Notification failed for transaction ${transaction._id}:`, emailErr.message);
        // Don't fail API response; email is non-critical
    }

    return successResponse(res, { transaction }, 201);
}


async function createInitialFundsTransaction(req, res) {
    /**
     * Creates initial funding transaction from system admin account to user account.
     * Uses same session handling and validation as regular transactions.
     */

    // REQUIREMENT #11: Defensive null check for authentication
    if (!req.user || !req.user._id) {
        return errorResponse(res, 401, 'unauthorized', 'Authentication required: user not found in request context.');
    }

    const { toAccount, amount, idempotencyKey } = req.body;

    // Check for required fields
    if (!toAccount || !amount || !idempotencyKey) {
        return errorResponse(res, 400, 'missing_fields', 'Missing required fields: toAccount, amount, idempotencyKey.');
    }

    // REQUIREMENT #5: Use validation helper for positive amount
    try {
        var validAmount = validatePositiveAmount(amount);
    } catch (err) {
        return errorResponse(res, 400, 'invalid_amount', err.message);
    }

    // REQUIREMENT #5: Use validation helper for idempotency key
    try {
        validateIdempotencyKey(idempotencyKey);
    } catch (err) {
        return errorResponse(res, 400, 'invalid_idempotency_key', err.message);
    }

    // REQUIREMENT #11: Validate account ID format
    if (!mongoose.Types.ObjectId.isValid(toAccount)) {
        return errorResponse(res, 400, 'invalid_account_id', 'Invalid account ID format.');
    }

    // Check idempotency before session
    const existingTxn = await transactionModel.findOne({ idempotencyKey });

    if (existingTxn) {
        if (existingTxn.status === 'COMPLETED') {
            return successResponse(res, { transaction: existingTxn }, 200);
        } else {
            return errorResponse(res, 409, 'idempotency_conflict', `Transaction already exists with status: ${existingTxn.status}`, { idempotencyKey });
        }
    }

    // Fetch accounts (preliminary check)
    const [toAcct, systemAcct] = await Promise.all([
        accountModel.findById(toAccount),
        accountModel.findOne({ user: req.user._id })
    ]);

    if (!toAcct) {
        return errorResponse(res, 404, 'account_not_found', 'Target account not found.');
    }

    if (!systemAcct) {
        return errorResponse(res, 404, 'system_account_not_found', 'System user account not found.');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Execute with session (REQUIREMENT #2)
    // ─────────────────────────────────────────────────────────────────────────
    
    const session = await mongoose.startSession();
    let transaction = null;

    try {
        session.startTransaction();

        // REQUIREMENT #11: Re-check target account inside session
        const targetAcct = await accountModel.findOne(
            { _id: toAccount, status: 'ACTIVE' },
            null,
            { session }
        );

        if (!targetAcct) {
            throw new Error('Target account not found or not in ACTIVE status.');
        }

        // Create transaction record
        transaction = await transactionModel.create([{
            fromAccount: systemAcct._id,
            toAccount,
            amount: validAmount,
            idempotencyKey,
            status: 'PENDING'
        }], { session });
        transaction = transaction[0];

        // Create DEBIT ledger entry (from system account)
        await ledgerModel.create([{
            account: systemAcct._id,
            amount: validAmount,
            transaction: transaction._id,
            type: 'DEBIT'
        }], { session });

        // Create CREDIT ledger entry (to target account)
        await ledgerModel.create([{
            account: toAccount,
            amount: validAmount,
            transaction: transaction._id,
            type: 'CREDIT'
        }], { session });

        // Update account balances atomically
        await accountModel.updateOne(
            { _id: systemAcct._id },
            { $inc: { balance: -validAmount } },
            { session }
        );

        await accountModel.updateOne(
            { _id: toAccount },
            { $inc: { balance: validAmount } },
            { session }
        );

        // Mark transaction as COMPLETED
        await transactionModel.findByIdAndUpdate(
            transaction._id,
            { status: 'COMPLETED' },
            { session, new: true }
        );

        // REQUIREMENT #10: Audit logging
        try {
            await auditModel.create([{
                actor: req.user._id,
                action: 'TRANSACTION_COMPLETED',
                entityType: 'Transaction',
                entityId: transaction._id,
                meta: {
                    type: 'initial_funding',
                    toAccount,
                    amount: validAmount,
                    idempotencyKey
                },
                source: 'initial_funds_api'
            }], { session });
        } catch (auditErr) {
            console.warn('[Audit] Failed to log initial funds transaction:', auditErr.message);
        }

        await session.commitTransaction();

    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }

        console.error(`[Initial Funds] Error for idempotency key ${idempotencyKey}:`, error.message);

        if (transaction && transaction._id) {
            try {
                await transactionModel.findByIdAndUpdate(
                    transaction._id,
                    { status: 'FAILED' },
                    { new: true }
                );
            } catch (updateErr) {
                console.error('[Initial Funds] Failed to mark transaction as FAILED:', updateErr.message);
            }
        }

        if (error.message.includes('not in ACTIVE status')) {
            return errorResponse(res, 400, 'account_not_eligible', error.message);
        } else {
            return errorResponse(res, 500, 'transaction_failed', 'Initial funds transaction failed. Please retry with the same idempotency key.');
        }
    } finally {
        // REQUIREMENT #2: Always end session
        await session.endSession();
    }

    return successResponse(res, { transaction }, 201);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions for Transaction Filtering & Pagination
// ─────────────────────────────────────────────────────────────────────────────

/**
 * buildTransactionQuery(req)
 * 
 * REQUIREMENT #5: Use validation helpers to build a safe filter object.
 * REQUIREMENT #11: Defensive checks for req.user.
 * Constructs a Mongoose filter from request query parameters with strict validation.
 *
 * Supported params:
 *   startDate  – ISO 8601 date string; filter createdAt >= startDate
 *   endDate    – ISO 8601 date string; filter createdAt <= endDate
 *   type       – "credit" | "debit" (relative to requester); omit for all
 *   minAmount  – numeric lower bound on amount
 *   maxAmount  – numeric upper bound on amount
 */
async function buildTransactionQuery(req) {
    // REQUIREMENT #11: Defensive check for authentication middleware bypass
    if (!req.user || !req.user._id) {
        throw new Error('Authentication required: user not found in request context.');
    }

    const userId = req.user._id;

    // Fetch all account IDs belonging to the authenticated user
    const userAccounts = await accountModel.find({ user: userId }).select('_id');
    const accountIds = userAccounts.map((a) => a._id);

    // REQUIREMENT #11: If user has no accounts, return safe empty filter
    if (accountIds.length === 0) {
        return { _id: { $exists: false } }; // Never matches; user has no accounts
    }

    const { startDate, endDate, type, minAmount, maxAmount } = req.query;

    // Build account filter based on transaction type
    let accountFilter;
    if (type === 'credit') {
        accountFilter = { toAccount: { $in: accountIds } };
    } else if (type === 'debit') {
        accountFilter = { fromAccount: { $in: accountIds } };
    } else {
        // Default: both credit and debit transactions
        accountFilter = {
            $or: [
                { fromAccount: { $in: accountIds } },
                { toAccount: { $in: accountIds } }
            ]
        };
    }

    const filter = { ...accountFilter };

    // REQUIREMENT #5: Validate and apply date range filter
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) {
            const startDateObj = validateDateISO(startDate);
            filter.createdAt.$gte = startDateObj;
        }
        if (endDate) {
            const endDateObj = validateDateISO(endDate);
            filter.createdAt.$lte = endDateObj;
        }
    }

    // REQUIREMENT #5: Validate and apply amount range filter
    if (minAmount !== undefined || maxAmount !== undefined) {
        const min = minAmount !== undefined ? validatePositiveAmount(minAmount) : undefined;
        const max = maxAmount !== undefined ? validatePositiveAmount(maxAmount) : undefined;

        // REQUIREMENT #6: Validate min <= max constraint
        validateAmountRange(min, max);

        filter.amount = {};
        if (min !== undefined) filter.amount.$gte = min;
        if (max !== undefined) filter.amount.$lte = max;
    }

    return filter;
}

/**
 * parseSortParam(sortParam)
 * 
 * REQUIREMENT #15: Use sort field whitelist from constants.
 * Converts "field:asc" or "field:desc" string to a Mongoose sort object.
 * Defaults to { createdAt: -1 } (newest first).
 */
function parseSortParam(sortParam) {
    if (!sortParam) return { createdAt: -1 };

    const [field, direction] = sortParam.split(':');

    // REQUIREMENT #15: Only allow whitelisted sort fields
    if (!constants.ALLOWED_SORT_FIELDS.includes(field)) {
        return { createdAt: -1 };
    }

    return { [field]: direction === 'asc' ? 1 : -1 };
}

// ─────────────────────────────────────────────────────────────────────────────


/**
 * GET /api/transactions
 * 
 * REQUIREMENT #7: Use aggregation pipeline to avoid N+1 population queries.
 * Returns paginated, filtered transaction history for authenticated user.
 *
 * Query params: startDate, endDate, type, minAmount, maxAmount, page, limit, sort
 * Response: { success: true, data: [...], meta: { page, limit, total } }
 */
async function getTransactionHistory(req, res) {
    try {
        // REQUIREMENT #12: Use constants for pagination limits
        const { page, limit } = parseAndValidatePagination(
            req.query.page,
            req.query.limit,
            constants.TRANSACTION_HISTORY_MAX_LIMIT
        );

        const skip = (page - 1) * limit;
        const sort = parseSortParam(req.query.sort);

        // REQUIREMENT #5: Build filter with validation
        const filter = await buildTransactionQuery(req);

        // REQUIREMENT #7: Use aggregation pipeline with $lookup to prevent N+1 queries
        const [data, countResult] = await Promise.all([
            transactionModel.aggregate([
                { $match: filter },
                {
                    $lookup: {
                        from: 'accounts',
                        localField: 'fromAccount',
                        foreignField: '_id',
                        as: 'fromAccountData'
                    }
                },
                {
                    $lookup: {
                        from: 'accounts',
                        localField: 'toAccount',
                        foreignField: '_id',
                        as: 'toAccountData'
                    }
                },
                {
                    $project: {
                        _id: 1,
                        fromAccount: { $arrayElemAt: ['$fromAccountData._id', 0] },
                        toAccount: { $arrayElemAt: ['$toAccountData._id', 0] },
                        fromAccountCurrency: { $arrayElemAt: ['$fromAccountData.currency', 0] },
                        toAccountCurrency: { $arrayElemAt: ['$toAccountData.currency', 0] },
                        fromAccountStatus: { $arrayElemAt: ['$fromAccountData.status', 0] },
                        toAccountStatus: { $arrayElemAt: ['$toAccountData.status', 0] },
                        amount: 1,
                        status: 1,
                        idempotencyKey: 1,
                        createdAt: 1,
                        updatedAt: 1
                    }
                },
                { $sort: sort },
                { $skip: skip },
                { $limit: limit }
            ]),
            transactionModel.aggregate([
                { $match: filter },
                { $count: 'total' }
            ])
        ]);

        const total = countResult[0]?.total ?? 0;

        return successResponse(res, { 
            transactions: data, 
            meta: { page, limit, total } 
        }, 200);

    } catch (err) {
        console.error('[Transaction] getTransactionHistory error:', err.message);
        
        // Determine error type for appropriate response
        if (err.message && err.message.includes('Invalid')) {
            return errorResponse(res, 400, 'invalid_request', err.message);
        } else {
            return errorResponse(res, 500, 'server_error', 'Failed to retrieve transaction history');
        }
    }
}

/**
 * GET /api/transactions/export
 * 
 * REQUIREMENT #8: Robust CSV streaming with comprehensive error handling and randomized filename.
 * REQUIREMENT #12: Use CSV_EXPORT_MAX_LIMIT from constants.
 * Streams a CSV file of filtered transactions with cursor-based pagination.
 *
 * Query params: same as getTransactionHistory + optional page/limit
 * Response: CSV file download or error JSON
 */
async function exportTransactionsCsv(req, res) {
    const csvStream = csvFormat({ headers: true });

    // REQUIREMENT #8: Attach error handlers BEFORE piping to prevent uncaught stream errors
    csvStream.on('error', (err) => {
        console.error('[CSV Export] Stream format error:', err.message);
        if (!res.headersSent) {
            return errorResponse(res, 500, 'stream_error', 'CSV formatting failed');
        } else {
            // Headers already sent; must destroy response to prevent hanging
            csvStream.destroy();
            res.destroy();
        }
    });

    res.on('error', (err) => {
        console.error('[CSV Export] Response error:', err.message);
        // Destroy the stream if response errors
        try {
            csvStream.destroy();
        } catch (destroyErr) {
            console.error('[CSV Export] Error destroying stream:', destroyErr.message);
        }
    });

    try {
        const sort = parseSortParam(req.query.sort);

        // REQUIREMENT #5: Build filter with validation
        const filter = await buildTransactionQuery(req);

        // REQUIREMENT #12: Apply CSV export limit from constants
        let limit = constants.CSV_EXPORT_MAX_LIMIT;
        let skip = 0;

        // If pagination provided, respect it but cap at max
        if (req.query.page !== undefined || req.query.limit !== undefined) {
            const pagination = parseAndValidatePagination(
                req.query.page,
                req.query.limit,
                constants.CSV_EXPORT_MAX_LIMIT
            );
            skip = (pagination.page - 1) * pagination.limit;
            limit = pagination.limit;
        }

        // Count total matching documents before streaming
        const count = await transactionModel.countDocuments(filter);

        // REQUIREMENT #8: Generate collision-resistant filename using crypto.randomBytes
        // Pattern: transactions_TIMESTAMP_HEX.csv
        const randomHex = crypto.randomBytes(4).toString('hex');
        const filename = `transactions_${Date.now()}_${randomHex}.csv`;

        // Set response headers for CSV download
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // REQUIREMENT #8: Pipe stream AFTER all error handlers attached
        csvStream.pipe(res);

        // REQUIREMENT #7: Use cursor-based iteration for memory efficiency on large exports
        const cursor = transactionModel
            .find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .cursor();

        let rowCount = 0;
        const maxRows = limit;

        cursor.on('data', (doc) => {
            if (rowCount >= maxRows) {
                cursor.close();
                csvStream.end();
                return;
            }

            csvStream.write({
                _id: doc._id.toString(),
                fromAccount: doc.fromAccount?.toString() ?? '',
                toAccount: doc.toAccount?.toString() ?? '',
                amount: doc.amount,
                status: doc.status,
                idempotencyKey: doc.idempotencyKey,
                createdAt: doc.createdAt?.toISOString() ?? '',
                updatedAt: doc.updatedAt?.toISOString() ?? ''
            });

            rowCount++;
        });

        cursor.on('error', (err) => {
            console.error('[CSV Export] Cursor error:', err.message);
            if (!res.headersSent) {
                return errorResponse(res, 500, 'cursor_error', 'Failed to read transactions');
            } else {
                try {
                    csvStream.destroy();
                } catch (destroyErr) {
                    console.error('[CSV Export] Error destroying stream on cursor error:', destroyErr.message);
                }
                res.destroy();
            }
        });

        cursor.on('end', () => {
            csvStream.end();
        });

    } catch (err) {
        console.error('[CSV Export] Error:', err.message);

        // REQUIREMENT #8: Check if headers sent before responding
        if (!res.headersSent) {
            if (err.message && err.message.includes('Invalid')) {
                return errorResponse(res, 400, 'invalid_request', err.message);
            } else {
                return errorResponse(res, 500, 'export_failed', 'CSV export failed');
            }
        } else {
            // Headers already sent; destroy stream and response to prevent hanging
            try {
                csvStream.destroy();
            } catch (destroyErr) {
                console.error('[CSV Export] Error destroying stream:', destroyErr.message);
            }
            res.destroy();
        }
    }
}

module.exports={
    createTransaction,
    createInitialFundsTransaction,
    getTransactionHistory,
    exportTransactionsCsv
}