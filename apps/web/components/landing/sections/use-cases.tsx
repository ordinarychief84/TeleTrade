'use client';

import { motion } from 'framer-motion';
import { Section, SectionHeader } from '../primitives';
import { Rocket, Megaphone, Snowflake, Wallet, MessageSquareText, HeartHandshake } from 'lucide-react';

const CASES = [
  {
    icon: Rocket,
    title: 'NPI launches without losing the long tail.',
    body:
      'Push a new SKU to every applicable outlet in days, not months. Filter by tier, outlet type, route — and dial.',
    kpi: { figure: '×3', label: 'faster than field-only NPI' },
  },
  {
    icon: Snowflake,
    title: 'Dormant outlet reactivation.',
    body:
      'Outlets idle for 30+ days get auto-queued for callbacks. Conversion rates and decline reasons land in reporting.',
    kpi: { figure: '27%', label: 'of dormant outlets reactivated in 30 days' },
  },
  {
    icon: Megaphone,
    title: 'Promo push, end-to-end measured.',
    body:
      'Approve a promo, generate a target list, watch revenue land in the dashboard — by route, agent, and SKU.',
    kpi: { figure: '+18%', label: 'lift on Q2 Malta push (illustrative)' },
  },
  {
    icon: Wallet,
    title: 'Credit collection at scale.',
    body:
      'Outstanding-balance outlets feed a polite, scripted call flow. Agents see the ledger before the line connects.',
    kpi: { figure: '4d', label: 'avg outstanding cycle reduction' },
  },
  {
    icon: MessageSquareText,
    title: 'Complaint follow-ups that don’t slip.',
    body:
      'Every complaint is a callback in the queue. SLAs are visible — and overdue ones surface in the manager inbox.',
    kpi: { figure: '<24h', label: 'first-response SLA' },
  },
  {
    icon: HeartHandshake,
    title: 'After-sales and survey ops.',
    body:
      'Run satisfaction sweeps after major drops. Tag outlets by sentiment, feed it back to the suggestion engine.',
    kpi: { figure: '4.6/5', label: 'avg outlet satisfaction (illustrative)' },
  },
];

export function UseCases() {
  return (
    <Section id="use-cases" tone="dark">
      <SectionHeader
        number="04"
        eyebrow="Use cases"
        title={
          <>
            What teams switch on first.
          </>
        }
        body="Most distributors start with dormant reactivation and an NPI campaign. The platform doesn’t care which — every flow runs on the same call, customer, and order primitives."
        tone="dark"
      />

      <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CASES.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
              className="group rounded-2xl border border-slate-800 bg-slate-900/40 p-6 hover:bg-slate-900/70 transition"
            >
              <div className="flex items-center gap-3">
                <span className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white leading-snug">{c.title}</h3>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">{c.body}</p>
              <div className="mt-5 pt-4 border-t border-slate-800 flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-white tabular-nums tracking-tight">
                  {c.kpi.figure}
                </span>
                <span className="text-xs text-slate-400 leading-snug">{c.kpi.label}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}
