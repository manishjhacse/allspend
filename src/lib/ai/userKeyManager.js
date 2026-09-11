import { userKeyOps } from '@/lib/db';

/**
 * Mask an API key string for safe display in UI.
 * e.g. "AIzaSyD-7k9p8x4q2m" -> "••••••••4q2m"
 */
export function maskKey(keyStr) {
  if (!keyStr || typeof keyStr !== 'string') return '••••••••';
  const clean = keyStr.trim();
  if (clean.length <= 4) return '••••' + clean;
  return '••••••••' + clean.slice(-4);
}

/**
 * Test a user-provided Gemini API key with a safe minimal prompt.
 * Does NOT consume AllSpend server fallback quota.
 * @param {string} rawKey
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function testUserKey(rawKey) {
  const cleanKey = rawKey?.trim();
  if (!cleanKey) return { ok: false, error: 'Key cannot be empty.' };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${cleanKey}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: 'Respond with OK' }],
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      if (res.status === 400 || res.status === 401 || res.status === 403 || errText.includes('API_KEY_INVALID')) {
        return { ok: false, error: 'Invalid API key or key lacks Gemini permissions.' };
      }
      if (res.status === 429) {
        return { ok: false, error: 'Quota or rate limit reached for this key.' };
      }
      return { ok: false, error: `Gemini returned HTTP ${res.status}` };
    }

    const json = await res.json();
    if (json.candidates?.[0]?.content?.parts?.[0]?.text) {
      return { ok: true };
    }

    return { ok: false, error: 'Unexpected response from Gemini API.' };
  } catch (err) {
    if (err.name === 'TypeError' || err.message?.includes('fetch')) {
      return { ok: false, error: 'Network error. Please check your internet connection.' };
    }
    return { ok: false, error: err.message || 'Key verification failed.' };
  }
}

/**
 * Attempt to process screenshot using the user's locally stored Gemini API keys.
 * Tries each enabled, non-cooldown key sequentially.
 * @param {string} imageBase64
 * @param {string} imageMimeType
 * @param {string} promptText
 * @returns {Promise<{ success: boolean, text?: string, keyId?: string, errorType?: 'NO_KEYS' | 'ALL_KEYS_FAILED' | 'OFFLINE' }>}
 */
export async function executeWithUserKeys(imageBase64, imageMimeType, promptText) {
  if (typeof window !== 'undefined' && navigator.onLine === false) {
    return { success: false, errorType: 'OFFLINE' };
  }

  const keys = await userKeyOps.getAllKeys();
  const enabledKeys = keys.filter((k) => k.enabled && k.key?.trim());

  if (enabledKeys.length === 0) {
    return { success: false, errorType: 'NO_KEYS' };
  }

  const now = Date.now();
  const usableKeys = enabledKeys.filter((k) => {
    if (k.status === 'invalid') return false;
    if (k.status === 'temporarily_unavailable' && k.cooldownUntil) {
      return new Date(k.cooldownUntil).getTime() <= now;
    }
    return true;
  });

  if (usableKeys.length === 0) {
    return { success: false, errorType: 'ALL_KEYS_FAILED' };
  }

  const models = ['gemini-3.6-flash'];

  for (const keyObj of usableKeys) {
    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${keyObj.key.trim()}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { inline_data: { mime_type: imageMimeType || 'image/jpeg', data: imageBase64 } },
                  { text: promptText },
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
          const errText = await res.text();

          if (res.status === 429 || errText.includes('RESOURCE_EXHAUSTED')) {
            console.warn(`[AllSpend UserKey] Key ${maskKey(keyObj.key)} hit 429 quota limit.`);
            await userKeyOps.updateKeyStatus(
              keyObj.id,
              'temporarily_unavailable',
              new Date(now + 15 * 60 * 1000)
            );
            break;
          }

          if (res.status === 400 || res.status === 401 || res.status === 403 || errText.includes('API_KEY_INVALID')) {
            console.warn(`[AllSpend UserKey] Key ${maskKey(keyObj.key)} is invalid.`);
            await userKeyOps.updateKeyStatus(keyObj.id, 'invalid');
            break;
          }

          if (res.status === 404) {
            continue;
          }

          break;
        }

        const json = await res.json();
        const contentText = json.candidates?.[0]?.content?.parts?.[0]?.text;

        if (contentText) {
          await userKeyOps.updateKeyStatus(keyObj.id, 'active');
          return {
            success: true,
            text: contentText,
            keyId: keyObj.id,
          };
        }
      } catch (err) {
        if (typeof window !== 'undefined' && navigator.onLine === false) {
          return { success: false, errorType: 'OFFLINE' };
        }
        console.warn(`[AllSpend UserKey] Key ${maskKey(keyObj.key)} fetch error:`, err.message);
        break;
      }
    }
  }

  return { success: false, errorType: 'ALL_KEYS_FAILED' };
}
