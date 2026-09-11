/**
 * AllSpend Payment Extraction Engine — Gemini Vision Architecture
 *
 * Flow:
 *   Screenshot (File/Blob)
 *     → Read as ArrayBuffer
 *     → Convert to Base64
 *     → Send to /api/extract (server-side Gemini Vision)
 *     → Validate structured JSON
 *     → Return transaction object
 *
 * NO local OCR.
 * NO Tesseract.
 * NO local text parsing.
 * NO regex-based extraction.
 */

import { extractWithGeminiVision } from './ai/geminiExtractor.js';
import { validateTransaction } from './validation/validator.js';

/**
 * Convert a File or Blob to base64-encoded string
 * @param {File|Blob} file
 * @returns {Promise<{ base64: string, mimeType: string }>}
 */
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // reader.result is a data URL: "data:image/png;base64,XXXX..."
      const dataUrl = reader.result;
      const base64 = dataUrl.split(',')[1]; // strip the prefix
      resolve({ base64, mimeType: file.type || 'image/jpeg' });
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Extract payment transaction from screenshot using Gemini Vision
 * @param {File|Blob} imageFile
 * @param {(progress: number) => void} [onProgress]
 * @returns {Promise<Object>}
 */
export async function extractPaymentFromScreenshot(imageFile, onProgress) {
  if (!imageFile) {
    throw new Error('No image file provided.');
  }

  // Step 1: Read image file and encode to base64
  if (onProgress) onProgress(10);
  const { base64, mimeType } = await fileToBase64(imageFile);

  // Step 2: Send to Gemini Vision via /api/extract
  if (onProgress) onProgress(25);
  const geminiResult = await extractWithGeminiVision(base64, mimeType);

  // Step 3: Validate schema
  if (onProgress) onProgress(90);
  const validated = validateTransaction(geminiResult);

  if (onProgress) onProgress(100);
  return validated;
}
