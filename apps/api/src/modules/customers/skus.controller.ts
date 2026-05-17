import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

/**
 * Lightweight SKU listing — used by the softphone screen to look up
 * unit price + name for arbitrary SKUs the agent might add to an order.
 */
@Controller('skus')
export class SkusController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@CurrentUser() u: AuthUser, @Query('q') q?: string, @Query('category') category?: string) {
    return this.prisma.sku.findMany({
      where: {
        tenantId: u.tenantId,
        active: true,
        ...(category && { category }),
        ...(q && {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { code: { contains: q, mode: 'insensitive' } },
            { brand: { contains: q, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { name: 'asc' },
      take: 200,
    });
  }
}
