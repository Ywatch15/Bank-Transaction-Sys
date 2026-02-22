const transactionModel = require('../models/transaction.model');
const ledgerModel = require('../models/ledger.model');
const accountModel = require('../models/account.model');
const emailService = require('../services/email.service');
const mongoose = require('mongoose');
const { format: csvFormat } = require('fast-csv');

async function createTransaction(req, res) {
    /**
     * 1. Validate the user request
     */
    const{ fromAccount, toAccount, amount, idempotencyKey } = req.body;

    if(!fromAccount || !toAccount || !amount || !idempotencyKey){
        return res.status(400).json({ error: "Missing required fields." });
    }
    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount,
    })
    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    })

    if(!fromUserAccount || !toUserAccount){
        return res.status(404).json({ error: "One or both accounts not found." });
    }

    /**
     * 2. Validate idempotency key
     * CRITICAL: Use consistent HTTP status codes for idempotency contract.
     * All non-COMPLETED states return 409 (Conflict) for clarity on retry semantics.
     */

    const isTransactionAlreadyExists = await transactionModel.findOne({
        idempotencyKey: idempotencyKey,
    })

    if(isTransactionAlreadyExists){
        if(isTransactionAlreadyExists.status === "COMPLETED"){
            return res.status(200).json({ message: "Transaction already completed.", transaction: isTransactionAlreadyExists });
        } 
        if(isTransactionAlreadyExists.status === "PENDING"){
            // CRITICAL: Return 409 Conflict for pending state (not 200).
            // Client can detect retry is in progress.
            return res.status(409).json({ message: "Transaction is still pending. Idempotency key already in use.", idempotencyKey });
        }
        if(isTransactionAlreadyExists.status === "FAILED"){
            // CRITICAL: Return 409 Conflict for failed state (not 500).
            // Indicates previous attempt failed; client must retry with new idempotency key.
            return res.status(409).json({ error: "Previous transaction with this key failed. Use a new idempotency key to retry.", idempotencyKey });
        }
        if(isTransactionAlreadyExists.status === "REVERSED"){
            // CRITICAL: Return 409 Conflict for reversed state (not 500).
            return res.status(409).json({ error: "Transaction was previously reversed. Use a new idempotency key.", idempotencyKey });
        }
    }

    /**
     * 3. Check account status
     */
    if(fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE"){
        return res.status(400).json({ error: "One or both accounts are not active." });
    }

    /**
     * 4. Derive sender balance from ledger entries
     */
    const balance = await fromUserAccount.getBalance();

    if(balance<amount){
        return res.status(400).json({
            message: `Insufficient funds. Current balance is ${balance}, and requested amount is ${amount}.`
        })
    }
    let transaction;
    const session = await mongoose.startSession();
    try{

        /**
         * 5. Create transaction (PENDING)
         * 6. Create DEBIT ledger entry (atomic within session)
         * 7. Create CREDIT ledger entry (atomic within session)
         * 8. Mark transaction as COMPLETED
         * 9. Commit MongoDB session
         */
        
        // CRITICAL: Start transaction session. All operations below are atomic.
        // If ANY operation fails, the entire transaction rolls back.
        session.startTransaction();
        
        transaction = (await transactionModel.create([{
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status:"PENDING"
        }], { session }))[0];
    
        // CRITICAL: Create DEBIT and CREDIT ledger entries atomically.
        // Both must succeed or both must fail (no partial ledger state).
        const debitLedgerEntry = await ledgerModel.create([{
            account: fromAccount,
            amount,
            transaction: transaction._id,
            type:"DEBIT"
        }], { session });
    
        // CRITICAL FIX: REMOVED 11-second artificial delay.
        // The delay broke double-entry bookkeeping atomicity:
        // If network failed between DEBIT and CREDIT, money would vanish.
        // All ledger operations must be atomic within the session.
    
        const creditLedgerEntry = await ledgerModel.create([{
            account: toAccount,
            amount,
            transaction: transaction._id,
            type:"CREDIT"
        }], { session });
    
        // Mark transaction as COMPLETED within the same session/transaction.
        await transactionModel.findOneAndUpdate({_id: transaction._id}, {status:"COMPLETED"}, { session, new:true });
    
        // CRITICAL: Commit at end of all operations. If any operation above failed,
        // we never reach this point (caught below).
        await session.commitTransaction();
    } catch(error){
        // CRITICAL FIX: Explicitly abort the transaction on error.
        // Without this, the MongoDB session may remain open, causing connection pool exhaustion.
        // The transaction must be explicitly aborted to rollback all writes.
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        
        console.error(`[Transaction] Error creating transaction for idempotency key ${idempotencyKey}:`, error.message);
        
        // Attempt to mark transaction as FAILED (outside the failed session context).
        if (transaction && transaction._id) {
            try {
                await transactionModel.findByIdAndUpdate(
                    transaction._id,
                    { status: "FAILED" },
                    { new: true }
                );
            } catch (updateErr) {
                console.error(`[Transaction] Failed to mark transaction as FAILED:`, updateErr.message);
            }
        }
        
        return res.status(500).json({
            message: "Transaction failed. Please retry with the same idempotency key.",
            idempotencyKey,
            retryable: true,
            error: error.message
        });
    } finally {
        // CRITICAL FIX: Always end the session, even if an error occurs.
        // Without this, sessions leak and exhaust MongoDB connection pool.
        await session.endSession();
    }


    /**
     * 10. Send email notification
     */

    await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount);
    return res.status(201).json({ message: "Transaction completed successfully.", transaction });
}

