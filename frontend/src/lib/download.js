/**
 * download.js — Blob download utility
 * -------------------------------------
 * Used for streaming CSV exports from the backend.
 *
 * Usage:
 *   import { downloadBlob } from '@/lib/download.js';
 *   const response = await api.get(API_ROUTES.transactionExport, {
 *     params: filters,
 *     responseType: 'blob',
 *   });
 *   downloadBlob(response.data, 'transactions.csv', 'text/csv');
 */

/**
 * Programmatically download a Blob with a user-visible filename.
 *
 * @param {Blob} blob        — The blob data from axios (responseType: 'blob')
 * @param {string} filename  — Suggested download filename
 * @param {string} mimeType  — MIME type (default: text/csv)
 */
export function downloadBlob(blob, filename = 'export.csv', mimeType = 'text/csv') {
  const url = URL.createObjectURL(new Blob([blob], { type: mimeType }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  // MUSt be in DOM for Firefox compatibility
  document.body.appendChild(anchor);
  anchor.click();
  // Clean up
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Build a timestamped filename for CSV exports.
 * e.g. "transactions_2026-02-21.csv"
 */
export function csvFilename(prefix = 'transactions') {
  const today = new Date().toISOString().split('T')[0];
  return `${prefix}_${today}.csv`;
}
