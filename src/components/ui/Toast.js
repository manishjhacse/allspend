'use client';

export function Toast({ toasts, onRemove }) {
  if (!toasts.length) return null;
  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom) + 12px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        zIndex: 9999,
        padding: '0 16px',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="toast"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            borderRadius: 12,
            maxWidth: 380,
            width: '100%',
            pointerEvents: 'auto',
            cursor: 'pointer',
            background: toast.type === 'error'
              ? '#1A0808'
              : toast.type === 'warning'
              ? '#1A1300'
              : '#0F1F10',
            color: toast.type === 'error'
              ? '#FF4444'
              : toast.type === 'warning'
              ? '#F59E0B'
              : '#00C853',
            border: `1px solid ${toast.type === 'error' ? '#FF444430' : toast.type === 'warning' ? '#F59E0B30' : '#00C85330'}`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}
          onClick={() => onRemove(toast.id)}
        >
          <span style={{ fontSize: 14 }}>
            {toast.type === 'error' ? '⚠' : '✓'}
          </span>
          <span style={{ fontSize: 14, fontWeight: 500, flex: 1, color: '#F5F5F5' }}>{toast.message}</span>
          <span style={{ fontSize: 14, opacity: 0.4, color: '#F5F5F5' }}>✕</span>
        </div>
      ))}
    </div>
  );
}
