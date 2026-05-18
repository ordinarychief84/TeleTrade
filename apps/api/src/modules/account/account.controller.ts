import { Body, Controller, Delete, Get, Param, Patch, Post, UsePipes } from '@nestjs/common';
import { AccountService } from './account.service';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/guards/roles.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Audited } from '../../common/interceptors/audit.interceptor';
import {
  Role,
  workspaceUpdateSchema,
  WorkspaceUpdateInput,
  planChangeSchema,
  PlanChangeInput,
  changePasswordSchema,
  ChangePasswordInput,
  dmsConfigSchema,
  DmsConfigInput,
  closeWorkspaceSchema,
  CloseWorkspaceInput,
} from '@teletrade/shared';

@Controller('account')
export class AccountController {
  constructor(private readonly account: AccountService) {}

  // ---------- Workspace profile ----------

  @Get('workspace')
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  workspace(@CurrentUser() u: AuthUser) {
    return this.account.getWorkspace(u.tenantId);
  }

  @Patch('workspace')
  @Roles(Role.ADMIN)
  @Audited('Tenant', 'workspace.update')
  @UsePipes(new ZodValidationPipe(workspaceUpdateSchema))
  updateWorkspace(@CurrentUser() u: AuthUser, @Body() body: WorkspaceUpdateInput) {
    return this.account.updateWorkspace(u.tenantId, body);
  }

  // ---------- Plan / billing ----------

  @Get('billing')
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  billing(@CurrentUser() u: AuthUser) {
    return this.account.billingSnapshot(u.tenantId);
  }

  @Post('billing/plan')
  @Roles(Role.ADMIN)
  @Audited('Tenant', 'workspace.plan.change')
  @UsePipes(new ZodValidationPipe(planChangeSchema))
  changePlan(@CurrentUser() u: AuthUser, @Body() body: PlanChangeInput) {
    return this.account.changePlan(u.tenantId, body);
  }

  // ---------- Security ----------

  @Get('sessions')
  sessions(@CurrentUser() u: AuthUser) {
    return this.account.sessions(u.userId);
  }

  @Delete('sessions/:id')
  @Audited('RefreshToken', 'session.revoke')
  revokeSession(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.account.revokeSession(u.userId, id);
  }

  @Post('password')
  @Audited('User', 'user.password.change')
  @UsePipes(new ZodValidationPipe(changePasswordSchema))
  changePassword(@CurrentUser() u: AuthUser, @Body() body: ChangePasswordInput) {
    return this.account.changePassword(u.userId, body);
  }

  // ---------- Integrations ----------

  @Get('integrations')
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  integrations(@CurrentUser() u: AuthUser) {
    return this.account.integrationsSnapshot(u.tenantId);
  }

  @Patch('integrations/dms')
  @Roles(Role.ADMIN)
  @Audited('Tenant', 'integrations.dms.update')
  @UsePipes(new ZodValidationPipe(dmsConfigSchema))
  updateDms(@CurrentUser() u: AuthUser, @Body() body: DmsConfigInput) {
    return this.account.updateDms(u.tenantId, body);
  }

  // ---------- Danger zone ----------

  @Post('close')
  @Roles(Role.ADMIN)
  @Audited('Tenant', 'workspace.close')
  @UsePipes(new ZodValidationPipe(closeWorkspaceSchema))
  closeWorkspace(@CurrentUser() u: AuthUser, @Body() body: CloseWorkspaceInput) {
    return this.account.closeWorkspace(u.tenantId, u.userId, u.role, body);
  }
}
