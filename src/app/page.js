'use client';

import { useState, useEffect } from 'react';
import { AppShell, useAppToast } from '@/components/layout/AppShell';
import { useMonthlyExpenses } from '@/hooks/useExpenses';
import { initDB, settingsOps } from '@/lib/db';
import { formatCurrency, getMonthName, percentChange } from '@/lib/formatters';
import { ExpenseCard } from '@/components/expenses/ExpenseCard';
import Link from 'next/link';
import { PWAInstallBanner } from '@/components/ui/PWAInstall';

// ─── Category Colours ─────────────────────────────────────────────────────

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

// ─── Month Navigator ──────────────────────────────────────────────────────

function MonthNav({ year, month, onPrev, onNext }) {
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: '#F5F5F5', letterSpacing: '-0.2px' }}>
        {getMonthName(month).slice(0, 3)} {year}
      </span>
      <button
        onClick={onPrev}
        style={{ background: 'none', border: 'none', color: '#555555', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '0 2px' }}
        aria-label="Previous month"
      >‹</button>
      <button
        onClick={onNext}
        disabled={isCurrentMonth}
        style={{ background: 'none', border: 'none', color: isCurrentMonth ? '#2A2A2A' : '#555555', cursor: isCurrentMonth ? 'default' : 'pointer', fontSize: 20, lineHeight: 1, padding: '0 2px' }}
        aria-label="Next month"
      >›</button>
    </div>
  );
}

// ─── Simple Donut Chart ───────────────────────────────────────────────────

function DonutChart({ segments, size = 120 }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;

  const cx = size / 2, cy = size / 2;
  const r = size * 0.38, strokeWidth = size * 0.18;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const dash = pct * circumference;
        const gap = circumference - dash;
        const el = (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
          />
        );
        offset += dash;
        return el;
      })}
      {/* Inner dark circle */}
      <circle cx={cx} cy={cy} r={r - strokeWidth / 2 - 2} fill="#050505" />
    </svg>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────

const TABS = ['ALL', 'EXPENSES', 'INCOME'];

