/**
 * LedgerTable.jsx — Professional ledger table component
 * -------------------------------------------------------
 * Uses TanStack Table for flexible sorting/filtering.
 * Displays transactions with debit/credit visualization.
 * Optimized for desktop-first dense display.
 */
import React, { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  formatDate,
  formatCurrency,
  formatTransactionType,
} from "../lib/format";
import Badge from "./Badge";

function LedgerTable({
  data = [],
  columns = [],
  isLoading = false,
  onRowClick = null,
  compact = true,
  striped = true,
}) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-sm">No transactions to display</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-gray-800 rounded-xl">
      <table className="w-full text-sm">
        <thead className="bg-gray-900 border-b border-gray-800">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className={`
                    px-4 py-3 text-left font-medium text-gray-300
                    ${header.column.columnDef.meta?.align === "right" ? "text-right" : ""}
                    ${header.column.getCanSort() ? "cursor-pointer hover:bg-gray-800" : ""}
                  `}
                >
                  <div className="flex items-center gap-2">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                    {header.column.getCanSort() && (
                      <span className="text-gray-500 text-xs">
                        {header.column.getIsSorted() === "desc" && "▼"}
                        {header.column.getIsSorted() === "asc" && "▲"}
                        {!header.column.getIsSorted() && "⇅"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, idx) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row.original)}
              className={`
                border-b border-gray-800
                ${striped && idx % 2 === 1 ? "bg-gray-800/40" : ""}
                ${onRowClick ? "cursor-pointer hover:bg-gray-800" : ""}
                transition-colors
              `}
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className={`
                    px-4 py-3
                    ${cell.column.columnDef.meta?.align === "right" ? "text-right" : ""}
                  `}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Default ledger columns definition for transactions
 * Used in Dashboard and Transactions pages
 */
export function getDefaultLedgerColumns() {
  return [
    {
      accessorKey: "date",
      header: "Date",
      cell: (info) => formatDate(info.getValue()),
      size: 100,
    },
    {
      accessorKey: "reference",
      header: "Reference",
      cell: (info) => info.getValue() || "–",
      size: 120,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: (info) => info.getValue(),
      size: 250,
    },
    {
      accessorKey: "debit",
      header: "Debit",
      cell: (info) => {
        const value = info.getValue();
        return value ? (
          <span className="text-debit-600 font-medium">
            {formatCurrency(value)}
          </span>
        ) : (
          "–"
        );
      },
      meta: { align: "right" },
      size: 100,
    },
    {
      accessorKey: "credit",
      header: "Credit",
      cell: (info) => {
        const value = info.getValue();
        return value ? (
          <span className="text-credit-600 font-medium">
            {formatCurrency(value)}
          </span>
        ) : (
          "–"
        );
      },
      meta: { align: "right" },
      size: 100,
    },
    {
      accessorKey: "balance",
      header: "Balance",
      cell: (info) => (
        <span className="font-medium text-brand-400">
          {formatCurrency(info.getValue())}
        </span>
      ),
      meta: { align: "right" },
      size: 100,
    },
  ];
}

export default LedgerTable;
