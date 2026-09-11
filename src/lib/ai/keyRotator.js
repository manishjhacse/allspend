/**
 * Key Rotator for Gemini API Keys
 * Handles comma-separated GEMINI_API_KEYS with round-robin load distribution
 * and automatic retry/failover on HTTP 429 rate limit errors.
 */

let currentIndex = 0;

/**
 * Get all available Gemini API keys from environment
 * @returns {string[]}
 */
export function getGeminiApiKeys() {
  const envKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
  return envKeys
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
}

/**
 * Get next key in round-robin sequence
 * @returns {string|null}
 */
export function getNextApiKey() {
  const keys = getGeminiApiKeys();
  if (keys.length === 0) return null;

  const key = keys[currentIndex % keys.length];
  currentIndex = (currentIndex + 1) % keys.length;
  return key;
}

/**
 * Execute an API call with automatic key rotation and failover on rate limits, invalid keys, or errors
 * @template T
 * @param {(apiKey: string) => Promise<T>} apiCallFn
 * @returns {Promise<T>}
 */
export async function executeWithKeyRotation(apiCallFn) {
  const keys = getGeminiApiKeys();

  if (keys.length === 0) {
    throw new Error('No GEMINI_API_KEYS configured in environment.');
  }

  let lastError = null;

  // Try each available key in sequence if any key fails
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const apiKey = getNextApiKey();
    try {
      return await apiCallFn(apiKey);
    } catch (err) {
      lastError = err;
      console.warn(
        `[AllSpend AI KeyRotator] Key attempt ${attempt + 1}/${keys.length} ("${apiKey.slice(0, 10)}...") failed: ${err.message}. Rotating to next key...`
      );
    }
  }

  throw lastError || new Error('All Gemini API keys exhausted.');
}