export default function HomePage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [initialized, setInitialized] = useState(false);
  const [tab, setTab] = useState('ALL');
  const [hideAmount, setHideAmount] = useState(false);
  const [userBudget, setUserBudget] = useState(20000);
  const [userSalary, setUserSalary] = useState(0);

  useEffect(() => {
    initDB().then(() => {
      setInitialized(true);
      settingsOps.get('monthlyBudget', '20000').then((val) => {
        const num = parseFloat(val);
        if (!isNaN(num) && num > 0) setUserBudget(num);
      });
      settingsOps.get('monthlySalary', '0').then((val) => {
        const num = parseFloat(val);
        if (!isNaN(num) && num > 0) setUserSalary(num);
      });
    });
  }, []);

  const { expenses, total, count } = useMonthlyExpenses(year, month);

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const { total: prevTotal } = useMonthlyExpenses(prevYear, prevMonth);

  const change = percentChange(total, prevTotal);

  // Filter by tab
  const filteredExpenses = expenses.filter((e) => {
    if (tab === 'EXPENSES') return e.transactionType !== 'income' && e.transactionType !== 'refund';
    if (tab === 'INCOME') return e.transactionType === 'income' || e.transactionType === 'refund';
    return true;
  });

  // Income total for net calculations
  const incomeTotal = expenses
    .filter((e) => e.transactionType === 'income' || e.transactionType === 'refund')
    .reduce((s, e) => s + (e.amount || 0), 0);

  // Category breakdown for chart
  const catTotals = {};
  for (const e of expenses) {
    if (e.transactionType === 'income' || e.transactionType === 'refund') continue;
    catTotals[e.category] = (catTotals[e.category] || 0) + (e.amount || 0);
  }
  const chartSegments = Object.entries(catTotals)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, val]) => ({ label: cat, value: val, color: CAT_COLORS[cat] || '#555555' }));

  // Budget
  const BUDGET = userBudget || 20000;
  const budgetPct = Math.min((total / BUDGET) * 100, 100);

  function goToPrevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function goToNextMonth() {
    const today = new Date();
    if (year === today.getFullYear() && month === today.getMonth()) return;
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  return (
    <AppShell>
      <div style={{ padding: '52px 0 0' }}>

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 16px' }}>
          <h1 style={{ fontSize: 16, fontWeight: 600, color: '#8A8A8A', letterSpacing: '-0.1px' }}>
            Your Monthly Expenses
          </h1>
          <MonthNav year={year} month={month} onPrev={goToPrevMonth} onNext={goToNextMonth} />
        </div>

        {/* ── PWA Install Banner ───────────────────────────────────────── */}
        <div style={{ padding: '0 20px' }}>
          <PWAInstallBanner />
        </div>

        {/* ── Amount ───────────────────────────────────────────────────── */}
        <div style={{ padding: '0 20px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <p
              style={{
                fontSize: 42,
                fontWeight: 800,
                color: '#F5F5F5',
                letterSpacing: '-2px',
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
                filter: hideAmount ? 'blur(10px)' : 'none',
                transition: 'filter 0.2s ease',
                userSelect: hideAmount ? 'none' : 'auto',
              }}
            >
              {formatCurrency(total)}
            </p>
            <p style={{ fontSize: 12, color: '#555555', marginTop: 6 }}>
              across {count} transaction{count !== 1 ? 's' : ''}
            </p>
          </div>
          {/* Eye icon */}
          <button
            onClick={() => setHideAmount((v) => !v)}
            style={{ background: '#151515', border: '1px solid #242424', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
            aria-label={hideAmount ? 'Show amount' : 'Hide amount'}
          >
            {hideAmount ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555555" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555555" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
            )}
          </button>
        </div>

        {/* ── Change badge ─────────────────────────────────────────────── */}
        {change !== null && count > 0 && prevTotal > 0 && (
          <div style={{ padding: '0 20px 20px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '5px 10px',
                borderRadius: 100,
                fontSize: 12,
                fontWeight: 700,
                background: change > 0 ? 'rgba(255,68,68,0.12)' : 'rgba(0,200,83,0.12)',
                color: change > 0 ? '#FF4444' : '#00C853',
              }}
            >
              {change > 0 ? '↑' : '↓'} Expenses {change > 0 ? 'up' : 'down'} by {formatCurrency(Math.abs(total - prevTotal))}
            </span>
          </div>
        )}

        {/* ── Chart + Legend ────────────────────────────────────────────── */}
        {chartSegments.length > 0 && (
          <div style={{ padding: '0 20px 20px' }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              {/* Donut */}
              <div style={{ flexShrink: 0 }}>
                <DonutChart segments={chartSegments} size={120} />
              </div>
              {/* Legend */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', flex: 1 }}>
                {chartSegments.slice(0, 8).map((seg) => (
                  <div key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: seg.color, display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: '#8A8A8A' }}>{seg.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Financial Targets (Salary & Budget) ─────────────────────── */}
        <div style={{ margin: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Salary card if configured */}
          {userSalary > 0 && (
            <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 10, color: '#555555', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>
                  MONTHLY SALARY / INCOME
                </p>
                <p style={{ fontSize: 20, fontWeight: 800, color: '#00C853', marginTop: 2 }}>
                  {formatCurrency(userSalary)}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 10, color: '#555555', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>
                  NET REMAINING
                </p>
                <p style={{ fontSize: 16, fontWeight: 700, color: userSalary - total >= 0 ? '#F5F5F5' : '#FF4444', marginTop: 2 }}>
                  {formatCurrency(userSalary - total)}
                </p>
              </div>
            </div>
          )}

          {/* Budget bar card */}
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#8A8A8A', fontWeight: 500 }}>
                {budgetPct.toFixed(0)}% of monthly budget ({formatCurrency(BUDGET)})
              </span>
              <Link href="/settings" style={{ fontSize: 12, color: '#00C853', fontWeight: 600, textDecoration: 'none' }}>
                Edit 🎯
              </Link>
            </div>
            <div className="budget-bar-track">
              <div
                className="budget-bar-fill"
                style={{
                  width: `${budgetPct}%`,
                  background: budgetPct >= 100 ? '#FF4444' : budgetPct >= 85 ? '#F59E0B' : '#00C853',
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ fontSize: 11, color: '#555555' }}>{formatCurrency(total)} spent</span>
              <span style={{ fontSize: 11, color: total > BUDGET ? '#FF4444' : '#00C853', fontWeight: 600 }}>
                {total > BUDGET ? `${formatCurrency(total - BUDGET)} over budget` : `${formatCurrency(BUDGET - total)} left`}
              </span>
            </div>
          </div>
        </div>

        {/* ── Tab bar ──────────────────────────────────────────────────── */}
        <div style={{ padding: '0 20px 16px' }}>
          <div
            style={{
              display: 'flex',
              background: '#0D0D0D',
              border: '1px solid #1A1A1A',
              borderRadius: 100,
              padding: 3,
              gap: 2,
            }}
          >
            {TABS.map((t) => (
              <button
                key={t}
                id={`tab-${t.toLowerCase()}`}
                onClick={() => setTab(t)}
                style={{
                  flex: 1,
                  padding: '7px 0',
                  borderRadius: 100,
                  fontSize: 11,
                  fontWeight: tab === t ? 700 : 500,
                  color: tab === t ? '#F5F5F5' : '#555555',
                  background: tab === t ? '#1E1E1E' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                  transition: 'all 0.15s ease',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* ── Transaction list ──────────────────────────────────────────── */}
        {filteredExpenses.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', gap: 10 }}>
            <span style={{ fontSize: 40 }}>💸</span>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#F5F5F5' }}>No transactions yet</p>
            <p style={{ fontSize: 13, color: '#555555', textAlign: 'center', lineHeight: 1.5 }}>
              Tap the + button to add from a payment screenshot.
            </p>
            <Link href="/import" style={{ marginTop: 12 }}>
              <button className="btn-primary" style={{ minHeight: 44, fontSize: 14, paddingLeft: 20, paddingRight: 20, width: 'auto' }}>
                + Add from Screenshot
              </button>
            </Link>
          </div>
        ) : (
          <div style={{ margin: '0 20px', background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 14, overflow: 'hidden' }}>
            {filteredExpenses.slice(0, 20).map((expense, i) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                isLast={i === Math.min(filteredExpenses.length, 20) - 1}
              />
            ))}
            {filteredExpenses.length > 20 && (
              <Link href="/expenses">
                <div style={{ padding: '13px 16px', textAlign: 'center', color: '#00C853', fontSize: 13, fontWeight: 600, borderTop: '1px solid #1A1A1A' }}>
                  View all {filteredExpenses.length} transactions →
                </div>
              </Link>
            )}
          </div>
        )}

        <div style={{ height: 32 }} />
      </div>
    </AppShell>
  );
}
