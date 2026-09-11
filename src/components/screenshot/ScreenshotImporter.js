'use client';

import { useState, useRef } from 'react';

function UploadIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#555555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" ry="3" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

export function ScreenshotImporter({ onImageSelected }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  function handleFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    onImageSelected(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
      {/* Drop zone */}
      <div
        id="screenshot-dropzone"
        style={{
          border: `2px dashed ${dragOver ? '#00C853' : '#242424'}`,
          background: dragOver ? 'rgba(0,200,83,0.05)' : '#0D0D0D',
          borderRadius: 16,
          minHeight: 200,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          padding: 24,
        }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        aria-label="Select payment screenshot"
      >
        <UploadIcon />
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#F5F5F5', marginBottom: 4 }}>
            Select payment screenshot
          </p>
          <p style={{ fontSize: 13, color: '#555555' }}>
            Tap to choose from your gallery
          </p>
        </div>
        <input
          ref={inputRef}
          id="screenshot-file-input"
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files?.[0])}
          aria-hidden="true"
        />
      </div>

      {/* Supported apps note */}
      <p style={{ fontSize: 12, color: '#555555', textAlign: 'center', lineHeight: 1.5 }}>
        Supports Google Pay · PhonePe · Paytm · BHIM<br />
        Navi · Super.money · Bank apps
      </p>

      <p style={{ fontSize: 11, color: '#3A3A3A', textAlign: 'center' }}>
        Your screenshot is sent to Gemini AI for analysis and never stored.
      </p>
    </div>
  );
}
