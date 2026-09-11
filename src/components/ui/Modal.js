'use client';

import { useEffect } from 'react';
import { ClientPortal } from '@/components/ui/ClientPortal';

export function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <ClientPortal>
      <div
        className="overlay"
        style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 9999 }}
        onClick={onClose}
      >
        <div
          className="bottom-sheet scroll-area"
          style={{
            background: '#111111',
            borderRadius: '24px 24px 0 0',
            border: '1px solid #242424',
            borderBottom: 'none',
            width: '100%',
            maxWidth: 480,
            maxHeight: 'calc(88dvh - env(safe-area-inset-bottom, 0px))',
            overflowY: 'auto',
            paddingBottom: 'max(28px, calc(env(safe-area-inset-bottom) + 24px))',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {title && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 16px', borderBottom: '1px solid #1A1A1A' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#F5F5F5' }}>{title}</h2>
              <button
                onClick={onClose}
                style={{
                  width: 30, height: 30, borderRadius: '50%', background: '#1A1A1A',
                  border: '1px solid #242424', color: '#8A8A8A', fontSize: 16, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          )}
          <div style={{ padding: 20 }}>{children}</div>
        </div>
      </div>
    </ClientPortal>
  );
}

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', confirmDanger = false }) {
  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p style={{ color: '#8A8A8A', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>{message}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={onConfirm} className={confirmDanger ? 'btn-danger' : 'btn-primary'}>
          {confirmText}
        </button>
        <button onClick={onClose} className="btn-ghost">Cancel</button>
      </div>
    </Modal>
  );
}
