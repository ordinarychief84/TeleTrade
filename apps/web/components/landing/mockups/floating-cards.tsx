'use client';

import { motion } from 'framer-motion';
import { PhoneIncoming, Sparkles, MapPin } from 'lucide-react';

/** A small floating "Inbound call" pill that hovers near the hero dashboard. */
export function FloatingInboundCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="absolute -left-6 top-32 hidden md:block"
    >
      <div className="rounded-xl border border-slate-200 bg-white shadow-[0_18px_40px_-15px_rgba(15,23,42,0.25)] px-3 py-2.5 w-[230px]">
        <div className="flex items-center gap-2">
          <motion.span
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"
          >
            <PhoneIncoming className="h-3.5 w-3.5" />
          </motion.span>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-slate-900 truncate">Inbound · Sister Lola</div>
            <div className="text-[10px] text-slate-500 truncate">Bar · Tier C · 14d dormant</div>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1 text-[9px]">
          <div className="rounded bg-slate-50 px-1.5 py-1 text-slate-600">CRM loads in <span className="font-semibold text-slate-900">1.2s</span></div>
          <div className="rounded bg-emerald-50 px-1.5 py-1 text-emerald-700">Promo: Malta Q2</div>
        </div>
      </div>
    </motion.div>
  );
}

/** Floating suggestion engine card */
export function FloatingSuggestionCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.4 }}
      className="absolute -right-4 -bottom-6 hidden md:block"
    >
      <div className="rounded-xl border border-slate-200 bg-white shadow-[0_18px_40px_-15px_rgba(15,23,42,0.25)] px-3 py-2.5 w-[270px]">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="h-6 w-6 rounded-md bg-violet-50 text-violet-600 flex items-center justify-center">
            <Sparkles className="h-3 w-3" />
          </span>
          <span className="text-[10px] uppercase tracking-wide text-slate-500 font-medium">Suggested order</span>
        </div>
        <div className="text-[11px] text-slate-700 leading-snug">
          <span className="font-medium text-slate-900">Malta 33cl ×3</span> — usually orders every 10d, last
          order <span className="font-medium text-slate-900">14d ago</span>.
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 tabular-nums">₦7,200</span>
          <span className="text-[10px] font-medium rounded bg-slate-900 text-white px-2 py-0.5">Add to order</span>
        </div>
      </div>
    </motion.div>
  );
}

/** Floating route stop card (next stop preview) */
export function FloatingRouteCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.4 }}
      className="absolute -bottom-10 -left-6 hidden lg:block"
    >
      <div className="rounded-xl border border-slate-200 bg-white shadow-[0_18px_40px_-15px_rgba(15,23,42,0.25)] px-3 py-2.5 w-[260px]">
        <div className="flex items-start gap-2">
          <span className="h-6 w-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
            <MapPin className="h-3 w-3" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wide text-slate-500 font-medium">Next stop · #1</div>
            <div className="text-[11px] font-medium text-slate-900 truncate">Alhaji Rahma Foods</div>
            <div className="text-[10px] text-slate-500 truncate">64 Allen Road · ₦228,500</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
