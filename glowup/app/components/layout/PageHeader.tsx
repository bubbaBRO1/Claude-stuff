'use client';
import Link from 'next/link';
import { useTheme } from './ThemeProvider';

interface Props {
  title: string;
  subtitle?: string;
  backHref?: string;
  right?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, backHref, right }: Props) {
  const { theme, toggle } = useTheme();
  return (
    <header className="flex items-center gap-3 mb-6 pt-2">
      {backHref && (
        <Link
          href={backHref}
          className="p-2 rounded-xl text-lg"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          ←
        </Link>
      )}
      <div className="flex-1">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h1>
        {subtitle && <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>}
      </div>
      {right}
      <button
        onClick={toggle}
        className="p-2 rounded-xl text-lg ml-auto"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </header>
  );
}
