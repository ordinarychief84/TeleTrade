import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';

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

  async refresh(refreshToken: string) {
    const tokenHash = this.hash(refreshToken);
    const row = await this.prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } });
    if (!row || row.revokedAt || row.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token invalid or expired');
    }
    // rotate
    await this.prisma.refreshToken.update({ where: { id: row.id }, data: { revokedAt: new Date() } });
    return this.issueTokens(row.user.id, row.user.tenantId, row.user.role, row.user.email);
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hash(refreshToken);
    await this.prisma.refreshToken
      .updateMany({ where: { tokenHash, revokedAt: null }, data: { revokedAt: new Date() } });
  }

  async me(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, fullName: true, role: true, languages: true, tenantId: true },
    });
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
      // seed-time deterministic hash (sha256 of `teletrade-seed::password`)
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
