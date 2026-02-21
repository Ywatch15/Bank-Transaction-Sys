const accountModel = require("../models/account.model");

/**
 * Freeze an account — sets status to FROZEN.
 * POST /api/admin/accounts/:accountId/freeze
 */
async function freezeAccount(req, res) {
  try {
    const { accountId } = req.params;

    const account = await accountModel.findById(accountId);
    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found." });
    }

    if (account.status === "FROZEN") {
      return res.status(400).json({ success: false, message: "Account is already frozen." });
    }

    account.status = "FROZEN";
    await account.save();

    return res.status(200).json({
      success: true,
      message: "Account has been frozen.",
      account: { _id: account._id, status: account.status },
    });
  } catch (err) {
    console.error("[Admin] freezeAccount error:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
}

/**
 * Unfreeze an account — restores status to ACTIVE.
 * POST /api/admin/accounts/:accountId/unfreeze
 */
async function unfreezeAccount(req, res) {
  try {
    const { accountId } = req.params;

    const account = await accountModel.findById(accountId);
    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found." });
    }

    if (account.status !== "FROZEN") {
      return res.status(400).json({
        success: false,
        message: `Account is not frozen (current status: ${account.status}).`,
      });
    }

    account.status = "ACTIVE";
    await account.save();

    return res.status(200).json({
      success: true,
      message: "Account has been unfrozen.",
      account: { _id: account._id, status: account.status },
    });
  } catch (err) {
    console.error("[Admin] unfreezeAccount error:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
}

module.exports = { freezeAccount, unfreezeAccount };
