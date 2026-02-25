// Configuration constants for financial transaction system
module.exports = {
  // Transaction listing pagination
  TRANSACTION_HISTORY_MAX_LIMIT: parseInt(process.env.TRANSACTION_HISTORY_MAX_LIMIT) || 100,
  DEFAULT_PAGE_SIZE: 25,

  // CSV export limits
  CSV_EXPORT_MAX_LIMIT: parseInt(process.env.CSV_EXPORT_MAX_LIMIT) || 10000,

  // Transaction validation
  MIN_TRANSACTION_AMOUNT: 0.01,
  MAX_TRANSACTION_AMOUNT: 999999999.99,

  // Allowed fields for sorting
  ALLOWED_SORT_FIELDS: ["createdAt", "amount", "status", "updatedAt", "idempotencyKey", "fromAccount", "toAccount"],

  // Default sort
  DEFAULT_SORT: { createdAt: -1 },

  // Account status values
  ACCOUNT_STATUS: {
    ACTIVE: "ACTIVE",
    FROZEN: "FROZEN",
    CLOSED: "CLOSED"
  },

  // Transaction status values
  TRANSACTION_STATUS: {
    PENDING: "PENDING",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
    REVERSED: "REVERSED"
  },

  // Ledger types
  LEDGER_TYPE: {
    DEBIT: "DEBIT",
    CREDIT: "CREDIT"
  },

  // Audit action types
  AUDIT_ACTION: {
    ACCOUNT_FROZEN: "ACCOUNT_FROZEN",
    ACCOUNT_UNFROZEN: "ACCOUNT_UNFROZEN",
    TRANSACTION_CREATED: "TRANSACTION_CREATED",
    TRANSACTION_COMPLETED: "TRANSACTION_COMPLETED"
  }
};
