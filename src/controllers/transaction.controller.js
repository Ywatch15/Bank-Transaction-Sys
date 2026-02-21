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
     */

    const isTransactionAlreadyExists = await transactionModel.findOne({
        idempotencyKey: idempotencyKey,
    })

    if(isTransactionAlreadyExists){
        if(isTransactionAlreadyExists.status === "COMPLETED"){
            return res.status(200).json({ message: "Transaction already completed.", transaction: isTransactionAlreadyExists });
        } 
        if(isTransactionAlreadyExists.status === "PENDING"){
            return res.status(200).json({ message: "Transaction is still pending." });
        }
        if(isTransactionAlreadyExists.status === "FAILED"){
            return res.status(500).json({ error: "Transaction has failed." });
        }
        if(isTransactionAlreadyExists.status === "REVERSED"){
            return res.status(500).json({ message: "Transaction has been reversed." });
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
    try{

        /**
         * 5. Create transaction (PENDING)
         * 6. Create DEBIT ledger entry
         * 7. Create CREDIT ledger entry
         * 8. Mark transaction as COMPLETED
         * 9. Commit MongoDB session
         */
    
        const session = await mongoose.startSession();
        session.startTransaction(); // this will ensure that all operations within this block are atomic i.e., either all of them succeed or none of them are applied
        transaction = (await transactionModel.create([{
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status:"PENDING"
        }], { session }))[0];
    
        const debitLedgerEntry = await ledgerModel.create([{
            account: fromAccount,
            amount,
            transaction: transaction._id,
            type:"DEBIT"
        }], { session });
    
        await (()=>{
            return new Promise((resolve)=> setTimeout(resolve,11*1000));
        })()
    
        const creditLedgerEntry = await ledgerModel.create([{
            account: toAccount,
            amount,
            transaction: transaction._id,
            type:"CREDIT"
        }], { session });
    
        
        // transaction.status = "COMPLETED";
        // await transaction.save({ session });
        await transactionModel.findOneAndUpdate({_id: transaction._id}, {status:"COMPLETED"}, { session, new:true });
    
        await session.commitTransaction();
        session.endSession();
    } catch(error){
        // await transactionModel.findOneAndUpdate(
        //     {idempotencyKey: idempotencyKey},
        //     {status:"FAILED"}
        // )
        return res.status(400).json({
            message: "Transaction is pending due to some issues, please retry later.",
            error: error.message
        })
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
 */
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

    // Date range filtering
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Amount range filtering
    if (minAmount !== undefined || maxAmount !== undefined) {
        filter.amount = {};
        if (minAmount !== undefined) filter.amount.$gte = parseFloat(minAmount);
        if (maxAmount !== undefined) filter.amount.$lte = parseFloat(maxAmount);
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
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
}

/**
 * GET /api/transactions/export
 * Streams a CSV file of the filtered transactions.
 * Pagination is optional; if page/limit are omitted, all matching records are exported.
 *
 * Query params: same as getTransactionHistory + optional page/limit
 */
async function exportTransactionsCsv(req, res) {
    try {
        const sort   = parseSortParam(req.query.sort);
        const filter = await buildTransactionQuery(req);

        // Pagination is optional for CSV export.
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

        const csvStream = csvFormat({ headers: true });
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

        csvStream.end();
    } catch (err) {
        console.error("[Transaction] exportTransactionsCsv error:", err.message);
        // Only write error response if headers have not been sent yet.
        if (!res.headersSent) {
            return res.status(500).json({ success: false, message: "Internal server error." });
        }
    }
}

module.exports={
    createTransaction,
    createInitialFundsTransaction,
    getTransactionHistory,
    exportTransactionsCsv
}