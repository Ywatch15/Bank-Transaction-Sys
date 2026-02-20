const transactionModel = require('../models/transaction.model');
const ledgerModel = require('../models/ledger.model');
const accountModel = require('../models/account.model');
const emailService = require('../services/email.service');
const mongoose = require('mongoose');

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

module.exports={
    createTransaction,
    createInitialFundsTransaction
}