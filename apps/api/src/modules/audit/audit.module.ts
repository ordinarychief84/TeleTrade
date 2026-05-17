import { Controller, Get, Module, Query } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/guards/roles.guard';
import { Role } from '@teletrade/shared';

@Controller('audit')
class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  list(
    @CurrentUser() u: AuthUser,
    @Query('entity') entity?: string,
    @Query('entityId') entityId?: string,
    @Query('actorId') actorId?: string
  ) {
    return this.prisma.auditLog.findMany({
      where: {
        tenantId: u.tenantId,
        ...(entity && { entity }),
        ...(entityId && { entityId }),
        ...(actorId && { actorId }),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { actor: { select: { fullName: true, email: true, role: true } } },
    });
  }
}

@Module({ controllers: [AuditController] })
export class AuditModule {}
