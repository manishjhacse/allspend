import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: '#F8FAF9',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: '#17201C', marginBottom: 8 }}>Page not found</h2>
      <p style={{ fontSize: 14, color: '#66736D', marginBottom: 24 }}>
        The page you're looking for doesn't exist.
      </p>
      <Link href="/">
        <button
          style={{
            background: '#159A68',
            color: '#FFFFFF',
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 15,
            padding: '14px 24px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Go Home
        </button>
      </Link>
    </div>
  );
}
