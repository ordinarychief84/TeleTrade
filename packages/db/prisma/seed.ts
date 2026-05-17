/**
 * TeleTrade seed — realistic FMCG distributor demo data.
 *
 *  - 1 tenant
 *  - 4 demo users (admin, sales manager, agent, delivery ops)
 *  - 4 territories, 8 routes
 *  - 30 SKUs across beverages, snacks, personal care, household
 *  - 3 active promos
 *  - 200 traditional-trade outlets across Lagos / Nairobi-style territories
 *  - 50 historical orders, 100 historical calls
 */
import {
  PrismaClient,
  Role,
  CustomerStatus,
  AccountTier,
  OutletType,
  LanguagePreference,
  CallDirection,
  CallStatus,
  CallOutcome,
  OrderStatus,
} from '@prisma/client';
import { randomUUID, createHash } from 'node:crypto';

const prisma = new PrismaClient();

// Lightweight argon2id stand-in for seed: we use a deterministic mock hash
// for the demo password, then real argon2 will be used at runtime.
// The api auth service treats `mock$` prefix as the seeded demo password.
function seedPassword(plain: string): string {
  const h = createHash('sha256').update(`teletrade-seed::${plain}`).digest('hex');
  return `mock$${h}`;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function pickN<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]!);
  }
  return out;
}

