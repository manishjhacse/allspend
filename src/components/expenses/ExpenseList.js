'use client';

import { ExpenseCard } from './ExpenseCard';
import { groupExpensesByDate } from '@/lib/formatters';

export function ExpenseList({ expenses, emptyTitle = 'No expenses yet', emptyDescription = 'Your saved payments will appear here.' }) {
  if (!expenses || expenses.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 10 }}>
        <span style={{ fontSize: 40 }}>📭</span>
        <p style={{ fontSize: 15, fontWeight: 600, color: '#F5F5F5' }}>{emptyTitle}</p>
        <p style={{ fontSize: 13, color: '#555555', textAlign: 'center', lineHeight: 1.5 }}>{emptyDescription}</p>
      </div>
    );
  }

  const groups = groupExpensesByDate(expenses);

  return (
    <div style={{ paddingBottom: 24 }}>
      {Object.entries(groups).map(([dateLabel, items]) => (
        <div key={dateLabel}>
          <div className="section-header">{dateLabel}</div>
          <div style={{ margin: '0 20px 4px', background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 14, overflow: 'hidden' }}>
            {items.map((expense, i) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                isLast={i === items.length - 1}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
