const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Audit Log Schema - Records all critical account and transaction actions
 * Used for compliance, dispute resolution, and security monitoring
 */
const auditLogSchema = new Schema(
  {
    // Who performed the action
    actor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    
    // What action was performed (e.g., "ACCOUNT_FROZEN", "TRANSACTION_CREATED")
    action: {
      type: String,
      required: true,
      enum: ['ACCOUNT_FROZEN', 'ACCOUNT_UNFROZEN', 'TRANSACTION_CREATED', 'TRANSACTION_COMPLETED'],
      index: true
    },
    
    // What entity type was affected (e.g., "Account", "Transaction")
    entityType: {
      type: String,
      required: true,
      enum: ['Account', 'Transaction'],
      index: true
    },
    
    // ID of the affected entity
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true
    },
    
    // Additional metadata (reason, details, etc.)
    meta: {
      type: Schema.Types.Mixed,
      default: {}
    },
    
    // IP address or source of the action (optional)
    source: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'auditLogs'
  }
);

// Compound index for efficient querying by entity
auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

// Compound index for querying by actor and action
auditLogSchema.index({ actor: 1, action: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
