import { Body, Controller, Get, Headers, Param, Post, Query, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { DmsService } from './dms.service';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../auth/public.decorator';
import { Roles } from '../../common/guards/roles.guard';
import { Role, DmsAdapterKind, DmsSyncStatus } from '@teletrade/shared';
import { Audited } from '../../common/interceptors/audit.interceptor';

@Controller('dms')
export class DmsController {
  constructor(private readonly dms: DmsService) {}

  @Get('sync-jobs')
  list(@CurrentUser() u: AuthUser, @Query('status') status?: DmsSyncStatus) {
    return this.dms.list(u.tenantId, status);
  }

  @Post('sync-jobs/:id/retry')
  @Roles(Role.SALES_MANAGER, Role.ADMIN)
  @Audited('DmsSyncJob', 'dms.sync.retry')
  retry(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.dms.retry(u.tenantId, id);
  }

  @Public()
  @Post('webhooks/:adapter')
  webhook(
    @Param('adapter') adapter: string,
    @Headers() headers: Record<string, string>,
    @Body() body: unknown,
    @Req() req: RawBodyRequest<Request>,
    @Query('tenantId') tenantId?: string
  ) {
    const kind = (adapter.toUpperCase() as DmsAdapterKind);
    const raw = req.rawBody?.toString('utf8') ?? JSON.stringify(body ?? {});
    return this.dms.receiveWebhook(tenantId ?? 'unknown', kind, headers, raw, body);
  }
}
