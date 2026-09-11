'use client';

import { useState, useEffect } from 'react';
import { ClientPortal } from '@/components/ui/ClientPortal';
import { settingsOps } from '@/lib/db';

export function OnboardingModal({ isOpen, onComplete }) {
  const [step, setStep] = useState(1); // 1: Name, 2: Salary & Budget
  const [name, setName] = useState('');
  const [salary, setSalary] = useState('');
  const [budget, setBudget] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  function handleNameSubmit(e) {
    e?.preventDefault();
    if (!name.trim()) return;
    setStep(2);
  }

  async function handleFinish(skip = false) {
    setSaving(true);
    const finalName = name.trim() || 'Friend';
    const finalSalary = skip ? '' : salary.trim();
    const finalBudget = skip ? '' : budget.trim();

    try {
      await settingsOps.set('userName', finalName);
      if (finalSalary) await settingsOps.set('monthlySalary', finalSalary);
      if (finalBudget) await settingsOps.set('monthlyBudget', finalBudget);
      await settingsOps.set('onboardingCompleted', true);

      onComplete?.({
        userName: finalName,
        salary: finalSalary,
        budget: finalBudget,
      });
    } catch (err) {
      console.error('[AllSpend Onboarding Error]:', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ClientPortal>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 5, 5, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <div
          className="modal-inner"
          style={{
            background: '#0F0F0F',
            border: '1px solid #222222',
            borderRadius: 24,
            padding: '36px 28px',
            width: '100%',
            maxWidth: 440,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle Step Progress Indicator */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 28, justifyContent: 'center' }}>
            <div
              style={{
                height: 4,
                width: 36,
                borderRadius: 2,
                background: '#00C853',
                transition: 'all 0.3s ease',
              }}
            />
            <div
              style={{
                height: 4,
                width: 36,
                borderRadius: 2,
                background: step === 2 ? '#00C853' : '#222222',
                transition: 'all 0.3s ease',
              }}
            />
          </div>

          {/* ── STEP 1: NAME (MANDATORY) ───────────────────────────────── */}
          {step === 1 && (
            <form onSubmit={handleNameSubmit} style={{ animation: 'modal-in 0.25s cubic-bezier(0.32, 0.72, 0, 1)' }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: 'rgba(0, 200, 83, 0.1)',
                    border: '1px solid rgba(0, 200, 83, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px auto',
                    boxShadow: '0 0 24px rgba(0, 200, 83, 0.2)',
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00C853" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#F5F5F5', letterSpacing: '-0.5px', marginBottom: 6 }}>
                  Welcome to AllSpend
                </h2>
                <p style={{ fontSize: 13, color: '#8A8A8A', lineHeight: 1.5 }}>
                  What should we call you?
                </p>
              </div>

              <div style={{ marginBottom: 24 }}>
                <input
                  type="text"
                  className="input"
                  placeholder="Enter your name..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  required
                  style={{
                    fontSize: 16,
                    padding: '14px 16px',
                    textAlign: 'center',
                    background: '#161616',
                    borderColor: name.trim() ? '#00C853' : '#282828',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={!name.trim()}
                className="btn-primary"
                style={{
                  minHeight: 48,
                  fontSize: 15,
                  opacity: name.trim() ? 1 : 0.4,
                  cursor: name.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Continue →
              </button>
            </form>
          )}

          {/* ── STEP 2: SALARY & BUDGET (OPTIONAL) ──────────────────────── */}
          {step === 2 && (
            <div style={{ animation: 'modal-in 0.25s cubic-bezier(0.32, 0.72, 0, 1)' }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: 'rgba(0, 200, 83, 0.1)',
                    border: '1px solid rgba(0, 200, 83, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px auto',
                    boxShadow: '0 0 24px rgba(0, 200, 83, 0.2)',
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00C853" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#F5F5F5', letterSpacing: '-0.5px', marginBottom: 6 }}>
                  Nice to meet you, <span style={{ color: '#00C853' }}>{name.trim()}</span>!
                </h2>
                <p style={{ fontSize: 13, color: '#8A8A8A', lineHeight: 1.5 }}>
                  Set your targets. You can change these anytime in Settings.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#8A8A8A', display: 'block', marginBottom: 6 }}>
                    Monthly Salary / Income (₹) <span style={{ color: '#555555', fontWeight: 400 }}></span>
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    className="input"
                    placeholder="e.g. 75000"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    style={{ fontSize: 14, background: '#161616' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#8A8A8A', display: 'block', marginBottom: 6 }}>
                    Monthly Spending Budget (₹) <span style={{ color: '#555555', fontWeight: 400 }}></span>
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    className="input"
                    placeholder="e.g. 40000"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    style={{ fontSize: 14, background: '#161616' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => handleFinish(false)}
                  disabled={saving}
                  className="btn-primary"
                  style={{ minHeight: 48, fontSize: 15 }}
                >
                  {saving ? 'Saving...' : 'Save & Get Started'}
                </button>
                <button
                  type="button"
                  onClick={() => handleFinish(true)}
                  disabled={saving}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#555555',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    padding: '8px',
                    textAlign: 'center',
                  }}
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ClientPortal>
  );
}
