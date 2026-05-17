# UX plan ↔ implementation map

This document maps the mobile UX plan to where each screen, state, and pattern lives in the codebase. It's the engineer's checklist that tells a PM "yes, that screen exists, here's the file."

## Shared / cross-cutting

| Plan screen | Implementation |
|---|---|
| **S0 · Splash / auth gate** | `apps/web/app/(app)/layout.tsx` — `Loading TeleTrade…` while `/auth/me` resolves, then redirect to `/login` or render shell |
| **S1 · Sign in** | `apps/web/app/(auth)/login/page.tsx` — email + password, demo-account hint card, error inline under fields |
| **Sx · Notifications inbox** | `apps/web/app/(app)/inbox/page.tsx` (UI) + `apps/api/src/modules/inbox/inbox.service.ts` (aggregator) — role-filtered feed, icon per kind, severity tint |
| **Sy · Settings** | `apps/web/app/(app)/settings/page.tsx` (admin scope — users + audit log) |
| **Mobile shell** | `apps/web/app/(app)/layout.tsx` — sidebar collapses to Sheet drawer on `<md`, bottom tab bar (max 5, role-aware) on mobile, Bell→Inbox in the top bar |
| **Sheet primitive** | `apps/web/components/ui/sheet.tsx` — Radix Dialog wrapper, used for drawer + future bottom sheets |
| **Multi-select dropdown** | `apps/web/components/ui/multi-select.tsx` — Radix DropdownMenu, "N selected" trigger, clear-all footer |

## Telesales Agent (mobile companion)

| Plan screen | Implementation | Notes |
|---|---|---|
| **A1 · Today** | `app/(app)/dashboard/page.tsx` | KPI grid 2-up mobile / 4-up desktop, skeleton tiles, named greeting, "refreshed 4:12 PM" caption, 60s polling. Duplicates KPI hidden for agents (per role). |
| **A2 · Call log** | (server) `apps/api/src/modules/calls/calls.controller.ts` — `GET /calls`. UI uses the customer 360 call list for now; a dedicated screen is a follow-up. |
| **A3 · Quick customer search** | `app/(app)/customers/page.tsx` | Sticky 44px search input with clear-X, recent-5 chips persisted in `localStorage` (`tt.recentCustomers`), tap-to-call from each row, "No outlets match 'XXX'" empty state. |
| **A4 · Customer 360** | `app/(app)/customers/[id]/page.tsx` | Tier badge, route + next delivery + last-order strip, active promos, recent orders, recent calls. |
| **A5 · My queue** | `app/(app)/campaigns/page.tsx` (agent role branch) | Renders campaign targets table instead of the manager builder when role = AGENT/DELIVERY_OPS. |

## Sales Manager (mobile-first dashboard)

| Plan screen | Implementation | Notes |
|---|---|---|
| **M1 · KPI cockpit** | `app/(app)/dashboard/page.tsx` | 60s background refresh, "last refreshed" caption, duplicates KPI deep-links to `/duplicates` and shows destructive border when >0. |
| **M2 · Live campaign feed** | `app/(app)/campaigns/page.tsx` + `app/(app)/campaigns/[id]/page.tsx` | Builder for managers, target preview, approve & start. |
| **M3 · Duplicate review** | `app/(app)/duplicates/page.tsx` | Side-by-side cards, overlapping SKUs bolded, header copy ("8 min apart · 2 SKUs in common"), 4 thumb-sized action buttons. |
| **M4 · Approve campaign** | `/campaigns/preview-targets` + approve button | Preview shows match count + sample; approve enqueues dialer jobs. |
| **M5 · Team activity** | `app/(app)/reports/page.tsx` (agent breakdown table) + `app/(app)/settings/page.tsx` (audit log) | Manager-on-the-go view of who's doing what. |

## Delivery Ops (mobile-primary)

This is the brand-new flow — the biggest delta in this UX pass.