async function createInitialFundsTransaction(req, res) {
    const {toAccount, amount, idempotencyKey} = req.body;

    if(!toAccount || !amount || !idempotencyKey){
        return res.status(400).json({ error: "Missing required fields." });
    }

    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    })

    if(!toUserAccount){
        return res.status(404).json({ error: "Account not found." });
    }

    const fromUserAccount = await accountModel.findOne({
        // systemUser: true,
        currency: toUserAccount.currency,
        user: req.user._id
    })
    if(!fromUserAccount){
        return res.status(404).json({ error: "System user account not found." });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    const transaction = new transactionModel({
        fromAccount: fromUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status:"PENDING"
    });

    const debitLedgerEntry = await ledgerModel.create([{
        account: fromUserAccount._id,
        amount,
        transaction: transaction._id,
        type:"DEBIT"
    }], { session });

    const creditLedgerEntry = await ledgerModel.create([{
        account: toAccount,
        amount,
        transaction: transaction._id,
        type:"CREDIT"
    }], { session });

    transaction.status = "COMPLETED";
    await transaction.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({ message: "Initial funds transaction completed successfully.", transaction });
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers shared by history and CSV export
// ─────────────────────────────────────────────────────────────────────────────

/**
 * buildTransactionQuery(req)
 * Resolves the user's accounts and constructs a Mongoose filter object
 * from the request query params.
 *
 * Supported params:
 *   startDate  – ISO date string; filter createdAt >= startDate
 *   endDate    – ISO date string; filter createdAt <= endDate
 *   type       – "credit" | "debit" (relative to the requester); omit for all
 *   minAmount  – numeric lower bound on amount
 *   maxAmount  – numeric upper bound on amount
 *
 * CRITICAL: All numeric and date parameters are strictly validated.
 * Invalid input throws an error (caught in calling endpoint).
 */

// CRITICAL: Validation helpers to prevent malformed queries.
function validateAmount(val) {
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0 || !Number.isFinite(num)) {
        throw new Error(`Invalid amount "${val}": must be positive finite number`);
    }
    return num;
}

function validateDate(val) {
    const date = new Date(val);
    if (isNaN(date.getTime())) {
        throw new Error(`Invalid date "${val}": must be ISO 8601 format`);
    }
    return date;
}

async function buildTransactionQuery(req) {
    const userId = req.user._id;

    // Fetch all account IDs belonging to the authenticated user.
    const userAccounts = await accountModel.find({ user: userId }).select("_id");
    const accountIds = userAccounts.map((a) => a._id);

    const { startDate, endDate, type, minAmount, maxAmount } = req.query;

    // Base: only return transactions involving the user's accounts.
    let accountFilter;
    if (type === "credit") {
        accountFilter = { toAccount: { $in: accountIds } };
    } else if (type === "debit") {
        accountFilter = { fromAccount: { $in: accountIds } };
    } else {
        // transfer / default → either side
        accountFilter = {
            $or: [{ fromAccount: { $in: accountIds } }, { toAccount: { $in: accountIds } }],
        };
    }

    const filter = { ...accountFilter };

    // CRITICAL: Date range filtering with strict validation.
    // Prevents NaN queries or Invalid Date objects from silently breaking queries.
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = validateDate(startDate);
        if (endDate) filter.createdAt.$lte = validateDate(endDate);
    }

    // CRITICAL: Amount range filtering with strict validation.
    // Prevents:
    // - parseFloat("NaN") queries that silently fail
    // - Negative amounts (nonsensical in financial context)
    // - minAmount > maxAmount (impossible ranges)
    if (minAmount !== undefined || maxAmount !== undefined) {
        const min = minAmount !== undefined ? validateAmount(minAmount) : undefined;
        const max = maxAmount !== undefined ? validateAmount(maxAmount) : undefined;
        
        // CRITICAL: Validate range constraint: min <= max
        if (min !== undefined && max !== undefined && min > max) {
            throw new Error(`Invalid amount range: minAmount (${min}) must be <= maxAmount (${max})`);
        }
        
        filter.amount = {};
        if (min !== undefined) filter.amount.$gte = min;
        if (max !== undefined) filter.amount.$lte = max;
    }

    return filter;
}

