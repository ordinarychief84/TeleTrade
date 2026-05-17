import { Controller, Get, Module, Query } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@Controller('territories')
class TerritoriesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('map')
  async map(@CurrentUser() u: AuthUser, @Query('territoryId') territoryId?: string) {
    const [territories, routes, customers] = await Promise.all([
      this.prisma.territory.findMany({ where: { tenantId: u.tenantId } }),
      this.prisma.route.findMany({ where: { tenantId: u.tenantId } }),
      this.prisma.customer.findMany({
        where: {
          tenantId: u.tenantId,
          latitude: { not: null },
          longitude: { not: null },
          ...(territoryId && { territoryId }),
        },
        select: {
          id: true,
          outletName: true,
          status: true,
          outletType: true,
          accountTier: true,
          latitude: true,
          longitude: true,
          routeId: true,
          territoryId: true,
          lastOrderDate: true,
        },
      }),
    ]);
    return { territories, routes, customers };
  }

  @Get()
  list(@CurrentUser() u: AuthUser) {
    return this.prisma.territory.findMany({
      where: { tenantId: u.tenantId },
      include: { routes: true },
    });
  }
}

@Controller('routes')
class RoutesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@CurrentUser() u: AuthUser) {
    return this.prisma.route.findMany({
      where: { tenantId: u.tenantId },
      include: { territory: { select: { id: true, name: true, code: true } } },
    });
  }
}

@Module({ controllers: [TerritoriesController, RoutesController] })
export class TerritoriesModule {}
