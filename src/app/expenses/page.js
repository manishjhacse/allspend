'use client';

import { useState, useMemo } from 'react';
import { AppShell, useAppToast } from '@/components/layout/AppShell';
import { ExpenseList } from '@/components/expenses/ExpenseList';
import { useExpenses } from '@/hooks/useExpenses';
import { useCategories } from '@/hooks/useCategories';
import { formatCurrency, getMonthName } from '@/lib/formatters';
import Link from 'next/link';

const PAYMENT_METHODS = ['All', 'UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallet', 'Cash'];

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export default function ExpensesPage() {
  const { expenses } = useExpenses();
  const { categories } = useCategories();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterMethod, setFilterMethod] = useState('All');
  const [sortBy, setSortBy] = useState('date-desc');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let result = [...expenses];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.merchant?.toLowerCase().includes(q) ||
          e.category?.toLowerCase().includes(q) ||
          e.note?.toLowerCase().includes(q) ||
          e.transactionId?.toLowerCase().includes(q)
      );
    }
    if (filterCategory && filterCategory !== 'All') {
      result = result.filter((e) => e.category === filterCategory);
    }
    if (filterMonth) {
      result = result.filter((e) => e.date?.startsWith(filterMonth));
    }
    if (filterMethod && filterMethod !== 'All') {
      result = result.filter((e) => e.paymentMethod === filterMethod);
    }
    switch (sortBy) {
      case 'date-asc': result.sort((a, b) => a.date?.localeCompare(b.date)); break;
      case 'amount-desc': result.sort((a, b) => b.amount - a.amount); break;
      case 'amount-asc': result.sort((a, b) => a.amount - b.amount); break;
      default: result.sort((a, b) => (b.date + (b.time || ''))?.localeCompare(a.date + (a.time || ''))); break;
    }
    return result;
  }, [expenses, search, filterCategory, filterMonth, filterMethod, sortBy]);

  const totalFiltered = filtered
    .filter((e) => e.transactionType !== 'income' && e.transactionType !== 'refund')
    .reduce((s, e) => s + (e.amount || 0), 0);
  const isFiltered = search || filterCategory !== 'All' || filterMonth || filterMethod !== 'All';

  const monthOptions = useMemo(() => {
    const months = new Set(expenses.map((e) => e.date?.slice(0, 7)).filter(Boolean));
    return Array.from(months).sort().reverse();
  }, [expenses]);

  return (
    <AppShell>
      {/* Header */}
      <div
        style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: '#050505', borderBottom: '1px solid #1A1A1A',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '52px 20px 12px' }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#F5F5F5', flex: 1, letterSpacing: '-0.4px' }}>
            All Transactions
          </h1>
          <Link href="/import">
            <button
              style={{
                width: 32, height: 32, borderRadius: '50%', background: '#00C853',
                border: 'none', color: '#000', fontSize: 20, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 300,
              }}
              aria-label="Add expense"
            >
              +
            </button>
          </Link>
        </div>

        {/* Search */}
        <div style={{ padding: '0 20px 12px' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#555555' }}>
              <SearchIcon />
            </div>
            <input
              id="expenses-search"
              type="search"
              className="input"
              placeholder="Search transactions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 34, fontSize: 14 }}
              aria-label="Search expenses"
            />
          </div>
        </div>

        {/* Filter bar */}
        <div style={{ padding: '0 20px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            id="filter-toggle-btn"
            onClick={() => setShowFilters((v) => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 100,
              border: `1px solid ${isFiltered ? '#00C853' : '#242424'}`,
              color: isFiltered ? '#00C853' : '#8A8A8A',
              background: isFiltered ? 'rgba(0,200,83,0.1)' : 'transparent',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
            }}
          >
            ⚙ Filters {isFiltered ? '•' : ''}
          </button>
          {isFiltered && (
            <span style={{ fontSize: 12, color: '#555555' }}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''} · {formatCurrency(totalFiltered)}
            </span>
          )}
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div style={{ padding: '0 20px 12px', display: 'flex', flexDirection: 'column', gap: 14, borderTop: '1px solid #1A1A1A', paddingTop: 14 }}>
            {/* Category */}
            <div>
              <p style={{ fontSize: 10, color: '#555555', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 8 }}>Category</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['All', ...categories.map((c) => c.name)].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    style={{
                      padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 500,
                      border: `1px solid ${filterCategory === cat ? '#00C853' : '#242424'}`,
                      color: filterCategory === cat ? '#00C853' : '#8A8A8A',
                      background: filterCategory === cat ? 'rgba(0,200,83,0.1)' : 'transparent',
                      cursor: 'pointer',
                    }}
                  >{cat}</button>
                ))}
              </div>
            </div>

            {/* Month */}
            {monthOptions.length > 0 && (
              <div>
                <p style={{ fontSize: 10, color: '#555555', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 8 }}>Month</p>
                <select className="input" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} style={{ paddingTop: 8, paddingBottom: 8, fontSize: 13 }}>
                  <option value="">All months</option>
                  {monthOptions.map((m) => {
                    const [y, mo] = m.split('-').map(Number);
                    return <option key={m} value={m}>{getMonthName(mo - 1)} {y}</option>;
                  })}
                </select>
              </div>
            )}

            {/* Sort */}
            <div>
              <p style={{ fontSize: 10, color: '#555555', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 8 }}>Sort By</p>
              <select className="input" value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ paddingTop: 8, paddingBottom: 8, fontSize: 13 }}>
                <option value="date-desc">Newest first</option>
                <option value="date-asc">Oldest first</option>
                <option value="amount-desc">Highest amount</option>
                <option value="amount-asc">Lowest amount</option>
              </select>
            </div>

            <button
              onClick={() => { setFilterCategory('All'); setFilterMonth(''); setFilterMethod('All'); setSortBy('date-desc'); }}
              style={{ color: '#FF4444', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* List */}
      <ExpenseList
        expenses={filtered}
        emptyTitle={isFiltered ? 'No transactions found' : 'No transactions yet'}
        emptyDescription={isFiltered ? 'Try adjusting your filters.' : 'Add your first expense from a payment screenshot.'}
      />
    </AppShell>
  );
}
