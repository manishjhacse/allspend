'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { PWAInstallModal } from '@/components/ui/PWAInstall';

// ─── Icons ────────────────────────────────────────────────────────────────

function HomeIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      {!active && <polyline points="9 22 9 12 15 12 15 22" />}
    </svg>
  );
}

function AnalyticsIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  );
}

function ExpensesIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function SettingsIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

// ─── Nav Items ────────────────────────────────────────────────────────────

const navItems = [
  { href: '/', label: 'Home', Icon: HomeIcon },
  { href: '/reports', label: 'Reports', Icon: AnalyticsIcon },
  { href: '/expenses', label: 'History', Icon: ExpensesIcon },
  { href: '/settings', label: 'Settings', Icon: SettingsIcon },
];

// ─── Bottom Navigation ────────────────────────────────────────────────────

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="bottom-nav-bar lg:hidden">
      {/* First two nav items */}
      {navItems.slice(0, 2).map(({ href, label, Icon }) => {
        const active = pathname === href || (href !== '/' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1 py-2 px-4 flex-1 no-select"
            style={{ color: active ? '#F5F5F5' : '#555555' }}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
          >
            <Icon active={active} />
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 400 }}>{label}</span>
          </Link>
        );
      })}

      {/* Center FAB */}
      <div className="flex items-center justify-center px-2">
        <button
          id="nav-fab"
          className="fab"
          onClick={() => router.push('/import')}
          aria-label="Add expense from screenshot"
        >
          <PlusIcon />
        </button>
      </div>

      {/* Last two nav items */}
      {navItems.slice(2).map(({ href, label, Icon }) => {
        const active = pathname === href || (href !== '/' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1 py-2 px-4 flex-1 no-select"
            style={{ color: active ? '#F5F5F5' : '#555555' }}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
          >
            <Icon active={active} />
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 400 }}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

// ─── Desktop Side Nav ─────────────────────────────────────────────────────

export function SideNav() {
  const pathname = usePathname();
  const { isInstalled, triggerInstall, showIOSModal, setShowIOSModal, isIOS } = usePWAInstall();

  return (
    <nav
      className="hidden lg:flex flex-col w-56 min-h-screen shrink-0"
      style={{ background: '#0A0A0A', borderRight: '1px solid #1A1A1A' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6" style={{ borderBottom: '1px solid #1A1A1A' }}>
        <img
          src="/logo.png"
          alt="AllSpend Logo"
          style={{ width: 32, height: 32, objectFit: 'contain' }}
        />
        <span style={{ fontSize: 17, fontWeight: 700, color: '#F5F5F5', letterSpacing: '-0.3px' }}>AllSpend</span>
      </div>

      {/* Nav items */}
      <div className="flex flex-col gap-1 p-3 flex-1">
        {navItems.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
              style={{
                background: active ? '#151515' : 'transparent',
                color: active ? '#F5F5F5' : '#555555',
                fontWeight: active ? 600 : 400,
                fontSize: 14,
              }}
              aria-current={active ? 'page' : undefined}
            >
              <Icon active={active} />
              {label}
            </Link>
          );
        })}
      </div>

      {/* Import & Install buttons */}
      <div className="px-3 py-4 flex flex-col gap-2.5" style={{ borderTop: '1px solid #1A1A1A' }}>
        {!isInstalled && (
          <button
            onClick={triggerInstall}
            className="btn-secondary"
            style={{
              fontSize: 13,
              minHeight: 38,
              width: '100%',
              justifyContent: 'center',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderColor: 'rgba(0, 200, 83, 0.3)',
              color: '#00C853',
              background: 'rgba(0, 200, 83, 0.06)',
            }}
          >
            <DownloadIcon />
            Install App
          </button>
        )}
        <Link href="/import">
          <button className="btn-primary" style={{ fontSize: 13, minHeight: 42 }}>
            <PlusIcon />
            Add from Screenshot
          </button>
        </Link>
      </div>

      <PWAInstallModal
        isOpen={showIOSModal}
        onClose={() => setShowIOSModal(false)}
        isIOS={isIOS}
      />
    </nav>
  );
}
