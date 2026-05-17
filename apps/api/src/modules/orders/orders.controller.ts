import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UsePipes } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Audited } from '../../common/interceptors/audit.interceptor';
import { Roles } from '../../common/guards/roles.guard';
import { orderDraftSchema, OrderDraftInput, Role, DuplicateReviewStatus } from '@teletrade/shared';
import { z } from 'zod';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  list(@CurrentUser() u: AuthUser, @Query() q: Record<string, any>) {
    return this.orders.list(u.tenantId, {
      status: q.status,
      customerId: q.customerId,
      agentId: q.agentId,
      duplicatesOnly: q.duplicatesOnly === 'true',
    });
  }

  @Get('duplicates')
  @Roles(Role.SALES_MANAGER, Role.ADMIN)
  duplicates(@CurrentUser() u: AuthUser) {
    return this.orders.duplicates(u.tenantId);
  }

  @Get(':id')
  get(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.orders.byId(u.tenantId, id);
  }

  @Post()
  @Audited('Order', 'order.draft')
  @UsePipes(new ZodValidationPipe(orderDraftSchema))
  upsertDraft(@CurrentUser() u: AuthUser, @Body() body: OrderDraftInput) {
    return this.orders.upsertDraft(u.tenantId, u.userId, body);
  }

  @Patch(':id')
  @Audited('Order', 'order.draft.update')
  @UsePipes(new ZodValidationPipe(orderDraftSchema))
  update(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() body: OrderDraftInput) {
    return this.orders.upsertDraft(u.tenantId, u.userId, { ...body, id });
  }

  @Post(':id/confirm')
  @Audited('Order', 'order.confirm')
  confirm(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.orders.confirm(u.tenantId, id);
  }

  @Post('duplicates/:id/review')
  @Roles(Role.SALES_MANAGER, Role.ADMIN)
  @Audited('Order', 'order.duplicate.review')
  review(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
    @Body() body: { decision: DuplicateReviewStatus }
  ) {
    return this.orders.reviewDuplicate(u.tenantId, id, body.decision);
  }
}
