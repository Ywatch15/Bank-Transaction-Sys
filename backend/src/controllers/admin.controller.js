const accountModel = require("../models/account.model");
const auditModel = require("../models/audit.model");
const { errorResponse, successResponse } = require("../utils/response");
const mongoose = require("mongoose");

/**
 * Freeze an account — sets status to FROZEN.
 * 
 * REQUIREMENT #10: Audit logging for account freeze.
 * REQUIREMENT #11: Defensive check for authentication.
 * POST /api/admin/accounts/:accountId/freeze
 */
async function freezeAccount(req, res) {
  try {
    // REQUIREMENT #11: Defensive check for authentication middleware
    if (!req.user || !req.user._id) {
      return errorResponse(res, 401, 'unauthorized', 'Authentication required: user not found in request context.');
    }

    const { accountId } = req.params;

    // Validate accountId format
    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      return errorResponse(res, 400, 'invalid_account_id', 'Invalid account ID format.');
    }

    const account = await accountModel.findById(accountId);
    if (!account) {
      return errorResponse(res, 404, 'account_not_found', 'Account not found.');
    }

    if (account.status === "FROZEN") {
      return errorResponse(res, 400, 'account_already_frozen', 'Account is already frozen.');
    }

    // Update account status
    account.status = "FROZEN";
    await account.save();

    // REQUIREMENT #10: Audit log the freeze action
    try {
      await auditModel.create({
        actor: req.user._id,
        action: 'ACCOUNT_FROZEN',
        entityType: 'Account',
        entityId: account._id,
        meta: {
          accountId: accountId,
          previousStatus: 'ACTIVE'
        },
        source: 'admin_api'
      });
    } catch (auditErr) {
      console.warn('[Audit] Failed to log account freeze:', auditErr.message);
      // Don't fail the response if audit logging fails
    }

    return successResponse(res, {
      account: { _id: account._id, status: account.status }
    }, 200);
  } catch (err) {
    console.error("[Admin] freezeAccount error:", err.message);
    return errorResponse(res, 500, 'server_error', 'Failed to freeze account');
  }
}

/**
 * Unfreeze an account — restores status to ACTIVE.
 * 
 * REQUIREMENT #10: Audit logging for account unfreeze.
 * REQUIREMENT #11: Defensive check for authentication.
 * POST /api/admin/accounts/:accountId/unfreeze
 */
async function unfreezeAccount(req, res) {
  try {
    // REQUIREMENT #11: Defensive check for authentication middleware
    if (!req.user || !req.user._id) {
      return errorResponse(res, 401, 'unauthorized', 'Authentication required: user not found in request context.');
    }

    const { accountId } = req.params;

    // Validate accountId format
    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      return errorResponse(res, 400, 'invalid_account_id', 'Invalid account ID format.');
    }

    const account = await accountModel.findById(accountId);
    if (!account) {
      return errorResponse(res, 404, 'account_not_found', 'Account not found.');
    }

    if (account.status !== "FROZEN") {
      return errorResponse(res, 400, 'account_not_frozen', `Account is not frozen (current status: ${account.status}).`);
    }

    // Update account status
    account.status = "ACTIVE";
    await account.save();

    // REQUIREMENT #10: Audit log the unfreeze action
    try {
      await auditModel.create({
        actor: req.user._id,
        action: 'ACCOUNT_UNFROZEN',
        entityType: 'Account',
        entityId: account._id,
        meta: {
          accountId: accountId,
          previousStatus: 'FROZEN'
        },
        source: 'admin_api'
      });
    } catch (auditErr) {
      console.warn('[Audit] Failed to log account unfreeze:', auditErr.message);
      // Don't fail the response if audit logging fails
    }

    return successResponse(res, {
      account: { _id: account._id, status: account.status }
    }, 200);
  } catch (err) {
    console.error("[Admin] unfreezeAccount error:", err.message);
    return errorResponse(res, 500, 'server_error', 'Failed to unfreeze account');
  }
}

/**
 * GET /api/admin/accounts
 * List ALL accounts across all users (admin only).
 * Populates user name/email for the admin table.
 */
async function getAllAccounts(req, res) {
  try {
    if (!req.user || !req.user._id) {
      return errorResponse(res, 401, 'unauthorized', 'Authentication required.');
    }

    const accounts = await accountModel.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    return successResponse(res, { accounts }, 200);
  } catch (err) {
    console.error("[Admin] getAllAccounts error:", err.message);
    return errorResponse(res, 500, 'server_error', 'Failed to load accounts.');
  }
}

module.exports = { freezeAccount, unfreezeAccount, getAllAccounts };
