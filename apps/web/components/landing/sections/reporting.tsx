'use client';

import { motion } from 'framer-motion';
import { Section, SectionHeader, MockWindow } from '../primitives';
import { DashboardPreview } from '../mockups/dashboard-preview';

const CALLOUTS = [
  {
    label: 'Revenue vs prior period',
    body: 'Delta chips on every KPI — green when up, red when not. Click to see the cohort.',
  },
  {
    label: 'Route-level revenue',
    body: 'See which routes carry the network. Spot the ones that are quietly slipping.',
  },
  {
    label: 'Call → order funnel',
    body: 'Conversion broken out by agent, campaign, and outlet type. No black box.',
  },
  {
    label: 'Operational alerts',
    body: 'Duplicates pending, DMS dead-letters, dormant cohorts — the things managers act on today.',
  },
];

export function Reporting() {
  return (
    <Section id="reporting" tone="light">
      <SectionHeader
        number="05"
        eyebrow="Reporting"
        title={
          <>
            Numbers your team can act on,
            <br />
            not just admire.
          </>
        }
        body="Every metric on this dashboard maps to a decision someone in the building will make today — not a slide deck someone will read next quarter."
      />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.5 }}
        className="mt-14"
      >
        <MockWindow title="teletrade.app/dashboard">
          <DashboardPreview />
        </MockWindow>
      </motion.div>

      <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {CALLOUTS.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <div className="text-sm font-semibold text-slate-900">{c.label}</div>
            <div className="mt-1 text-sm text-slate-500 leading-relaxed">{c.body}</div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