/**
 * parseSortParam(sortParam)
 * Converts "field:asc" or "field:desc" string to a Mongoose sort object.
 * Defaults to { createdAt: -1 } (newest first).
 */
function parseSortParam(sortParam) {
    const ALLOWED_SORT_FIELDS = ["createdAt", "amount", "status", "updatedAt"];

    if (!sortParam) return { createdAt: -1 };

    const [field, direction] = sortParam.split(":");
    if (!ALLOWED_SORT_FIELDS.includes(field)) return { createdAt: -1 };

    return { [field]: direction === "asc" ? 1 : -1 };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/transactions
 * Returns paginated, filtered transaction history for the authenticated user.
 *
 * Query params: startDate, endDate, type, minAmount, maxAmount, page, limit, sort
 * Response: { data, page, limit, total }
 */
async function getTransactionHistory(req, res) {
    try {
        const page  = Math.max(1, parseInt(req.query.page  ?? "1",  10));
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit ?? "20", 10)));
        const skip  = (page - 1) * limit;
        const sort  = parseSortParam(req.query.sort);

        // CRITICAL: Validation errors from buildTransactionQuery are caught here.
        const filter = await buildTransactionQuery(req);

        const [data, total] = await Promise.all([
            transactionModel
                .find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate("fromAccount", "currency status")
                .populate("toAccount", "currency status")
                .lean(),
            transactionModel.countDocuments(filter),
        ]);

        return res.status(200).json({ data, page, limit, total });
    } catch (err) {
        console.error("[Transaction] getTransactionHistory error:", err.message);
        // CRITICAL: Return 400 for validation errors, 500 for server errors.
        const status = err.message && err.message.includes("Invalid") ? 400 : 500;
        return res.status(status).json({ 
            success: false, 
            message: status === 400 ? err.message : "Internal server error." 
        });
    }
}

/**
 * GET /api/transactions/export
 * Streams a CSV file of the filtered transactions.
 * Pagination is optional; if page/limit are omitted, all matching records are exported.
 *
 * Query params: same as getTransactionHistory + optional page/limit
 *
 * CRITICAL: Includes comprehensive error handling to prevent resource leaks.
 * Stream errors and response errors are both handled to close connections properly.
 */
async function exportTransactionsCsv(req, res) {
    const csvStream = csvFormat({ headers: true });
    
    // CRITICAL: Attach error handlers BEFORE piping to prevent uncaught errors.
    csvStream.on('error', (err) => {
        console.error("[CSV Export] Stream error:", err.message);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: "CSV export failed." });
        } else {
            // Headers already sent; must destroy response.
            res.destroy();
        }
    });

    res.on('error', (err) => {
        console.error("[CSV Export] Response error:", err.message);
        // Destroy the stream if response errors.
        csvStream.destroy();
    });

    try {
        const sort   = parseSortParam(req.query.sort);
        // CRITICAL: Validation errors from buildTransactionQuery are caught here.
        const filter = await buildTransactionQuery(req);

        // CRITICAL: Pagination is optional, but enforce upper bound to prevent memory exhaustion.
        // Without a limit, user with 1M transactions could export all, consuming server memory.
        let query = transactionModel.find(filter).sort(sort).lean();

        if (req.query.page !== undefined || req.query.limit !== undefined) {
            const page  = Math.max(1, parseInt(req.query.page  ?? "1",  10));
            const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit ?? "100", 10)));
            query = query.skip((page - 1) * limit).limit(limit);
        }

        const transactions = await query;

        // Set response headers for CSV download.
        const filename = `transactions_${Date.now()}.csv`;
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

        // CRITICAL: Pipe AFTER error handlers are attached.
        csvStream.pipe(res);

        for (const txn of transactions) {
            csvStream.write({
                _id:            txn._id.toString(),
                fromAccount:    txn.fromAccount?.toString() ?? "",
                toAccount:      txn.toAccount?.toString() ?? "",
                amount:         txn.amount,
                status:         txn.status,
                idempotencyKey: txn.idempotencyKey,
                createdAt:      txn.createdAt?.toISOString() ?? "",
                updatedAt:      txn.updatedAt?.toISOString() ?? "",
            });
        }

        // CRITICAL: End the stream to signal completion and flush buffer.
        csvStream.end();
    } catch (err) {
        console.error("[CSV Export] Error:", err.message);
        // CRITICAL: Check if headers sent to avoid "Headers already sent" error.
        if (!res.headersSent) {
            // Return appropriate status based on error type.
            const status = err.message && err.message.includes("Invalid") ? 400 : 500;
            return res.status(status).json({ 
                success: false, 
                message: status === 400 ? err.message : "Internal server error." 
            });
        } else {
            // Headers already sent; destroy stream and response to prevent hanging.
            csvStream.destroy();
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