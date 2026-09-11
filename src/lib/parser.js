/**
 * Parser — delegates to Gemini Vision extraction pipeline.
 * Returns a flat object (not wrapped in { value, confidence }).
 */

import { extractPaymentFromScreenshot } from './ocr/index.js';

export { extractPaymentFromScreenshot };

export function normalizeMerchant(name) {
  if (!name) return '';
  return name.trim();
}
