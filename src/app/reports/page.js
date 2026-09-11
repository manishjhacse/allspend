'use client';

import { useState, useEffect, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { CategoryChart } from '@/components/reports/CategoryChart';
import { MonthlyChart } from '@/components/reports/MonthlyChart';
import { EmptyState } from '@/components/ui/EmptyState';
import { useMonthlyExpenses, useYearlyExpenses } from '@/hooks/useExpenses';
import { formatCurrency, formatDate, getMonthName, percentChange } from '@/lib/formatters';
import { initDB } from '@/lib/db';

function MonthNav({ year, month, onPrev, onNext }) {
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 12px' }}>
      <button onClick={onPrev} style={{ color: '#555555', fontSize: 22, background: 'none', border: 'none', cursor: 'pointer' }} aria-label="Previous month">‹</button>
      <span style={{ fontSize: 15, fontWeight: 600, color: '#F5F5F5' }}>{getMonthName(month)} {year}</span>
      <button onClick={onNext} disabled={isCurrentMonth} style={{ color: isCurrentMonth ? '#2A2A2A' : '#555555', fontSize: 22, background: 'none', border: 'none', cursor: 'pointer' }} aria-label="Next month">›</button>
    </div>
  );
}


function StatCard({ label, value, sub }) {
  return (
    <div
      style={{
        background: '#0F0F0F',
        border: '1px solid #1F1F1F',
        borderRadius: 16,
        padding: '16px 18px',
        flex: 1,
      }}
    >
      <p style={{ fontSize: 11, color: '#8A8A8A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </p>
      <p style={{ fontSize: 22, fontWeight: 800, color: '#F5F5F5', marginTop: 6, letterSpacing: '-0.6px', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: 11, color: '#666666', marginTop: 2 }}>{sub}</p>}
    </div>
  );
}

export default function ReportsPage() {
  const now = new Date();
  const [view, setView] = useState('month'); // 'month' | 'year'
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  useEffect(() => { initDB(); }, []);

  // Monthly data
  const { expenses: monthExpenses, total: monthTotal, count: monthCount } = useMonthlyExpenses(year, month);

  // Previous month
  const prevMo = month === 0 ? 11 : month - 1;
  const prevYr = month === 0 ? year - 1 : year;
  const { total: prevTotal } = useMonthlyExpenses(prevYr, prevMo);

  // Yearly data
  const { expenses: yearExpenses } = useYearlyExpenses(year);

  // Category totals
  const categoryData = useMemo(() => {
    const src = view === 'month' ? monthExpenses : yearExpenses;
    const totals = {};
    for (const e of src) {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    }
    return Object.entries(totals)
      .sort(([, a], [, b]) => b - a)
      .map(([category, total]) => ({ category, total }));
  }, [monthExpenses, yearExpenses, view]);

  // Monthly totals for year view
  const monthlyTotals = useMemo(() => {
    if (view !== 'year') return [];
    const totals = Array(12).fill(0);
    for (const e of yearExpenses) {
      const m = parseInt(e.date?.slice(5, 7)) - 1;
      if (!isNaN(m)) totals[m] += e.amount;
    }
    return totals.map((total, month) => ({ month, total })).filter((d) => d.total > 0);
  }, [yearExpenses, view]);

  // Stats
  const activeExpenses = view === 'month' ? monthExpenses : yearExpenses;
  const total = activeExpenses.reduce((s, e) => s + e.amount, 0);
  const count = activeExpenses.length;
  const avg = count > 0 ? total / count : 0;
  const largest = count > 0 ? Math.max(...activeExpenses.map((e) => e.amount)) : 0;

  function goToPrevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }

  function goToNextMonth() {
    if (year === now.getFullYear() && month === now.getMonth()) return;
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  const change = percentChange(monthTotal, prevTotal);

  return (
    <AppShell>
      {/* Header */}
      <div style={{ padding: '52px 20px 16px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#F5F5F5', letterSpacing: '-0.4px' }}>Reports</h1>
      </div>

      {/* View toggle */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ display: 'flex', background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 100, padding: 3, gap: 2 }}>
          {['month', 'year'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 100, fontSize: 12, fontWeight: view === v ? 700 : 500,
                color: view === v ? '#F5F5F5' : '#555555', background: view === v ? '#1E1E1E' : 'transparent',
                border: 'none', cursor: 'pointer', transition: 'all 0.15s ease',
              }}
            >
              {v === 'month' ? 'Month' : 'Year'}
            </button>
          ))}
        </div>
      </div>

      {/* Month / Year navigation */}
      {view === 'month' ? (
        <MonthNav year={year} month={month} onPrev={goToPrevMonth} onNext={goToNextMonth} />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 12px' }}>
          <button onClick={() => setYear((y) => y - 1)} style={{ color: '#555555', fontSize: 22, background: 'none', border: 'none', cursor: 'pointer' }}>‹</button>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#F5F5F5' }}>{year}</span>
          <button onClick={() => setYear((y) => Math.min(y + 1, now.getFullYear()))} style={{ color: year >= now.getFullYear() ? '#2A2A2A' : '#555555', fontSize: 22, background: 'none', border: 'none', cursor: 'pointer' }}>›</button>
        </div>
      )}

      {/* Total */}
      <div style={{ padding: '0 20px 16px' }}>
        <p style={{ fontSize: 36, fontWeight: 800, color: '#F5F5F5', letterSpacing: '-1.2px', fontVariantNumeric: 'tabular-nums' }}>
          {formatCurrency(total)}
        </p>
        <p style={{ fontSize: 13, color: '#555555', marginTop: 4 }}>
          {count} transaction{count !== 1 ? 's' : ''}
          {view === 'month' && change !== null && count > 0 && prevTotal > 0 && (
            <span style={{ marginLeft: 8, fontWeight: 700, color: change > 0 ? '#FF4444' : '#00C853' }}>
              {change > 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
            </span>
          )}
        </p>
      </div>

      {count === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 10 }}>
          <span style={{ fontSize: 40 }}>📊</span>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#F5F5F5' }}>No data yet</p>
          <p style={{ fontSize: 13, color: '#555555', textAlign: 'center' }}>Add expenses to see your spending reports.</p>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div style={{ display: 'flex', gap: 10, padding: '0 20px 16px' }}>
            <StatCard label="Average" value={formatCurrency(avg)} />
            <StatCard label="Largest" value={formatCurrency(largest)} />
          </div>

          {/* Monthly chart (year view) */}
          {view === 'year' && monthlyTotals.length > 0 && (
            <div style={{ margin: '0 20px 16px', background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 14, padding: 16 }}>
              <p style={{ fontSize: 10, color: '#555555', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 12 }}>
                Monthly Trend
              </p>
              <MonthlyChart data={monthlyTotals} />
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {monthlyTotals.map((d) => (
                  <div key={d.month} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span style={{ fontSize: 13, color: '#8A8A8A' }}>{getMonthName(d.month).slice(0, 3)}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#F5F5F5' }}>{formatCurrency(d.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category chart */}
          {categoryData.length > 0 && (
            <div style={{ margin: '0 20px 24px', background: '#0F0F0F', border: '1px solid #1F1F1F', borderRadius: 20, padding: 20 }}>
              <p style={{ fontSize: 11, color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 14 }}>
                By Category
              </p>
              <CategoryChart data={categoryData} />
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
