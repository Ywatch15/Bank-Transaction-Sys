const transactionModel = require('../models/transaction.model');
const ledgerModel = require('../models/ledger.model');
const accountModel = require('../models/account.model');
const emailService = require('../services/email.service');


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
}