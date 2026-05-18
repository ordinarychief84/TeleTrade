'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { MockWindow, GridPattern } from '../primitives';
import { DashboardPreview } from '../mockups/dashboard-preview';
import { FloatingInboundCard, FloatingSuggestionCard, FloatingRouteCard } from '../mockups/floating-cards';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#080d1c] text-slate-100">
      <GridPattern tone="dark" />
      {/* very soft radial highlight, no gradient soup */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[600px] w-[1100px] rounded-full bg-emerald-500/[0.06] blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-7xl px-6 lg:px-10 pt-28 pb-24 md:pt-32 md:pb-32 lg:pt-36 lg:pb-40">
        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/40 px-3 py-1 text-[11px] font-medium text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Telesales infrastructure for traditional trade
            </div>

            <h1 className="mt-5 text-4xl md:text-5xl lg:text-[3.6rem] font-semibold leading-[1.04] tracking-tight text-white">
              Recover the revenue your field team{' '}
              <span className="text-emerald-400">never reaches.</span>
            </h1>

            <p className="mt-6 text-lg md:text-xl text-slate-300 leading-relaxed max-w-xl">
              TeleTrade is the telesales operating system FMCG distributors use to{' '}
              <span className="text-white">
                call dormant outlets, lift coverage, and turn calls into route deliveries
              </span>{' '}
              — at a fraction of field cost.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 rounded-md bg-white text-slate-900 px-5 py-3 text-sm font-medium hover:bg-slate-100 transition"
              >
                Start your workspace
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-5 py-3 text-sm font-medium text-slate-100 hover:bg-slate-900/60 transition"
              >
                See it operating
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-[11px] text-slate-400">
              <span>Built for Odoo · SAP B1 · Dynamics 365 · Custom ERPs</span>
              <span className="hidden md:inline-block h-3 w-px bg-slate-700" />
              <span>Twilio · Africa’s Talking · SIP-ready</span>
              <span className="hidden md:inline-block h-3 w-px bg-slate-700" />
              <span>Audit-grade compliance</span>
            </div>
          </div>

          <div className="relative">
            <MockWindow title="teletrade.app/dashboard">
              <DashboardPreview />
            </MockWindow>
            <FloatingInboundCard />
            <FloatingSuggestionCard />
            <FloatingRouteCard />
          </div>
        </div>
      </div>
    </section>
  );
}