| Plan screen | Implementation | Notes |
|---|---|---|
| **D1 · Today's route** | `app/(app)/route/page.tsx` | Route header, Done/Left/Failed tiles, pinned Next-Stop card with Call + Navigate, full stops list, "End run" only when 0 left. |
| **D2 · Stop list** | (same page) | Sequence-numbered rows, delivered rows visually collapse, failed rows get destructive border. |
| **D3 · Stop detail** | `app/(app)/route/[id]/page.tsx` | Outlet + order line items + state-aware primary CTA. Sub-flows: cash collection, fail. |
| **D4 · Failed delivery** | `FailFlow` inside `app/(app)/route/[id]/page.tsx` | 6 reason chips, notes, "Reschedule for tomorrow" checkbox. |
| **Cash sub-flow** | `CashFlow` inside `app/(app)/route/[id]/page.tsx` | Big amount input pre-filled with order total, payment method, instant short/surplus delta, server-side 10% sanity guard. |
| **D5 · End-of-run summary** | `app/(app)/route/summary/page.tsx` | 4 tiles, expected vs. collected delta, refuses to close if any stop still open, then named-day-out "Run closed. Nice work." |

Backend in `apps/api/src/modules/deliveries/`:
- `DeliveriesService.assignForOrder` — called automatically from `OrdersService.confirm` so every confirmed order lands on a driver's route, on the next route day, sequence-numbered.
- Driver round-robin: deterministic hash of `routeId` so the same route prefers the same driver.
- `GET /deliveries/my-route` — today + leftover open stops, with per-status totals.
- `PATCH /deliveries/:id/status` — state machine: PLANNED → PICKED → IN_TRANSIT → DELIVERED/FAILED/RESCHEDULED. DELIVERED cascades `Order.status`.
- `POST /deliveries/:id/cash` — records amount + method; rejects collected total >110% of order total.
- `GET /deliveries/end-of-run` — refuses to close while stops are still PLANNED/PICKED/IN_TRANSIT.

## Cross-screen patterns

| Pattern | Implementation |
|---|---|
| **Skeleton-then-fade** | `animate-pulse` placeholder cards on dashboard, route, inbox, customers list, orders list, duplicates. No `Loading…` strings. |
| **Stale-data caption** | Dashboard: "refreshed 4:12 PM (refreshing…)". Route home: "refreshing…" inline while React Query revalidates. |
| **Tap-to-call everywhere** | Phone numbers wrapped in `<a href="tel:...">`. Used in customer rows, customer 360, stop detail, route home. |
| **Optimistic writes (best-effort)** | Order confirm → DMS sync + delivery assign run as side-effects, never block the response. |
| **Error cards with retry** | Every page-level query handles `isError`: dashboard, route, inbox, customers, orders, duplicates. |
| **Mutation pending state** | Campaign builder + Duplicate buttons + Delivery actions all show "Saving…" / disabled while in-flight. |
| **Microcopy** | "All quiet. Good." (inbox empty). "The 30-minute window's been clean." (duplicates empty). "Thank Mrs Adaeze." (delivered card). "Loading your day." (planned for splash, current state matches). |

## What's stubbed (documented follow-ups)

- **Retailer/Outlet companion app (R1–R5)** — separate auth context for outlet owners, not internal staff. Planned as a separate Next.js route group `/shop/*` with its own login (phone OTP), gated by a `customer_token` JWT. Tracking issue: TODO.
- **Voice search on customer lookup** — input + mic icon spec'd in the plan; the icon is intentionally absent until a Web Speech API integration ships behind a feature flag.
- **Biometric / PIN unlock on sign-in** — requires native shell or PWA + WebAuthn. Sign-in remains email+password.
- **Push notifications** — server-side aggregation lives in `/inbox`; surfacing them as OS push requires Service Worker + provider (Firebase/WebPush). The bell badge is fed live from `/inbox` poll on a 30s interval.
- **Streak / retention micro-rewards** — schema captures the data (audit log + reports); UI surfaces "delivered N stops on time" in the EOR summary, but daily-streak rendering on Today is a follow-up.

## Verification

After running `pnpm dev`:

1. **Driver mobile flow** — log in as `delivery@teletrade.demo`, visit `/route` (10 seeded stops), tap a stop, mark delivered & collect cash, end run, see summary.
2. **Agent companion** — log in as `agent@teletrade.demo`, search a customer, tap-to-call from a row, simulate inbound on `/call`, watch the suggestion engine fire.
3. **Manager review** — log in as `manager@teletrade.demo`, hit `/duplicates` (seeded with at least one flagged order if you've confirmed two within 30 min), pick a decision card.
4. **Inbox** — works for every role; bell icon in the mobile top bar routes there.
5. **Tests** — `pnpm test` runs `DeliveriesService` unit tests (round-robin, cash guardrails, EOR refusal) alongside existing duplicate-detector / cadence-rule / DMS-registry suites.
