const mongoose = require("mongoose");

/**
 * AuditLog schema — stores one document per inbound request.
 * Sensitive data (passwords, full card numbers) must NEVER be stored here.
 */
const auditLogSchema = new mongoose.Schema(
  {
    // The authenticated user, if the request carried a valid JWT.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
    // Source IP of the request.
    ip: {
      type: String,
      default: null,
    },
    // HTTP method (GET, POST, etc.)
    method: {
      type: String,
      required: true,
    },
    // Request route/path (e.g. /api/transactions/)
    route: {
      type: String,
      required: true,
    },
    // Optional small metadata object (e.g. { amount, accountId }).
    // Keep this payload lean — no secrets.
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    // createdAt is the canonical "audit timestamp"; updatedAt is not needed.
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const auditLogModel = mongoose.model("auditLog", auditLogSchema);

module.exports = auditLogModel;
