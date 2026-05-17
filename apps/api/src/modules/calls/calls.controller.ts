import { Body, Controller, Get, Param, Post, Query, UsePipes } from '@nestjs/common';
import { CallsService } from './calls.service';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { callbackSchema } from '@teletrade/shared';
import { z } from 'zod';

@Controller('calls')
export class CallsController {
  constructor(private readonly calls: CallsService) {}

  @Get()
  list(@CurrentUser() u: AuthUser, @Query() q: Record<string, any>) {
    return this.calls.list(u.tenantId, {
      status: q.status,
      direction: q.direction,
      agentId: q.agentId,
      customerId: q.customerId,
    });
  }

  @Get(':id')
  get(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.calls.byId(u.tenantId, id);
  }

  @Post(':id/callback')
  @UsePipes(new ZodValidationPipe(callbackSchema))
  schedule(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
    @Body() body: z.infer<typeof callbackSchema>
  ) {
    return this.calls.scheduleCallback(u.tenantId, id, new Date(body.scheduledFor), body.notes);
  }
}
