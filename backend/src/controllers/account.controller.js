const accountModel = require("../models/account.model");



async function createAccountController(req,res){
    const user  = req.user;

    const account = await accountModel.create({
        user :user._id
    })

    res.status(201).json({
        account
    })
}


async function getUserAccountsController(req,res){
    const accounts = await accountModel.find({user:req.user._id});

    res.status(200).json({
        accounts
    })
}

async function getAccountBalanceController(req,res){
    const {accountId} = req.params;
    const account = await accountModel.findOne({
        _id:accountId,
        user:req.user._id
    })
    if(!account){
        return res.status(404).json({ error: "Account not found." });
    }
    const balance = await account.getBalance();
    // Return full account data so frontend can display status/currency
    res.status(200).json({
        _id: account._id,
        accountId: account._id,
        balance: balance,
        status: account.status,
        currency: account.currency
    })
}

module.exports={
    createAccountController,
    getUserAccountsController,
    getAccountBalanceController
}