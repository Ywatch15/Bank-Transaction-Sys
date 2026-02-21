/**
 * FilterBar.jsx
 * Filter controls for the Transactions page.
 * Props:
 *   filters  — current filter state object
 *   onChange(filters) — called on any change
 *   onReset() — called when user resets filters
 */
import React from 'react';

const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc',  label: 'Oldest first' },
  { value: 'amount:desc',    label: 'Amount (high → low)' },
  { value: 'amount:asc',     label: 'Amount (low → high)' },
];

const TYPE_OPTIONS = [
  { value: '',       label: 'All types' },
  { value: 'credit', label: 'Credit (received)' },
  { value: 'debit',  label: 'Debit (sent)' },
];

export default function FilterBar({ filters, onChange, onReset }) {
  function handle(e) {
    const { name, value } = e.target;
    onChange({ ...filters, [name]: value, page: 1 });
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Start date */}
        <div>
          <label htmlFor="startDate" className="label">From</label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            value={filters.startDate}
            onChange={handle}
            className="input-field"
          />
        </div>

        {/* End date */}
        <div>
          <label htmlFor="endDate" className="label">To</label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            value={filters.endDate}
            onChange={handle}
            className="input-field"
          />
        </div>

        {/* Type */}
        <div>
          <label htmlFor="type" className="label">Type</label>
          <select id="type" name="type" value={filters.type} onChange={handle} className="input-field">
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Min amount */}
        <div>
          <label htmlFor="minAmount" className="label">Min Amount</label>
          <input
            id="minAmount"
            name="minAmount"
            type="number"
            min="0"
            step="0.01"
            value={filters.minAmount}
            onChange={handle}
            placeholder="0"
            className="input-field"
          />
        </div>

        {/* Max amount */}
        <div>
          <label htmlFor="maxAmount" className="label">Max Amount</label>
          <input
            id="maxAmount"
            name="maxAmount"
            type="number"
            min="0"
            step="0.01"
            value={filters.maxAmount}
            onChange={handle}
            placeholder="∞"
            className="input-field"
          />
        </div>

        {/* Sort */}
        <div>
          <label htmlFor="sort" className="label">Sort</label>
          <select id="sort" name="sort" value={filters.sort} onChange={handle} className="input-field">
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <button onClick={onReset} className="btn-secondary py-1.5 text-xs">
          Reset Filters
        </button>
      </div>
    </div>
  );
}
