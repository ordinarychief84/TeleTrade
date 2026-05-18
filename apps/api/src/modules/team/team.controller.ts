import { Body, Controller, Delete, Get, Param, Patch, Post, UsePipes } from '@nestjs/common';
import { TeamService } from './team.service';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/guards/roles.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Audited } from '../../common/interceptors/audit.interceptor';
import {
  Role,
  inviteSchema,
  InviteInput,
  updateUserSchema,
  UpdateUserInput,
} from '@teletrade/shared';

@Controller('team')
export class TeamController {
  constructor(private readonly team: TeamService) {}

  @Get()
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  overview(@CurrentUser() u: AuthUser) {
    return this.team.overview(u.tenantId);
  }

  @Post('invite')
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  @Audited('Invitation', 'team.invite')
  @UsePipes(new ZodValidationPipe(inviteSchema))
  invite(@CurrentUser() u: AuthUser, @Body() body: InviteInput) {
    return this.team.invite(u.tenantId, u.userId, body);
  }

  @Delete('invitations/:id')
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  @Audited('Invitation', 'team.invite.revoke')
  revokeInvite(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.team.revokeInvite(u.tenantId, id);
  }

  @Patch('users/:id')
  @Roles(Role.ADMIN)
  @Audited('User', 'team.user.update')
  @UsePipes(new ZodValidationPipe(updateUserSchema))
  updateUser(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateUserInput
  ) {
    return this.team.updateUser(u.tenantId, u.userId, id, body);
  }
}
