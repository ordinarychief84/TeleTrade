'use client';

import { motion } from 'framer-motion';
import { Section, SectionHeader } from '../primitives';
import { Plug, Database, Headphones, Truck } from 'lucide-react';

const STEPS = [
  {
    n: '01',
    icon: Database,
    title: 'Connect your DMS / ERP.',
    body: 'Odoo, SAP B1, Dynamics 365, or a custom REST adapter — sync customers, routes, SKUs, and price lists in one pass.',
  },
  {
    n: '02',
    icon: Plug,
    title: 'Match outlets to routes.',
    body: 'Each outlet is bound to a route and territory. New ones get auto-classified the first time a telesales agent reaches them.',
  },
  {
    n: '03',
    icon: Headphones,
    title: 'Run telesales operations.',
    body: 'Agents take inbound, run outbound campaigns, and capture orders inside the CRM panel with autosaved drafts.',
  },
  {
    n: '04',
    icon: Truck,
    title: 'Orders flow back as deliveries.',
    body: 'Every confirmed order syncs to your ERP and lands on a driver’s next route day — no spreadsheet handoff.',
  },
];

export function HowItWorks() {
  return (
    <Section id="how" tone="light">
      <SectionHeader
        number="03"
        eyebrow="How it works"
        title={
          <>
            Four moves to operationalise
            <br />
            telesales across your network.
          </>
        }
        body="Most distributors are live within two weeks. The system meets your DMS where it is — we don’t ask you to rip and replace."
      />

      <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 border border-slate-200 rounded-2xl overflow-hidden">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="bg-white p-7 md:p-8 flex flex-col h-full"
            >
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono tracking-[0.18em] uppercase text-emerald-600">
                  {s.n}
                </span>
                <span className="h-px flex-1 bg-slate-200" />
                <span className="h-8 w-8 rounded-md bg-slate-50 text-slate-700 flex items-center justify-center">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-900 leading-snug">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">{s.body}</p>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}
