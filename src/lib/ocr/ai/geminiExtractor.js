import { executeWithUserKeys } from '@/lib/ai/userKeyManager';
import { fallbackQuotaOps } from '@/lib/db';

const EXTRACTION_PROMPT = `You are an expert financial transaction extraction system for AllSpend.

Analyze the provided payment screenshot carefully and extract the transaction details with maximum precision.

1. PRIMARY TRANSACTION AMOUNT IDENTIFICATION:
- Locate the main monetary number for the payment transaction.
- If text like "Paid", "Sent", or "Debited" is present, the amount is the monetary value (₹, Rs, INR) attached to that action.
- If NO action words exist (only green checkmark ✔, success tick, or status icon), the transaction amount is the monetary value visually paired with the checkmark and receiver name.
- EXCLUSION RULES (STRICT):
  * NEVER extract account balance (e.g. "Bal ₹12,450", "Available Balance", "Updated Bal").
  * NEVER extract account numbers (e.g. "A/c **4321", "Ending in 9812").
  * NEVER extract cashback/rewards (e.g. "Earned ₹10", "Scratched Card").
  * NEVER extract transaction/reference/UTR numbers (e.g. "428918231").

2. MERCHANT / COUNTERPARTY NAME IDENTIFICATION:
- Extract the actual Person or Business who received the money (e.g. after "Paid to", "Sent to", "To", or in the primary header title).
- CLEANUP RULES:
  * Remove raw UPI handles in parentheses: convert "Rahul Sharma (rahul@okaxis)" to "Rahul Sharma".
  * If only a business handle is present (e.g. "swiggy@icici"), format it cleanly as "Swiggy".
  * NEVER use bank names ("HDFC Bank", "SBI", "ICICI", "Axis Bank") as the merchant name unless it's a direct bank fee.
  * NEVER use generic action words ("UPI Payment", "Paid", "Transfer", "Self") as the merchant name.

3. APP & METADATA DETECTION:
- Identify paymentApp: Return any payment or bank app name as string (e.g. "Google Pay", "PhonePe", "Paytm", "Amazon Pay", "WhatsApp Pay", "Airtel Thanks", "BHIM", "Navi", "Super.money", "CRED", "ICICI iMobile", "HDFC Bank", "SBI YONO", etc.) or null if unknown.
- Identify paymentMethod: "UPI" | "Debit Card" | "Credit Card" | "Wallet" | "Net Banking" | "Cash" | "Other" | null.
- Date/Time: Normalize date to "YYYY-MM-DD" and time to 24-hour "HH:mm". If date/year is missing, use current year (2026).
- Categories: Food, Shopping, Travel, Groceries, Rent, Investments, Health, EMI/Bill, Subscriptions, Entertainment, Education, Personal, Others.

4. OUTPUT FORMAT:
Return ONLY valid JSON matching the schema below:
{
  "isPaymentScreenshot": boolean,
  "transactionType": "expense" | "income" | "refund" | "failed" | "pending",
  "status": "success" | "failed" | "pending" | "refunded",
  "amount": number or null,
  "currency": "INR",
  "merchant": string or null,
  "sender": string or null,
  "receiver": string or null,
  "date": "YYYY-MM-DD" or null,
  "time": "HH:mm" or null,
  "paymentMethod": "UPI" | "Debit Card" | "Credit Card" | "Wallet" | "Net Banking" | "Cash" | "Other" | null,
  "paymentApp": string or null,
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

