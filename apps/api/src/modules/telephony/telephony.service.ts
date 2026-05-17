import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TELEPHONY_PROVIDER } from './telephony.tokens';
import { TelephonyProvider, ProviderCallEvent } from './provider.interface';
import { CallsService } from '../calls/calls.service';
import { SoftphoneGateway } from './softphone.gateway';
import {
  CallDirection,
  CallStatus,
  LanguagePreference,
} from '@teletrade/shared';

@Injectable()
export class TelephonyService implements OnModuleInit {
  private readonly log = new Logger('Telephony');

  constructor(
    @Inject(TELEPHONY_PROVIDER) private readonly provider: TelephonyProvider,
    private readonly prisma: PrismaService,
    private readonly calls: CallsService,
    private readonly gateway: SoftphoneGateway
  ) {}

  onModuleInit() {
    this.provider.onCallEvent((evt) => this.handleEvent(evt));
    this.log.log(`Telephony provider: ${this.provider.name}`);
  }

  async simulateInbound(tenantId: string, fromNumber: string, language?: LanguagePreference, productMenu?: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { tenantId, phone: fromNumber },
    });
    const result = await this.provider.simulateInbound({ fromNumber, language, productMenu });
    const call = await this.calls.create({
      tenantId,
      externalCallId: result.callId,
      direction: CallDirection.INBOUND,
      status: CallStatus.QUEUED,
      fromNumber,
      languageQueue: language,
      productMenu: productMenu ?? null,
      customerId: customer?.id ?? null,
    });
    this.gateway.broadcast('inbound.queued', { callId: call.id, customerId: call.customerId, fromNumber, language });
    return call;
  }

  async outboundDial(tenantId: string, agentId: string, customerId: string, campaignTargetId?: string | null) {
    const customer = await this.prisma.customer.findFirst({ where: { id: customerId, tenantId } });
    if (!customer) throw new Error('Customer not found');

    const call = await this.calls.create({
      tenantId,
      direction: CallDirection.OUTBOUND,
      status: CallStatus.RINGING,
      toNumber: customer.phone,
      agentId,
      customerId: customer.id,
      campaignTargetId: campaignTargetId ?? null,
    });

    const { externalCallId } = await this.provider.dial({
      toNumber: customer.phone,
      agentId,
      callId: call.id,
    });
    await this.prisma.call.update({ where: { id: call.id }, data: { externalCallId } });
    return call;
  }

  async answer(tenantId: string, callId: string, agentId: string) {
    const call = await this.calls.byId(tenantId, callId);
    await this.provider.answer(call.id, agentId);
    return this.calls.updateState(callId, {
      status: CallStatus.CONNECTED,
      agent: { connect: { id: agentId } },
      connectedAt: new Date(),
    });
  }

  async hangup(tenantId: string, callId: string) {
    await this.calls.byId(tenantId, callId);
    await this.provider.hangup(callId);
    return this.calls.updateState(callId, { status: CallStatus.COMPLETED, endedAt: new Date() });
  }

  private async handleEvent(evt: ProviderCallEvent) {
    this.log.debug(`Provider event: ${evt.type}`);
    switch (evt.type) {
      case 'ringing':
        await this.calls.updateState(evt.callId, { status: CallStatus.RINGING, ringingAt: new Date() });
        this.gateway.broadcast('call.ringing', { callId: evt.callId });
        break;
      case 'answered':
        await this.calls.updateState(evt.callId, {
          status: CallStatus.CONNECTED,
          agent: { connect: { id: evt.agentId } },
          connectedAt: new Date(),
        });
        this.gateway.broadcast('call.answered', { callId: evt.callId, agentId: evt.agentId });
        break;
      case 'hangup':
      case 'missed':
      case 'dropped': {
        const endStatus =
          evt.type === 'missed' ? CallStatus.MISSED : evt.type === 'dropped' ? CallStatus.DROPPED : CallStatus.COMPLETED;
        await this.calls.updateState(evt.callId, { status: endStatus, endedAt: new Date() });
        this.gateway.broadcast(`call.${evt.type}`, { callId: evt.callId });
        break;
      }
      default:
        break;
    }
  }
}
