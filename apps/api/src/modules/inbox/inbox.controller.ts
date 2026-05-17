import { Controller, Get } from '@nestjs/common';
import { InboxService } from './inbox.service';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@Controller('inbox')
export class InboxController {
  constructor(private readonly inbox: InboxService) {}

  @Get()
  list(@CurrentUser() u: AuthUser) {
    return this.inbox.list(u.tenantId, u.role, u.userId);
  }
}
