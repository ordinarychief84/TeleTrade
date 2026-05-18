'use client';

import { motion } from 'framer-motion';
import { Database, Phone, Webhook, ShieldCheck } from 'lucide-react';
import { Section, SectionHeader } from '../primitives';

const DMS = ['Odoo', 'SAP Business One', 'Microsoft Dynamics 365', 'Sage X3', 'Custom REST'];
const TELEPHONY = ['Twilio', 'Africa’s Talking', 'Vonage', 'SIP / PBX', 'Mock provider'];
const COMPLIANCE = ['SOC 2 Type II (in progress)', 'ISO 27001 (path)', 'NDPR / GDPR aligned', 'Data residency by region'];

export function Integrations() {
  return (
    <Section id="integrations" tone="dark">
      <SectionHeader
        number="06"
        eyebrow="Integrations"
        title={
          <>
            Plug into the systems your
            <br />
            operation already runs on.
          </>
        }
        body="TeleTrade is built around adapter contracts, not bespoke integrations. Swap providers without rewriting your floor."
        tone="dark"
      />

      <div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Stack
          icon={Database}
          eyebrow="DMS / ERP adapters"
          body="Order push, customer + route sync, webhooks. Retry queue with dead-letter alerting."
          items={DMS}
        />
        <Stack
          icon={Phone}
          eyebrow="Telephony providers"
          body="Inbound, outbound, recording, language routing — provider-agnostic behind a single interface."
          items={TELEPHONY}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6"
      >
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Webhook className="h-4 w-4" />
            </span>
            <div className="text-[10px] font-mono tracking-[0.18em] uppercase text-emerald-400">
              Webhooks &amp; events
            </div>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            Every order, call, and delivery emits a typed event. Signed payloads, retries, and a public event
            catalog so your data team can pipe TeleTrade into the rest of the warehouse.
          </p>
          <pre className="mt-4 rounded-md border border-slate-800 bg-[#070c1b] p-4 text-[11px] text-slate-300 leading-relaxed overflow-x-auto">
{`POST  /api/v1/dms/webhooks/odoo
Event order.delivered → BullMQ → DMS push
Signed:  x-teletrade-signature: sha256=…
Retry:   exponential, 5 attempts → dead-letter`}
          </pre>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div className="text-[10px] font-mono tracking-[0.18em] uppercase text-emerald-400">
              Trust &amp; compliance
            </div>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            Enterprise distributors run regulated operations. We treat the boring parts as load-bearing.
          </p>
          <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {COMPLIANCE.map((c) => (
              <li key={c} className="text-xs text-slate-300 flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </Section>
  );
}

function Stack({
  icon: Icon,
  eyebrow,
  body,
  items,
}: {
  icon: any;
  eyebrow: string;
  body: string;
  items: string[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6"
    >
      <div className="flex items-center gap-3">
        <span className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <div className="text-[10px] font-mono tracking-[0.18em] uppercase text-emerald-400">{eyebrow}</div>
          <div className="text-sm text-slate-300 max-w-md">{body}</div>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((it) => (
          <div
            key={it}
            className="rounded-lg border border-slate-800 bg-[#0a0f1f] px-4 py-3 text-sm text-slate-200 flex items-center justify-between"
          >
            <span>{it}</span>
            <span className="text-[10px] text-emerald-400">·</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
