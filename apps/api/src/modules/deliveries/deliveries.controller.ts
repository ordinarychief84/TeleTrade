import { Body, Controller, Get, Param, Patch, Post, UsePipes } from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Audited } from '../../common/interceptors/audit.interceptor';
import { Roles } from '../../common/guards/roles.guard';
import {
  Role,
  deliveryStatusPatchSchema,
  DeliveryStatusPatch,
  cashCollectionSchema,
  CashCollectionInput,
} from '@teletrade/shared';

@Controller('deliveries')
export class DeliveriesController {
  constructor(private readonly deliveries: DeliveriesService) {}

  @Get('my-route')
  @Roles(Role.DELIVERY_OPS, Role.ADMIN, Role.SALES_MANAGER)
  myRoute(@CurrentUser() u: AuthUser) {
    return this.deliveries.myRoute(u.tenantId, u.userId);
  }

  @Get('end-of-run')
  @Roles(Role.DELIVERY_OPS, Role.ADMIN)
  endOfRun(@CurrentUser() u: AuthUser) {
    return this.deliveries.endOfRun(u.tenantId, u.userId);
  }

  @Get(':id')
  @Roles(Role.DELIVERY_OPS, Role.ADMIN, Role.SALES_MANAGER)
  get(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.deliveries.byId(u.tenantId, id);
  }

  @Patch(':id/status')
  @Roles(Role.DELIVERY_OPS, Role.ADMIN, Role.SALES_MANAGER)
  @Audited('DeliveryAssignment', 'delivery.status')
  @UsePipes(new ZodValidationPipe(deliveryStatusPatchSchema))
  updateStatus(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
    @Body() body: DeliveryStatusPatch
  ) {
    return this.deliveries.updateStatus(u.tenantId, id, body);
  }

  @Post(':id/cash')
  @Roles(Role.DELIVERY_OPS, Role.ADMIN)
  @Audited('DeliveryAssignment', 'delivery.cash')
  @UsePipes(new ZodValidationPipe(cashCollectionSchema))
  cash(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
    @Body() body: CashCollectionInput
  ) {
    return this.deliveries.recordCash(u.tenantId, id, body);
  }
}
