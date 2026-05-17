# TeleTrade — Setup Guide

## Prerequisites

- Node.js 20+
- pnpm 9+ (`npm i -g pnpm`)
- Docker Desktop (for local Postgres + Redis)

## First run

```bash
# 1. Postgres + Redis
docker-compose up -d

# 2. Install deps
pnpm install

# 3. Env
cp .env.example .env

# 4. Migrate + seed (200 outlets, 30 SKUs, 4 users, etc.)
pnpm db:migrate
pnpm db:seed

# 5. Start API + Web in parallel
pnpm dev
```

| URL | What |
|---|---|
| http://localhost:3000 | Web UI |
| http://localhost:4000/api/v1/health | API health check |

## Sign in

| Role | Email | Password |
|---|---|---|
| Admin | admin@teletrade.demo | password123 |
| Sales Manager | manager@teletrade.demo | password123 |
| Telesales Agent | agent@teletrade.demo | password123 |
| Delivery Ops | delivery@teletrade.demo | password123 |

## End-to-end flow walk-through

1. **Login as `agent@teletrade.demo`** → land on `/dashboard`.
2. **Softphone (`/call`)**:
   - Pick a real customer phone from `/customers` (right-click → copy phone).
   - Paste into the softphone "Simulate inbound call" field, click the button.
   - CRM panel loads with the customer 360 + suggestions in under 2s.
   - Click **Answer**, then add 1–2 suggested SKUs.
   - Click **Confirm order**. The order goes through duplicate detection
     and then schedules DMS sync (BullMQ).
3. **Trigger a duplicate**: confirm a second order with at least one
   overlapping SKU for the same customer within 30 min. The second
   order appears under `/duplicates` as **Sales Manager**.
4. **Log out and log in as `manager@teletrade.demo`**:
   - `/campaigns` — build a `PROMO_PUSH` filtered by `accountTier=A`,
     **Preview targets**, then **Save as draft**, then **Approve & start**.
   - `/duplicates` — review the flagged duplicate (Keep both / Cancel /
     Merge / Mark valid).
   - `/dms` — see the sync jobs progress through `PENDING → SUCCEEDED`.
5. **`/territory`** — Leaflet map shows all 200 outlets coloured by status.
6. **`/reports`** — 30-day aggregates with charts.

## CI workflow

A reference `ci.yml` is sketched in `docs/ARCHITECTURE.md`. The GitHub
OAuth token used for the first push lacked the `workflow` scope, so the
workflow file isn't checked in — add it manually under
`.github/workflows/ci.yml` (Postgres + Redis services, `pnpm test`).

## Adapter configuration

### Telephony

```
TELEPHONY_PROVIDER=mock     # mock | twilio | africastalking | sip
```

Real provider integration: implement `TelephonyProvider` in
`apps/api/src/modules/telephony/` and register it in `telephony.module.ts`.

### DMS

```
DMS_DEFAULT_ADAPTER=odoo    # odoo | sap_b1 | dynamics_365 | custom
DMS_ODOO_URL=https://your-odoo
DMS_ODOO_DB=your-db
DMS_ODOO_USERNAME=...
DMS_ODOO_API_KEY=...
DMS_CUSTOM_URL=https://your-erp
DMS_CUSTOM_TOKEN=...
```

If `DMS_ODOO_URL` is unset, the Odoo adapter simulates a successful
push and logs the shaped payload — perfect for the demo, no real ERP
required.

## Resetting

```bash
pnpm db:reset       # drops + recreates + re-seeds (destructive)
docker-compose down # stops Postgres + Redis (keeps volume)
```
