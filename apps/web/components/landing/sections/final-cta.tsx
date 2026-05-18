'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { GridPattern } from '../primitives';

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-[#080d1c] text-white">
      <GridPattern tone="dark" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 h-[500px] w-[1100px] rounded-full bg-emerald-500/[0.05] blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-7xl px-6 lg:px-10 py-24 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/40 px-3 py-1 text-[11px] font-medium text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Ready when you are
          </div>
          <h2 className="mt-5 text-3xl md:text-5xl lg:text-[3.4rem] font-semibold leading-[1.05] tracking-tight">
            Add a telesales floor without<br />adding a field-sales budget.
          </h2>
          <p className="mt-6 text-lg text-slate-300 max-w-2xl leading-relaxed">
            Start a workspace in under two minutes. Bring your DMS when you’re ready — the platform meets it
            where it is.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-md bg-white text-slate-900 px-5 py-3 text-sm font-medium hover:bg-slate-100 transition"
            >
              Start your workspace
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="mailto:sales@teletrade.app"
              className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-5 py-3 text-sm font-medium text-slate-100 hover:bg-slate-900/60 transition"
            >
              Talk to a sales engineer
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              SOC 2 in progress · ISO 27001 path
            </span>
            <span>Per-region data residency</span>
            <span>14-day pilot · cancel anytime</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
