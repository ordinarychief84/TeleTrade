'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Linear / Stripe-style eyebrow tag: a tiny monospace label with a leading
 * number, used to anchor the start of each section.
 */
export function Eyebrow({
  number,
  children,
  tone = 'dark',
}: {
  number: string;
  children: React.ReactNode;
  tone?: 'dark' | 'light';
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em]',
        tone === 'dark' ? 'text-slate-400' : 'text-slate-500'
      )}
    >
      <span
        className={cn(
          'inline-block h-px w-6',
          tone === 'dark' ? 'bg-slate-700' : 'bg-slate-300'
        )}
      />
      <span className={tone === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}>
        {number}
      </span>
      <span>{children}</span>
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  number,
  title,
  body,
  tone = 'light',
  align = 'left',
}: {
  eyebrow: string;
  number: string;
  title: React.ReactNode;
  body?: React.ReactNode;
  tone?: 'dark' | 'light';
  align?: 'left' | 'center';
}) {
  return (
    <div className={cn('max-w-3xl', align === 'center' && 'mx-auto text-center')}>
      <Eyebrow number={number} tone={tone}>
        {eyebrow}
      </Eyebrow>
      <h2
        className={cn(
          'mt-4 text-3xl md:text-4xl lg:text-[2.75rem] font-semibold tracking-tight leading-[1.1]',
          tone === 'dark' ? 'text-white' : 'text-slate-900'
        )}
      >
        {title}
      </h2>
      {body && (
        <p
          className={cn(
            'mt-4 text-base md:text-lg leading-relaxed',
            tone === 'dark' ? 'text-slate-300' : 'text-slate-600'
          )}
        >
          {body}
        </p>
      )}
    </div>
  );
}

export function Section({
  tone = 'light',
  className,
  children,
  id,
}: {
  tone?: 'dark' | 'light';
  className?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        'relative w-full',
        tone === 'dark' ? 'bg-[#0a0f1f] text-slate-100' : 'bg-white text-slate-900',
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-20 md:py-28 lg:py-32">{children}</div>
    </section>
  );
}

export function GridPattern({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  return (
    <svg
      className="absolute inset-0 h-full w-full pointer-events-none"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id={'grid-' + tone}
          width="56"
          height="56"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 56 0 L 0 0 0 56"
            fill="none"
            stroke={tone === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)'}
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#grid-${tone})`} />
    </svg>
  );
}

/**
 * Faux-window chrome around a UI mockup so it reads as "this is product",
 * not "this is marketing imagery".
 */
export function MockWindow({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200/80 bg-white shadow-[0_25px_60px_-15px_rgba(15,23,42,0.25)] overflow-hidden',
        className
      )}
    >
      <div className="flex items-center gap-1.5 border-b border-slate-200/80 bg-slate-50 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        {title && (
          <span className="ml-3 text-[11px] font-mono text-slate-500">{title}</span>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}
