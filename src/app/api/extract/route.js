import { NextResponse } from 'next/server';
import { executeWithKeyRotation, getGeminiApiKeys } from '@/lib/ai/keyRotator';

const EXTRACTION_PROMPT = `You are a payment transaction extraction system for AllSpend.

Analyze the provided payment screenshot carefully.

The screenshot may come from any Indian UPI/payment application, including Google Pay, PhonePe, Paytm, BHIM, Navi, Super.money, bank applications, or an unknown payment application.

Do not assume a particular app or layout.

Understand the complete screenshot visually and extract the actual transaction information.

Most importantly, identify the PRIMARY TRANSACTION AMOUNT.

Do not simply select the first number or first currency value.

The screenshot may contain:
- Transaction amount
- Cashback
- Rewards
- Discount
- Date
- Time
- Phone number
- Account number
- UPI ID
- Transaction ID
- UTR
- Reference number
- Bank account suffix
- Other unrelated numbers

Determine what each number represents from the visual and textual context.

For example, if the screenshot contains:
Paid ₹500
Cashback ₹100
the transaction amount is ₹500 and cashback is ₹100.

If the screenshot contains:
Money Received
₹50
the transaction type is income.

If the screenshot contains:
Payment Failed
₹500
the transaction should be classified as failed, not as a successful expense.

Never invent information. If a field cannot be determined confidently, return null.

For the category field, use one of: Food, Shopping, Travel, Groceries, Rent, Investments, Health, EMI/Bill, Subscriptions, Entertainment, Education, Personal, Others
- Zomato, Swiggy → Food
- Blinkit, Zepto, BigBasket → Groceries
- Amazon, Flipkart, Myntra → Shopping
- Uber, Ola, Rapido, IRCTC → Travel
- Netflix, Spotify, YouTube Premium → Subscriptions
- If uncertain → Others

For date/time, normalize to: date: YYYY-MM-DD, time: HH:mm (24-hour)

Supported date formats from screenshots:
September 9 at 8:58 PM → 2026-09-09, 20:58
9 Sept 2026, 9:55 PM → 2026-09-09, 21:55
12 Jul 2026, 3:06 PM → 2026-07-12, 15:06
07:42 PM on 10 Sep 2026 → 2026-09-10, 19:42
08:48 PM, 16 Aug 2026 → 2026-08-16, 20:48

For paymentApp, identify from the screenshot's UI (logo, color scheme, typography):
- Google Pay (green/white, "GPay" branding)
- PhonePe (purple)
- Paytm (blue)
- BHIM (tricolor)
- Navi, Super.money
If not identifiable, return null.

Return ONLY valid JSON matching the schema below.
Do not return markdown.
Do not return explanations.
Do not return code fences.
Return raw JSON only.

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
