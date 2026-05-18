'use client';

import { motion } from 'framer-motion';
import { Section, SectionHeader } from '../primitives';
import { Briefcase, ClipboardList, Truck, Headphones } from 'lucide-react';

const PERSONAS = [
  {
    icon: Briefcase,
    title: 'VP Sales · Commercial Director',
    body:
      'See network coverage and revenue at a glance. Approve campaigns. Catch dormant cohorts before the next QBR.',
  },
  {
    icon: ClipboardList,
    title: 'Sales Operations · Trade Marketing',
    body:
      'Define filters, push NPI launches, watch the conversion funnel by SKU and route. Stop running ops in spreadsheets.',
  },
  {
    icon: Truck,
    title: 'Route Manager · Distribution Lead',
    body:
      'Every order auto-lands on the right driver’s next route day. Cash collection, failed stops, EOR — visible.',
  },
  {
    icon: Headphones,
    title: 'Telesales Team Lead',
    body:
      'A real softphone. Agents see customer 360, promos, and reorder prompts before the call connects.',
  },
];

export function Audience() {
  return (
    <Section id="who-its-for" tone="light">
      <SectionHeader
        number="07"
        eyebrow="Who it’s for"
        title={
          <>
            Built for the four roles
            <br />
            running traditional trade.
          </>
        }
        body="Distribution is a team sport. Each persona gets a tailored surface — same source of truth, role-appropriate controls."
      />

      <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-200 border border-slate-200 rounded-2xl overflow-hidden">
        {PERSONAS.map((p, i) => {
          const Icon = p.icon;
          return (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="bg-white p-7 md:p-8 flex gap-4"
            >
              <span className="h-10 w-10 rounded-md bg-slate-900 text-white flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 leading-snug">{p.title}</h3>
                <p className="mt-1 text-sm text-slate-500 leading-relaxed">{p.body}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}
