import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { Role, InviteInput, UpdateUserInput, InvitationStatus } from '@teletrade/shared';

const INVITE_TTL_DAYS = 7;

@Injectable()
export class TeamService {
  private readonly log = new Logger('Team');

  constructor(private readonly prisma: PrismaService) {}

  /** Workspace overview shown on /settings/team. */
  async overview(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        seatLimit: true,
        industry: true,
        country: true,
        billingEmail: true,
      },
    });
    if (!tenant) throw new NotFoundException('Workspace not found');

    const [users, invitations, seatsUsed] = await Promise.all([
      this.prisma.user.findMany({
        where: { tenantId },
        orderBy: [{ active: 'desc' }, { createdAt: 'asc' }],
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          active: true,
          lastLoginAt: true,
          createdAt: true,
        },
      }),
      this.prisma.invitation.findMany({
        where: { tenantId, status: { in: ['PENDING', 'EXPIRED'] } },
        orderBy: { createdAt: 'desc' },
        include: { invitedBy: { select: { fullName: true } } },
      }),
      this.prisma.user.count({ where: { tenantId, active: true } }),
    ]);

    return {
      tenant: {
        ...tenant,
        seatsUsed,
        seatsAvailable: Math.max(0, tenant.seatLimit - seatsUsed),
      },
      users,
      invitations: invitations.map((i) => ({
        id: i.id,
        email: i.email,
        fullName: i.fullName,
        role: i.role,
        status: i.status,
        invitedBy: i.invitedBy.fullName,
        expiresAt: i.expiresAt,
        createdAt: i.createdAt,
      })),
    };
  }

  async invite(tenantId: string, invitedById: string, input: InviteInput) {
    const email = input.email.toLowerCase();

    const seatsUsed = await this.prisma.user.count({ where: { tenantId, active: true } });
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { seatLimit: true, name: true, slug: true },
    });
    if (!tenant) throw new NotFoundException('Workspace not found');
    if (seatsUsed >= tenant.seatLimit) {
      throw new BadRequestException(
        `Workspace at seat limit (${tenant.seatLimit}). Deactivate someone or upgrade the plan.`
      );
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new BadRequestException(
        existingUser.tenantId === tenantId
          ? 'That email already belongs to this workspace.'
          : 'That email already belongs to another workspace.'
      );
    }

    const pending = await this.prisma.invitation.findFirst({
      where: { tenantId, email, status: 'PENDING' },
    });
    if (pending) {
      throw new BadRequestException('There is already a pending invite to that email.');
    }

    const rawToken = randomBytes(24).toString('base64url');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 3600 * 1000);

    const invitation = await this.prisma.invitation.create({
      data: {
        tenantId,
        email,
        fullName: input.fullName.trim(),
        role: input.role,
        invitedById,
        tokenHash,
        expiresAt,
      },
      include: { invitedBy: { select: { fullName: true } } },
    });

    // Stub email send — log it. A real implementation would enqueue a job
    // that posts to SES/Postmark/SendGrid with the accept URL.
    const acceptUrl = `${process.env.WEB_ORIGIN?.split(',')[0] ?? 'http://localhost:3100'}/accept-invite/${rawToken}`;
    this.log.log(
      `INVITE → ${email} (${invitation.role}) for workspace "${tenant.name}". Accept: ${acceptUrl}`
    );

    return {
      id: invitation.id,
      email: invitation.email,
      fullName: invitation.fullName,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      acceptUrl, // surfaced so the manager can copy/paste while we wire real email
    };
  }

  async revokeInvite(tenantId: string, id: string) {
    const inv = await this.prisma.invitation.findFirst({ where: { id, tenantId } });
    if (!inv) throw new NotFoundException('Invitation not found');
    if (inv.status !== 'PENDING') {
      throw new BadRequestException(`Already ${inv.status.toLowerCase()}.`);
    }
    return this.prisma.invitation.update({
      where: { id },
      data: { status: 'REVOKED' as InvitationStatus },
    });
  }

  async updateUser(tenantId: string, actorId: string, userId: string, input: UpdateUserInput) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, tenantId } });
    if (!user) throw new NotFoundException('User not found');

    // Safety: you cannot demote or deactivate yourself.
    if (actorId === userId && input.active === false) {
      throw new ForbiddenException("You can't deactivate yourself.");
    }
    if (actorId === userId && input.role && input.role !== user.role) {
      throw new ForbiddenException("You can't change your own role.");
    }

    // Don't let the last active ADMIN lose admin / be deactivated.
    if (user.role === Role.ADMIN && (input.role && input.role !== Role.ADMIN) || (user.role === Role.ADMIN && input.active === false)) {
      const otherAdmins = await this.prisma.user.count({
        where: { tenantId, role: Role.ADMIN as any, active: true, NOT: { id: userId } },
      });
      if (otherAdmins === 0) {
        throw new BadRequestException('A workspace needs at least one active admin.');
      }
    }

    // If reactivating someone, enforce seat limit.
    if (input.active === true && !user.active) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { seatLimit: true },
      });
      const seatsUsed = await this.prisma.user.count({ where: { tenantId, active: true } });
      if (tenant && seatsUsed >= tenant.seatLimit) {
        throw new BadRequestException('Workspace is at its seat limit — upgrade first.');
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.role && { role: input.role as any }),
        ...(input.active !== undefined && { active: input.active }),
        ...(input.fullName && { fullName: input.fullName.trim() }),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        active: true,
        lastLoginAt: true,
      },
    });
  }
}
