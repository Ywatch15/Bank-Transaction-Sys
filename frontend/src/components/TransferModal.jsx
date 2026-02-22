/**
 * TransferModal.jsx — Modal dialog for creating a transfer
 * ----------------------------------------------------------
 * Shows from account, to account selector, amount input, and confirmation.
 * Uses Headless UI Dialog for accessibility.
 */
import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useCreateTransfer } from '../hooks/useTransactions';
import { formatCurrency } from '../lib/format';

function TransferModal({
  isOpen = false,
  onClose = () => {},
  fromAccount = null,
  accounts = [],
  onSuccess = () => {},
}) {
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [step, setStep] = useState('form'); // 'form' or 'confirm'
  const { execute, loading } = useCreateTransfer();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!toAccountId || !amount) {
      alert('Please fill in all fields');
      return;
    }
    setStep('confirm');
  };

  const handleConfirm = async () => {
    try {
      await execute(fromAccount._id, toAccountId, parseFloat(amount), note);
      setToAccountId('');
      setAmount('');
      setNote('');
      setStep('form');
      onSuccess();
      onClose();
    } catch (error) {
      // Error handled by useCreateTransfer hook
    }
  };

  const toAccount = accounts.find((a) => a._id === toAccountId);

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
              <Dialog.Panel className="w-full max-w-md transform bg-white p-6 border border-neutral-200 rounded-lg shadow-lg transition-all">
                {step === 'form' ? (
                  <>
                    <Dialog.Title className="text-lg font-semibold text-neutral-900 mb-4">
                      New Transfer
                    </Dialog.Title>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* From Account (read-only) */}
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">
                          From Account
                        </label>
                        <div className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded text-sm text-neutral-700">
                          {fromAccount?.numberMasked || '–'} ({fromAccount?.currency})<br />
                          Balance: {formatCurrency(fromAccount?.balance, fromAccount?.currency)}
                        </div>
                      </div>

                      {/* To Account */}
                      <div>
                        <label htmlFor="to-account" className="block text-xs font-medium text-neutral-700 mb-1">
                          To Account
                        </label>
                        <select
                          id="to-account"
                          value={toAccountId}
                          onChange={(e) => setToAccountId(e.target.value)}
                          className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                          required
                        >
                          <option value="">Select account...</option>
                          {accounts
                            .filter((a) => a._id !== fromAccount?._id)
                            .map((a) => (
                              <option key={a._id} value={a._id}>
                                {a.numberMasked} ({a.currency})
                              </option>
                            ))}
                        </select>
                      </div>

                      {/* Amount */}
                      <div>
                        <label htmlFor="amount" className="block text-xs font-medium text-neutral-700 mb-1">
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
                          className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                          required
                        />
                      </div>

                      {/* Note */}
                      <div>
                        <label htmlFor="note" className="block text-xs font-medium text-neutral-700 mb-1">
                          Reference / Note (optional)
                        </label>
                        <textarea
                          id="note"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="e.g. Loan repayment"
                          className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm resize-none"
                          rows="3"
                        />
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-3 pt-4">
                        <button
                          type="button"
                          onClick={onClose}
                          className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded font-medium text-sm hover:bg-neutral-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 px-4 py-2 bg-primary-800 text-white rounded font-medium text-sm hover:bg-primary-900 transition-colors"
                        >
                          Review
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <>
                    <Dialog.Title className="text-lg font-semibold text-neutral-900 mb-4">
                      Confirm Transfer
                    </Dialog.Title>

                    <div className="space-y-3 mb-6 bg-neutral-50 p-4 rounded border border-neutral-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600">From:</span>
                        <span className="font-medium">{fromAccount?.numberMasked}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600">To:</span>
                        <span className="font-medium">{toAccount?.numberMasked}</span>
                      </div>
                      <div className="border-t border-neutral-300 pt-3 flex justify-between text-sm font-semibold">
                        <span>Amount:</span>
                        <span className="text-primary-800">{formatCurrency(amount)}</span>
                      </div>
                      {note && (
                        <div className="border-t border-neutral-300 pt-3">
                          <span className="text-xs text-neutral-600">Note: </span>
                          <p className="text-sm text-neutral-700">{note}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setStep('form')}
                        disabled={loading}
                        className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded font-medium text-sm hover:bg-neutral-50 transition-colors disabled:opacity-50"
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
                          'Confirm Transfer'
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
