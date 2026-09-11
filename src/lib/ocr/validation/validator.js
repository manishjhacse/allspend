/**
 * Schema validator for Gemini Vision extracted transaction objects.
 * Validates and sanitizes the flat JSON returned by Gemini Vision.
 * Performs zero semantic parsing or text interpretation.
 */

const VALID_TYPES = new Set(['expense', 'income', 'refund', 'failed', 'pending']);
const VALID_STATUSES = new Set(['success', 'failed', 'pending', 'refunded']);
const VALID_CATEGORIES = new Set([
  'Food', 'Shopping', 'Travel', 'Groceries', 'Rent', 'Investments',
  'Health', 'EMI/Bill', 'Subscriptions', 'Entertainment', 'Education', 'Personal', 'Others',
]);

/**
 * Validate and sanitize transaction data schema
 * @param {Object} rawData
 * @returns {Object} validated flat transaction object
 */
export function validateTransaction(rawData) {
  if (!rawData || typeof rawData !== 'object') {
    return {
      transactionType: 'expense',
      status: 'success',
      amount: null,
      currency: 'INR',
      merchant: null,
      sender: null,
      receiver: null,
      date: null,
      time: null,
      paymentMethod: 'UPI',
      paymentApp: null,
      transactionId: null,
      referenceId: null,
      utr: null,
      upiId: null,
      bank: null,
      cashback: null,
      category: 'Others',
      confidence: 0,
      source: 'gemini_vision',
    };
  }

  const data = { ...rawData };

  // Amount
  if (typeof data.amount !== 'number' || isNaN(data.amount) || data.amount <= 0) {
    data.amount = null;
  } else {
    data.amount = Math.round(data.amount * 100) / 100;
  }

  // Transaction type
  if (!VALID_TYPES.has(data.transactionType)) {
    data.transactionType = 'expense';
  }

  // Status
  if (!VALID_STATUSES.has(data.status)) {
    data.status = 'success';
  }

  // Category
  if (!VALID_CATEGORIES.has(data.category)) {
    data.category = 'Others';
  }

  // Currency default
  data.currency = data.currency || 'INR';

  // Sanitize string fields
  const strFields = ['merchant', 'sender', 'receiver', 'date', 'time', 'transactionId',
    'referenceId', 'utr', 'upiId', 'bank', 'paymentApp', 'paymentMethod'];
  for (const field of strFields) {
    if (typeof data[field] === 'string' && data[field].trim().length > 0) {
      data[field] = data[field].trim();
    } else {
      data[field] = null;
    }
  }

  // Cashback
  if (typeof data.cashback !== 'number' || isNaN(data.cashback) || data.cashback < 0) {
    data.cashback = null;
  }

  // Ensure source is set
  data.source = 'gemini_vision';

  return data;
}
