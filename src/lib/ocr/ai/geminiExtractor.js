/**
 * Gemini Vision Client Bridge
 * Sends the screenshot image directly to /api/extract (server-side Gemini Vision)
 * No OCR. No local text extraction. Image goes straight to Gemini.
 */

/**
 * Extract payment transaction from a screenshot image using Gemini Vision
 * @param {string} imageBase64 - Base64-encoded image data (no data URI prefix)
 * @param {string} mimeType - MIME type of the image e.g. 'image/jpeg', 'image/png'
 * @returns {Promise<Object>} Structured transaction object
 */
export async function extractWithGeminiVision(imageBase64, mimeType) {
  if (!imageBase64 || imageBase64.trim().length === 0) {
    throw new Error('Image data is empty. Could not read payment details.');
  }

  const res = await fetch('/api/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mimeType }),
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    if (res.status === 503 || json.error?.includes('GEMINI_API_KEYS')) {
      throw new Error(
        'GEMINI_API_KEYS is missing in .env.local! Please add your Gemini API key and restart the server.'
      );
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

  const txn = json.transaction;

  // Compute average confidence
  let avgConfidence = 0.95;
  if (txn.confidence && typeof txn.confidence === 'object') {
    const vals = Object.values(txn.confidence).filter((v) => typeof v === 'number');
    if (vals.length > 0) {
      avgConfidence = vals.reduce((a, b) => a + b, 0) / vals.length;
    }
  }

  return {
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
    source: 'gemini_vision',
  };
}
