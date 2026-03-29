'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/', icon: '🏠', label: 'Home' },
  { href: '/scan', icon: '📷', label: 'Scan' },
  { href: '/routine', icon: '☀️', label: 'Routine' },
  { href: '/confidence', icon: '💪', label: 'Grow' },
  { href: '/shop', icon: '🛍️', label: 'Shop' },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around"
      style={{
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingTop: '0.5rem',
        paddingLeft: '0.5rem',
        paddingRight: '0.5rem',
      }}
    >
      {NAV.map((n) => {
        const active = n.href === '/' ? path === '/' : path.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all"
            style={{
              color: active ? 'var(--accent)' : 'var(--text-muted)',
              background: active ? 'var(--bg-card)' : 'transparent',
              minWidth: 56,
            }}
          >
            <span className="text-xl">{n.icon}</span>
            <span className="text-[10px] font-medium">{n.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
