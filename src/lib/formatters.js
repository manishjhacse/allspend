/**
 * Indian number and date formatting utilities
 */

/**
 * Format a number as Indian currency (₹)
 * Supports Indian numbering system (lakhs, crores)
 */
export function formatCurrency(amount, options = {}) {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  const { compact = false } = options;

  if (compact) {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date string (YYYY-MM-DD) for display
 */
export function formatDate(dateStr, options = {}) {
  if (!dateStr) return '';
  const {
    format = 'medium', // 'short' | 'medium' | 'long' | 'monthYear' | 'dayMonth'
  } = options;

  // Parse as local date to avoid timezone shift
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  if (format === 'short') {
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  }
  if (format === 'long') {
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  if (format === 'monthYear') {
    return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }
  if (format === 'dayMonth') {
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }
  // medium (default)
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Format time string (HH:MM or HH:MM:SS) for display
 */
export function formatTime(timeStr) {
  if (!timeStr) return '';
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return timeStr;
  }
}

/**
 * Get today's date as YYYY-MM-DD (local timezone)
 */
export function todayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * Get current time as HH:MM (local timezone)
 */
export function nowTimeStr() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

/**
 * Get year-month string (YYYY-MM) for a date string
 */
export function getYearMonth(dateStr) {
  if (!dateStr) return '';
  return dateStr.slice(0, 7);
}

/**
 * Get display label for date relative to today
 * Returns 'Today', 'Yesterday', or formatted date
 */
export function getRelativeDateLabel(dateStr) {
  const today = todayStr();
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  return formatDate(dateStr, { format: 'short' });
}

/**
 * Group expenses by date label
 */
export function groupExpensesByDate(expenses) {
  const groups = {};
  for (const expense of expenses) {
    const label = getRelativeDateLabel(expense.date);
    if (!groups[label]) groups[label] = [];
    groups[label].push(expense);
  }
  return groups;
}

/**
 * Get month name
 */
export function getMonthName(monthIndex) {
  return new Date(2000, monthIndex, 1).toLocaleString('en-IN', { month: 'long' });
}

/**
 * Parse amount string to number
 */
export function parseAmount(amountStr) {
  if (!amountStr) return 0;
  const cleaned = String(amountStr)
    .replace(/[₹Rs\.INR,\s]/gi, '')
    .trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Calculate percentage change
 */
export function percentChange(current, previous) {
  if (!previous || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/**
 * Get YYYY-MM-DD from a Date object (local timezone)
 */
export function dateToStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
