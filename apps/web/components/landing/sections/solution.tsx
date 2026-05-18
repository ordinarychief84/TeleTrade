'use client';

import { motion } from 'framer-motion';
import { PhoneIncoming, Route, Sparkles, CheckCircle2, AlertTriangle, PhoneOutgoing } from 'lucide-react';
import { Section, SectionHeader } from '../primitives';

const PILLARS = [
  {
    eyebrow: 'Pillar 01',
    title: 'Telesales operations, productised.',
    body:
      'Inbound, outbound, and follow-up flows your team actually executes. Smart routing, queue-aware agents, scripted pitches.',
    bullets: [
      'CRM panel auto-loads in <2s',
      'Outbound campaigns with target filters',
      'Callback queues + missed-call recovery',
    ],
    mock: <TelesalesMock />,
  },
  {
    eyebrow: 'Pillar 02',
    title: 'Route intelligence baked in.',
    body:
      'Every order lands on a driver’s next route day. No spreadsheet handoffs, no WhatsApp dispatch.',
    bullets: [
      'Routes synced from your DMS',
      'Stops auto-numbered, driver auto-assigned',
      'Live order → delivered → cash collected',
    ],
    mock: <RouteMock />,
  },
  {
    eyebrow: 'Pillar 03',
    title: 'Revenue recovery, by design.',
    body:
      'A rules-based suggestion engine catches the orders that field reps miss — cadence, gap-fill, promo, NPI.',
    bullets: [
      'Dormant outlet reactivation lists',
      'Plain-language reorder prompts',
      'Duplicate detection without auto-cancel',
    ],
    mock: <RecoveryMock />,
  },
];

export function Solution() {
  return (
    <Section id="solution" tone="dark">
      <SectionHeader
        number="02"
        eyebrow="The platform"
        title={
          <>
            Three operational pillars.
            <br />
            <span className="text-emerald-400">One system of record.</span>
          </>
        }
        body="TeleTrade is not a CRM with a phone tab. It’s the layer between your sales floor, your distribution routes, and your ERP."
        tone="dark"
      />

      <div className="mt-14 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {PILLARS.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
            className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 lg:p-7 flex flex-col"
          >
            <div className="text-[10px] font-mono tracking-[0.18em] uppercase text-emerald-400">
              {p.eyebrow}
            </div>
            <h3 className="mt-2 text-xl font-semibold text-white leading-tight">{p.title}</h3>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">{p.body}</p>
            <ul className="mt-4 space-y-2">
              {p.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-xl border border-slate-800 bg-[#0a0f1f] p-3">{p.mock}</div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

function TelesalesMock() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono uppercase tracking-wide">
        <span>Softphone</span>
        <span className="text-emerald-400">connected · 02:14</span>
      </div>
      <div className="rounded-md bg-slate-900 border border-slate-800 p-2.5">
        <div className="flex items-center gap-2">
          <span className="h-7 w-7 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <PhoneIncoming className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-white truncate">Sister Lola Cool Spot</div>
            <div className="text-[10px] text-slate-400 truncate">+234 857 710 6559 · BAR · EN</div>
          </div>
        </div>
      </div>
      <div className="rounded-md bg-slate-900 border border-slate-800 p-2.5">
        <div className="text-[10px] text-slate-400 mb-1">Suggested · cadence</div>
        <div className="text-[11px] text-slate-200 leading-snug">
          Buys <span className="font-medium text-white">Malta 33cl every 10d</span>. Last order 14d ago — pitch 3 cases.
        </div>
      </div>
    </div>
  );
}

function RouteMock() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono uppercase tracking-wide">
        <span>LAG-S-A · today</span>
        <span className="text-emerald-400">12 / 20 stops</span>
      </div>
      <div className="rounded-md bg-slate-900 border border-slate-800 p-2.5">
        <svg viewBox="0 0 200 60" className="w-full h-12">
          <path
            d="M5,40 Q40,30 70,25 Q100,20 130,28 Q160,35 195,30"
            stroke="#334155"
            strokeWidth="1.5"
            fill="none"
          />
          {[
            [10, 40, 'emerald'],
            [35, 32, 'emerald'],
            [60, 27, 'emerald'],
            [85, 24, 'violet'],
            [115, 24, 'slate'],
            [140, 30, 'slate'],
            [170, 33, 'slate'],
            [192, 30, 'slate'],
          ].map(([x, y, t], i) => (
            <circle
              key={i}
              cx={x as number}
              cy={y as number}
              r="3"
              fill={t === 'emerald' ? '#10b981' : t === 'violet' ? '#a78bfa' : '#475569'}
              stroke="#0a0f1f"
              strokeWidth="1.2"
            />
          ))}
        </svg>
      </div>
      <div className="rounded-md bg-slate-900 border border-slate-800 p-2.5 text-[11px] text-slate-200">
        Next stop: <span className="font-medium text-white">Alhaji Rahma Foods</span> · ₦228,500
      </div>
    </div>
  );
}

function RecoveryMock() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono uppercase tracking-wide">
        <span>Suggestions</span>
        <span>5 outlets</span>
      </div>
      <div className="rounded-md bg-slate-900 border border-slate-800 p-2.5">
        <div className="flex items-center gap-2 text-[11px]">
          <Sparkles className="h-3 w-3 text-violet-400 shrink-0" />
          <span className="text-slate-200 truncate">
            <span className="font-medium text-white">Indomie Hot &amp; Spicy 70g</span> — NPI, pitch 2 cases
          </span>
        </div>
      </div>
      <div className="rounded-md bg-slate-900 border border-slate-800 p-2.5">
        <div className="flex items-center gap-2 text-[11px]">
          <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />
          <span className="text-slate-200 truncate">
            <span className="font-medium text-white">Dormant 30d+</span> — 14 outlets in this route
          </span>
        </div>
      </div>
      <div className="rounded-md bg-slate-900 border border-slate-800 p-2.5">
        <div className="flex items-center gap-2 text-[11px]">
          <PhoneOutgoing className="h-3 w-3 text-emerald-400 shrink-0" />
          <span className="text-slate-200 truncate">
            <span className="font-medium text-white">Auto-queued</span> for the morning campaign
          </span>
        </div>
      </div>
    </div>
  );
}
