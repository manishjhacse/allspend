'use client';

import { useState, useEffect } from 'react';
import { userKeyOps, fallbackQuotaOps } from '@/lib/db';
import { maskKey, testUserKey } from '@/lib/ai/userKeyManager';
import { Modal } from '@/components/ui/Modal';

export function GeminiKeyManager({ isOpen, onClose, addToast }) {
  const [keys, setKeys] = useState([]);
  const [quotaStatus, setQuotaStatus] = useState({ used: 0, available: 3, date: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKeyInput, setNewKeyInput] = useState('');
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [testingId, setTestingId] = useState(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  async function loadData() {
    const kList = await userKeyOps.getAllKeys();
    setKeys(kList);
    const q = await fallbackQuotaOps.getStatus();
    setQuotaStatus(q);
  }

  async function handleAddKey(e) {
    e.preventDefault();
    const cleanKey = newKeyInput.trim();
    if (!cleanKey) {
      addToast?.('Please enter an API key', 'error');
      return;
    }

    setAdding(true);
    try {
      const testRes = await testUserKey(cleanKey);
      if (!testRes.ok) {
        addToast?.(`Verification warning: ${testRes.error}`, 'error');
      }

      const created = await userKeyOps.addKey(cleanKey, newKeyLabel.trim());
      if (testRes.ok) {
        await userKeyOps.updateKeyStatus(created.id, 'active');
      }

      addToast?.('Gemini API Key added ✓');
      setNewKeyInput('');
      setNewKeyLabel('');
      setShowAddModal(false);
      await loadData();
    } catch (err) {
      addToast?.(err.message || 'Failed to add key', 'error');
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveKey(id, label) {
    if (confirm(`Remove ${label || 'this Gemini key'}?`)) {
      await userKeyOps.removeKey(id);
      addToast?.('Key removed');
      await loadData();
    }
  }

  async function handleToggleKey(id, currentEnabled) {
    await userKeyOps.toggleKey(id, !currentEnabled);
    await loadData();
  }

  async function handleTestKey(keyObj) {
    setTestingId(keyObj.id);
    const res = await testUserKey(keyObj.key);
    setTestingId(null);

    if (res.ok) {
      await userKeyOps.updateKeyStatus(keyObj.id, 'active');
      addToast?.('Key is healthy and working ✓');
    } else {
      if (res.error?.includes('Quota') || res.error?.includes('429')) {
        await userKeyOps.updateKeyStatus(keyObj.id, 'temporarily_unavailable', new Date(Date.now() + 15 * 60 * 1000));
      } else if (res.error?.includes('Invalid')) {
        await userKeyOps.updateKeyStatus(keyObj.id, 'invalid');
      }
      addToast?.(`Key test failed: ${res.error}`, 'error');
    }
    await loadData();
  }

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#050505', zIndex: 60, overflowY: 'auto' }}>
      <div style={{ padding: '24px 20px max(110px, calc(env(safe-area-inset-bottom) + 90px))', maxWidth: 480, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, paddingTop: 12 }}>
          <button
            onClick={onClose}
            style={{
              background: '#151515',
              border: '1px solid #242424',
              borderRadius: '50%',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#8A8A8A',
              fontSize: 18,
              flexShrink: 0,
            }}
            aria-label="Back"
          >
            ←
          </button>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#F5F5F5', letterSpacing: '-0.3px' }}>
              Gemini Keys & Quota
            </h2>
            <p style={{ fontSize: 12, color: '#555555', marginTop: 1 }}>
              Configure API keys & view backup limit
            </p>
          </div>
        </div>

        {/* Local Security Banner */}
        <div
          style={{
            background: 'rgba(0, 200, 83, 0.06)',
            border: '1px solid rgba(0, 200, 83, 0.2)',
            borderRadius: 12,
            padding: '10px 14px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ fontSize: 14, lineHeight: 1 }}>🔒</span>
          <p style={{ fontSize: 12, color: '#00C853', fontWeight: 500, margin: 0, lineHeight: 1.4 }}>
            Keys are stored 100% locally on your device and never sent to servers.
          </p>
        </div>

        {/* User Keys Card */}
        <div
          style={{
            background: '#0D0D0D',
            border: '1px solid #1C1C1C',
            borderRadius: 16,
            padding: '16px',
            marginBottom: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#F5F5F5' }}>Personal Gemini Keys</h3>
              <p style={{ fontSize: 11, color: '#555555', marginTop: 1 }}>
                Tried first · Unlimited reads
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
              style={{
                width: 'auto',
                fontSize: 12,
                fontWeight: 600,
                padding: '6px 14px',
                minHeight: 32,
                borderRadius: 100,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              + Add Key
            </button>
          </div>

          {keys.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 12px', border: '1px dashed #242424', borderRadius: 12, background: '#0A0A0A' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#8A8A8A', marginBottom: 4 }}>No personal Gemini keys</p>
              <p style={{ fontSize: 11, color: '#555555', margin: 0 }}>
                Get a free key from Google AI Studio (aistudio.google.com) to process unlimited screenshots.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {keys.map((k) => {
                const isCooldown = k.status === 'temporarily_unavailable' && k.cooldownUntil && new Date(k.cooldownUntil) > new Date();
                return (
                  <div
                    key={k.id}
                    style={{
                      background: '#141414',
                      border: '1px solid #222222',
                      borderRadius: 12,
                      padding: '10px 12px',
                      opacity: k.enabled ? 1 : 0.55,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#F5F5F5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {k.label || 'Gemini Key'}
                        </span>
                        <code style={{ fontSize: 11, color: '#8A8A8A', background: '#0A0A0A', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>
                          {maskKey(k.key)}
                        </code>
                      </div>

                      {/* Enable/Disable Toggle */}
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 5, flexShrink: 0 }}>
                        <input
                          type="checkbox"
                          checked={k.enabled}
                          onChange={() => handleToggleKey(k.id, k.enabled)}
                          style={{ accentColor: '#00C853', width: 15, height: 15 }}
                        />
                        <span style={{ fontSize: 11, color: '#555555' }}>{k.enabled ? 'On' : 'Off'}</span>
                      </label>
                    </div>

                    {/* Status Badge & Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid #1E1E1E' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: !k.enabled
                              ? '#555555'
                              : isCooldown
                              ? '#F59E0B'
                              : k.status === 'active'
                              ? '#00C853'
                              : k.status === 'invalid'
                              ? '#FF4444'
                              : '#8A8A8A',
                          }}
                        />
                        <span style={{ fontSize: 11, color: '#8A8A8A' }}>
                          {!k.enabled
                            ? 'Disabled'
                            : isCooldown
                            ? 'Quota Limit Reached'
                            : k.status === 'active'
                            ? 'Healthy'
                            : k.status === 'invalid'
                            ? 'Invalid Key'
                            : 'Untested'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: 12 }}>
                        <button
                          onClick={() => handleTestKey(k)}
                          disabled={testingId === k.id || !k.enabled}
                          style={{
                            fontSize: 11,
                            color: testingId === k.id ? '#555555' : '#00C853',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          {testingId === k.id ? 'Testing...' : 'Test'}
                        </button>
                        <button
                          onClick={() => handleRemoveKey(k.id, k.label)}
                          style={{ fontSize: 11, color: '#FF4444', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* AllSpend Backup Quota Card */}
        <div
          style={{
            background: '#0D0D0D',
            border: '1px solid #1C1C1C',
            borderRadius: 16,
            padding: '16px',
            marginBottom: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#F5F5F5' }}>AllSpend Backup Quota</h3>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: 100,
                whiteSpace: 'nowrap',
                background: quotaStatus.available > 0 ? 'rgba(0, 200, 83, 0.12)' : 'rgba(255, 68, 68, 0.12)',
                color: quotaStatus.available > 0 ? '#00C853' : '#FF4444',
                border: `1px solid ${quotaStatus.available > 0 ? 'rgba(0, 200, 83, 0.25)' : 'rgba(255, 68, 68, 0.25)'}`,
                flexShrink: 0,
              }}
            >
              {quotaStatus.available} of 3 available
            </span>
          </div>

          <p style={{ fontSize: 11, color: '#8A8A8A', lineHeight: 1.5, marginBottom: 12 }}>
            Used automatically when your personal keys are not configured or hit rate limits. Resets daily.
          </p>

          <div style={{ display: 'flex', gap: 6, height: 5, borderRadius: 3, background: '#1A1A1A', overflow: 'hidden' }}>
            {[1, 2, 3].map((slot) => {
              const isUsed = slot <= quotaStatus.used;
              return (
                <div
                  key={slot}
                  style={{
                    flex: 1,
                    background: isUsed ? '#333333' : '#00C853',
                    borderRadius: 2,
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Manual Entry Status */}
        <div
          style={{
            background: '#0D0D0D',
            border: '1px solid #1C1C1C',
            borderRadius: 16,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#F5F5F5', margin: 0 }}>Manual Entry</p>
            <p style={{ fontSize: 11, color: '#555555', margin: '2px 0 0' }}>Add transactions manually anytime</p>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#00C853', background: 'rgba(0,200,83,0.1)', padding: '3px 10px', borderRadius: 100 }}>
            Unlimited
          </span>
        </div>
      </div>

      {/* Add Key Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Gemini API Key">
        <form onSubmit={handleAddKey} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: '#8A8A8A', marginBottom: 6, display: 'block' }}>Key Label (Optional)</label>
            <input
              className="input"
              placeholder="e.g. Personal Key 1"
              value={newKeyLabel}
              onChange={(e) => setNewKeyLabel(e.target.value)}
              style={{ fontSize: 14 }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, color: '#8A8A8A', marginBottom: 6, display: 'block' }}>Google Gemini API Key *</label>
            <input
              className="input"
              placeholder="AIzaSy..."
              value={newKeyInput}
              onChange={(e) => setNewKeyInput(e.target.value)}
              required
              style={{ fontSize: 14, fontFamily: 'monospace' }}
            />
            <p style={{ fontSize: 11, color: '#555555', marginTop: 6 }}>
              Get your free key from Google AI Studio (aistudio.google.com).
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="btn-secondary"
              style={{ flex: 1, minHeight: 44, fontSize: 13 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adding || !newKeyInput.trim()}
              className="btn-primary"
              style={{ flex: 1, minHeight: 44, fontSize: 13 }}
            >
              {adding ? 'Verifying...' : 'Save Key'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
