'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * ClientPortal — renders children directly into document.body
 * This guarantees that modals sit in the root stacking context,
 * escaping any parent CSS transforms or stacking contexts (e.g. .page-enter)
 * and placing them 100% ON TOP of bottom navigation bars and headers.
 */
export function ClientPortal({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(children, document.body);
}
