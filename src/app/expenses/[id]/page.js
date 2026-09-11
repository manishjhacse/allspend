'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell, useAppToast } from '@/components/layout/AppShell';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { CategoryIcon } from '@/components/ui/CategorySelector';
import { ConfirmModal } from '@/components/ui/Modal';
import { expenseOps, initDB } from '@/lib/db';
import { useCategories } from '@/hooks/useCategories';
import { formatCurrency, formatDate, formatTime } from '@/lib/formatters';
import Link from 'next/link';

const CAT_COLORS = {
  'Food': '#FF5C5C', 'Shopping': '#5B8EFF', 'Travel': '#FF9F40', 'Groceries': '#00C853',
  'Rent': '#F59E0B', 'Investments': '#A78BFA', 'Health': '#EC4899', 'EMI/Bill': '#8A8A8A',
  'Subscriptions': '#06B6D4', 'Entertainment': '#F97316', 'Education': '#14B8A6',
  'Personal': '#E879F9', 'Others': '#555555',
};

export default function ExpenseDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const addToast = useAppToast();
  const { categories } = useCategories();

  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(id === 'new');
  const [deleteModal, setDeleteModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    initDB();
    if (id === 'new') { setLoading(false); return; }
    expenseOps.getById(Number(id)).then((e) => {
      setExpense(e || null);
      setLoading(false);
    });
  }, [id]);

  async function handleSave(data) {
    setIsSaving(true);
    try {
      if (id === 'new') {
        await expenseOps.add({ ...data, source: 'manual' });
        addToast?.('Expense added ✓');
      } else {
        await expenseOps.update(Number(id), data);
        addToast?.('Expense updated ✓');
      }
      router.push('/expenses');
    } catch {
      addToast?.('Failed to save', 'error');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await expenseOps.delete(Number(id));
      addToast?.('Expense deleted');
      router.push('/expenses');
    } catch {
      addToast?.('Failed to delete', 'error');
    }
  }

  const spinnerStyle = {
    width: 36, height: 36, borderRadius: '50%',
    border: '3px solid #1A1A1A', borderTopColor: '#00C853',
  };

  if (loading) {
    return (
      <AppShell>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60dvh' }}>
          <div className="spin" style={spinnerStyle} />
        </div>
      </AppShell>
    );
  }

  if (id !== 'new' && !expense) {
    return (
      <AppShell>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '80px 24px' }}>
          <p style={{ fontSize: 40 }}>🔍</p>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: '#F5F5F5' }}>Expense not found</h2>
          <Link href="/expenses">
            <button className="btn-secondary" style={{ width: 'auto', paddingLeft: 20, paddingRight: 20 }}>
              Back to Expenses
            </button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const isIncome = expense?.transactionType === 'income' || expense?.transactionType === 'refund';
  const catColor = CAT_COLORS[expense?.category] || '#555555';

  return (
    <AppShell>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '52px 20px 16px' }}>
        <Link href="/expenses" aria-label="Back">
          <button
            style={{
              width: 34, height: 34, borderRadius: '50%', background: '#151515',
              border: '1px solid #242424', color: '#8A8A8A', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}
          >←</button>
        </Link>
        <h1 style={{ fontSize: 17, fontWeight: 700, color: '#F5F5F5', flex: 1, letterSpacing: '-0.2px' }}>
          {id === 'new' ? 'Add Expense' : editing ? 'Edit Expense' : expense?.merchant || 'Expense'}
        </h1>
        {id !== 'new' && !editing && (
          <button
            onClick={() => setEditing(true)}
            style={{ fontSize: 14, color: '#00C853', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Edit
          </button>
        )}
      </div>

      <div style={{ padding: '0 20px 100px' }}>
        {editing ? (
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 16, padding: 20 }}>
            <ExpenseForm
              initialValues={expense || {}}
              categories={categories}
              onSubmit={handleSave}
              onCancel={() => id === 'new' ? router.back() : setEditing(false)}
              submitLabel={id === 'new' ? 'Add Expense' : 'Save Changes'}
              isLoading={isSaving}
            />
          </div>
        ) : expense ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Amount hero card */}
            <div
              style={{
                background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 16,
                padding: '28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              }}
            >
              <CategoryIcon name={expense.category} size={52} />
              <p
                style={{
                  fontSize: 40, fontWeight: 800, letterSpacing: '-1.5px',
                  color: isIncome ? '#00C853' : '#F5F5F5',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {isIncome ? '+' : '-'}{formatCurrency(expense.amount)}
              </p>
              <p style={{ fontSize: 16, color: '#F5F5F5', fontWeight: 500 }}>{expense.merchant}</p>
              <span
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 100, fontSize: 12, fontWeight: 600,
                  background: `${catColor}15`, color: catColor, border: `1px solid ${catColor}30`,
                }}
              >
                {expense.category}
              </span>
            </div>

            {/* Details */}
            <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 14, overflow: 'hidden' }}>
              {[
                { label: 'Date', value: expense.date ? formatDate(expense.date, { format: 'long' }) : null },
                { label: 'Time', value: expense.time ? formatTime(expense.time) : null },
                { label: 'Payment App', value: expense.paymentApp },
                { label: 'Payment Method', value: expense.paymentMethod },
                { label: 'Transaction ID', value: expense.transactionId },
                { label: 'UTR', value: expense.utr },
                { label: 'Bank', value: expense.bank },
                { label: 'Cashback', value: expense.cashback ? formatCurrency(expense.cashback) : null },
                { label: 'Note', value: expense.note },
                { label: 'Source', value: expense.source === 'screenshot' ? '📸 Screenshot' : '✏️ Manual' },
              ]
                .filter((f) => f.value)
                .map((field, i, arr) => (
                  <div
                    key={field.label}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                      padding: '13px 16px',
                      borderBottom: i < arr.length - 1 ? '1px solid #1A1A1A' : 'none',
                    }}
                  >
                    <span style={{ fontSize: 13, color: '#555555' }}>{field.label}</span>
                    <span style={{ fontSize: 13, color: '#F5F5F5', textAlign: 'right', maxWidth: '60%', wordBreak: 'break-all' }}>
                      {field.value}
                    </span>
                  </div>
                ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => setEditing(true)} className="btn-secondary" style={{ fontSize: 14 }}>
                Edit Expense
              </button>
              <button onClick={() => setDeleteModal(true)} className="btn-danger" style={{ fontSize: 14 }}>
                Delete Expense
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <ConfirmModal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This cannot be undone."
        confirmText="Delete"
        confirmDanger
      />
    </AppShell>
  );
}
