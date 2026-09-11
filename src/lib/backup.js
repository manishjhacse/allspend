/**
 * Backup and restore utilities
 * - JSON export/import (full backup)
 * - CSV export
 */

import { db } from './db';
import { formatDate, formatTime } from './formatters';

// ─── JSON Backup ──────────────────────────────────────────────────────────────

export async function exportBackupJSON() {
  const [expenses, categories, merchantMappings, settings] = await Promise.all([
    db.expenses.toArray(),
    db.categories.toArray(),
    db.merchantMappings.toArray(),
    db.settings.toArray(),
  ]);

  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: { expenses, categories, merchantMappings, settings },
  };

  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const today = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `allspend-backup-${today}.json`);
}

export async function importBackupJSON(file, mode = 'merge') {
  const text = await file.text();
  let backup;

  try {
    backup = JSON.parse(text);
  } catch {
    throw new Error('Invalid backup file: not valid JSON');
  }

  if (!backup.version || !backup.data) {
    throw new Error('Invalid backup file: missing required fields');
  }

  const { expenses = [], categories = [], merchantMappings = [], settings = [] } = backup.data;

  // Validate data
  if (!Array.isArray(expenses) || !Array.isArray(categories)) {
    throw new Error('Invalid backup file: corrupted data structure');
  }

  if (mode === 'replace') {
    await db.transaction('rw', db.expenses, db.categories, db.merchantMappings, db.settings, async () => {
      await db.expenses.clear();
      await db.categories.clear();
      await db.merchantMappings.clear();
      await db.settings.clear();

      await importAll(expenses, categories, merchantMappings, settings);
    });
  } else {
    // Merge mode
    await db.transaction('rw', db.expenses, db.categories, db.merchantMappings, db.settings, async () => {
      await importAll(expenses, categories, merchantMappings, settings);
    });
  }

  return {
    expenses: expenses.length,
    categories: categories.length,
    merchantMappings: merchantMappings.length,
  };
}

async function importAll(expenses, categories, merchantMappings, settings) {
  // Import categories (by name to avoid duplicates)
  for (const cat of categories) {
    const { id, ...rest } = cat;
    const existing = await db.categories.where('name').equals(cat.name).first();
    if (!existing) await db.categories.add(rest);
  }

  // Import merchant mappings (by merchant key)
  for (const mm of merchantMappings) {
    const { id, ...rest } = mm;
    const existing = await db.merchantMappings.where('merchant').equals(mm.merchant).first();
    if (!existing) await db.merchantMappings.add(rest);
    else await db.merchantMappings.update(existing.id, { category: mm.category });
  }

  // Import expenses (merge by transactionId if available, otherwise add)
  for (const exp of expenses) {
    const { id, ...rest } = exp;
    if (exp.transactionId) {
      const existing = await db.expenses.where('transactionId').equals(exp.transactionId).first();
      if (!existing) await db.expenses.add(rest);
    } else {
      await db.expenses.add(rest);
    }
  }

  // Import settings
  for (const s of settings) {
    await db.settings.put(s);
  }
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

export async function exportCSV() {
  const expenses = await db.expenses.orderBy('date').reverse().toArray();

  const headers = [
    'Date', 'Time', 'Merchant', 'Amount', 'Category',
    'Payment Method', 'Transaction ID', 'Note', 'Source'
  ];

  const rows = expenses.map((e) => [
    e.date ? formatDate(e.date) : '',
    e.time ? formatTime(e.time) : '',
    escapeCsv(e.merchant || ''),
    e.amount || 0,
    escapeCsv(e.category || ''),
    escapeCsv(e.paymentMethod || ''),
    escapeCsv(e.transactionId || ''),
    escapeCsv(e.note || ''),
    escapeCsv(e.source || 'manual'),
  ]);

  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const today = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `allspend-${today}.csv`);
}

function escapeCsv(value) {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

// ─── Clear all data ───────────────────────────────────────────────────────────

export async function clearAllData() {
  await db.transaction('rw', db.expenses, db.categories, db.merchantMappings, db.settings, async () => {
    await db.expenses.clear();
    await db.categories.clear();
    await db.merchantMappings.clear();
    await db.settings.clear();
  });
}
