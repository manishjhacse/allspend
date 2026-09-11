'use client';

import Link from 'next/link';
import { formatCurrency, formatDate, formatTime } from '@/lib/formatters';

const CAT_COLORS = {
  'Food':         '#FF5C5C',
  'Shopping':     '#5B8EFF',
  'Travel':       '#FF9F40',
  'Groceries':    '#00C853',
  'Rent':         '#F59E0B',
  'Investments':  '#A78BFA',
  'Health':       '#EC4899',
  'EMI/Bill':     '#8A8A8A',
  'Subscriptions':'#06B6D4',
  'Entertainment':'#F97316',
  'Education':    '#14B8A6',
  'Personal':     '#E879F9',
  'Others':       '#555555',
};

function ArrowIcon({ type }) {
  const isIncome = type === 'income' || type === 'refund';
  const isFailed = type === 'failed';
  const color = isIncome ? '#00C853' : isFailed ? '#555555' : '#FF4444';

  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: `${color}18`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transform: isIncome ? 'rotate(135deg)' : isFailed ? 'rotate(0deg)' : 'rotate(-45deg)' }}
      >
        <line x1="7" y1="17" x2="17" y2="7" />
        <polyline points="7 7 17 7 17 17" />
      </svg>
    </div>
  );
}

export function ExpenseCard({ expense, isLast = false }) {
  const isIncome = expense.transactionType === 'income' || expense.transactionType === 'refund';
  const isFailed = expense.transactionType === 'failed';
  const amountColor = isIncome ? '#00C853' : isFailed ? '#555555' : '#F5F5F5';
  const amountPrefix = isIncome ? '+' : isFailed ? '' : '-';
  const catColor = CAT_COLORS[expense.category] || '#555555';

  return (
    <Link href={`/expenses/${expense.id}`}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '13px 16px',
          gap: 12,
          borderBottom: isLast ? 'none' : '1px solid #1A1A1A',
          cursor: 'pointer',
          transition: 'background 0.1s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#111111'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        {/* Transaction type arrow icon */}
        <ArrowIcon type={expense.transactionType} />

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: '#F5F5F5',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {expense.merchant || 'Unknown'}
          </p>
          <p style={{ fontSize: 11, color: '#555555', marginTop: 2 }}>
            <span style={{ color: catColor, fontWeight: 500 }}>{expense.category}</span>
            {expense.date ? ` · ${formatDate(expense.date, { format: 'dayMonth' })}` : ''}
            {expense.time ? `, ${formatTime(expense.time)}` : ''}
          </p>
        </div>

        {/* Amount */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: amountColor,
              letterSpacing: '-0.3px',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {amountPrefix}{formatCurrency(expense.amount)}
          </p>
          {expense.paymentApp && (
            <p style={{ fontSize: 10, color: '#3A3A3A', marginTop: 1 }}>{expense.paymentApp}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
