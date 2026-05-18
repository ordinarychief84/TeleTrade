import { Body, Controller, Get, Param, Patch, Post, UsePipes, Query, UseGuards } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Roles } from '../../common/guards/roles.guard';
import { campaignCreateSchema, campaignFiltersSchema, CampaignCreateInput, Role } from '@teletrade/shared';
import { z } from 'zod';
import { Audited } from '../../common/interceptors/audit.interceptor';

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaigns: CampaignsService) {}

  @Get()
  list(@CurrentUser() u: AuthUser) {
    return this.campaigns.list(u.tenantId);
  }

  @Get('my-queue')
  myQueue(@CurrentUser() u: AuthUser) {
    return this.campaigns.myQueue(u.tenantId, u.userId);
  }

  @Get(':id')
  get(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.campaigns.byId(u.tenantId, id);
  }

  @Post()
  @Roles(Role.SALES_MANAGER, Role.ADMIN)
  @Audited('Campaign', 'campaign.create')
  @UsePipes(new ZodValidationPipe(campaignCreateSchema))
  create(@CurrentUser() u: AuthUser, @Body() body: CampaignCreateInput) {
    return this.campaigns.create(u.tenantId, u.userId, body);
  }

  @Post('preview-targets')
  @Roles(Role.SALES_MANAGER, Role.ADMIN)
  preview(@CurrentUser() u: AuthUser, @Body() body: unknown) {
    const filters = campaignFiltersSchema.parse(body ?? {});
    return this.campaigns.previewTargets(u.tenantId, filters);
  }

  @Post(':id/approve')
  @Roles(Role.SALES_MANAGER, Role.ADMIN)
  @Audited('Campaign', 'campaign.approve')
  approve(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.campaigns.approve(u.tenantId, id, u.userId);
  }

  @Post(':id/pause')
  @Roles(Role.SALES_MANAGER, Role.ADMIN)
  @Audited('Campaign', 'campaign.pause')
  pause(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.campaigns.pause(u.tenantId, id);
  }

  @Post(':id/resume')
  @Roles(Role.SALES_MANAGER, Role.ADMIN)
  @Audited('Campaign', 'campaign.resume')
  resume(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.campaigns.resume(u.tenantId, id);
  }

  @Post(':id/complete')
  @Roles(Role.SALES_MANAGER, Role.ADMIN)
  @Audited('Campaign', 'campaign.complete')
  complete(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.campaigns.complete(u.tenantId, id);
  }
}
