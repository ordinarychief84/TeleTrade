import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CallStatus, CallOutcome, CallDirection, LanguagePreference } from '@teletrade/shared';
import { CALLBACK_QUEUE } from './callback.tokens';

export interface CreateCallInput {
  tenantId: string;
  externalCallId?: string;
  direction: CallDirection;
  status: CallStatus;
  languageQueue?: LanguagePreference | null;
  productMenu?: string | null;
  fromNumber?: string;
  toNumber?: string;
  customerId?: string | null;
  agentId?: string | null;
  campaignId?: string | null;
  campaignTargetId?: string | null;
}

@Injectable()
export class CallsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(CALLBACK_QUEUE) private readonly callbackQueue: Queue
  ) {}

  list(tenantId: string, filters: { status?: CallStatus; direction?: CallDirection; agentId?: string; customerId?: string }) {
    return this.prisma.call.findMany({
      where: {
        tenantId,
        ...(filters.status && { status: filters.status }),
        ...(filters.direction && { direction: filters.direction }),
        ...(filters.agentId && { agentId: filters.agentId }),
        ...(filters.customerId && { customerId: filters.customerId }),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { customer: { select: { id: true, outletName: true, contactName: true } } },
    });
  }

  async byId(tenantId: string, id: string) {
    const c = await this.prisma.call.findFirst({ where: { id, tenantId } });
    if (!c) throw new NotFoundException('Call not found');
    return c;
  }

  create(input: CreateCallInput) {
    return this.prisma.call.create({
      data: {
        tenantId: input.tenantId,
        externalCallId: input.externalCallId,
        direction: input.direction,
        status: input.status,
        languageQueue: input.languageQueue ?? undefined,
        productMenu: input.productMenu ?? undefined,
        fromNumber: input.fromNumber,
        toNumber: input.toNumber,
        customerId: input.customerId ?? undefined,
        agentId: input.agentId ?? undefined,
        campaignId: input.campaignId ?? undefined,
        campaignTargetId: input.campaignTargetId ?? undefined,
      },
    });
  }

  updateState(id: string, patch: Prisma.CallUpdateInput) {
    return this.prisma.call.update({ where: { id }, data: patch });
  }

  recordOutcome(tenantId: string, id: string, outcome: CallOutcome, notes?: string) {
    return this.prisma.call.update({
      where: { id },
      data: {
        outcome,
        notes,
        status: CallStatus.COMPLETED,
        endedAt: new Date(),
      },
    });
  }

  async scheduleCallback(tenantId: string, callId: string, scheduledFor: Date, notes?: string) {
    const call = await this.byId(tenantId, callId);
    const updated = await this.prisma.call.update({
      where: { id: callId },
      data: {
        status: CallStatus.CALLBACK_SCHEDULED,
        outcome: CallOutcome.CALLBACK_SCHEDULED,
        scheduledCallbackAt: scheduledFor,
        notes,
      },
    });
    const delay = Math.max(0, scheduledFor.getTime() - Date.now());
    await this.callbackQueue.add(
      'callback',
      {
        tenantId,
        callId,
        customerId: call.customerId,
        language: call.languageQueue,
        scheduledFor: scheduledFor.toISOString(),
      },
      { delay, removeOnComplete: true, attempts: 3 }
    );
    return updated;
  }
}
