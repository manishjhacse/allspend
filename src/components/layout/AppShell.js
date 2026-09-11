'use client';

import { BottomNav, SideNav } from './Navigation';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { createContext, useContext } from 'react';

import { ErrorBoundary } from './ErrorBoundary';

const ToastContext = createContext(null);

export function useAppToast() {
  return useContext(ToastContext);
}

export function AppShell({ children }) {
  const { toasts, addToast, removeToast } = useToast();

  return (
    <ToastContext.Provider value={addToast}>
      <div className="flex min-h-dvh" style={{ background: '#050505' }}>
        {/* Desktop sidebar */}
        <SideNav />

        {/* Main content */}
        <main className="flex-1 flex flex-col min-w-0">
          <div
            className="flex-1 page-enter pb-safe"
            style={{
              maxWidth: 480,
              width: '100%',
              margin: '0 auto',
            }}
          >
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </main>

        {/* Mobile bottom nav (lg:hidden) */}
        <BottomNav />

        {/* Toasts */}
        <Toast toasts={toasts} onRemove={removeToast} />
      </div>
    </ToastContext.Provider>
  );
}
