const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const { freezeAccount, unfreezeAccount } = require("../controllers/admin.controller");

const router = express.Router();

// All admin routes require admin privileges.
router.use(authMiddleware.authAdminMiddleware);

/**
 * POST /api/admin/accounts/:accountId/freeze
 * Freezes an account, preventing further transactions.
 */
router.post("/accounts/:accountId/freeze", freezeAccount);

/**
 * POST /api/admin/accounts/:accountId/unfreeze
 * Restores a frozen account to ACTIVE status.
 */
router.post("/accounts/:accountId/unfreeze", unfreezeAccount);

module.exports = router;
