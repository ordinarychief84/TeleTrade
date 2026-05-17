# TeleTrade — Architecture

Production-grade SaaS MVP for telesales in traditional-trade FMCG distribution.
Built as a monorepo to keep the API, web client, shared types and Prisma schema
versioned together.

## High-level

```
┌────────────┐    JWT  ┌────────────┐  Prisma  ┌────────────┐
│ Next.js 14 │ ──────▶ │  NestJS    │ ───────▶ │ PostgreSQL │
│ (apps/web) │         │ (apps/api) │           └────────────┘
└────────────┘         │            │  BullMQ  ┌────────────┐
       ▲ Socket.IO     │            │ ───────▶ │  Redis 7   │
       └───────────────┤            │           └────────────┘
                       │            │  Adapter ┌────────────┐
                       │            │ ───────▶ │  DMS/ERP   │
                       │            │           │ Odoo, SAP, │
                       │            │           │ Dynamics,  │
                       │            │           │ Custom     │
                       │            │           └────────────┘
                       │            │  Adapter ┌────────────┐
                       │            │ ───────▶ │ Telephony  │
                       │            │           │ Mock /     │
                       │            │           │ Twilio /   │
                       │            │           │ AT / SIP   │
                       └────────────┘           └────────────┘
```

## Module boundaries (NestJS)

Every product capability is a NestJS module under `apps/api/src/modules/`. Modules
expose controllers and services; cross-module data flow goes through services,
never controllers.

- `auth` — JWT access + refresh, argon2id, RolesGuard
- `users` — admin list
- `customers` — Customer 360 (CRM core)
- `telephony` — provider-agnostic softphone (Mock provider shipped)
- `calls` — call records, callbacks (BullMQ-delayed SMS dispatch)
- `campaigns` — outbound campaigns, target filters, dialer queue
- `suggestions` — rules-based engine (5 rules, dedup + score)
- `orders` — draft → confirm pipeline, duplicate detection
- `dms` — adapter registry + BullMQ sync queue + webhook receiver
- `territories` — map data
- `reports` — KPI aggregations
- `audit` — log endpoint
- `realtime` — generic Socket.IO gateway

## Adapter patterns

Two integration points are designed for replacement:

**Telephony** (`apps/api/src/modules/telephony/provider.interface.ts`)
- `dial`, `hangup`, `answer`, `simulateInbound`, `onCallEvent`
- Currently ships `MockTelephonyProvider`. Pick via `TELEPHONY_PROVIDER` env.

**DMS** (`apps/api/src/modules/dms/adapter.interface.ts`)
- `pushOrder`, `syncCustomers`, `handleWebhook`
- Ships `OdooAdapter`, `SapB1Adapter`, `Dynamics365Adapter`, `CustomApiAdapter`.
- Resolved at runtime via `DmsRegistry.defaultKind()` reading
  `DMS_DEFAULT_ADAPTER`.

## Exception handling (per spec)

| Spec exception | Where it's handled |
|---|---|
| No IVR selection after 10s | TelephonyService can re-route on timeout (queueing fallback). |
| No agent available | `calls.scheduleCallback` enqueues a BullMQ delayed job — processor logs an SMS dispatch. |
| Language queue unavailable | `Call.languageQueue` is nullable; routing prefers customer's pref then defaults. |
| DMS offline | BullMQ exponential backoff x5; final failure → `DmsSyncStatus.DEAD_LETTER`. Manager retries from `/dms`. |
| Connectivity drop / browser crash | Frontend autosaves order drafts to IndexedDB every 5s; restores on mount. |
| Phone matches multiple outlets | `CustomersService.findByPhone` returns `candidates` for disambiguation. |
| Outbound no-answer after 3 retries | `CampaignTarget.status = UNREACHABLE` (set by agent on outcome). |

## Realtime

- `/softphone` namespace — broadcasts call.* events to agent UIs.
- `/realtime` namespace — generic broadcast for live dashboard updates.

## Audit

Every mutation route decorated with `@Audited('Entity', 'action.name')` writes
an `AuditLog` row through `AuditInterceptor`. Includes actor, IP, user-agent,
and the response payload as `after`.

## Multi-tenancy

`tenantId` on every model. The JWT carries `tenantId`; controllers source it
from `@CurrentUser()`. Postgres RLS is not enabled in MVP — enforced at app
layer — but the schema is ready for `ENABLE ROW LEVEL SECURITY` migrations.

## What's stubbed for MVP

- Real PSTN telephony (provider interface exists, only mock is shipped).
- SAP / Dynamics / Custom adapters simulate success and log payloads. Odoo
  speaks the real JSON-RPC body when credentials are set.
- SMS dispatch is logged, not sent.
- E2E tests (only unit-level coverage on duplicate detector, suggestion
  engine cadence rule, targeting filter translation, DMS registry).

## Local dev

```bash
docker-compose up -d
cp .env.example .env
pnpm install
pnpm db:migrate && pnpm db:seed
pnpm dev
```

- API at `http://localhost:4000/api/v1`
- Web at `http://localhost:3000`

## Commit convention

`type(scope): subject` (conventional commits). Each commit on `main` is a
self-contained logical chunk.
