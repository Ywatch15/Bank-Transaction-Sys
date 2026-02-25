/**
 * TransferModal.jsx — Modal dialog for creating a transfer
 * ----------------------------------------------------------
 * Shows from account, to account selector, amount input, and confirmation.
 * Uses Headless UI Dialog for accessibility.
 */
import React, { useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useCreateTransfer } from "../hooks/useTransactions";
import { formatCurrency } from "../lib/format";

function TransferModal({
  isOpen = false,
  onClose = () => {},
  fromAccount = null,
  accounts = [],
  onSuccess = () => {},
}) {
  const [toAccountId, setToAccountId] = useState("");
  const [manualId, setManualId] = useState("");
  const [inputMode, setInputMode] = useState("select"); // 'select' or 'manual'
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [step, setStep] = useState("form"); // 'form' or 'confirm'
  const { execute, loading } = useCreateTransfer();

  const otherAccounts = accounts.filter((a) => a._id !== fromAccount?._id);
  const effectiveToId = inputMode === "manual" ? manualId.trim() : toAccountId;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!effectiveToId || !amount) {
      alert("Please fill in all fields");
      return;
    }
    // Client-side validation: positive number, max 2 decimals
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      alert("Amount must be a positive number");
      return;
    }
    if (amount.includes(".") && amount.split(".")[1]?.length > 2) {
      alert("Amount allows max 2 decimal places");
      return;
    }
    // Prevent same-account transfer
    if (effectiveToId === fromAccount?._id) {
      alert("Source and destination accounts must be different");
      return;
    }
    setStep("confirm");
  };

  const handleConfirm = async () => {
    try {
      await execute(fromAccount._id, effectiveToId, parseFloat(amount), note);
      setToAccountId("");
      setManualId("");
      setAmount("");
      setNote("");
      setStep("form");
      onSuccess();
      onClose();
    } catch (error) {
      // Error handled by useCreateTransfer hook
    }
  };

  const toAccount = accounts.find((a) => a._id === effectiveToId);

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform bg-gray-900 p-6 border border-gray-800 rounded-xl shadow-2xl transition-all">
                {step === "form" ? (
                  <>
                    <Dialog.Title className="text-lg font-semibold text-white mb-4">
                      New Transfer
                    </Dialog.Title>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* From Account (read-only) */}
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          From Account
                        </label>
                        <div className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300">
                          {fromAccount?.numberMasked || "–"} (
                          {fromAccount?.currency})<br />
                          Balance:{" "}
                          {formatCurrency(
                            fromAccount?.balance,
                            fromAccount?.currency,
                          )}
                        </div>
                      </div>

                      {/* To Account — dual mode: dropdown or manual ID */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-medium text-gray-400">
                            To Account
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setInputMode((m) =>
                                m === "select" ? "manual" : "select",
                              );
                              setToAccountId("");
                              setManualId("");
                            }}
                            className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                          >
                            {inputMode === "select"
                              ? "Enter ID manually"
                              : "Select from my accounts"}
                          </button>
                        </div>

                        {inputMode === "select" ? (
                          <>
                            <select
                              id="to-account"
                              value={toAccountId}
                              onChange={(e) => setToAccountId(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
                              required
                            >
                              <option value="">Select account...</option>
                              {otherAccounts.map((a) => (
                                <option key={a._id} value={a._id}>
                                  {a.currency} ···{String(a._id).slice(-6)}{" "}
                                  (Bal: {formatCurrency(a.balance, a.currency)})
                                </option>
                              ))}
                            </select>
                            {otherAccounts.length === 0 && (
                              <p className="mt-1 text-xs text-amber-400">
                                No other accounts found.{" "}
                                <button
                                  type="button"
                                  onClick={() => setInputMode("manual")}
                                  className="underline text-brand-400"
                                >
                                  Enter an account ID manually
                                </button>
                              </p>
                            )}
                          </>
                        ) : (
                          <input
                            id="to-account-manual"
                            type="text"
                            value={manualId}
                            onChange={(e) => setManualId(e.target.value)}
                            placeholder="Paste destination account ID"
                            className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm font-mono"
                            required
                          />
                        )}
                      </div>

                      {/* Amount */}
                      <div>
                        <label
                          htmlFor="amount"
                          className="block text-xs font-medium text-gray-400 mb-1"
                        >
                          Amount
                        </label>
                        <input
                          id="amount"
                          type="number"
                          step="0.01"
                          min="0"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
                          required
                        />
                      </div>

                      {/* Note */}
                      <div>
                        <label
                          htmlFor="note"
                          className="block text-xs font-medium text-gray-400 mb-1"
                        >
                          Reference / Note (optional)
                        </label>
                        <textarea
                          id="note"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="e.g. Loan repayment"
                          className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm resize-none"
                          rows="3"
                        />
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-3 pt-4">
                        <button
                          type="button"
                          onClick={onClose}
                          className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 rounded-lg font-medium text-sm hover:bg-gray-800 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg font-medium text-sm hover:bg-brand-500 transition-colors"
                        >
                          Review
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <>
                    <Dialog.Title className="text-lg font-semibold text-white mb-4">
                      Confirm Transfer
                    </Dialog.Title>

                    <div className="space-y-3 mb-6 bg-gray-800 p-4 rounded-lg border border-gray-700">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">From:</span>
                        <span className="font-medium text-gray-200">
                          {fromAccount?.numberMasked}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">To:</span>
                        <span className="font-medium text-gray-200 font-mono">
                          {toAccount
                            ? `${toAccount.currency} ···${String(toAccount._id).slice(-6)}`
                            : `···${effectiveToId.slice(-8)}`}
                        </span>
                      </div>
                      <div className="border-t border-gray-700 pt-3 flex justify-between text-sm font-semibold">
                        <span className="text-gray-300">Amount:</span>
                        <span className="text-brand-400">
                          {formatCurrency(parseFloat(amount))}
                        </span>
                      </div>
                      {note && (
                        <div className="border-t border-gray-700 pt-3">
                          <span className="text-xs text-gray-400">Note: </span>
                          <p className="text-sm text-gray-300">{note}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setStep("form")}
                        disabled={loading}
                        className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 rounded-lg font-medium text-sm hover:bg-gray-800 transition-colors disabled:opacity-50"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-credit-600 text-white rounded font-medium text-sm hover:bg-credit-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Processing...
                          </>
                        ) : (
                          "Confirm Transfer"
                        )}
                      </button>
                    </div>
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default TransferModal;
