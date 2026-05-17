import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string | null | undefined, currency = 'NGN') {
  const n = typeof value === 'string' ? Number(value) : (value ?? 0);
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
}

export function formatDate(d: string | Date | null | undefined, opts: Intl.DateTimeFormatOptions = {}) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', ...opts });
}

export function relativeDays(d: string | Date | null | undefined): string {
  if (!d) return '—';
  const days = Math.floor((Date.now() - new Date(d).getTime()) / (24 * 3600 * 1000));
  if (days < 1) return 'today';
  if (days < 2) return 'yesterday';
  return `${days} days ago`;
}
