const accountModel = require("../models/account.model");
const { successResponse, errorResponse } = require("../utils/response");


async function createAccountController(req,res){
    try {
        const user  = req.user;
        const account = await accountModel.create({
            user: user._id
        });
        return successResponse(res, { account }, 201);
    } catch (err) {
        console.error("[Account] createAccount error:", err.message);
        return errorResponse(res, 500, 'server_error', 'Failed to create account.');
    }
}


async function getUserAccountsController(req,res){
    try {
        const accounts = await accountModel.find({user:req.user._id});
        return res.status(200).json({ accounts });
    } catch (err) {
        console.error("[Account] getUserAccounts error:", err.message);
        return errorResponse(res, 500, 'server_error', 'Failed to load accounts.');
    }
}

/**
 * GET /api/account/:accountId
 * Fetch a single account by ID (must belong to the authenticated user).
 */
async function getAccountDetailController(req, res) {
    try {
        const { accountId } = req.params;
        const account = await accountModel.findOne({
            _id: accountId,
            user: req.user._id
        });
        if (!account) {
            return errorResponse(res, 404, 'account_not_found', 'Account not found.');
        }
        return res.status(200).json(account);
    } catch (err) {
        console.error("[Account] getAccountDetail error:", err.message);
        return errorResponse(res, 500, 'server_error', 'Failed to load account.');
    }
}

async function getAccountBalanceController(req,res){
    try {
        const {accountId} = req.params;
        const account = await accountModel.findOne({
            _id:accountId,
            user:req.user._id
        });
        if(!account){
            return errorResponse(res, 404, 'account_not_found', 'Account not found.');
        }
        // Return denormalized balance (consistent with transaction logic)
        return res.status(200).json({
            _id: account._id,
            accountId: account._id,
            balance: account.balance,
            status: account.status,
            currency: account.currency
        });
    } catch (err) {
        console.error("[Account] getAccountBalance error:", err.message);
        return errorResponse(res, 500, 'server_error', 'Failed to load balance.');
    }
}

module.exports={
    createAccountController,
    getUserAccountsController,
    getAccountDetailController,
    getAccountBalanceController
}