'use client';

import { useState, useRef, useEffect } from 'react';
import { AppShell, useAppToast } from '@/components/layout/AppShell';
import { ConfirmModal } from '@/components/ui/Modal';
import { useCategories } from '@/hooks/useCategories';
import { useMerchantMappings } from '@/hooks/useMerchantMappings';
import { exportBackupJSON, importBackupJSON, exportCSV, clearAllData } from '@/lib/backup';
import { initDB, settingsOps, expenseOps } from '@/lib/db';
import { formatCurrency } from '@/lib/formatters';
import { useMonthlyExpenses } from '@/hooks/useExpenses';

// ─── Settings Row ─────────────────────────────────────────────────────────

function SettingsRow({ icon, label, value, onClick, danger, chevron = true }) {
  return (
    <button
      className="settings-row"
      onClick={onClick}
      style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}
    >
      <div className="settings-icon">
        <span>{icon}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: danger ? '#FF4444' : '#F5F5F5' }}>{label}</p>
        {value && <p style={{ fontSize: 12, color: '#555555', marginTop: 1 }}>{value}</p>}
      </div>
      {chevron && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3A3A3A" strokeWidth="2" strokeLinecap="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      )}
    </button>
  );
}

// ─── Category Manager ─────────────────────────────────────────────────────

