'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('App Error:', error);
  }, [error]);

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
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: '#17201C', marginBottom: 8 }}>
        Something went wrong
      </h2>
      <p style={{ fontSize: 14, color: '#66736D', marginBottom: 24, maxWidth: 320 }}>
        An unexpected error occurred. Your data is safe in local storage.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 280 }}>
        <button
          onClick={reset}
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
          Try Again
        </button>
        <Link href="/">
          <button
            style={{
              background: 'transparent',
              color: '#159A68',
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 15,
              padding: '14px 24px',
              border: '1.5px solid #E3E9E6',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Go Home
          </button>
        </Link>
      </div>
    </div>
  );
}
