import { Controller, Get } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('overview')
  overview(@CurrentUser() u: AuthUser) {
    return this.reports.overview(u.tenantId);
  }

  @Get('agents')
  agents(@CurrentUser() u: AuthUser) {
    return this.reports.byAgent(u.tenantId);
  }

  @Get('campaigns')
  campaigns(@CurrentUser() u: AuthUser) {
    return this.reports.byCampaign(u.tenantId);
  }

  @Get('routes')
  routes(@CurrentUser() u: AuthUser) {
    return this.reports.byRoute(u.tenantId);
  }

  @Get('decline-reasons')
  declineReasons(@CurrentUser() u: AuthUser) {
    return this.reports.declineReasons(u.tenantId);
  }

  @Get('sku-uptake')
  skuUptake(@CurrentUser() u: AuthUser) {
    return this.reports.skuUptake(u.tenantId);
  }
}
