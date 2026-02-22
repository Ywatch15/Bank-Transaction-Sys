/**
 * format.js — Formatting utilities for banking data
 * ---------------------------------------------------
 * Currency, date, and number formatting helpers using Intl APIs.
 */

/**
 * Format amount as currency
 * @param {number} amount - The amount to format
 * @param {string} currency - ISO 4217 code (default: 'USD')
 * @param {string} locale - BCP 47 locale tag (default: 'en-US')
 * @returns {string} formatted currency string, e.g. "$1,234.56"
 */
export function formatCurrency(amount, currency = 'USD', locale = 'en-US') {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '–';
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format amount with sign (credit: green +, debit: red –)
 * Used in ledger tables to indicate transaction direction.
 * @param {number} amount
 * @param {string} currency
 * @returns {string} e.g. "+$500.00" or "-$200.50"
 */
export function formatSignedAmount(amount, currency = 'USD') {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '–';
  }
  const sign = amount >= 0 ? '+' : '';
  return sign + formatCurrency(Math.abs(amount), currency);
}

/**
 * Format date in short form, e.g. "Feb 22, 2026"
 * @param {Date|string|number} date
 * @returns {string}
 */
export function formatDate(date, locale = 'en-US') {
  if (!date) return '–';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '–';
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

/**
 * Format date + time, e.g. "Feb 22, 2026 14:32"
 * @param {Date|string|number} date
 * @returns {string}
 */
export function formatDateTime(date, locale = 'en-US') {
  if (!date) return '–';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '–';
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Format account number with masking, e.g. "****1234"
 * @param {string} accountNumber - Full account number
 * @param {number} showLast - How many trailing digits to show (default: 4)
 * @returns {string}
 */
export function maskAccountNumber(accountNumber, showLast = 4) {
  if (!accountNumber) return '–';
  const str = String(accountNumber);
  if (str.length <= showLast) return str;
  return '*'.repeat(str.length - showLast) + str.slice(-showLast);
}

/**
 * Format account display: name + masked number
 * e.g. "Checking ••••1234"
 * @param {string} name - Account name/type
 * @param {string} number - Account number
 * @returns {string}
 */
export function formatAccountDisplay(name, number) {
  if (!name) return maskAccountNumber(number);
  return `${name} ${maskAccountNumber(number)}`;
}

/**
 * Parse date string (YYYY-MM-DD) to display format
 * @param {string} isoDate - ISO 8601 date string
 * @returns {string} formatted date
 */
export function parseISODate(isoDate) {
  return formatDate(new Date(isoDate));
}

/**
 * Format percentage with 1-2 decimal places
 * @param {number} value - e.g. 0.0523 for 5.23%
 * @param {number} decimals - How many decimal places (default: 2)
 * @returns {string} e.g. "5.23%"
 */
export function formatPercent(value, decimals = 2) {
  if (typeof value !== 'number' || isNaN(value)) {
    return '–';
  }
  return (value * 100).toFixed(decimals) + '%';
}

/**
 * Format transaction type for display
 * @param {string} type - e.g. "transfer", "deposit", "withdrawal"
 * @returns {string} - Titlecase, e.g. "Transfer"
 */
export function formatTransactionType(type) {
  if (!type) return '–';
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

/**
 * Format transaction status for display
 * @param {string} status - e.g. "completed", "pending", "failed"
 * @returns {string}
 */
export function formatTransactionStatus(status) {
  return formatTransactionType(status);
}
