'use client';

import { motion } from 'framer-motion';
import { TrendingUp, ShoppingCart, Phone, Banknote, ArrowUpRight, ArrowDownRight, PhoneIncoming } from 'lucide-react';

/**
 * A compact dashboard mockup — composed UI, not a screenshot. Designed
 * to read clearly at 16:10 in the hero.
 */
export function DashboardPreview() {
  return (
    <div className="bg-white">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500">Today · Lagos South</div>
            <div className="text-base font-semibold text-slate-900">Operations cockpit</div>
          </div>
          <div className="inline-flex rounded-md border border-slate-200 p-0.5 text-[10px] font-medium">
            <span className="rounded-sm px-2 py-1 bg-slate-900 text-white">7d</span>
            <span className="px-2 py-1 text-slate-500">30d</span>
            <span className="px-2 py-1 text-slate-500">90d</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 px-5">
        <Kpi label="Revenue" value="₦11.0M" delta="+18.4%" up icon={Banknote} tone="emerald" sparkD="M0,18 L10,14 L20,12 L30,15 L40,9 L50,10 L60,6 L70,8 L80,4 L90,2" />
        <Kpi label="Orders" value="486" delta="+12.1%" up icon={ShoppingCart} tone="violet" sparkD="M0,15 L10,14 L20,9 L30,11 L40,7 L50,8 L60,5 L70,6 L80,4 L90,3" />
        <Kpi label="Calls" value="1,204" delta="+9.6%" up icon={Phone} tone="blue" sparkD="M0,12 L10,10 L20,12 L30,9 L40,7 L50,9 L60,6 L70,8 L80,5 L90,4" />
        <Kpi label="Conversion" value="14.3%" delta="+2.1pp" up icon={TrendingUp} tone="cyan" />
      </div>
      <div className="grid grid-cols-3 gap-2 px-5 pt-3 pb-5">
        <ChartCard />
        <RouteMap />
        <CallStream />
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  delta,
  up,
  icon: Icon,
  tone,
  sparkD,
}: {
  label: string;
  value: string;
  delta: string;
  up: boolean;
  icon: any;
  tone: 'emerald' | 'violet' | 'blue' | 'cyan';
  sparkD?: string;
}) {
  const toneIcon: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
    blue: 'bg-blue-50 text-blue-600',
    cyan: 'bg-cyan-50 text-cyan-600',
  };
  const stroke: Record<string, string> = {
    emerald: '#10b981',
    violet: '#8b5cf6',
    blue: '#3b82f6',
    cyan: '#06b6d4',
  };
  return (
    <div className="rounded-lg border border-slate-200 p-3 bg-white">
      <div className="flex items-center gap-1.5">
        <span className={'h-5 w-5 rounded flex items-center justify-center ' + toneIcon[tone]}>
          <Icon className="h-3 w-3" />
        </span>
        <span className="text-[10px] uppercase tracking-wide text-slate-500 font-medium">{label}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-lg font-semibold text-slate-900 tabular-nums">{value}</span>
        <span
          className={
            'inline-flex items-center gap-0.5 text-[10px] font-medium rounded px-1 py-0.5 ' +
            (up ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')
          }
        >
          {up ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
          {delta}
        </span>
      </div>
      {sparkD && (
        <svg className="mt-1 h-5 w-full" viewBox="0 0 90 20" preserveAspectRatio="none">
          <path d={sparkD} fill="none" stroke={stroke[tone]} strokeWidth="1.5" />
        </svg>
      )}
    </div>
  );
}

function ChartCard() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wide text-slate-500 font-medium">
          Calls & orders
        </span>
        <span className="text-[9px] text-slate-400">7d</span>
      </div>
      <svg className="mt-2 h-20 w-full" viewBox="0 0 200 80" preserveAspectRatio="none">
        <defs>
          <linearGradient id="g-blue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="g-violet" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0,55 C20,50 30,48 50,40 C70,32 90,42 110,30 C130,22 150,28 170,18 C185,12 195,15 200,12 L200,80 L0,80 Z"
          fill="url(#g-blue)"
        />
        <path
          d="M0,55 C20,50 30,48 50,40 C70,32 90,42 110,30 C130,22 150,28 170,18 C185,12 195,15 200,12"
          stroke="#3b82f6"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M0,62 C20,58 30,52 50,52 C70,52 90,46 110,42 C130,38 150,40 170,32 C185,28 195,25 200,24 L200,80 L0,80 Z"
          fill="url(#g-violet)"
        />
        <path
          d="M0,62 C20,58 30,52 50,52 C70,52 90,46 110,42 C130,38 150,40 170,32 C185,28 195,25 200,24"
          stroke="#8b5cf6"
          strokeWidth="1.5"
          fill="none"
        />
      </svg>
    </div>
  );
}

