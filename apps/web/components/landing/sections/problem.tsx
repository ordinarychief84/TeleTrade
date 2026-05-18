'use client';

import { motion } from 'framer-motion';
import { Section, SectionHeader } from '../primitives';

const STATS = [
  {
    figure: '12%',
    label: 'Outlet coverage by field reps in a typical week',
    body: 'Reps see the easy outlets. The other 88% reorder when they remember.',
  },
  {
    figure: '₦4.2M',
    label: 'Average monthly revenue lost to dormant outlets',
    body: 'Outlets go quiet for 30+ days. Nobody calls them back.',
  },
  {
    figure: '+27%',
    label: 'Year-on-year cost-to-serve increase',
    body: 'Fuel, salaries, allowances climb. Routes get expensive.',
  },
  {
    figure: '3 days',
    label: 'Lag between order placed and order in DMS',
    body: 'Paper forms, WhatsApp threads, manual entry. Errors compound.',
  },
  {
    figure: '46%',
    label: 'Outlets that never see an NPI launch',
    body: 'New SKUs ship to top accounts. The long tail finds out months later.',
  },
  {
    figure: '0',
    label: 'Visibility into why a customer stopped ordering',
    body: 'No call log. No follow-up. Just churn that nobody flagged.',
  },
];

export function Problem() {
  return (
    <Section id="problem" tone="light">
      <SectionHeader
        number="01"
        eyebrow="The problem"
        title={
          <>
            The traditional-trade math
            <br />
            doesn’t work anymore.
          </>
        }
        body="Field-only sales was built for a denser, cheaper world. Today every distributor we talk to is leaking revenue in the same six places."
      />

      <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-200 border border-slate-200 rounded-2xl overflow-hidden">
        {STATS.map((s, i) => (
          <motion.div
            key={s.figure + i}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.4, delay: i * 0.04 }}
            className="bg-white p-7 md:p-8"
          >
            <div className="text-3xl md:text-4xl font-semibold text-slate-900 tabular-nums tracking-tight">
              {s.figure}
            </div>
            <div className="mt-2 text-sm font-medium text-slate-900">{s.label}</div>
            <div className="mt-1 text-sm text-slate-500 leading-relaxed">{s.body}</div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