function daysAgo(d: number): Date {
  return new Date(Date.now() - d * 24 * 3600 * 1000);
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log('🌱  Seeding TeleTrade...');

  // ---- tenant ----
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: { name: 'TeleTrade Demo Distributor', slug: 'demo' },
  });

  // ---- users ----
  const users = await Promise.all(
    [
      { email: 'admin@teletrade.demo', fullName: 'Ada Admin', role: Role.ADMIN },
      { email: 'manager@teletrade.demo', fullName: 'Maria Manager', role: Role.SALES_MANAGER },
      { email: 'agent@teletrade.demo', fullName: 'Akin Agent', role: Role.AGENT },
      { email: 'delivery@teletrade.demo', fullName: 'Dami Delivery', role: Role.DELIVERY_OPS },
    ].map((u) =>
      prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: {
          tenantId: tenant.id,
          email: u.email,
          fullName: u.fullName,
          role: u.role,
          passwordHash: seedPassword('password123'),
          languages:
            u.role === Role.AGENT
              ? [LanguagePreference.EN, LanguagePreference.YO, LanguagePreference.HA]
              : [LanguagePreference.EN],
        },
      })
    )
  );

  const admin = users[0]!;
  const manager = users[1]!;
  const agent = users[2]!;

  // ---- territories ----
  const territoryDefs = [
    { code: 'LAG-N', name: 'Lagos North' },
    { code: 'LAG-S', name: 'Lagos South' },
    { code: 'IBA-E', name: 'Ibadan East' },
    { code: 'ABJ-C', name: 'Abuja Central' },
  ];
  const territories = await Promise.all(
    territoryDefs.map((t) =>
      prisma.territory.upsert({
        where: { tenantId_code: { tenantId: tenant.id, code: t.code } },
        update: {},
        create: { tenantId: tenant.id, ...t },
      })
    )
  );

  // ---- routes ----
  const routes: { id: string; territoryId: string; code: string }[] = [];
  for (const territory of territories) {
    for (const letter of ['A', 'B']) {
      const code = `${territory.code}-${letter}`;
      const r = await prisma.route.upsert({
        where: { tenantId_code: { tenantId: tenant.id, code } },
        update: {},
        create: {
          tenantId: tenant.id,
          territoryId: territory.id,
          name: `${territory.name} Route ${letter}`,
          code,
          scheduleDow: letter === 'A' ? [1, 3, 5] : [2, 4, 6],
        },
      });
      routes.push({ id: r.id, territoryId: territory.id, code: r.code });
    }
  }

  // ---- SKUs ----
  const skuDefs = [
    // beverages
    { code: 'BEV-MLT-33', name: 'Malta 33cl Can', brand: 'Maltina', category: 'Beverages', unitPrice: 2400, packSize: '24 x 33cl' },
    { code: 'BEV-MLT-50', name: 'Malta 50cl PET', brand: 'Maltina', category: 'Beverages', unitPrice: 3200, packSize: '12 x 50cl' },
    { code: 'BEV-COKE-50', name: 'Coke 50cl PET', brand: 'Coca-Cola', category: 'Beverages', unitPrice: 3000, packSize: '12 x 50cl' },
    { code: 'BEV-FAN-50', name: 'Fanta 50cl PET', brand: 'Coca-Cola', category: 'Beverages', unitPrice: 3000, packSize: '12 x 50cl' },
    { code: 'BEV-SPR-50', name: 'Sprite 50cl PET', brand: 'Coca-Cola', category: 'Beverages', unitPrice: 3000, packSize: '12 x 50cl' },
    { code: 'BEV-CHV-30', name: 'Chivita 100% 1L', brand: 'Chi Ltd', category: 'Beverages', unitPrice: 4200, packSize: '12 x 1L' },
    { code: 'BEV-WAT-75', name: 'Eva Water 75cl', brand: 'Eva', category: 'Beverages', unitPrice: 1800, packSize: '24 x 75cl' },
    { code: 'BEV-PEAK-EVAP', name: 'Peak Evap Milk 170g', brand: 'Peak', category: 'Beverages', unitPrice: 5400, packSize: '48 x 170g' },

    // snacks
    { code: 'SNK-IND-INDOM', name: 'Indomie Chicken 70g', brand: 'Indomie', category: 'Snacks', unitPrice: 7500, packSize: '40 x 70g' },
    { code: 'SNK-IND-HOT', name: 'Indomie Hot & Spicy 70g', brand: 'Indomie', category: 'Snacks', unitPrice: 7500, packSize: '40 x 70g' },
    { code: 'SNK-GAL-CRK', name: 'Gala Sausage Roll', brand: 'UAC', category: 'Snacks', unitPrice: 4200, packSize: '20 x 60g' },
    { code: 'SNK-BIS-CABIN', name: 'Cabin Biscuit', brand: 'Yale', category: 'Snacks', unitPrice: 3600, packSize: '24 packs' },
    { code: 'SNK-BIS-TBC', name: 'TC Biscuit', brand: 'Beloxxi', category: 'Snacks', unitPrice: 4800, packSize: '36 packs' },
    { code: 'SNK-PRG-MELON', name: 'Pringles Melon 165g', brand: 'Pringles', category: 'Snacks', unitPrice: 8200, packSize: '12 cans' },

    // personal care
    { code: 'PC-DET-OMO-1KG', name: 'Omo Detergent 1kg', brand: 'Unilever', category: 'Personal Care', unitPrice: 9200, packSize: '12 x 1kg' },
    { code: 'PC-DET-OMO-90', name: 'Omo Sachet 90g', brand: 'Unilever', category: 'Personal Care', unitPrice: 3400, packSize: '48 x 90g' },
    { code: 'PC-SP-LUX-175', name: 'Lux Bar Soap 175g', brand: 'Unilever', category: 'Personal Care', unitPrice: 4800, packSize: '48 bars' },
    { code: 'PC-TP-CLG-150', name: 'Colgate 150g', brand: 'Colgate', category: 'Personal Care', unitPrice: 5400, packSize: '12 tubes' },
    { code: 'PC-DEO-RXN-150', name: 'Rexona Deo 150ml', brand: 'Unilever', category: 'Personal Care', unitPrice: 6200, packSize: '12 cans' },
    { code: 'PC-PAMP-S4', name: 'Pampers Size 4 x44', brand: 'P&G', category: 'Personal Care', unitPrice: 12200, packSize: '4 packs' },

    // household
    { code: 'HH-BLEACH-1L', name: 'Hypo Bleach 1L', brand: 'Hypo', category: 'Household', unitPrice: 4600, packSize: '12 x 1L' },
    { code: 'HH-AIR-FRSH', name: 'Air Freshener 300ml', brand: 'Glade', category: 'Household', unitPrice: 5400, packSize: '12 cans' },
    { code: 'HH-INSECT-300', name: 'Raid Insecticide 300ml', brand: 'Raid', category: 'Household', unitPrice: 6200, packSize: '12 cans' },
    { code: 'HH-TISS-72', name: 'Rose Tissue x10', brand: 'Rose', category: 'Household', unitPrice: 2800, packSize: '72 rolls' },

    // staples
    { code: 'STP-OIL-PALM-5L', name: 'Palm Oil 5L', brand: 'Mamador', category: 'Staples', unitPrice: 14200, packSize: '4 x 5L' },
    { code: 'STP-OIL-VEG-5L', name: 'Vegetable Oil 5L', brand: 'Devon', category: 'Staples', unitPrice: 13800, packSize: '4 x 5L' },
    { code: 'STP-SUG-1KG', name: 'Cube Sugar 1kg', brand: 'St. Louis', category: 'Staples', unitPrice: 3800, packSize: '24 x 1kg' },
    { code: 'STP-SAL-500', name: 'Iodised Salt 500g', brand: 'Mr Chef', category: 'Staples', unitPrice: 2200, packSize: '48 x 500g' },
    { code: 'STP-FLR-2KG', name: 'Wheat Flour 2kg', brand: 'Golden Penny', category: 'Staples', unitPrice: 5400, packSize: '10 x 2kg' },
    { code: 'STP-RICE-50KG', name: 'Local Rice 50kg', brand: 'Mama Gold', category: 'Staples', unitPrice: 78000, packSize: '1 bag' },
  ];

  const skus = await Promise.all(
    skuDefs.map((s) =>
      prisma.sku.upsert({
        where: { tenantId_code: { tenantId: tenant.id, code: s.code } },
        update: {},
        create: { tenantId: tenant.id, ...s },
      })
    )
  );

  // ---- promotions ----
  const promos = await Promise.all([
    prisma.promotion.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: 'PROMO-MALTA-Q2' } },
      update: {},
      create: {
        tenantId: tenant.id,
        code: 'PROMO-MALTA-Q2',
        name: 'Q2 Malta Booster',
        description: 'Buy 10 cases of Malta 33cl, get 1 free',
        startsAt: daysAgo(15),
        endsAt: daysAgo(-30),
        applicableSkus: ['BEV-MLT-33', 'BEV-MLT-50'],
        applicableOutletTypes: [OutletType.KIOSK, OutletType.BAR, OutletType.RESTAURANT, OutletType.MINI_MART],
        freeUnits: 1,
        discountPct: null,
      },
    }),
    prisma.promotion.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: 'PROMO-INDOM-NPI' } },
      update: {},
      create: {
        tenantId: tenant.id,
        code: 'PROMO-INDOM-NPI',
        name: 'Indomie Hot & Spicy Launch',
        description: 'NPI launch — 5% trade discount on Hot & Spicy 70g',
        startsAt: daysAgo(7),
        endsAt: daysAgo(-21),
        applicableSkus: ['SNK-IND-HOT'],
        applicableOutletTypes: Object.values(OutletType),
        discountPct: 5,
      },
    }),
    prisma.promotion.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: 'PROMO-OMO-BULK' } },
      update: {},
      create: {
        tenantId: tenant.id,
        code: 'PROMO-OMO-BULK',
        name: 'Omo Bulk Bundle',
        description: '3% off on Omo 1kg orders of 5+ cases',
        startsAt: daysAgo(30),
        endsAt: daysAgo(-15),
        applicableSkus: ['PC-DET-OMO-1KG', 'PC-DET-OMO-90'],
        applicableOutletTypes: [OutletType.SUPERMARKET, OutletType.MINI_MART, OutletType.WHOLESALER],
        discountPct: 3,
      },
    }),
  ]);

  // ---- customers ----
  const customerCount = 200;
  console.log(`  → creating ${customerCount} outlets...`);

  const firstNames = ['Adaeze', 'Bola', 'Chiamaka', 'Dami', 'Efe', 'Funke', 'Gbenga', 'Halima', 'Ibrahim', 'Jide', 'Kemi', 'Lola', 'Musa', 'Ngozi', 'Obi', 'Patience', 'Rahma', 'Seyi', 'Tunde', 'Uche', 'Wale', 'Yemi', 'Zainab'];
  const lastNames = ['Okafor', 'Adeyemi', 'Bello', 'Eze', 'Ibrahim', 'Lawal', 'Mohammed', 'Nwosu', 'Olawale', 'Obi', 'Sani', 'Yusuf', 'Onyeka', 'Adebayo', 'Garba'];
  const outletPrefixes = ['Mama', 'Baba', 'Auntie', 'Bro', 'Sister', 'Chief', 'Hajia', 'Alhaji'];
  const outletNamePool = ['Stores', 'Mart', 'Provisions', 'Supermarket', 'Drinks Joint', 'Cool Spot', 'Kiosk', 'Foods', 'Stop', 'Plaza'];

  const baseCoords = {
    'LAG-N': { lat: 6.62, lng: 3.36 },
    'LAG-S': { lat: 6.45, lng: 3.38 },
    'IBA-E': { lat: 7.39, lng: 3.92 },
    'ABJ-C': { lat: 9.07, lng: 7.50 },
  } as const;

  const customers = [] as { id: string; phone: string; routeId: string | null; territoryId: string }[];

  for (let i = 0; i < customerCount; i++) {
    const route = pick(routes);
    const territory = territories.find((t) => t.id === route.territoryId)!;
    const territoryCode = territory.code as keyof typeof baseCoords;
    const baseLat = baseCoords[territoryCode].lat;
    const baseLng = baseCoords[territoryCode].lng;
    const outletType = pick(Object.values(OutletType));
    const tier = pick([AccountTier.A, AccountTier.B, AccountTier.B, AccountTier.C, AccountTier.C, AccountTier.D]);
    const isDormant = Math.random() < 0.18;
    const isPhoneOnly = Math.random() < 0.12;
    const status = isDormant
      ? CustomerStatus.DORMANT
      : isPhoneOnly
        ? CustomerStatus.PHONE_ONLY
        : Math.random() < 0.04
          ? CustomerStatus.UNREACHABLE
          : CustomerStatus.ACTIVE;
    const fname = pick(firstNames);
    const lname = pick(lastNames);
    const outletName = `${pick(outletPrefixes)} ${fname} ${pick(outletNamePool)}`;
    const contactName = `${fname} ${lname}`;
    const phone = `+2348${rand(1, 9)}${String(rand(0, 99999999)).padStart(8, '0')}`;
    const preferredSkus = pickN(skus, rand(2, 5)).map((s) => s.code);
    const lastOrderDaysAgo = isDormant ? rand(40, 120) : rand(2, 30);

    const c = await prisma.customer.create({
      data: {
        tenantId: tenant.id,
        outletName,
        contactName,
        phone,
        languagePreference: pick([
          LanguagePreference.EN,
          LanguagePreference.EN,
          LanguagePreference.YO,
          LanguagePreference.HA,
          LanguagePreference.IG,
        ]),
        outletType,
        address: `${rand(1, 250)} ${pick(['Allen', 'Awolowo', 'Herbert Macaulay', 'Adeniyi Jones', 'Olusegun Obasanjo', 'Ahmadu Bello'])} Road`,
        latitude: baseLat + (Math.random() - 0.5) * 0.15,
        longitude: baseLng + (Math.random() - 0.5) * 0.15,
        routeId: route.id,
        territoryId: territory.id,
        accountTier: tier,
        status,
        preferredSkus,
        nextDeliveryDate: status === CustomerStatus.ACTIVE ? daysAgo(-rand(1, 7)) : null,
        lastOrderDate: status === CustomerStatus.ACTIVE || status === CustomerStatus.DORMANT ? daysAgo(lastOrderDaysAgo) : null,
        creditLimit: tier === AccountTier.A ? 500000 : tier === AccountTier.B ? 250000 : 100000,
        outstandingBalance: Math.random() < 0.3 ? rand(5000, 80000) : 0,
        notes: Math.random() < 0.2 ? 'Prefers morning delivery before 10am' : null,
      },
    });
    customers.push({ id: c.id, phone: c.phone, routeId: c.routeId, territoryId: c.territoryId! });
  }

  // ---- historical orders + delivery assignments ----
  console.log('  → creating historical orders + deliveries...');
  const delivery = users.find((u) => u.email === 'delivery@teletrade.demo')!;
  const todayMorning = (() => {
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    return d;
  })();
  let deliveriesToday = 0;
  for (let i = 0; i < 50; i++) {
    const customer = pick(customers);
    const orderSkus = pickN(skus, rand(2, 5));
    let subtotal = 0;
    const linesData = orderSkus.map((sku) => {
      const qty = rand(1, 8);
      const lineTotal = Number(sku.unitPrice) * qty;
      subtotal += lineTotal;
      return {
        skuId: sku.id,
        skuCode: sku.code,
        name: sku.name,
        qty,
        unitPrice: sku.unitPrice,
        lineTotal,
      };
    });
    const discount = Math.random() < 0.3 ? Math.round(subtotal * 0.03) : 0;
    const total = subtotal - discount;

    const status = pick([
      OrderStatus.SYNCED,
      OrderStatus.SYNCED,
      OrderStatus.SYNCED,
      OrderStatus.DELIVERED,
      OrderStatus.OUT_FOR_DELIVERY,
    ]);
    const createdOrder = await prisma.order.create({
      data: {
        tenantId: tenant.id,
        orderReference: `ORD-${Date.now()}-${i.toString().padStart(4, '0')}`,
        customerId: customer.id,
        agentId: agent.id,
        routeId: customer.routeId,
        status,
        subtotal,
        discount,
        total,
        confirmedAt: daysAgo(rand(2, 60)),
        syncedAt: daysAgo(rand(1, 59)),
        lines: { create: linesData },
      },
    });

    // For ~10 of these orders, drop a delivery on today's run so the
    // driver has a real route on first login.
    if (deliveriesToday < 10 && customer.routeId) {
      deliveriesToday++;
      const dStatus = pick([
        'PLANNED',
        'PLANNED',
        'PLANNED',
        'PICKED',
        'IN_TRANSIT',
        'DELIVERED',
      ] as const);
      await prisma.deliveryAssignment.create({
        data: {
          tenantId: tenant.id,
          orderId: createdOrder.id,
          customerId: customer.id,
          routeId: customer.routeId,
          driverId: delivery.id,
          status: dStatus as any,
          scheduledFor: todayMorning,
          sequence: deliveriesToday,
          startedAt: dStatus !== 'PLANNED' ? new Date() : null,
          deliveredAt: dStatus === 'DELIVERED' ? new Date() : null,
          amountCollected: dStatus === 'DELIVERED' ? total : null,
          paymentMethod: dStatus === 'DELIVERED' ? 'CASH' : null,
        },
      });
    }
  }

  // ---- historical calls ----
  console.log('  → creating historical calls...');
  for (let i = 0; i < 100; i++) {
    const customer = pick(customers);
    const direction = Math.random() < 0.55 ? CallDirection.INBOUND : CallDirection.OUTBOUND;
    const status = pick([CallStatus.COMPLETED, CallStatus.COMPLETED, CallStatus.MISSED, CallStatus.DROPPED]);
    const outcome =
      status === CallStatus.COMPLETED
        ? pick([CallOutcome.ORDER_CREATED, CallOutcome.NO_ORDER, CallOutcome.CALLBACK_SCHEDULED, CallOutcome.INFO_REQUEST])
        : null;
    const queued = daysAgo(rand(1, 45));
    const connected = status === CallStatus.COMPLETED ? new Date(queued.getTime() + rand(5, 20) * 1000) : null;
    const ended = connected ? new Date(connected.getTime() + rand(30, 600) * 1000) : null;

    await prisma.call.create({
      data: {
        tenantId: tenant.id,
        direction,
        status,
        outcome,
        languageQueue: customer.id ? LanguagePreference.EN : undefined,
        customerId: customer.id,
        agentId: agent.id,
        fromNumber: direction === CallDirection.INBOUND ? customer.phone : '+2348000000000',
        toNumber: direction === CallDirection.INBOUND ? '+2348000000000' : customer.phone,
        queuedAt: queued,
        ringingAt: queued,
        connectedAt: connected,
        endedAt: ended,
        durationSec: ended && connected ? Math.round((ended.getTime() - connected.getTime()) / 1000) : null,
        notes: outcome === CallOutcome.NO_ORDER ? 'Will reorder next route day' : null,
      },
    });
  }

  // ---- audit log seed entry ----
  await prisma.auditLog.create({
    data: {
      tenantId: tenant.id,
      actorId: admin.id,
      action: 'system.seed',
      entity: 'Tenant',
      entityId: tenant.id,
      after: { seededAt: new Date().toISOString(), customers: customerCount },
    },
  });

  console.log('✅  Seed complete');
  console.log(`   Tenant: ${tenant.slug}`);
  console.log(`   Users: ${users.map((u) => u.email).join(', ')}`);
  console.log(`   Customers: ${customerCount}, SKUs: ${skus.length}, Routes: ${routes.length}, Promos: ${promos.length}`);
  console.log(`   Demo password for all users: password123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
