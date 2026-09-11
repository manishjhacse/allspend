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
      // Perform quick verification test before saving
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
      <div style={{ padding: '52px 20px 100px', maxWidth: 540, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button
            onClick={onClose}
            style={{
              background: '#151515',
              border: '1px solid #242424',
              borderRadius: '50%',
              width: 34,
              height: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#8A8A8A',
              fontSize: 18,
            }}
            aria-label="Back"
          >
            ←
          </button>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#F5F5F5' }}>Gemini Keys & Quota</h2>
        </div>

        {/* Local Security Badge */}
        <div
          style={{
            background: 'rgba(0, 200, 83, 0.08)',
            border: '1px solid rgba(0, 200, 83, 0.25)',
            borderRadius: 14,
            padding: '14px 16px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>🔒</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#00C853', marginBottom: 2 }}>
              100% Local Storage Security
            </p>
            <p style={{ fontSize: 12, color: '#8A8A8A', lineHeight: 1.5 }}>
              Your Gemini API keys are stored on this device only. They are never sent to AllSpend servers, analytics, or transaction logs.
            </p>
          </div>
        </div>

        {/* User Keys Card */}
        <div
          style={{
            background: '#0D0D0D',
            border: '1px solid #1A1A1A',
            borderRadius: 16,
            padding: '18px 16px',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#F5F5F5' }}>Your Gemini API Keys</h3>
              <p style={{ fontSize: 12, color: '#555555', marginTop: 2 }}>
                Used first with unlimited reads
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
              style={{ width: 'auto', fontSize: 12, padding: '6px 12px', minHeight: 34 }}
            >
              + Add Key
            </button>
          </div>

          {keys.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 12px', border: '1px dashed #242424', borderRadius: 12 }}>
              <p style={{ fontSize: 13, color: '#8A8A8A', marginBottom: 6 }}>No personal Gemini keys added</p>
              <p style={{ fontSize: 11, color: '#555555' }}>
                Add your free key from Google AI Studio to process unlimited screenshots.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {keys.map((k) => {
                const isCooldown = k.status === 'temporarily_unavailable' && k.cooldownUntil && new Date(k.cooldownUntil) > new Date();
                return (
                  <div
                    key={k.id}
                    style={{
                      background: '#141414',
                      border: '1px solid #242424',
                      borderRadius: 12,
                      padding: '12px 14px',
                      opacity: k.enabled ? 1 : 0.55,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#F5F5F5', marginRight: 8 }}>
                          {k.label || 'Gemini Key'}
                        </span>
                        <code style={{ fontSize: 12, color: '#8A8A8A', background: '#0A0A0A', padding: '2px 6px', borderRadius: 4 }}>
                          {maskKey(k.key)}
                        </code>
                      </div>

                      {/* Enable/Disable Toggle */}
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 6 }}>
                        <input
                          type="checkbox"
                          checked={k.enabled}
                          onChange={() => handleToggleKey(k.id, k.enabled)}
                          style={{ accentColor: '#00C853', width: 16, height: 16 }}
                        />
                        <span style={{ fontSize: 11, color: '#555555' }}>{k.enabled ? 'Active' : 'Off'}</span>
                      </label>
                    </div>

                    {/* Status Badge & Action buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid #1F1F1F' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            width: 7,
                            height: 7,
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
                            ? 'Temporarily Limit Reached'
                            : k.status === 'active'
                            ? 'Healthy'
                            : k.status === 'invalid'
                            ? 'Invalid Key'
                            : 'Not tested yet'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: 10 }}>
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
                          {testingId === k.id ? 'Testing...' : 'Test Key'}
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
            border: '1px solid #1A1A1A',
            borderRadius: 16,
            padding: '18px 16px',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#F5F5F5' }}>AllSpend Backup Quota</h3>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 100,
                background: quotaStatus.available > 0 ? 'rgba(0, 200, 83, 0.15)' : 'rgba(255, 68, 68, 0.15)',
                color: quotaStatus.available > 0 ? '#00C853' : '#FF4444',
                border: `1px solid ${quotaStatus.available > 0 ? 'rgba(0, 200, 83, 0.3)' : 'rgba(255, 68, 68, 0.3)'}`,
              }}
            >
              {quotaStatus.available} of 3 available today
            </span>
          </div>

          <p style={{ fontSize: 12, color: '#8A8A8A', lineHeight: 1.5, marginBottom: 12 }}>
            Your personal Gemini keys are always tried first. If none can process a screenshot, AllSpend provides up to 3 additional backup reads each day.
          </p>

          <div style={{ display: 'flex', gap: 6, height: 6, borderRadius: 3, background: '#1A1A1A', overflow: 'hidden' }}>
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

        {/* Manual Entry Note */}
        <div
          style={{
            background: '#0D0D0D',
            border: '1px solid #1A1A1A',
            borderRadius: 16,
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#F5F5F5' }}>Manual Entry</p>
            <p style={{ fontSize: 12, color: '#555555', marginTop: 1 }}>Add income or expenses manually anytime</p>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#00C853', background: 'rgba(0,200,83,0.1)', padding: '4px 10px', borderRadius: 100 }}>
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
