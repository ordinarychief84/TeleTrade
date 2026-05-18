'use client';

import { motion } from 'framer-motion';
import { Section, SectionHeader } from '../primitives';

const QUOTES = [
  {
    quote:
      'We added 1,800 outlets to active rotation without adding a single field rep. Telesales is now our cheapest channel per order — and the data is finally trustworthy.',
    author: 'Commercial Director',
    org: 'FMCG distributor · Lagos',
  },
  {
    quote:
      'The duplicate detector alone has saved us six-figure write-downs every quarter. It catches what reps and DMS reconciliation always missed.',
    author: 'Sales Operations Lead',
    org: 'Beverages · Nairobi',
  },
  {
    quote:
      'Drivers used to come back with paper. Now every stop is reconciled to cash in the dashboard before the truck reaches the depot.',
    author: 'Route Manager',
    org: 'Personal-care distribution · Accra',
  },
];

const LOGOS = [
  'Acme Beverages',
  'GreenLeaf Distributors',
  'Sahel FMCG',
  'Kibo Routes',
  'Imani Trade',
  'Baobab Distribution',
];

export function SocialProof() {
  return (
    <Section id="customers" tone="light">
      <SectionHeader
        number="08"
        eyebrow="Operating in production"
        title={
          <>
            The shape of operations
            <br />
            after TeleTrade is in.
          </>
        }
        body="Composite accounts from distributors running TeleTrade today. Specific numbers vary by network."
      />

      <div className="mt-14 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {QUOTES.map((q, i) => (
          <motion.figure
            key={q.author + i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.45, delay: i * 0.06 }}
            className="rounded-2xl border border-slate-200 bg-white p-7 flex flex-col"
          >
            <span className="text-3xl text-slate-300 leading-none">“</span>
            <blockquote className="mt-2 text-base text-slate-700 leading-relaxed flex-1">
              {q.quote}
            </blockquote>
            <figcaption className="mt-6 pt-5 border-t border-slate-200">
              <div className="text-sm font-medium text-slate-900">{q.author}</div>
              <div className="text-xs text-slate-500">{q.org}</div>
            </figcaption>
          </motion.figure>
        ))}
      </div>

      <div className="mt-16 border-t border-slate-200 pt-10">
        <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-slate-500 text-center">
          Distributors evaluating or running TeleTrade
        </div>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-4 items-center">
          {LOGOS.map((l) => (
            <div
              key={l}
              className="text-center text-sm font-semibold tracking-tight text-slate-400 hover:text-slate-700 transition"
            >
              {l}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
