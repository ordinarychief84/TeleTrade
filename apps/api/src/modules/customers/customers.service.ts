import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CustomerCreateInput,
  CustomerUpdateInput,
  CustomerFilters,
  Pagination,
} from '@teletrade/shared';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string, filters: CustomerFilters, page: Pagination) {
    const where: Prisma.CustomerWhereInput = {
      tenantId,
      ...(filters.status && { status: filters.status }),
      ...(filters.outletType && { outletType: filters.outletType }),
      ...(filters.tier && { accountTier: filters.tier }),
      ...(filters.routeId && { routeId: filters.routeId }),
      ...(filters.territoryId && { territoryId: filters.territoryId }),
      ...(filters.q && {
        OR: [
          { outletName: { contains: filters.q, mode: 'insensitive' } },
          { contactName: { contains: filters.q, mode: 'insensitive' } },
          { phone: { contains: filters.q } },
        ],
      }),
    };
    const [items, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page.page - 1) * page.pageSize,
        take: page.pageSize,
        include: { route: { select: { code: true, name: true } }, territory: { select: { code: true, name: true } } },
      }),
      this.prisma.customer.count({ where }),
    ]);
    return { items, total, page: page.page, pageSize: page.pageSize };
  }

  async findByPhone(tenantId: string, phone: string) {
    // exact match first
    const exact = await this.prisma.customer.findMany({ where: { tenantId, phone } });
    if (exact.length === 1) return { match: exact[0], candidates: exact };
    if (exact.length > 1) return { match: null, candidates: exact };
    // fallback to like-match on last 9 digits to handle international prefix variants
    const tail = phone.replace(/\D/g, '').slice(-9);
    const fuzzy = await this.prisma.customer.findMany({
      where: { tenantId, phone: { contains: tail } },
      take: 10,
    });
    return { match: fuzzy.length === 1 ? fuzzy[0] : null, candidates: fuzzy };
  }

  async get360(tenantId: string, id: string) {
    const c = await this.prisma.customer.findFirst({
      where: { id, tenantId },
      include: {
        route: true,
        territory: true,
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { lines: true },
        },
        calls: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!c) throw new NotFoundException('Customer not found');
    const activePromos = await this.prisma.promotion.findMany({
      where: {
        tenantId,
        active: true,
        startsAt: { lte: new Date() },
        endsAt: { gte: new Date() },
        applicableOutletTypes: { has: c.outletType },
      },
      take: 10,
    });
    return { ...c, activePromos };
  }

  async create(tenantId: string, input: CustomerCreateInput) {
    return this.prisma.customer.create({
      data: {
        tenantId,
        ...input,
        latitude: input.latitude ?? undefined,
        longitude: input.longitude ?? undefined,
        creditLimit: input.creditLimit ?? undefined,
      },
    });
  }

  async update(tenantId: string, id: string, input: CustomerUpdateInput) {
    await this.ensureExists(tenantId, id);
    return this.prisma.customer.update({
      where: { id },
      data: {
        ...input,
        latitude: input.latitude ?? undefined,
        longitude: input.longitude ?? undefined,
        creditLimit: input.creditLimit ?? undefined,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.ensureExists(tenantId, id);
    await this.prisma.customer.delete({ where: { id } });
    return { ok: true };
  }

  private async ensureExists(tenantId: string, id: string) {
    const exists = await this.prisma.customer.findFirst({ where: { id, tenantId }, select: { id: true } });
    if (!exists) throw new NotFoundException('Customer not found');
  }
}