function RouteMap() {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 relative overflow-hidden">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] uppercase tracking-wide text-slate-500 font-medium">
          LAG-S-A · today
        </span>
        <span className="text-[9px] text-emerald-700 bg-emerald-50 rounded px-1 py-0.5 font-medium">
          12 / 20
        </span>
      </div>
      <svg viewBox="0 0 160 80" className="w-full h-16">
        {/* roads */}
        <path d="M10,60 Q40,55 60,45 Q90,30 130,38 Q145,42 150,60" stroke="#cbd5e1" strokeWidth="1.5" fill="none" />
        <path d="M30,72 Q60,68 75,55 Q90,42 110,28" stroke="#cbd5e1" strokeWidth="1" fill="none" />
        {/* stops */}
        {[
          [18, 60, 'emerald'],
          [38, 56, 'emerald'],
          [60, 45, 'emerald'],
          [80, 38, 'violet'],
          [105, 35, 'slate'],
          [128, 38, 'slate'],
          [145, 50, 'slate'],
          [42, 70, 'amber'],
        ].map(([cx, cy, t], i) => (
          <circle
            key={i}
            cx={cx as number}
            cy={cy as number}
            r="3"
            fill={
              t === 'emerald' ? '#10b981' : t === 'violet' ? '#8b5cf6' : t === 'amber' ? '#f59e0b' : '#94a3b8'
            }
            stroke="white"
            strokeWidth="1.2"
          />
        ))}
      </svg>
      <div className="mt-1 flex items-center gap-2 text-[9px] text-slate-500">
        <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> done</span>
        <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-violet-500" /> en route</span>
        <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> failed</span>
      </div>
    </div>
  );
}

function CallStream() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] uppercase tracking-wide text-slate-500 font-medium">Live calls</span>
        <motion.span
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="inline-flex items-center gap-1 text-[9px] font-medium text-emerald-700"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> live
        </motion.span>
      </div>
      <div className="space-y-1.5">
        <CallRow name="Mama Adaeze Stores" outcome="Order" amount="₦46,366" tone="emerald" />
        <CallRow name="Chief Bola Foods" outcome="Callback" amount="" tone="blue" />
        <CallRow name="Auntie Yemi Plaza" outcome="No order" amount="" tone="slate" />
      </div>
    </div>
  );
}

function CallRow({
  name,
  outcome,
  amount,
  tone,
}: {
  name: string;
  outcome: string;
  amount: string;
  tone: 'emerald' | 'blue' | 'slate';
}) {
  const cls: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
    slate: 'bg-slate-100 text-slate-700',
  };
  return (
    <div className="flex items-center justify-between gap-2 text-[10px]">
      <div className="flex items-center gap-1.5 min-w-0">
        <PhoneIncoming className="h-3 w-3 text-slate-400 shrink-0" />
        <span className="truncate text-slate-700">{name}</span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className={'rounded px-1.5 py-0.5 font-medium ' + cls[tone]}>{outcome}</span>
        {amount && <span className="text-slate-500 tabular-nums">{amount}</span>}
      </div>
    </div>
  );
}
