'use client';

import { useState, useEffect } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { ClientPortal } from './ClientPortal';

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00C853" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3" />
    </svg>
  );
}

export function PWAInstallModal({ isOpen, onClose, isIOS }) {
  if (!isOpen) return null;

  return (
    <ClientPortal>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#0F0F0F',
            border: '1px solid #222222',
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 380,
            textAlign: 'center',
            animation: 'modal-in 0.2s cubic-bezier(0.32, 0.72, 0, 1)',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'rgba(0, 200, 83, 0.12)',
              border: '1px solid rgba(0, 200, 83, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              color: '#00C853',
            }}
          >
            <DownloadIcon />
          </div>

          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#F5F5F5', marginBottom: 8 }}>
            Install AllSpend App
          </h3>

          <p style={{ fontSize: 13, color: '#8A8A8A', lineHeight: 1.5, marginBottom: 20 }}>
            {isIOS
              ? 'To install on iOS: tap the Share button at the bottom of Safari, then select "Add to Home Screen".'
              : 'Tap your browser menu (⋮ or Share icon) and select "Add to Home Screen" or "Install App".'}
          </p>

          <button
            onClick={onClose}
            className="btn-primary"
            style={{ minHeight: 42, fontSize: 14 }}
          >
            Got it
          </button>
        </div>
      </div>
    </ClientPortal>
  );
}

export function PWAInstallBanner() {
  const { isInstalled, triggerInstall, showIOSModal, setShowIOSModal, isIOS } = usePWAInstall();

  if (isInstalled) return null;

  return (
    <>
      <div
        style={{
          background: 'linear-gradient(135deg, #0F1F15 0%, #0A0A0A 100%)',
          border: '1px solid rgba(0, 200, 83, 0.2)',
          borderRadius: 16,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(0, 200, 83, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <PhoneIcon />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#F5F5F5', margin: 0 }}>
              Install AllSpend App
            </p>
            <p style={{ fontSize: 11, color: '#8A8A8A', margin: 0 }}>
              Quick access & works offline
            </p>
          </div>
        </div>

        <button
          onClick={triggerInstall}
          className="btn-primary"
          style={{
            minHeight: 34,
            padding: '0 14px',
            fontSize: 12,
            fontWeight: 600,
            width: 'auto',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexShrink: 0,
          }}
        >
          <DownloadIcon />
          Install
        </button>
      </div>

      <PWAInstallModal
        isOpen={showIOSModal}
        onClose={() => setShowIOSModal(false)}
        isIOS={isIOS}
      />
    </>
  );
}

export function PWAInstallRow() {
  const { isInstalled, triggerInstall, showIOSModal, setShowIOSModal, isIOS } = usePWAInstall();

  if (isInstalled) return null;

  return (
    <>
      <button
        className="settings-row"
        onClick={triggerInstall}
        style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}
      >
        <div className="settings-icon">
          <DownloadIcon />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: '#00C853' }}>Install AllSpend App</p>
          <p style={{ fontSize: 12, color: '#555555', marginTop: 1 }}>
            Add to home screen for instant access
          </p>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3A3A3A" strokeWidth="2" strokeLinecap="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      <PWAInstallModal
        isOpen={showIOSModal}
        onClose={() => setShowIOSModal(false)}
        isIOS={isIOS}
      />
    </>
  );
}

export function PWAInstallPopup() {
  const { isInstalled, triggerInstall, showIOSModal, setShowIOSModal, isIOS } = usePWAInstall();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isInstalled) {
      setVisible(false);
      return;
    }

    const dismissedUntil = localStorage.getItem('pwaPromptDismissedUntil');
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
      setVisible(false);
      return;
    }

    const timer = setTimeout(() => {
      setVisible(true);
    }, 1200);

    return () => clearTimeout(timer);
  }, [isInstalled]);

  const handleDismiss = () => {
    const nextTime = Date.now() + 24 * 60 * 60 * 1000; // 24 hours suppression
    localStorage.setItem('pwaPromptDismissedUntil', String(nextTime));
    setVisible(false);
  };

  const handleInstallClick = async () => {
    await triggerInstall();
  };

  if (!visible || isInstalled) return null;

  return (
    <>
      <ClientPortal>
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 99998,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              background: '#0F0F0F',
              border: '1px solid #222222',
              borderRadius: 24,
              padding: '28px 24px',
              width: '100%',
              maxWidth: 420,
              boxShadow: '0 24px 64px rgba(0,0,0,0.85)',
              position: 'relative',
              animation: 'modal-in 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
            }}
          >
            {/* Top Icon Badge */}
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'rgba(0, 200, 83, 0.1)',
                border: '1px solid rgba(0, 200, 83, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                color: '#00C853',
                boxShadow: '0 0 24px rgba(0, 200, 83, 0.2)',
              }}
            >
              <DownloadIcon />
            </div>

            {/* Header */}
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#F5F5F5', textAlign: 'center', letterSpacing: '-0.4px', marginBottom: 4 }}>
              Install AllSpend App
            </h2>
            <p style={{ fontSize: 13, color: '#8A8A8A', textAlign: 'center', marginBottom: 20 }}>
              Get the complete experience on your mobile & desktop
            </p>

            {/* Feature Bullets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24, background: '#141414', border: '1px solid #202020', borderRadius: 16, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ color: '#00C853', fontSize: 14, fontWeight: 700, marginTop: 1 }}>✓</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#F5F5F5', margin: 0 }}>Direct Screenshot Sharing</p>
                  <p style={{ fontSize: 11, color: '#777777', margin: 0, lineHeight: 1.4 }}>Share GPay, PhonePe or Paytm payment receipts directly from gallery</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ color: '#00C853', fontSize: 14, fontWeight: 700, marginTop: 1 }}>✓</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#F5F5F5', margin: 0 }}>Instant Offline Access</p>
                  <p style={{ fontSize: 11, color: '#777777', margin: 0, lineHeight: 1.4 }}>Fast launch & zero loading delay anytime, anywhere</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ color: '#00C853', fontSize: 14, fontWeight: 700, marginTop: 1 }}>✓</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#F5F5F5', margin: 0 }}>AI Vision Receipt Scan</p>
                  <p style={{ fontSize: 11, color: '#777777', margin: 0, lineHeight: 1.4 }}>Auto-extract merchant, category, & total amount in seconds</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ color: '#00C853', fontSize: 14, fontWeight: 700, marginTop: 1 }}>✓</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#F5F5F5', margin: 0 }}>100% Private & Secure</p>
                  <p style={{ fontSize: 11, color: '#777777', margin: 0, lineHeight: 1.4 }}>All your financial data remains strictly on your device</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={handleInstallClick}
                className="btn-primary"
                style={{ minHeight: 46, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <DownloadIcon />
                Install App
              </button>
              <button
                onClick={handleDismiss}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#666666',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  padding: '8px',
                  textAlign: 'center',
                }}
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </ClientPortal>

      <PWAInstallModal
        isOpen={showIOSModal}
        onClose={() => setShowIOSModal(false)}
        isIOS={isIOS}
      />
    </>
  );
}
