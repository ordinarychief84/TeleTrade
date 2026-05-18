'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const LINKS = [
  { label: 'Product', href: '#solution' },
  { label: 'Use cases', href: '#use-cases' },
  { label: 'Reporting', href: '#reporting' },
  { label: 'Integrations', href: '#integrations' },
  { label: 'Customers', href: '#customers' },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-colors',
        scrolled ? 'bg-[#080d1c]/80 backdrop-blur-md border-b border-slate-900/50' : 'bg-transparent'
      )}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Wordmark />
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm text-slate-300">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-white transition">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden sm:inline-flex text-sm text-slate-300 hover:text-white px-3 py-2"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 rounded-md bg-white text-slate-900 px-3.5 py-2 text-sm font-medium hover:bg-slate-100 transition"
          >
            Start workspace
          </Link>
        </div>
      </div>
    </header>
  );
}

function Wordmark() {
  return (
    <span className="inline-flex items-center gap-2 text-white">
      <span
        aria-hidden
        className="relative h-6 w-6 rounded-md bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-[10px] font-bold text-emerald-950"
      >
        T
        <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-white border border-emerald-700" />
      </span>
      <span className="font-semibold tracking-tight text-[15px]">TeleTrade</span>
    </span>
  );
}
