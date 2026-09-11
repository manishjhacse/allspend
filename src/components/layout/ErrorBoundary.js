'use client';

import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[AllSpend Uncaught UI Error]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100dvh',
            background: '#050505',
            color: '#F5F5F5',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(255, 68, 68, 0.1)',
              border: '1px solid rgba(255, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              marginBottom: 16,
            }}
          >
            ⚠️
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.3px' }}>
            Something went wrong
          </h2>

          <p style={{ fontSize: 13, color: '#8A8A8A', maxWidth: 320, lineHeight: 1.5, marginBottom: 24 }}>
            {this.state.error?.message || 'An unexpected error occurred in this view.'}
          </p>

          <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 280 }}>
            <button
              onClick={this.handleReset}
              style={{
                flex: 1,
                minHeight: 46,
                borderRadius: 12,
                background: '#00C853',
                color: '#000',
                border: 'none',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>

            <button
              onClick={() => {
                this.handleReset();
                window.location.href = '/';
              }}
              style={{
                flex: 1,
                minHeight: 46,
                borderRadius: 12,
                background: '#151515',
                color: '#F5F5F5',
                border: '1px solid #242424',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Go Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
