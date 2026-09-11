'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppShell, useAppToast } from '@/components/layout/AppShell';
import { ScreenshotImporter } from '@/components/screenshot/ScreenshotImporter';
import { GeminiProcessor } from '@/components/screenshot/OCRProcessor';
import { ExpenseConfirmation } from '@/components/screenshot/ExpenseConfirmation';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { expenseOps, initDB } from '@/lib/db';
import { useCategories } from '@/hooks/useCategories';
import Link from 'next/link';

// Stages: 'select' | 'processing-share' | 'processing' | 'confirm' | 'manual' | 'error'

function ImportPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addToast = useAppToast();
  const { categories } = useCategories();

  const [stage, setStage] = useState('select');
  const [imageFile, setImageFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [duplicate, setDuplicate] = useState(null);
  const [error, setError] = useState(null);

  // Handle Web Share Target (POST redirect from Android or Service Worker)
  useEffect(() => {
    initDB();

    const isShared = searchParams?.get('shared') === '1';
    if (!isShared) return;

    setStage('processing-share');

    function processBase64ToImage(data, type, name) {
      const byteStr = atob(data);
      const arr = new Uint8Array(byteStr.length);
      for (let i = 0; i < byteStr.length; i++) arr[i] = byteStr.charCodeAt(i);
      const blob = new Blob([arr], { type: type || 'image/png' });
      const file = new File([blob], name || 'screenshot.png', { type: type || 'image/png' });
      setImageFile(file);
      setStage('processing');
    }

    // 1. Try reading from sessionStorage (populated by server route handler)
    try {
      const stored = sessionStorage.getItem('allspend_shared_image');
      if (stored) {
        sessionStorage.removeItem('allspend_shared_image');
        const { data, type, name } = JSON.parse(stored);
        if (data) {
          processBase64ToImage(data, type, name);
          return;
        }
      }
    } catch (e) {
      console.warn('[AllSpend] Could not read from sessionStorage:', e);
    }

    // 2. Try reading directly from window CacheStorage (bypasses SW message latency)
    async function checkDirectCache() {
      try {
        if ('caches' in window) {
          const cache = await caches.open('share-target-temp');
          const match = await cache.match('/share-data');
          if (match) {
            const text = await match.text();
            await cache.delete('/share-data');
            if (text) {
              const { data, type, name } = JSON.parse(text);
              if (data) {
                processBase64ToImage(data, type, name);
                return true;
              }
            }
          }
        }
      } catch (e) {
        console.warn('[AllSpend] Direct cache reading failed:', e);
      }
      return false;
    }

    // 3. Fallback: message Service Worker
    async function waitForSWAndFetch(retries = 8) {
      const foundInCache = await checkDirectCache();
      if (foundInCache) return;

      if (navigator.serviceWorker?.controller) return fetchFromSW();
      if (retries <= 0) { setStage('select'); return; }
      await new Promise((r) => setTimeout(r, 250));
      return waitForSWAndFetch(retries - 1);
    }

    async function fetchFromSW() {
      return new Promise((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = (e) => {
          const { shareData } = e.data;
          if (!shareData) { setStage('select'); resolve(); return; }
          try {
            const { data, type, name } = JSON.parse(shareData);
            processBase64ToImage(data, type, name);
          } catch (err) {
            console.error('[AllSpend] Failed to restore shared file:', err);
            setStage('select');
          }
          resolve();
        };

        navigator.serviceWorker.controller.postMessage({ type: 'GET_SHARE_DATA' }, [channel.port2]);
        setTimeout(() => { setStage('select'); resolve(); }, 4000);
      });
    }

    waitForSWAndFetch();
  }, [searchParams]);

  function handleImageSelected(file) {
    setImageFile(file);
    setStage('processing');
    setError(null);
    setParsedData(null);
    setDuplicate(null);
  }

  async function handleGeminiComplete(parsed) {
    setParsedData(parsed);

    // Check for duplicates using flat data
    const dupCheck = await expenseOps.checkDuplicate({
      amount: parsed.amount,
      merchant: parsed.merchant,
      date: parsed.date,
      transactionId: parsed.transactionId,
    });
    setDuplicate(dupCheck);
    setStage('confirm');
  }

  function handleGeminiError(msg) {
    setError(msg || 'Could not analyze the screenshot.');
    setStage('error');
  }

  const isShared = searchParams?.get('shared') === '1';

  function handleCloseShared() {
    try {
      window.close();
    } catch (e) {}
    setTimeout(() => {
      router.replace('/');
    }, 100);
  }

  async function handleSave(expense) {
    try {
      await expenseOps.add(expense);
      if (isShared) {
        setStage('saved');
        setTimeout(() => {
          handleCloseShared();
        }, 700);
      } else {
        addToast?.('Expense saved ✓');
        router.push('/');
      }
    } catch (err) {
      addToast?.('Failed to save expense', 'error');
    }
  }

  function handleRetry() {
    setImageFile(null);
    setParsedData(null);
    setDuplicate(null);
    setError(null);
    setStage('select');
  }

  // ─── Render: Shared Popup Flow (Floating over Payment App) ────────────────
  if (isShared) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Stage: processing-share */}
          {stage === 'processing-share' && (
            <div
              className="card-elevated"
              style={{
                padding: '36px 24px',
                borderRadius: 24,
                textAlign: 'center',
                background: '#111111',
                border: '1px solid #242424',
              }}
            >
              <div
                className="spin"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  border: '3px solid #1A1A1A',
                  borderTopColor: '#00C853',
                  margin: '0 auto 16px',
                }}
              />
              <p style={{ fontSize: 17, fontWeight: 700, color: '#F5F5F5', marginBottom: 4 }}>
                Receiving receipt…
              </p>
              <p style={{ fontSize: 13, color: '#555555' }}>Extracting payment from screenshot</p>
            </div>
          )}

          {/* Stage: processing */}
          {stage === 'processing' && imageFile && (
            <GeminiProcessor
              imageFile={imageFile}
              onComplete={handleGeminiComplete}
              onError={handleGeminiError}
              onCancel={handleCloseShared}
            />
          )}

          {/* Stage: confirm */}
          {stage === 'confirm' && parsedData && (
            <ExpenseConfirmation
              parsed={parsedData}
              categories={categories}
              onSave={handleSave}
              onManual={() => setStage('manual')}
              onCancel={handleCloseShared}
              duplicate={duplicate}
            />
          )}

          {/* Stage: saved */}
          {stage === 'saved' && (
            <div
              className="card-elevated"
              style={{
                padding: '36px 24px',
                borderRadius: 24,
                textAlign: 'center',
                background: '#111111',
                border: '1px solid rgba(0, 200, 83, 0.3)',
                animation: 'modal-in 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'rgba(0, 200, 83, 0.15)',
                  border: '1px solid rgba(0, 200, 83, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                  color: '#00C853',
                  boxShadow: '0 0 24px rgba(0, 200, 83, 0.2)',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#F5F5F5', marginBottom: 4 }}>
                Expense Saved!
              </h3>
              <p style={{ fontSize: 13, color: '#8A8A8A' }}>Closing window…</p>
            </div>
          )}

          {/* Stage: error */}
          {stage === 'error' && (
            <div
              className="card-elevated"
              style={{
                padding: '32px 24px',
                borderRadius: 24,
                textAlign: 'center',
                background: '#111111',
                border: '1px solid #242424',
              }}
            >
              <div style={{ fontSize: 44, marginBottom: 12 }}>⚠️</div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#F5F5F5', marginBottom: 6 }}>
                Couldn't analyze screenshot
              </h2>
              <p style={{ fontSize: 13, color: '#8A8A8A', marginBottom: 20, lineHeight: 1.5 }}>
                {error || 'The screenshot could not be parsed confidently.'}
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleCloseShared} className="btn-secondary" style={{ flex: 1, minHeight: 44, fontSize: 13 }}>
                  Close
                </button>
                <button onClick={() => setStage('manual')} className="btn-primary" style={{ flex: 1, minHeight: 44, fontSize: 13 }}>
                  Add Manually
                </button>
              </div>
            </div>
          )}

          {/* Stage: manual */}
          {stage === 'manual' && (
            <div
              className="card-elevated"
              style={{
                padding: '24px 20px',
                borderRadius: 24,
                background: '#111111',
                border: '1px solid #242424',
                maxHeight: '85dvh',
                overflowY: 'auto',
              }}
            >
              <p style={{ fontSize: 14, fontWeight: 700, color: '#F5F5F5', marginBottom: 16 }}>Add Expense Manually</p>
              <ExpenseForm
                categories={categories}
                onSubmit={handleSave}
                onCancel={handleCloseShared}
                submitLabel="Save Expense"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Render: Standard App Import Page ─────────────────────────────────────
  return (
    <AppShell>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '52px 20px 16px' }}>
        <Link href="/" aria-label="Back">
          <button
            style={{
              width: 34, height: 34, borderRadius: '50%', background: '#151515',
              border: '1px solid #242424', color: '#8A8A8A', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}
            aria-label="Back"
          >
            ←
          </button>
        </Link>
        <h1 style={{ fontSize: 17, fontWeight: 700, color: '#F5F5F5', letterSpacing: '-0.2px' }}>
          {stage === 'manual' ? 'Add Manually' : 'Add Expense'}
        </h1>
      </div>

      <div style={{ padding: '0 20px 100px' }}>
        {/* Stage: select */}
        {(stage === 'select' || stage === 'processing') && (
          <div>
            <ScreenshotImporter onImageSelected={handleImageSelected} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
              <div style={{ flex: 1, height: 1, background: '#1A1A1A' }} />
              <span style={{ fontSize: 12, color: '#555555' }}>or</span>
              <div style={{ flex: 1, height: 1, background: '#1A1A1A' }} />
            </div>

            <button
              id="manual-add-btn"
              onClick={() => setStage('manual')}
              className="btn-secondary"
              style={{ fontSize: 14 }}
            >
              + Add Manually
            </button>
          </div>
        )}

        {/* Stage: processing (Gemini Vision overlay) */}
        {stage === 'processing' && imageFile && (
          <GeminiProcessor
            imageFile={imageFile}
            onComplete={handleGeminiComplete}
            onError={handleGeminiError}
            onCancel={handleRetry}
          />
        )}

        {/* Stage: confirm (overlay modal) */}
        {stage === 'confirm' && parsedData && (
          <ExpenseConfirmation
            parsed={parsedData}
            categories={categories}
            onSave={handleSave}
            onManual={() => setStage('manual')}
            onCancel={handleRetry}
            duplicate={duplicate}
          />
        )}

        {/* Stage: manual */}
        {stage === 'manual' && (
          <div className="card-elevated" style={{ padding: '20px', borderRadius: 16 }}>
            <p style={{ fontSize: 13, color: '#555555', marginBottom: 16 }}>Enter transaction details manually</p>
            <ExpenseForm
              categories={categories}
              onSubmit={handleSave}
              onCancel={() => setStage('select')}
              submitLabel="Add Expense"
            />
          </div>
        )}

        {/* Stage: error */}
        {stage === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 40 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>
                {error === 'OFFLINE_ERROR' ? '📡' : error === 'ALLSPEND_QUOTA_EXHAUSTED' ? '⏳' : '⚠️'}
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#F5F5F5', marginBottom: 8 }}>
                {error === 'OFFLINE_ERROR'
                  ? "You're offline"
                  : error === 'ALLSPEND_QUOTA_EXHAUSTED'
                  ? 'Screenshot processing unavailable'
                  : "Couldn't analyze this screenshot"}
              </h2>
              <p style={{ fontSize: 13, color: '#8A8A8A', lineHeight: 1.6, maxWidth: 360, margin: '0 auto' }}>
                {error === 'OFFLINE_ERROR'
                  ? 'Screenshot processing requires internet access. You can still add this transaction manually.'
                  : error === 'ALLSPEND_QUOTA_EXHAUSTED'
                  ? "Your connected Gemini keys can't process this screenshot right now, and your 3 AllSpend backup reads for today have been used."
                  : error || 'The screenshot could not be parsed confidently.'}
              </p>
            </div>

            <button id="manual-fallback-btn" onClick={() => setStage('manual')} className="btn-primary" style={{ fontSize: 14 }}>
              + Add Expense Manually
            </button>

            {error === 'ALLSPEND_QUOTA_EXHAUSTED' ? (
              <button onClick={() => router.push('/settings')} className="btn-secondary" style={{ fontSize: 14 }}>
                Configure My Gemini Keys
              </button>
            ) : (
              <button id="retry-btn" onClick={handleRetry} className="btn-secondary" style={{ fontSize: 14 }}>
                Try Another Screenshot
              </button>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function ImportPage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', background: '#050505' }}>
          <div
            className="spin"
            style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #1A1A1A', borderTopColor: '#00C853' }}
          />
        </div>
      }
    >
      <ImportPageInner />
    </Suspense>
  );
}
