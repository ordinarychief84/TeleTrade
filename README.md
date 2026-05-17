# TeleTrade

**CRM-integrated telesales platform for traditional-trade FMCG distributors.**

Inbound + outbound call handling, route-aware CRM, suggestion ordering, order creation, DMS/ERP sync, delivery route assignment, and performance analytics — built as a production-grade SaaS web application.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router) · TypeScript · Tailwind · shadcn/ui |
| Backend | NestJS · Node.js 20 · TypeScript |
| Database | PostgreSQL 16 · Prisma |
| Realtime | Socket.IO |
| Queues | BullMQ · Redis 7 |
| Offline | IndexedDB (idb-keyval) |
| Maps | react-leaflet + OpenStreetMap |
| Telephony | Mock adapter (Twilio / Africa's Talking / SIP / PBX pluggable) |
| DMS | Adapter pattern (Odoo · SAP B1 · Dynamics 365 · Custom) |

## Quick start

```bash
# 1. Bring up Postgres + Redis
docker-compose up -d

# 2. Install deps
pnpm install

# 3. Migrate + seed
cp .env.example .env
pnpm db:migrate
pnpm db:seed

# 4. Run the stack
pnpm dev
# api  → http://localhost:4000  (docs at /api/v1/docs)
# web  → http://localhost:3000
```

## Seeded demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@teletrade.demo | password123 |
| Sales Manager | manager@teletrade.demo | password123 |
| Telesales Agent | agent@teletrade.demo | password123 |
| Delivery Ops | delivery@teletrade.demo | password123 |

## Modules

1. **Auth + RBAC** — Admin / Sales Manager / Telesales Agent / Delivery Ops
2. **Customer 360 CRM** — outlet profile + order/call history + suggestions
3. **Telephony** — mock softphone, pluggable provider interface
4. **Inbound flow** — IVR sim, queue routing, callback scheduling
5. **Outbound campaigns** — NPI / Promo / Dormant / Gap-fill / Credit / Survey / Complaint / After-sales
6. **Suggestion engine** — rules-based (cadence, overdue SKU, promo, NPI, outlet type)
7. **Order engine** — draft → confirm → sync, autosaved to IndexedDB every 10s
8. **DMS sync** — Odoo / SAP B1 / Dynamics 365 / Custom, BullMQ retry queue, webhook receiver
9. **Duplicate detection** — same outlet + SKU within 30 min → manager review (never auto-cancel)
10. **Territory map** — outlets, clusters, route coverage, delivery assignments
11. **Reporting** — calls, orders, conversion, AOV, agent perf, route revenue, coverage
12. **Exception handling** — IVR no-input, no agent, DMS offline, browser crash, ambiguous phone, etc.

## Repository layout

```
apps/
  api/      NestJS backend
  web/      Next.js frontend
packages/
  db/       Prisma schema + client + seed
  shared/   Zod schemas + enums + DTO types (shared web/api)
docker-compose.yml
```

## Telephony adapter

`apps/api/src/modules/telephony/provider.interface.ts` defines the `TelephonyProvider` contract. The shipped `MockTelephonyProvider` simulates inbound/outbound + state transitions. To plug in Twilio, Africa's Talking, or SIP, implement the same interface and register it in `TelephonyModule`. Provider selected via `TELEPHONY_PROVIDER` env var.

## DMS adapter

`apps/api/src/modules/dms/adapter.interface.ts` defines `DmsAdapter`. Four implementations ship: `OdooAdapter` (XML-RPC / REST shape), `SapB1Adapter`, `Dynamics365Adapter`, `CustomApiAdapter`. Default adapter via `DMS_DEFAULT_ADAPTER` env var. Sync runs through BullMQ with retries + dead-letter alerting.

## Auto-commits

This MVP is built in many small commits, pushed directly to `main` on `github.com/ordinarychief84/TeleTrade`.

## License

Proprietary — all rights reserved.
