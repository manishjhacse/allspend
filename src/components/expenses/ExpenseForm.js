'use client';

import { useState } from 'react';
import { CategorySelector } from '@/components/ui/CategorySelector';
import { todayStr, nowTimeStr } from '@/lib/formatters';

const PAYMENT_METHODS = ['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallet', 'Cash', 'Other'];

export function ExpenseForm({
  initialValues = {},
  categories = [],
  onSubmit,
  onCancel,
  submitLabel = 'Save Expense',
  isLoading = false,
}) {
  const [form, setForm] = useState({
    amount: '',
    merchant: '',
    category: 'Others',
    date: todayStr(),
    time: nowTimeStr(),
    paymentMethod: 'UPI',
    transactionId: '',
    note: '',
    ...initialValues,
    amount: initialValues.amount ? String(initialValues.amount) : '',
  });

  const [showMore, setShowMore] = useState(
    !!(initialValues.transactionId || initialValues.note)
  );
  const [errors, setErrors] = useState({});

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
  }

  function validate() {
    const errs = {};
    if (!form.amount || isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0) {
      errs.amount = 'Enter a valid amount';
    }
    if (!form.merchant.trim()) {
      errs.merchant = 'Enter merchant or person name';
    }
    if (!form.category) {
      errs.category = 'Select a category';
    }
    if (!form.date) {
      errs.date = 'Select a date';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      amount: parseFloat(form.amount),
      merchant: form.merchant.trim(),
      category: form.category,
      date: form.date,
      time: form.time || null,
      paymentMethod: form.paymentMethod || null,
      transactionId: form.transactionId.trim() || null,
      note: form.note.trim() || null,
    });
  }

  const labelStyle = {
    fontSize: 11,
    fontWeight: 600,
    color: '#555555',
    marginBottom: 6,
    display: 'block',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
  };

  const errStyle = { color: '#FF4444', fontSize: 12, marginTop: 4 };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Amount */}
      <div>
        <label style={labelStyle} htmlFor="expense-amount">Amount *</label>
        <div className="amount-input-wrapper">
          <span className="currency-symbol">₹</span>
          <input
            id="expense-amount"
            type="number"
            inputMode="decimal"
            className="input"
            placeholder="0"
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
            required
            min="0"
            step="0.01"
            style={{ paddingLeft: 32, fontSize: 26, fontWeight: 700 }}
          />
        </div>
        {errors.amount && <p style={errStyle}>{errors.amount}</p>}
      </div>

      {/* Merchant */}
      <div>
        <label style={labelStyle} htmlFor="expense-merchant">Merchant / Person *</label>
        <input
          id="expense-merchant"
          type="text"
          className="input"
          placeholder="e.g. Zomato, Manish"
          value={form.merchant}
          onChange={(e) => set('merchant', e.target.value)}
        />
        {errors.merchant && <p style={errStyle}>{errors.merchant}</p>}
      </div>

      {/* Category */}
      <div>
        <label style={labelStyle}>Category *</label>
        <CategorySelector
          value={form.category}
          onChange={(val) => set('category', val)}
          categories={
            categories.length
              ? categories
              : [
                  { name: 'Food' }, { name: 'Groceries' }, { name: 'Shopping' }, { name: 'Travel' },
                  { name: 'Rent' }, { name: 'Investments' }, { name: 'Health' }, { name: 'EMI/Bill' },
                  { name: 'Subscriptions' }, { name: 'Entertainment' }, { name: 'Education' },
                  { name: 'Personal' }, { name: 'Others' },
                ]
          }
        />
        {errors.category && <p style={errStyle}>{errors.category}</p>}
      </div>

      {/* Date */}
      <div>
        <label style={labelStyle} htmlFor="expense-date">Date *</label>
        <input
          id="expense-date"
          type="date"
          className="input"
          value={form.date}
          onChange={(e) => set('date', e.target.value)}
          max={todayStr()}
        />
        {errors.date && <p style={errStyle}>{errors.date}</p>}
      </div>

      {/* Payment method */}
      <div>
        <label style={labelStyle} htmlFor="expense-method">Payment Method</label>
        <select
          id="expense-method"
          className="input"
          value={form.paymentMethod}
          onChange={(e) => set('paymentMethod', e.target.value)}
          style={{ appearance: 'none', cursor: 'pointer' }}
        >
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* More fields toggle */}
      <button
        type="button"
        onClick={() => setShowMore((v) => !v)}
        style={{
          color: '#555555',
          fontSize: 12,
          textAlign: 'left',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          letterSpacing: '0.03em',
        }}
      >
        {showMore ? '▲ Hide optional fields' : '▼ Show time, transaction ID, note'}
      </button>

      {showMore && (
        <>
          {/* Time */}
          <div>
            <label style={labelStyle} htmlFor="expense-time">Time</label>
            <input
              id="expense-time"
              type="time"
              className="input"
              value={form.time}
              onChange={(e) => set('time', e.target.value)}
            />
          </div>

          {/* Transaction ID */}
          <div>
            <label style={labelStyle} htmlFor="expense-txnid">Transaction / UTR ID</label>
            <input
              id="expense-txnid"
              type="text"
              className="input"
              placeholder="Optional reference number"
              value={form.transactionId}
              onChange={(e) => set('transactionId', e.target.value)}
            />
          </div>

          {/* Note */}
          <div>
            <label style={labelStyle} htmlFor="expense-note">Note</label>
            <textarea
              id="expense-note"
              className="input"
              rows={2}
              placeholder="Optional note"
              value={form.note}
              onChange={(e) => set('note', e.target.value)}
              style={{ resize: 'vertical', minHeight: 70 }}
            />
          </div>
        </>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
        <button
          id="expense-form-submit"
          type="submit"
          className="btn-primary"
          disabled={isLoading}
        >
          {isLoading ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-ghost">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