function CategoryManager({ categories, addCategory, renameCategory, deleteCategory, addToast, onClose }) {
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    if (categories.find((c) => c.name.toLowerCase() === name.toLowerCase())) {
      addToast?.('Category already exists', 'error');
      return;
    }
    await addCategory(name);
    setNewName('');
    addToast?.('Category added ✓');
  }

  async function handleRename() {
    if (!editing || !editing.name.trim()) return;
    await renameCategory(editing.id, editing.name.trim());
    setEditing(null);
    addToast?.('Renamed ✓');
  }

  async function handleDelete() {
    await deleteCategory(deleteTarget.id, 'Others');
    setDeleteTarget(null);
    addToast?.('Category deleted');
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#050505', zIndex: 60, overflowY: 'auto' }}>
      <div style={{ padding: '52px 20px 100px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button
            onClick={onClose}
            style={{ background: '#151515', border: '1px solid #242424', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#8A8A8A', fontSize: 18 }}
          >←</button>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#F5F5F5' }}>Edit Categories</h2>
        </div>

        {/* Category list */}
        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
          {categories.map((cat, i) => (
            <div
              key={cat.id}
              style={{
                display: 'flex', alignItems: 'center', padding: '13px 16px', gap: 12,
                borderBottom: i < categories.length - 1 ? '1px solid #1A1A1A' : 'none',
              }}
            >
              {editing?.id === cat.id ? (
                <input
                  className="input"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                  autoFocus
                  style={{ flex: 1, fontSize: 14, padding: '6px 10px' }}
                />
              ) : (
                <span style={{ flex: 1, fontSize: 14, color: '#F5F5F5' }}>{cat.name}</span>
              )}
              <div style={{ display: 'flex', gap: 14 }}>
                {editing?.id === cat.id ? (
                  <>
                    <button onClick={handleRename} style={{ fontSize: 13, color: '#00C853', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Save</button>
                    <button onClick={() => setEditing(null)} style={{ fontSize: 13, color: '#555555', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setEditing({ id: cat.id, name: cat.name })} style={{ fontSize: 13, color: '#8A8A8A', background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
                    {cat.name !== 'Others' && (
                      <button onClick={() => setDeleteTarget(cat)} style={{ fontSize: 13, color: '#FF4444', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add new */}
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            className="input"
            placeholder="New category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            style={{ fontSize: 14, flex: 1 }}
          />
          <button onClick={handleAdd} className="btn-primary" style={{ width: 'auto', paddingLeft: 18, paddingRight: 18, minHeight: 46 }}>
            Add
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        message={`Delete "${deleteTarget?.name}"? All expenses will move to "Others".`}
        confirmText="Delete"
        confirmDanger
      />
    </div>
  );
}

// ─── Settings Page ────────────────────────────────────────────────────────

import { GeminiKeyManager } from '@/components/settings/GeminiKeyManager';

export default function SettingsPage() {
  const addToast = useAppToast();
  const { categories, addCategory, renameCategory, deleteCategory } = useCategories();
  const { mappings, setMapping, deleteMapping } = useMerchantMappings();
  const [clearModal, setClearModal] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showGeminiKeys, setShowGeminiKeys] = useState(false);
  const [userName, setUserName] = useState('Manish');
  const [salary, setSalary] = useState('');
  const [budget, setBudget] = useState('');
  const [savingTargets, setSavingTargets] = useState(false);
  const importRef = useRef(null);

  const now = new Date();
  const { total, count } = useMonthlyExpenses(now.getFullYear(), now.getMonth());

  useEffect(() => {
    initDB();
    settingsOps.get('userName', 'Manish').then((v) => { if (v) setUserName(v); });
    settingsOps.get('monthlySalary', '').then((v) => { if (v !== null && v !== undefined) setSalary(String(v)); });
    settingsOps.get('monthlyBudget', '20000').then((v) => { if (v !== null && v !== undefined) setBudget(String(v)); });
  }, []);

  async function handleSaveTargets(e) {
    e.preventDefault();
    setSavingTargets(true);
    try {
      await settingsOps.set('monthlySalary', salary.trim());
      await settingsOps.set('monthlyBudget', budget.trim());
      addToast?.('Financial targets saved ✓');
    } catch (err) {
      addToast?.('Failed to save targets', 'error');
    } finally {
      setSavingTargets(false);
    }
  }

  async function handleExportJSON() {
    try { await exportBackupJSON(); addToast?.('Backup exported ✓'); }
    catch { addToast?.('Export failed', 'error'); }
  }

  async function handleImportJSON(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await importBackupJSON(file, 'merge');
      addToast?.(`Imported ${result.expenses} expenses ✓`);
    } catch (err) {
      addToast?.(err.message || 'Import failed', 'error');
    }
    e.target.value = '';
  }

  async function handleExportCSV() {
    try { await exportCSV(); addToast?.('CSV exported ✓'); }
    catch { addToast?.('Export failed', 'error'); }
  }

  async function handleClear() {
    await clearAllData();
    await initDB();
    setClearModal(false);
    addToast?.('All data cleared');
  }

  if (showCategories) {
    return (
      <AppShell>
        <CategoryManager
          categories={categories}
          addCategory={addCategory}
          renameCategory={renameCategory}
          deleteCategory={deleteCategory}
          addToast={addToast}
          onClose={() => setShowCategories(false)}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ padding: '52px 0 100px' }}>

        {/* ── Greeting ─────────────────────────────────────────────────── */}
        <div style={{ padding: '0 20px 24px' }}>
          <p style={{ fontSize: 11, color: '#555555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            YOUR ACCOUNT
          </p>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#F5F5F5', letterSpacing: '-0.8px', lineHeight: 1.1, marginBottom: 4 }}>
            Hey, <em style={{ fontStyle: 'italic', color: '#00C853' }}>{userName}.</em>
          </h1>
          <p style={{ fontSize: 13, color: '#555555' }}>Make AllSpend yours.</p>
        </div>

        {/* ── Spent So Far card ─────────────────────────────────────────── */}
        <div style={{ margin: '0 20px 20px', background: '#0D0D0D', border: '1px solid #242424', borderRadius: 14, padding: '16px 18px' }}>
          <p style={{ fontSize: 10, color: '#555555', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 8 }}>
            SPENT SO FAR
          </p>
          <p style={{ fontSize: 32, fontWeight: 800, color: '#F5F5F5', letterSpacing: '-1px', marginBottom: 4 }}>
            {formatCurrency(total)}
          </p>
          <p style={{ fontSize: 12, color: '#555555' }}>
            across {count} transaction{count !== 1 ? 's' : ''}
          </p>
        </div>

        {/* ── FINANCIAL TARGETS section ──────────────────────────────────── */}
        <p className="section-header" style={{ padding: '0 20px 8px' }}>FINANCIAL TARGETS</p>
        <div style={{ margin: '0 20px 24px', background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 14, padding: '16px' }}>
          <form onSubmit={handleSaveTargets} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#8A8A8A', display: 'block', marginBottom: 6 }}>
                Monthly Salary / Income (₹)
              </label>
              <input
                type="number"
                inputMode="decimal"
                className="input"
                placeholder="e.g. 75000"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                style={{ fontSize: 14 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#8A8A8A', display: 'block', marginBottom: 6 }}>
                Monthly Spending Budget (₹)
              </label>
              <input
                type="number"
                inputMode="decimal"
                className="input"
                placeholder="e.g. 40000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                style={{ fontSize: 14 }}
              />
            </div>

            <button
              type="submit"
              disabled={savingTargets}
              className="btn-primary"
              style={{ minHeight: 42, fontSize: 14, marginTop: 2 }}
            >
              {savingTargets ? 'Saving…' : 'Save Targets'}
            </button>
          </form>
        </div>

        {/* ── PREFERENCES section ────────────────────────────────────────── */}
        <p className="section-header" style={{ padding: '0 20px 8px' }}>PREFERENCES</p>
        <div style={{ margin: '0 20px 24px', background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 14, overflow: 'hidden' }}>
          <SettingsRow icon="🔑" label="Gemini Keys & Quota" value="Configure API keys & view fallback usage" onClick={() => setShowGeminiKeys(true)} />
          <SettingsRow icon="🏷️" label="Edit Categories" value="Manage expense categories" onClick={() => setShowCategories(true)} />
        </div>

        {/* ── DATA section ─────────────────────────────────────────────── */}
        <p className="section-header" style={{ padding: '0 20px 8px' }}>DATA</p>
        <div style={{ margin: '0 20px 24px', background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 14, overflow: 'hidden' }}>
          <SettingsRow icon="⬆️" label="Export Backup" value="Save all data as JSON" onClick={handleExportJSON} />
          <SettingsRow icon="⬇️" label="Import Backup" value="Restore from JSON" onClick={() => importRef.current?.click()} />
          <SettingsRow icon="📊" label="Export CSV" value="Open in Excel or Sheets" onClick={handleExportCSV} />
          <SettingsRow icon="🗑️" label="Clear All Data" onClick={() => setClearModal(true)} danger />
          <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportJSON} />
        </div>

        {/* ── About ────────────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', padding: '8px 20px' }}>
          <p style={{ fontSize: 12, color: '#3A3A3A' }}>
            🔒 Your data stays on this device. Powered by Gemini Vision.
          </p>
        </div>
      </div>

      <GeminiKeyManager
        isOpen={showGeminiKeys}
        onClose={() => setShowGeminiKeys(false)}
        addToast={addToast}
      />

      <ConfirmModal
        isOpen={clearModal}
        onClose={() => setClearModal(false)}
        onConfirm={handleClear}
        title="Clear All Data"
        message="This will permanently delete all your expenses, categories, and merchant rules. This cannot be undone."
        confirmText="Delete Everything"
        confirmDanger
      />
    </AppShell>
  );
}
