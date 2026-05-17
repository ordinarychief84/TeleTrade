import { Controller, Get, Module } from '@nestjs/common';
import { Roles } from '../../common/guards/roles.guard';
import { Role } from '@teletrade/shared';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('users')
class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles(Role.ADMIN)
  list(@CurrentUser() u: AuthUser) {
    return this.prisma.user.findMany({
      where: { tenantId: u.tenantId },
      select: { id: true, email: true, fullName: true, role: true, active: true, lastLoginAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}

@Module({ controllers: [UsersController] })
export class UsersModule {}
