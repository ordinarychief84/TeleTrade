'use client';

import * as React from 'react';
import Link from 'next/link';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatTone = 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate' | 'cyan';

const TONE_STYLES: Record<StatTone, { ring: string; icon: string; fill: string; stroke: string }> = {
  blue:    { ring: 'bg-blue-50',    icon: 'text-blue-600',    fill: '#3b82f6', stroke: '#3b82f6' },
  emerald: { ring: 'bg-emerald-50', icon: 'text-emerald-600', fill: '#10b981', stroke: '#10b981' },
  amber:   { ring: 'bg-amber-50',   icon: 'text-amber-600',   fill: '#f59e0b', stroke: '#f59e0b' },
  rose:    { ring: 'bg-rose-50',    icon: 'text-rose-600',    fill: '#f43f5e', stroke: '#f43f5e' },
  violet:  { ring: 'bg-violet-50',  icon: 'text-violet-600',  fill: '#8b5cf6', stroke: '#8b5cf6' },
  slate:   { ring: 'bg-slate-100',  icon: 'text-slate-600',   fill: '#64748b', stroke: '#64748b' },
  cyan:    { ring: 'bg-cyan-50',    icon: 'text-cyan-600',    fill: '#06b6d4', stroke: '#06b6d4' },
};

export interface StatCardProps {
  label: string;
  value: string | number;
  /** Previous period's raw number (used for delta auto-calc). */
  previous?: number;
  /** Display value of the change, e.g. "+12" or "-3pp" if you want full control. */
  deltaLabel?: string;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: StatTone;
  href?: string;
  /** Sparkline series — array of `{date, value}` (~30 days). */
  series?: { date: string; value: number }[];
  /** Higher-is-better (default true). Flip to false for "missed", "dormant" etc. */
  higherIsBetter?: boolean;
  emphasize?: boolean;
}

export function StatCard({
  label,
  value,
  previous,
  deltaLabel,
  hint,
  icon: Icon,
  tone = 'slate',
  href,
  series,
  higherIsBetter = true,
  emphasize,
}: StatCardProps) {
  const toneStyle = TONE_STYLES[tone];

  // Compute delta when not explicitly provided.
  let delta: { sign: 'up' | 'down' | 'flat'; pct: number; label: string } | null = null;
  if (typeof value === 'number' && typeof previous === 'number') {
    if (previous === 0 && value === 0) {
      delta = { sign: 'flat', pct: 0, label: '—' };
    } else if (previous === 0) {
      delta = { sign: 'up', pct: 100, label: 'new' };
    } else {
      const change = ((value - previous) / previous) * 100;
      const pct = Math.round(change * 10) / 10;
      delta = {
        sign: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat',
        pct: Math.abs(pct),
        label: `${pct > 0 ? '+' : pct < 0 ? '−' : ''}${Math.abs(pct)}%`,
      };
    }
  } else if (deltaLabel) {
    const trimmed = deltaLabel.trim();
    const sign: 'up' | 'down' | 'flat' = trimmed.startsWith('-') || trimmed.startsWith('−') ? 'down' : trimmed.startsWith('+') ? 'up' : 'flat';
    delta = { sign, pct: 0, label: trimmed };
  }

  const isGood = !delta
    ? false
    : delta.sign === 'flat'
      ? false
      : higherIsBetter
        ? delta.sign === 'up'
        : delta.sign === 'down';
  const deltaTone =
    !delta || delta.sign === 'flat'
      ? 'text-muted-foreground bg-muted'
      : isGood
        ? 'text-emerald-700 bg-emerald-50'
        : 'text-rose-700 bg-rose-50';

  const inner = (
    <div
      className={cn(
        'group rounded-xl border bg-card text-card-foreground p-4 shadow-sm transition hover:shadow-md',
        emphasize && 'ring-1 ring-primary/30'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {Icon && (
              <span className={cn('h-7 w-7 rounded-lg flex items-center justify-center', toneStyle.ring)}>
                <Icon className={cn('h-3.5 w-3.5', toneStyle.icon)} />
              </span>
            )}
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{label}</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-[1.7rem] font-semibold leading-none">{value}</span>
            {delta && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium',
                  deltaTone
                )}
                title="vs previous period"
              >
                {delta.sign === 'up' ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : delta.sign === 'down' ? (
                  <ArrowDownRight className="h-3 w-3" />
                ) : (
                  <Minus className="h-3 w-3" />
                )}
                {delta.label}
              </span>
            )}
          </div>
          {hint && <div className="mt-1 text-[11px] text-muted-foreground line-clamp-1">{hint}</div>}
        </div>
        {series && series.length > 1 && (
          <div className="h-12 w-24 -mr-1 -mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={`spark-${tone}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={toneStyle.fill} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={toneStyle.fill} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={toneStyle.stroke}
                  strokeWidth={1.5}
                  fill={`url(#spark-${tone})`}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}
