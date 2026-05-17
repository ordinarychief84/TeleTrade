import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Order, OrderLine } from '@prisma/client';

/**
 * Detect duplicate orders.
 *
 * Spec: same outlet + same SKU within 30 minutes across any channel.
 *
 * Returns the matching existing order if a duplicate is detected, else null.
 * Never auto-cancels — the caller is responsible for flagging and routing to
 * the manager review queue.
 */
@Injectable()
export class DuplicateDetectorService {
  static readonly WINDOW_MINUTES = 30;

  constructor(private readonly prisma: PrismaService) {}

  async detect(input: {
    tenantId: string;
    customerId: string;
    skuCodes: string[];
    excludeOrderId?: string;
  }): Promise<(Order & { lines: OrderLine[] }) | null> {
    if (!input.skuCodes.length) return null;
    const cutoff = new Date(Date.now() - DuplicateDetectorService.WINDOW_MINUTES * 60_000);

    const recent = await this.prisma.order.findMany({
      where: {
        tenantId: input.tenantId,
        customerId: input.customerId,
        createdAt: { gte: cutoff },
        ...(input.excludeOrderId && { NOT: { id: input.excludeOrderId } }),
        status: {
          notIn: ['CANCELLED', 'FAILED', 'DRAFT'],
        },
      },
      include: { lines: true },
      orderBy: { createdAt: 'desc' },
    });

    const incomingSet = new Set(input.skuCodes);
    for (const order of recent) {
      const overlap = order.lines.some((l) => incomingSet.has(l.skuCode));
      if (overlap) return order;
    }
    return null;
  }
}
