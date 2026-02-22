const constants = require('../config/constants');

/**
 * Validate a positive monetary amount
 * @param {*} value - The value to validate
 * @returns {number} Parsed and validated amount
 * @throws {Error} If invalid
 */
function validatePositiveAmount(value) {
  const num = parseFloat(value);
  
  if (isNaN(num)) {
    throw new Error(`Invalid amount "${value}": must be a number`);
  }
  
  if (num <= 0) {
    throw new Error(`Invalid amount "${num}": must be greater than 0`);
  }
  
  if (!Number.isFinite(num)) {
    throw new Error(`Invalid amount "${num}": must be a finite number`);
  }
  
  if (num > constants.MAX_TRANSACTION_AMOUNT) {
    throw new Error(`Invalid amount "${num}": exceeds maximum allowed amount`);
  }
  
  return num;
}

/**
 * Validate an ISO 8601 date string
 * @param {*} value - The value to validate
 * @returns {Date} Parsed and validated date
 * @throws {Error} If invalid
 */
function validateDateISO(value) {
  if (!value) {
    return null;
  }
  
  const date = new Date(value);
  
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date "${value}": must be ISO 8601 format (e.g., 2026-02-22T10:30:00Z)`);
  }
  
  return date;
}

/**
 * Validate pagination parameters
 * @param {*} page - Page number (1-indexed)
 * @param {*} limit - Items per page
 * @returns {Object} { page, limit } validated and normalized
 * @throws {Error} If invalid
 */
function parseAndValidatePagination(page, limit, maxLimit) {
  let pageNum = parseInt(page) || 1;
  let limitNum = parseInt(limit) || constants.DEFAULT_PAGE_SIZE;
  const max = maxLimit || constants.TRANSACTION_HISTORY_MAX_LIMIT;
  
  if (pageNum < 1) {
    throw new Error("Page must be >= 1");
  }
  
  if (limitNum < 1) {
    throw new Error("Limit must be >= 1");
  }
  
  if (limitNum > max) {
    limitNum = max;
  }
  
  return { page: pageNum, limit: limitNum };
}

/**
 * Validate min and max amount range
 * @param {number} min - Minimum amount (already validated)
 * @param {number} max - Maximum amount (already validated)
 * @throws {Error} If min > max
 */
function validateAmountRange(min, max) {
  if (min !== undefined && max !== undefined && min > max) {
    throw new Error(`Invalid amount range: minAmount (${min}) must be <= maxAmount (${max})`);
  }
}

/**
 * Validate idempotency key format
 * @param {*} key - The key to validate
 * @throws {Error} If invalid
 */
function validateIdempotencyKey(key) {
  if (!key || typeof key !== 'string' || key.trim().length === 0) {
    throw new Error("Idempotency key is required and must be a non-empty string");
  }
  
  if (key.trim().length < 8) {
    throw new Error("Idempotency key must be at least 8 characters long");
  }
}

module.exports = {
  validatePositiveAmount,
  validateDateISO,
  parseAndValidatePagination,
  validateAmountRange,
  validateIdempotencyKey
};
