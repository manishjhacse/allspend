'use client';

import { useState, useEffect } from 'react';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { formatCurrency, formatDate, formatTime } from '@/lib/formatters';
import { merchantMappingOps } from '@/lib/db';
import { ClientPortal } from '@/components/ui/ClientPortal';

const CATEGORY_COLORS = {
  'Food': '#FF5C5C',
  'Shopping': '#5B8EFF',
  'Travel': '#FF9F40',
  'Groceries': '#00C853',
  'Rent': '#F59E0B',
  'Investments': '#A78BFA',
  'Health': '#EC4899',
  'EMI/Bill': '#8A8A8A',
  'Subscriptions': '#06B6D4',
  'Entertainment': '#F97316',
  'Education': '#14B8A6',
  'Personal': '#E879F9',
  'Others': '#555555',
};

function CategoryDot({ name }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: CATEGORY_COLORS[name] || '#555555',
        flexShrink: 0,
      }}
    />
  );
}

/**
 * ExpenseConfirmation — "Got it. Instantly." modal
 * Uses flat transaction data (not .value-wrapped).
 */
export function ExpenseConfirmation({ parsed, categories, onSave, onManual, onCancel, duplicate }) {
  const [showEdit, setShowEdit] = useState(false);
  const [category, setCategory] = useState(parsed?.category || 'Others');
  const [rememberMerchant, setRememberMerchant] = useState(false);

  // Resolve category from merchant mappings on mount
  useEffect(() => {
    async function resolveCategory() {
      if (parsed?.merchant) {
        const mapped = await merchantMappingOps.getCategory(parsed.merchant);
        if (mapped) setCategory(mapped);
        else if (parsed.category) setCategory(parsed.category);
      } else if (parsed?.category) {
        setCategory(parsed.category);
      }
    }
    resolveCategory();
  }, [parsed]);

  const merchant = parsed?.merchant || parsed?.receiver || parsed?.sender || 'Unknown';
  const amount = parsed?.amount;
  const date = parsed?.date;
  const time = parsed?.time;
  const isIncome = parsed?.transactionType === 'income';
  const isRefund = parsed?.transactionType === 'refund';
  const isFailed = parsed?.transactionType === 'failed';
  const paymentApp = parsed?.paymentApp;

  const amountColor = isIncome || isRefund ? '#00C853' : isFailed ? '#8A8A8A' : '#FF4444';
  const amountPrefix = isIncome || isRefund ? '+' : isFailed ? '' : '-';

  async function handleDone() {
    const expense = {
      amount,
      merchant,
      category,
      date: date || new Date().toISOString().slice(0, 10),
      time: time || null,
      paymentMethod: parsed?.paymentMethod || 'UPI',
      paymentApp: parsed?.paymentApp || null,
      transactionType: parsed?.transactionType || 'expense',
      status: parsed?.status || 'success',
      transactionId: parsed?.transactionId || null,
      referenceId: parsed?.referenceId || null,
      utr: parsed?.utr || null,
      upiId: parsed?.upiId || null,
      bank: parsed?.bank || null,
      cashback: parsed?.cashback || null,
      sender: parsed?.sender || null,
      receiver: parsed?.receiver || null,
      source: 'screenshot',
    };

    if (rememberMerchant && merchant && category) {
      await merchantMappingOps.setMapping(merchant, category);
    }

    await onSave(expense);
  }

  async function handleFormSave(expense) {
    if (rememberMerchant && expense.merchant && expense.category) {
      await merchantMappingOps.setMapping(expense.merchant, expense.category);
    }
    await onSave({ ...expense, source: 'screenshot' });
  }

  // ── Edit mode: full form ──────────────────────────────────────────────────

  if (showEdit) {
    return (
      <ClientPortal>
        <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
        }}
      >
        <div
          className="modal-inner"
          style={{
            position: 'relative',
            background: '#111111',
            borderRadius: '24px 24px 0 0',
            width: '100%',
            maxWidth: 480,
            padding: '24px 20px 40px',
            border: '1px solid #242424',
            borderBottom: 'none',
            maxHeight: '90dvh',
            overflowY: 'auto',
          }}
        >
          {onCancel && (
            <button
              onClick={onCancel}
              aria-label="Cancel"
              style={{
                position: 'absolute',
                top: 14,
                right: 16,
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'rgba(255, 68, 68, 0.15)',
                border: '1px solid rgba(255, 68, 68, 0.4)',
                color: '#FF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                zIndex: 10,
              }}
            >
              ✕
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
            <button
              onClick={() => setShowEdit(false)}
              style={{ background: '#1A1A1A', border: 'none', borderRadius: 8, padding: '6px 10px', color: '#8A8A8A', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}
              aria-label="Back"
            >
              ←
            </button>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#F5F5F5', marginLeft: 12 }}>Edit Details</h2>
          </div>
          <ExpenseForm
            initialValues={{
              amount: amount ? String(amount) : '',
              merchant,
              category,
              date: date || new Date().toISOString().slice(0, 10),
              time: time || '',
              paymentMethod: parsed?.paymentMethod || 'UPI',
              transactionId: parsed?.transactionId || '',
            }}
            categories={categories}
            onSubmit={handleFormSave}
            onCancel={() => setShowEdit(false)}
            submitLabel="Save Expense"
          />
        </div>
      </div>
    </ClientPortal>
    );
  }

  // ── "Got it. Instantly." confirmation ────────────────────────────────────

  const cleanCategories = Array.from(
    new Set(
      (categories?.length > 0
        ? categories.map((c) => c.name)
        : ['Food', 'Shopping', 'Travel', 'Groceries', 'Rent', 'Investments', 'Health', 'EMI/Bill', 'Subscriptions', 'Others']
      ).map((cat) => (cat === 'Other' ? 'Others' : cat === 'Bills' ? 'EMI/Bill' : cat))
    )
  );

  return (
    <ClientPortal>
      <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        className="modal-inner scroll-area"
        style={{
          position: 'relative',
          background: '#111111',
          borderRadius: '24px 24px 0 0',
          width: '100%',
          maxWidth: 480,
          maxHeight: 'calc(90dvh - env(safe-area-inset-bottom, 0px))',
          overflowY: 'auto',
          padding: '28px 20px max(28px, calc(env(safe-area-inset-bottom) + 24px))',
          border: '1px solid #242424',
          borderBottom: 'none',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.8)',
        }}
      >
        {/* Red Cancel Button */}
        {onCancel && (
          <button
            onClick={onCancel}
            aria-label="Cancel"
            style={{
              position: 'absolute',
              top: 14,
              right: 16,
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'rgba(255, 68, 68, 0.15)',
              border: '1px solid rgba(255, 68, 68, 0.4)',
              color: '#FF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              zIndex: 10,
            }}
          >
            ✕
          </button>
        )}
        {/* Green check */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <div
            className="check-pop"
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: '#00C853',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 style={{ fontSize: 21, fontWeight: 800, color: '#F5F5F5', textAlign: 'center', marginBottom: 4, letterSpacing: '-0.4px' }}>
          Got it. Instantly.
        </h2>

        {/* Duplicate warning */}
        {duplicate && (
          <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 12, marginTop: 6 }}>
            <p style={{ fontSize: 12, color: '#F59E0B', fontWeight: 600 }}>
              {duplicate.type === 'exact' ? '⚠ This transaction may already be saved.' : '⚠ A similar expense already exists.'}
            </p>
          </div>
        )}

        {/* Transaction summary card */}
        <div
          style={{
            background: '#0D0D0D',
            border: '1px solid #242424',
            borderRadius: 14,
            padding: '14px 16px',
            marginTop: 12,
            marginBottom: 14,
          }}
        >
          {/* Merchant row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              {/* Avatar */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: `${CATEGORY_COLORS[category] || '#242424'}22`,
                  border: `1px solid ${CATEGORY_COLORS[category] || '#242424'}44`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  color: CATEGORY_COLORS[category] || '#8A8A8A',
                  flexShrink: 0,
                }}
              >
                {merchant.charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#F5F5F5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {merchant}
                </p>
                <p style={{ fontSize: 12, color: '#555555', marginTop: 1 }}>
                  {category}
                  {paymentApp ? ` · ${paymentApp}` : ''}
                </p>
              </div>
            </div>
            {/* Amount */}
            <p style={{ fontSize: 18, fontWeight: 800, color: amountColor, letterSpacing: '-0.5px', flexShrink: 0, marginLeft: 8 }}>
              {amount != null ? `${amountPrefix}${formatCurrency(amount)}` : '—'}
            </p>
          </div>

          {/* Date / time row */}
          {(date || time) && (
            <p style={{ fontSize: 12, color: '#555555', marginTop: 10, paddingTop: 10, borderTop: '1px solid #1A1A1A' }}>
              {date && formatDate(date, { format: 'medium' })}
              {time && ` · ${formatTime(time)}`}
            </p>
          )}
        </div>

        {/* Category quick-select */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 10, color: '#555555', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>
            Category
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 150, overflowY: 'auto', paddingRight: 2 }}>
            {cleanCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '6px 12px',
                  borderRadius: 100,
                  border: `1.5px solid ${category === cat ? CATEGORY_COLORS[cat] || '#00C853' : '#242424'}`,
                  background: category === cat ? `${CATEGORY_COLORS[cat] || '#00C853'}15` : 'transparent',
                  fontSize: 12,
                  fontWeight: category === cat ? 700 : 400,
                  color: category === cat ? (CATEGORY_COLORS[cat] || '#00C853') : '#8A8A8A',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                }}
              >
                <CategoryDot name={cat} />
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Remember merchant checkbox */}
        {merchant && merchant !== 'Unknown' && (
          <label
            style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, cursor: 'pointer' }}
          >
            <input
              type="checkbox"
              checked={rememberMerchant}
              onChange={(e) => setRememberMerchant(e.target.checked)}
              style={{ accentColor: '#00C853', width: 16, height: 16 }}
            />
            <span style={{ fontSize: 12, color: '#555555' }}>
              Remember category for <strong style={{ color: '#8A8A8A' }}>{merchant}</strong>
            </span>
          </label>
        )}

        {/* Cashback note */}
        {parsed?.cashback && (
          <p style={{ fontSize: 12, color: '#00C853', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>✦</span> Cashback of {formatCurrency(parsed.cashback)} earned
          </p>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button
            onClick={() => setShowEdit(true)}
            className="btn-secondary"
            style={{ flex: 1, minHeight: 48, fontSize: 14 }}
          >
            Edit
          </button>
          <button
            id="confirm-done-btn"
            onClick={handleDone}
            className="btn-primary"
            style={{ flex: 2, minHeight: 48, fontSize: 15 }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
    </ClientPortal>
  );
}
