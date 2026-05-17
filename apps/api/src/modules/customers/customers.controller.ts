import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UsePipes } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Audited } from '../../common/interceptors/audit.interceptor';
import {
  customerCreateSchema,
  customerUpdateSchema,
  customerFiltersSchema,
  paginationSchema,
  CustomerCreateInput,
  CustomerUpdateInput,
} from '@teletrade/shared';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  list(
    @CurrentUser() u: AuthUser,
    @Query() raw: Record<string, string>
  ) {
    const filters = customerFiltersSchema.parse(raw);
    const page = paginationSchema.parse(raw);
    return this.customers.list(u.tenantId, filters, page);
  }

  @Get('lookup')
  lookup(@CurrentUser() u: AuthUser, @Query('phone') phone: string) {
    return this.customers.findByPhone(u.tenantId, phone);
  }

  @Get(':id/360')
  get360(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.customers.get360(u.tenantId, id);
  }

  @Get(':id')
  get(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.customers.get360(u.tenantId, id);
  }

  @Post()
  @Audited('Customer', 'customer.create')
  @UsePipes(new ZodValidationPipe(customerCreateSchema))
  create(@CurrentUser() u: AuthUser, @Body() body: CustomerCreateInput) {
    return this.customers.create(u.tenantId, body);
  }

  @Patch(':id')
  @Audited('Customer', 'customer.update')
  @UsePipes(new ZodValidationPipe(customerUpdateSchema))
  update(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() body: CustomerUpdateInput) {
    return this.customers.update(u.tenantId, id, body);
  }

  @Delete(':id')
  @Audited('Customer', 'customer.delete')
  remove(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.customers.remove(u.tenantId, id);
  }
}
