'use client';

import Link from 'next/link';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Telesales operations', href: '#solution' },
      { label: 'Route intelligence', href: '#solution' },
      { label: 'Revenue recovery', href: '#solution' },
      { label: 'Reporting', href: '#reporting' },
      { label: 'Integrations', href: '#integrations' },
    ],
  },
  {
    title: 'Solutions',
    links: [
      { label: 'NPI launches', href: '#use-cases' },
      { label: 'Dormant reactivation', href: '#use-cases' },
      { label: 'Promo push', href: '#use-cases' },
      { label: 'Credit collection', href: '#use-cases' },
      { label: 'After-sales ops', href: '#use-cases' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Press kit', href: '#' },
      { label: 'Contact', href: 'mailto:sales@teletrade.app' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Security', href: '#integrations' },
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
      { label: 'DPA', href: '#' },
      { label: 'Status', href: '#' },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="bg-[#040814] text-slate-400">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10">
          <div className="col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 text-white">
              <span
                aria-hidden
                className="relative h-7 w-7 rounded-md bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-[11px] font-bold text-emerald-950"
              >
                T
                <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-white border border-emerald-700" />
              </span>
              <span className="font-semibold tracking-tight text-base">TeleTrade</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed max-w-xs">
              The telesales operating system for FMCG distribution, route-based sales, and traditional trade.
            </p>
            <div className="mt-6 text-[11px]">
              <div className="font-mono uppercase tracking-[0.18em] text-slate-500">Built for</div>
              <div className="mt-2 text-slate-300">
                Africa-first distribution networks · Multi-country deployments · Audit-grade compliance
              </div>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-slate-500">
                {col.title}
              </div>
              <ul className="mt-4 space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-sm text-slate-300 hover:text-white transition">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 pt-6 border-t border-slate-900 flex flex-wrap items-center justify-between gap-4 text-[12px] text-slate-500">
          <div>© {new Date().getFullYear()} TeleTrade. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <span>SOC 2 Type II — in progress</span>
            <span className="h-3 w-px bg-slate-800" />
            <span>NDPR · GDPR aligned</span>
            <span className="h-3 w-px bg-slate-800" />
            <span>v0.1.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
