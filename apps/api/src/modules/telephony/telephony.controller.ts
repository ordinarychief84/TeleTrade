import { Body, Controller, Post, Param, UsePipes } from '@nestjs/common';
import { TelephonyService } from './telephony.service';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { Audited } from '../../common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Public } from '../auth/public.decorator';
import {
  inboundSimulateSchema,
  outboundDialSchema,
  callOutcomeSchema,
} from '@teletrade/shared';
import { z } from 'zod';
import { CallsService } from '../calls/calls.service';

@Controller('telephony')
export class TelephonyController {
  constructor(
    private readonly telephony: TelephonyService,
    private readonly calls: CallsService
  ) {}

  @Post('simulate/inbound')
  @Audited('Call', 'call.inbound.simulate')
  @UsePipes(new ZodValidationPipe(inboundSimulateSchema))
  simulateInbound(
    @CurrentUser() u: AuthUser,
    @Body() body: z.infer<typeof inboundSimulateSchema>
  ) {
    return this.telephony.simulateInbound(u.tenantId, body.fromNumber, body.language, body.productMenu);
  }

  @Post('outbound/dial')
  @Audited('Call', 'call.outbound.dial')
  @UsePipes(new ZodValidationPipe(outboundDialSchema))
  outboundDial(
    @CurrentUser() u: AuthUser,
    @Body() body: z.infer<typeof outboundDialSchema>
  ) {
    return this.telephony.outboundDial(u.tenantId, u.userId, body.customerId, body.campaignTargetId);
  }

  @Post('calls/:id/answer')
  @Audited('Call', 'call.answer')
  answer(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.telephony.answer(u.tenantId, id, u.userId);
  }

  @Post('calls/:id/hangup')
  @Audited('Call', 'call.hangup')
  hangup(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.telephony.hangup(u.tenantId, id);
  }

  @Post('calls/:id/outcome')
  @Audited('Call', 'call.outcome')
  @UsePipes(new ZodValidationPipe(callOutcomeSchema))
  outcome(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
    @Body() body: z.infer<typeof callOutcomeSchema>
  ) {
    return this.calls.recordOutcome(u.tenantId, id, body.outcome, body.notes);
  }
}
