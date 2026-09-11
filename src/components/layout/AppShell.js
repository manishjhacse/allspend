'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { BottomNav, SideNav } from './Navigation';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { ErrorBoundary } from './ErrorBoundary';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { PWAInstallPopup } from '@/components/ui/PWAInstall';
import { initDB, settingsOps } from '@/lib/db';

const ToastContext = createContext(null);

export function useAppToast() {
  return useContext(ToastContext);
}

export function AppShell({ children }) {
  const { toasts, addToast, removeToast } = useToast();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function checkOnboarding() {
      try {
        await initDB();
        const completed = await settingsOps.get('onboardingCompleted', false);
        if (isMounted && !completed) {
          setShowOnboarding(true);
        }
      } catch (err) {
        console.error('[Onboarding check failed]:', err);
      } finally {
        if (isMounted) {
          setCheckingOnboarding(false);
        }
      }
    }
    checkOnboarding();
    return () => {
      isMounted = false;
    };
  }, []);

  function handleOnboardingComplete() {
    setShowOnboarding(false);
    addToast?.('Welcome to AllSpend!');
  }

  if (checkingOnboarding) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#050505',
          zIndex: 999999,
        }}
      />
    );
  }

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

        {/* Smart PWA Install Popup */}
        <PWAInstallPopup />

        {/* First time Onboarding Flow */}
        <OnboardingModal
          isOpen={showOnboarding}
          onComplete={handleOnboardingComplete}
        />

        {/* Toasts */}
        <Toast toasts={toasts} onRemove={removeToast} />
      </div>
    </ToastContext.Provider>
  );
}
