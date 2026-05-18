import { Injectable, BadRequestException, ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  WorkspaceUpdateInput,
  PlanChangeInput,
  ChangePasswordInput,
  DmsConfigInput,
  CloseWorkspaceInput,
  Role,
  PlanTier,
} from '@teletrade/shared';
import { AuthService } from '../auth/auth.service';

const SEATS_BY_PLAN: Record<PlanTier, number> = {
  FREE: 3,
  STARTER: 10,
  GROWTH: 50,
  ENTERPRISE: 250,
};

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService, private readonly auth: AuthService) {}

  async getWorkspace(tenantId: string) {
    const t = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        seatLimit: true,
        industry: true,
        country: true,
        timezone: true,
        billingEmail: true,
        logoUrl: true,
        dmsAdapter: true,
        dmsConfig: true,
        deletedAt: true,
        createdAt: true,
      },
    });
    if (!t) throw new NotFoundException('Workspace not found');

    const [seatsUsed, userCount, customerCount, orderCount] = await Promise.all([
      this.prisma.user.count({ where: { tenantId, active: true } }),
      this.prisma.user.count({ where: { tenantId } }),
      this.prisma.customer.count({ where: { tenantId } }),
      this.prisma.order.count({ where: { tenantId } }),
    ]);

    return {
      ...t,
      seatsUsed,
      seatsAvailable: Math.max(0, t.seatLimit - seatsUsed),
      stats: { users: userCount, customers: customerCount, orders: orderCount },
    };
  }

  async updateWorkspace(tenantId: string, input: WorkspaceUpdateInput) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(input.name && { name: input.name.trim() }),
        ...(input.industry !== undefined && { industry: input.industry }),
        ...(input.country !== undefined && { country: input.country }),
        ...(input.timezone !== undefined && { timezone: input.timezone }),
        ...(input.billingEmail !== undefined && { billingEmail: input.billingEmail }),
        ...(input.logoUrl !== undefined && { logoUrl: input.logoUrl }),
      },
      select: { id: true, name: true, industry: true, country: true, timezone: true, billingEmail: true, logoUrl: true },
    });
  }

  async changePlan(tenantId: string, input: PlanChangeInput) {
    const newLimit = SEATS_BY_PLAN[input.plan];
    const seatsUsed = await this.prisma.user.count({ where: { tenantId, active: true } });
    if (seatsUsed > newLimit) {
      throw new BadRequestException(
        `You have ${seatsUsed} active users — downgrading to ${input.plan} (${newLimit} seats) requires deactivating ${seatsUsed - newLimit} first.`
      );
    }
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { plan: input.plan, seatLimit: newLimit },
      select: { id: true, plan: true, seatLimit: true },
    });
  }

  async billingSnapshot(tenantId: string) {
    const t = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true, seatLimit: true, createdAt: true, billingEmail: true },
    });
    if (!t) throw new NotFoundException('Workspace not found');
    const seatsUsed = await this.prisma.user.count({ where: { tenantId, active: true } });
    // Mock invoice history — last 6 months at the current plan price.
    const PRICE: Record<PlanTier, number> = { FREE: 0, STARTER: 199, GROWTH: 799, ENTERPRISE: 2499 };
    const invoices: { id: string; period: string; amount: number; status: 'PAID' | 'DUE'; issuedAt: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      if (d < t.createdAt) break;
      invoices.push({
        id: `INV-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`,
        period: d.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        amount: PRICE[t.plan],
        status: i === 0 ? 'DUE' : 'PAID',
        issuedAt: d.toISOString(),
      });
    }
    return {
      plan: t.plan,
      seatLimit: t.seatLimit,
      seatsUsed,
      billingEmail: t.billingEmail,
      monthlyTotal: PRICE[t.plan],
      invoices,
    };
  }

  async sessions(userId: string) {
    const rows = await this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, userAgent: true, ip: true, createdAt: true, expiresAt: true },
    });
    return rows;
  }

  async revokeSession(userId: string, sessionId: string) {
    const row = await this.prisma.refreshToken.findFirst({ where: { id: sessionId, userId } });
    if (!row) throw new NotFoundException('Session not found');
    await this.prisma.refreshToken.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    // Verify current password via auth service login flow.
    try {
      await this.auth.login(user.email, input.currentPassword);
    } catch {
      throw new UnauthorizedException('Current password is incorrect.');
    }
    const passwordHash = await this.auth.hashPassword(input.newPassword);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    // Revoke all other sessions so a leak doesn't outlast the change.
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  async updateDms(tenantId: string, input: DmsConfigInput) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        dmsAdapter: input.adapter,
        dmsConfig: {
          url: input.url ?? null,
          apiKey: input.apiKey ? '***' + input.apiKey.slice(-4) : null, // store masked hint only in the JSON for safety in MVP
          database: input.database ?? null,
          username: input.username ?? null,
          // In production, the apiKey would be encrypted at rest. For the demo we only echo the last 4.
        },
      },
      select: { dmsAdapter: true, dmsConfig: true },
    });
  }

  async integrationsSnapshot(tenantId: string) {
    const t = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { dmsAdapter: true, dmsConfig: true },
    });
    if (!t) throw new NotFoundException('Workspace not found');

    const [pending, failed, deadLetter, succeeded24h, lastWebhook] = await Promise.all([
      this.prisma.dmsSyncJob.count({ where: { tenantId, status: 'PENDING' } }),
      this.prisma.dmsSyncJob.count({ where: { tenantId, status: 'FAILED' } }),
      this.prisma.dmsSyncJob.count({ where: { tenantId, status: 'DEAD_LETTER' } }),
      this.prisma.dmsSyncJob.count({
        where: { tenantId, status: 'SUCCEEDED', finishedAt: { gt: new Date(Date.now() - 24 * 3600 * 1000) } },
      }),
      this.prisma.webhookEvent.findFirst({ where: { tenantId }, orderBy: { createdAt: 'desc' } }),
    ]);

    return {
      dms: {
        adapter: t.dmsAdapter ?? process.env.DMS_DEFAULT_ADAPTER?.toUpperCase() ?? 'ODOO',
        config: t.dmsConfig,
        health: { pending, failed, deadLetter, succeeded24h },
      },
      telephony: {
        provider: process.env.TELEPHONY_PROVIDER ?? 'mock',
        // managed at the platform level for MVP
      },
      webhooks: {
        endpoint: `${process.env.API_URL ?? 'http://localhost:4100'}/api/v1/dms/webhooks/{adapter}`,
        lastReceived: lastWebhook?.createdAt ?? null,
      },
    };
  }

  async closeWorkspace(tenantId: string, actorId: string, actorRole: string, input: CloseWorkspaceInput) {
    if (actorRole !== Role.ADMIN) throw new ForbiddenException('Only an admin can close the workspace.');
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } });
    if (!tenant) throw new NotFoundException('Workspace not found');
    if (input.confirm.trim() !== tenant.name) {
      throw new BadRequestException(`Type the workspace name exactly ("${tenant.name}") to confirm.`);
    }
    const user = await this.prisma.user.findUnique({ where: { id: actorId } });
    if (!user) throw new UnauthorizedException();
    try {
      await this.auth.login(user.email, input.password);
    } catch {
      throw new UnauthorizedException('Password is incorrect.');
    }
    // Soft-close: mark deletedAt, deactivate every user, revoke every session.
    await this.prisma.$transaction([
      this.prisma.tenant.update({ where: { id: tenantId }, data: { deletedAt: new Date() } }),
      this.prisma.user.updateMany({ where: { tenantId }, data: { active: false } }),
      this.prisma.refreshToken.updateMany({
        where: { user: { tenantId }, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      this.prisma.invitation.updateMany({
        where: { tenantId, status: 'PENDING' },
        data: { status: 'REVOKED' },
      }),
    ]);
    return { ok: true, closedAt: new Date().toISOString() };
  }
}
