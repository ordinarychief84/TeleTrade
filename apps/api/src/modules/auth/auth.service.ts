import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@teletrade/shared';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.active) throw new UnauthorizedException('Invalid credentials');

    const ok = await this.verifyPassword(user.passwordHash, password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    return this.issueTokens(user.id, user.tenantId, user.role, user.email);
  }

  /**
   * Public signup: a company creates a workspace. The first user becomes
   * the workspace ADMIN; subsequent teammates are added via /team/invite.
   */
  async signup(input: {
    companyName: string;
    industry?: string;
    country?: string;
    fullName: string;
    email: string;
    password: string;
  }) {
    const email = input.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException('That email is already in use — sign in instead.');
    }

    const slug = await this.uniqueSlug(input.companyName);
    const passwordHash = await this.hashPassword(input.password);

    const tenant = await this.prisma.tenant.create({
      data: {
        name: input.companyName.trim(),
        slug,
        industry: input.industry,
        country: input.country,
        billingEmail: email,
        users: {
          create: {
            email,
            fullName: input.fullName.trim(),
            role: Role.ADMIN as any,
            passwordHash,
          },
        },
      },
      include: { users: true },
    });

    const admin = tenant.users[0]!;
    return this.issueTokens(admin.id, admin.tenantId, admin.role, admin.email);
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hash(refreshToken);
    const row = await this.prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } });
    if (!row || row.revokedAt || row.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token invalid or expired');
    }
    await this.prisma.refreshToken.update({ where: { id: row.id }, data: { revokedAt: new Date() } });
    return this.issueTokens(row.user.id, row.user.tenantId, row.user.role, row.user.email);
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hash(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        languages: true,
        tenantId: true,
        tenant: { select: { name: true, slug: true, plan: true, seatLimit: true } },
      },
    });
  }

  /** Public token-based invitation accept — creates a new User in the inviting tenant. */
  async acceptInvitation(token: string, password: string) {
    const tokenHash = this.hash(token);
    const inv = await this.prisma.invitation.findUnique({
      where: { tokenHash },
      include: { tenant: { select: { id: true, seatLimit: true } } },
    });
    if (!inv) throw new BadRequestException('Invitation not found.');
    if (inv.status !== 'PENDING') {
      throw new BadRequestException(`This invitation is ${inv.status.toLowerCase()}.`);
    }
    if (inv.expiresAt < new Date()) {
      await this.prisma.invitation.update({ where: { id: inv.id }, data: { status: 'EXPIRED' } });
      throw new BadRequestException('This invitation has expired — ask your admin for a fresh one.');
    }

    const seatsUsed = await this.prisma.user.count({ where: { tenantId: inv.tenantId, active: true } });
    if (seatsUsed >= inv.tenant.seatLimit) {
      throw new BadRequestException(
        `Workspace is at its seat limit (${inv.tenant.seatLimit}). Ask the admin to add seats first.`
      );
    }

    const existing = await this.prisma.user.findUnique({ where: { email: inv.email } });
    if (existing) {
      throw new BadRequestException('That email already belongs to a workspace.');
    }

    const passwordHash = await this.hashPassword(password);
    const user = await this.prisma.user.create({
      data: {
        tenantId: inv.tenantId,
        email: inv.email,
        fullName: inv.fullName,
        role: inv.role,
        passwordHash,
      },
    });
    await this.prisma.invitation.update({
      where: { id: inv.id },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
    });

    return this.issueTokens(user.id, user.tenantId, user.role, user.email);
  }

  private async uniqueSlug(name: string): Promise<string> {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'workspace';
    let slug = base;
    let n = 1;
    // Cheap dedup loop — slug is just a human identifier, race condition is acceptable for MVP.
    while (await this.prisma.tenant.findUnique({ where: { slug } })) {
      slug = `${base}-${++n}`;
    }
    return slug;
  }

  private async issueTokens(userId: string, tenantId: string, role: string, email: string) {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, tenantId, role, email },
      { secret: process.env.JWT_ACCESS_SECRET!, expiresIn: Number(process.env.JWT_ACCESS_TTL ?? 900) }
    );
    const raw = randomBytes(48).toString('base64url');
    const ttl = Number(process.env.JWT_REFRESH_TTL ?? 2592000);
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hash(raw),
        expiresAt: new Date(Date.now() + ttl * 1000),
      },
    });
    return { accessToken, refreshToken: raw, expiresIn: Number(process.env.JWT_ACCESS_TTL ?? 900) };
  }

  private async verifyPassword(stored: string, plain: string): Promise<boolean> {
    if (stored.startsWith('mock$')) {
      const expected = createHash('sha256').update(`teletrade-seed::${plain}`).digest('hex');
      return stored === `mock$${expected}`;
    }
    try {
      return await argon2.verify(stored, plain);
    } catch {
      return false;
    }
  }

  async hashPassword(plain: string): Promise<string> {
    return argon2.hash(plain, { type: argon2.argon2id });
  }

  private hash(s: string): string {
    return createHash('sha256').update(s).digest('hex');
  }
}
