'use client';

import { useState, useEffect } from 'react';
import { extractPaymentFromScreenshot } from '@/lib/ocr/index';

import { ClientPortal } from '@/components/ui/ClientPortal';

const CATEGORIES = [
  { name: 'Food', dot: '#FF5C5C' },
  { name: 'Shopping', dot: '#5B8EFF' },
  { name: 'Travel', dot: '#FF9F40' },
  { name: 'Groceries', dot: '#00C853' },
  { name: 'Rent', dot: '#F59E0B' },
  { name: 'Investments', dot: '#A78BFA' },
  { name: 'Health', dot: '#EC4899' },
  { name: 'EMI/Bill', dot: '#8A8A8A' },
  { name: 'Subscriptions', dot: '#06B6D4' },
  { name: 'Others', dot: '#555555' },
];

/**
 * GeminiProcessor — replaces OCRProcessor
 * Sends image directly to Gemini Vision and shows the "Reading your receipt…" UI.
 */
export function GeminiProcessor({ imageFile, onComplete, onError, onCancel }) {
  const [stage, setStage] = useState('analyzing'); // analyzing | done | error
  const [statusText, setStatusText] = useState('Sending to Gemini…');

  useEffect(() => {
    if (!imageFile) return;
    let cancelled = false;

    async function process() {
      try {
        setStage('analyzing');
        setStatusText('Reading your receipt…');

        const result = await extractPaymentFromScreenshot(imageFile, (progress) => {
          if (cancelled) return;
          if (progress < 30) setStatusText('Reading your receipt…');
          else if (progress < 80) setStatusText('Analyzing payment details…');
          else setStatusText('Almost done…');
        });

        if (cancelled) return;
        setStage('done');
        setTimeout(() => {
          if (!cancelled) onComplete(result);
        }, 300);
      } catch (err) {
        if (!cancelled) {
          setStage('error');
          onError?.(err.message);
        }
      }
    }

    process();
    return () => { cancelled = true; };
  }, [imageFile]);

  return (
    <ClientPortal>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
        }}
      >
      <div
        className="modal-inner scroll-area"
        style={{
          position: 'relative',
          background: '#111111',
          borderRadius: '24px 24px 0 0',
          width: '100%',
          maxWidth: 480,
          maxHeight: 'calc(85dvh - env(safe-area-inset-bottom, 0px))',
          overflowY: 'auto',
          padding: '28px 20px max(28px, calc(env(safe-area-inset-bottom) + 24px))',
          border: '1px solid #242424',
          borderBottom: 'none',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.8)',
        }}
      >
        {/* Red Cancel Button */}
        {onCancel && (
          <button
            onClick={onCancel}
            aria-label="Cancel analysis"
            style={{
              position: 'absolute',
              top: 14,
              right: 16,
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'rgba(255, 68, 68, 0.15)',
              border: '1px solid rgba(255, 68, 68, 0.4)',
              color: '#FF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              zIndex: 10,
            }}
          >
            ✕
          </button>
        )}

        {/* Spinner */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div
            className="spin"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: '3px solid #1A1A1A',
              borderTopColor: '#00C853',
            }}
          />
        </div>

        {/* Status text */}
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F5F5F5', textAlign: 'center', marginBottom: 4, letterSpacing: '-0.3px' }}>
          {statusText}
        </h2>
        <p style={{ fontSize: 13, color: '#555555', textAlign: 'center', marginBottom: 20 }}>
          AllSpend is extracting the amount and merchant.
        </p>

        {/* Category pills (decorative — shows the model knows categories) */}
        <p style={{ fontSize: 10, color: '#555555', textAlign: 'center', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>
          Tap to set a category
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
          {CATEGORIES.map((cat) => (
            <div
              key={cat.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 11px',
                borderRadius: 100,
                border: '1.5px solid #242424',
                fontSize: 12,
                fontWeight: 500,
                color: '#8A8A8A',
                opacity: 0.7,
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: cat.dot, display: 'inline-block', flexShrink: 0 }} />
              {cat.name}
            </div>
          ))}
        </div>
      </div>
    </div>
    </ClientPortal>
  );
}
