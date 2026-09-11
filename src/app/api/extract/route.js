import { NextResponse } from 'next/server';
import { executeWithKeyRotation, getGeminiApiKeys } from '@/lib/ai/keyRotator';

const RECEIPT_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    isPaymentScreenshot: { type: 'BOOLEAN' },
    transactionType: { type: 'STRING', enum: ['expense', 'income', 'refund', 'failed', 'pending'] },
    status: { type: 'STRING', enum: ['success', 'failed', 'pending', 'refunded'] },
    amount: { type: 'NUMBER', nullable: true },
    currency: { type: 'STRING' },
    merchant: { type: 'STRING', nullable: true },
    sender: { type: 'STRING', nullable: true },
    receiver: { type: 'STRING', nullable: true },
    date: { type: 'STRING', nullable: true },
    time: { type: 'STRING', nullable: true },
    paymentMethod: { type: 'STRING', nullable: true },
    paymentApp: { type: 'STRING', nullable: true },
    transactionId: { type: 'STRING', nullable: true },
    referenceId: { type: 'STRING', nullable: true },
    utr: { type: 'STRING', nullable: true },
    upiId: { type: 'STRING', nullable: true },
    bank: { type: 'STRING', nullable: true },
    cashback: { type: 'NUMBER', nullable: true },
    category: { type: 'STRING', nullable: true },
    confidence: {
      type: 'OBJECT',
      properties: {
        amount: { type: 'NUMBER' },
        merchant: { type: 'NUMBER' },
        date: { type: 'NUMBER' },
        time: { type: 'NUMBER' },
        transactionType: { type: 'NUMBER' },
      },
    },
  },
  required: ['isPaymentScreenshot', 'currency'],
};

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
Return valid JSON matching the exact schema requested.`;

/**
 * Safely parse JSON returned by Gemini Vision.
 * Handles markdown code blocks, control characters, trailing commas, and truncated strings/objects.
 */
function cleanAndParseJson(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty or invalid response from Gemini API');
  }

  // 1. Strip markdown code fences
  let text = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

  // 2. Find outer boundaries of JSON object
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.substring(firstBrace, lastBrace + 1);
  } else if (firstBrace !== -1) {
    text = text.substring(firstBrace);
  }

  // 3. Fast path: standard JSON parse
  try {
    return JSON.parse(text);
  } catch (e1) {
    console.warn('[AllSpend /api/extract] Direct JSON parse failed, attempting auto-repair...');
  }

  // 4. Sanitize control characters & trailing commas
  let cleaned = text
    .replace(/[\u0000-\u001F]+/g, (match) => (match === '\n' || match === '\r' ? ' ' : ''))
    .replace(/,\s*([}\]])/g, '$1');

  try {
    return JSON.parse(cleaned);
  } catch (e2) {
    // 5. Structural repair for truncated outputs (unterminated strings/objects)
    let repaired = cleaned;
    let inString = false;
    let escaped = false;
    let openBraces = 0;
    let openBrackets = 0;

    for (let i = 0; i < repaired.length; i++) {
      const ch = repaired[i];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
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

export async function POST(request) {
  try {
    const keys = getGeminiApiKeys();
    if (keys.length === 0) {
      return NextResponse.json(
        { error: 'No GEMINI_API_KEYS configured in .env.local', success: false },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { imageBase64, mimeType } = body;

    if (!imageBase64 || typeof imageBase64 !== 'string' || imageBase64.trim().length === 0) {
      return NextResponse.json(
        { error: 'imageBase64 is required', success: false },
        { status: 400 }
      );
    }

    const imageMimeType = mimeType || 'image/jpeg';

    const result = await executeWithKeyRotation(async (apiKey) => {
      // Use gemini-3.6-flash model as requested
      const models = [
        'gemini-3.6-flash',
      ];
      let lastErr = null;

      for (const model of models) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      inline_data: {
                        mime_type: imageMimeType,
                        data: imageBase64,
                      },
                    },
                    {
                      text: EXTRACTION_PROMPT,
                    },
                  ],
                },
              ],
              generationConfig: {
                response_mime_type: 'application/json',
                response_schema: RECEIPT_RESPONSE_SCHEMA,
                temperature: 0.1,
                maxOutputTokens: 1024,
              },
            }),
          });

          if (!res.ok) {
            const errorText = await res.text();
            let msg = `Gemini API error (${res.status})`;

            if (res.status === 404) {
              msg = `Gemini model (${model}) not found. Trying next model...`;
              const err = new Error(msg);
              err.status = 404;
              lastErr = err;
              continue;
            }

            if (
              errorText.includes('API key not valid') ||
              errorText.includes('INVALID_ARGUMENT') ||
              errorText.includes('API_KEY_INVALID') ||
              res.status === 401
            ) {
              msg = `Gemini API Key ("${apiKey.slice(0, 10)}...") invalid or unauthenticated (HTTP ${res.status}).`;
            }

            const err = new Error(msg);
            err.status = res.status;
            lastErr = err;
            throw err;
          }

          const json = await res.json();
          const contentText = json.candidates?.[0]?.content?.parts?.[0]?.text;

          if (!contentText) {
            throw new Error('Empty response from Gemini API');
          }

          // Parse and return the JSON safely with auto-repair
          const parsed = cleanAndParseJson(contentText);
          console.log('\n🤖 ==================== GEMINI VISION RESPONSE ====================');
          console.log(`🤖 Model Used: ${model}`);
          console.log(JSON.stringify(parsed, null, 2));
          console.log('===================================================================\n');
          return parsed;
        } catch (err) {
          console.warn(`[AllSpend /api/extract] Model ${model} failed (${err.message}). Trying next model...`);
          lastErr = err;
          if (err.status === 401 || err.message?.includes('unauthenticated') || err.message?.includes('API key not valid')) {
            throw err;
          }
          continue;
        }
      }

      throw lastErr || new Error('Failed to query Gemini Vision API models.');
    });

    return NextResponse.json({ success: true, transaction: result });
  } catch (err) {
    console.error('[AllSpend /api/extract Error]:', err.message);
    return NextResponse.json(
      { error: err.message, success: false },
      { status: err.status || 500 }
    );
  }
}
