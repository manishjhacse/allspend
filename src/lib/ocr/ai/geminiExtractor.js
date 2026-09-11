import { executeWithUserKeys } from '@/lib/ai/userKeyManager';
import { fallbackQuotaOps } from '@/lib/db';

const EXTRACTION_PROMPT = `You are a payment transaction extraction system for AllSpend.

Analyze the provided payment screenshot carefully.
Understand the complete screenshot visually and extract the actual transaction information.
Most importantly, identify the PRIMARY TRANSACTION AMOUNT.

Supported categories: Food, Shopping, Travel, Groceries, Rent, Investments, Health, EMI/Bill, Subscriptions, Entertainment, Education, Personal, Others
Supported date/time: normalize to date: YYYY-MM-DD, time: HH:mm (24-hour)
Supported paymentApp: Google Pay, PhonePe, Paytm, BHIM, Navi, Super.money or null

Return ONLY valid JSON matching the schema below:
{
  "isPaymentScreenshot": boolean (true if image is a payment receipt, UPI transfer, bank statement, or payment app screenshot; false if image is not a payment receipt),
  "transactionType": "expense" | "income" | "refund" | "failed" | "pending",
  "status": "success" | "failed" | "pending" | "refunded",
  "amount": number or null,
  "currency": "INR",
  "merchant": string or null,
  "sender": string or null,
  "receiver": string or null,
  "date": "YYYY-MM-DD" or null,
  "time": "HH:mm" or null,
  "paymentMethod": "UPI" | "Debit Card" | "Credit Card" | "Wallet" | "Net Banking" | null,
  "paymentApp": "Google Pay" | "PhonePe" | "Paytm" | "BHIM" | "Navi" | "Super.money" | null,
  "transactionId": string or null,
  "referenceId": string or null,
  "utr": string or null,
  "upiId": string or null,
  "bank": string or null,
  "cashback": number or null,
  "category": "Food" | "Shopping" | "Travel" | "Groceries" | "Rent" | "Investments" | "Health" | "EMI/Bill" | "Subscriptions" | "Entertainment" | "Education" | "Personal" | "Others" | null,
  "confidence": {
    "amount": number,
    "merchant": number,
    "date": number,
    "time": number,
    "transactionType": number
  }
}`;

export function cleanAndParseJson(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty or invalid response from Gemini API');
  }

  let text = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.substring(firstBrace, lastBrace + 1);
  } else if (firstBrace !== -1) {
    text = text.substring(firstBrace);
  }

  try {
    return JSON.parse(text);
  } catch (e1) {}

  let cleaned = text
    .replace(/[\u0000-\u001F]+/g, (match) => (match === '\n' || match === '\r' ? ' ' : ''))
    .replace(/,\s*([}\]])/g, '$1');

  try {
    return JSON.parse(cleaned);
  } catch (e2) {
    let repaired = cleaned;
    let inString = false;
    let escaped = false;
    let openBraces = 0;
    let openBrackets = 0;

    for (let i = 0; i < repaired.length; i++) {
      const ch = repaired[i];
      if (escaped) { escaped = false; continue; }
      if (ch === '\\') { escaped = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (!inString) {
        if (ch === '{') openBraces++;
        if (ch === '}') openBraces--;
        if (ch === '[') openBrackets++;
        if (ch === ']') openBrackets--;
      }
    }

    if (inString) repaired += '"';
    while (openBrackets > 0) { repaired += ']'; openBrackets--; }
    while (openBraces > 0) { repaired += '}'; openBraces--; }

    repaired = repaired.replace(/,\s*([}\]])/g, '$1');

    try {
      return JSON.parse(repaired);
    } catch (e3) {
      throw new Error('Screenshot data could not be parsed confidently as structured payment details.');
    }
  }
}

function formatTransactionObject(txn, source = 'gemini_vision') {
  let avgConfidence = 0.95;
  if (txn.confidence && typeof txn.confidence === 'object') {
    const vals = Object.values(txn.confidence).filter((v) => typeof v === 'number');
    if (vals.length > 0) {
      avgConfidence = vals.reduce((a, b) => a + b, 0) / vals.length;
    }
  }

  return {
    isPaymentScreenshot: txn.isPaymentScreenshot !== false,
    transactionType: txn.transactionType || 'expense',
    status: txn.status || 'success',
    amount: typeof txn.amount === 'number' ? txn.amount : null,
    currency: txn.currency || 'INR',
    merchant: txn.merchant || null,
    sender: txn.sender || null,
    receiver: txn.receiver || null,
    date: txn.date || null,
    time: txn.time || null,
    paymentMethod: txn.paymentMethod || 'UPI',
    paymentApp: txn.paymentApp || null,
    transactionId: txn.transactionId || null,
    referenceId: txn.referenceId || null,
    utr: txn.utr || null,
    upiId: txn.upiId || null,
    bank: txn.bank || null,
    cashback: typeof txn.cashback === 'number' ? txn.cashback : null,
    category: txn.category || 'Others',
    confidence: Math.round(avgConfidence * 100) / 100,
    fieldConfidences: txn.confidence || {},
    source,
  };
}

/**
 * Extract payment transaction from a screenshot image using Gemini Vision.
 * Flow:
 * 1. Offline check
 * 2. Try User's local Gemini keys FIRST
 * 3. Fallback to AllSpend server quota (3/day) ONLY if user keys unavailable
 */
export async function extractWithGeminiVision(imageBase64, mimeType) {
  if (!imageBase64 || imageBase64.trim().length === 0) {
    throw new Error('Image data is empty. Could not read payment details.');
  }

  // 1. Offline check
  if (typeof window !== 'undefined' && navigator.onLine === false) {
    throw new Error('OFFLINE_ERROR');
  }

  // 2. Try User's local Gemini API keys FIRST
  const userResult = await executeWithUserKeys(imageBase64, mimeType, EXTRACTION_PROMPT);

  if (userResult.success && userResult.text) {
    const rawParsed = cleanAndParseJson(userResult.text);
    return formatTransactionObject(rawParsed, 'user_gemini_key');
  }

  if (userResult.errorType === 'OFFLINE') {
    throw new Error('OFFLINE_ERROR');
  }

  // 3. Fallback to AllSpend Server Quota (3 operations per day)
  const quotaStatus = await fallbackQuotaOps.getStatus();

  if (quotaStatus.available <= 0) {
    throw new Error('ALLSPEND_QUOTA_EXHAUSTED');
  }

  // Call AllSpend server route
  const res = await fetch('/api/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mimeType }),
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    if (res.status === 503 || json.error?.includes('GEMINI_API_KEYS')) {
      throw new Error('Server Gemini quota unavailable. Please configure your own Gemini API key in Settings.');
    }
    let errMsg = json.error || `Gemini Vision extraction failed (HTTP ${res.status})`;
    if (
      errMsg.includes('SyntaxError') ||
      errMsg.includes('JSON') ||
      errMsg.includes('position') ||
      errMsg.includes('Unexpected token') ||
      errMsg.includes('fetch failed')
    ) {
      errMsg = 'Could not read transaction details clearly from this screenshot. Please try another screenshot or add the expense manually.';
    }
    throw new Error(errMsg);
  }

  // Only consume 1 server fallback quota on SUCCESSFUL extraction
  await fallbackQuotaOps.consume();

  return formatTransactionObject(json.transaction, 'allspend_fallback');
}

