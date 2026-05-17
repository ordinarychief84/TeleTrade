import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CallDirection, CallStatus } from '@teletrade/shared';
import {
  DialOptions,
  ProviderCallEvent,
  SimulateInboundOptions,
  TelephonyProvider,
} from './provider.interface';

@Injectable()
export class MockTelephonyProvider implements TelephonyProvider {
  readonly name = 'mock';
  private readonly log = new Logger('MockTelephony');
  private handlers: ((evt: ProviderCallEvent) => void)[] = [];

  onCallEvent(handler: (evt: ProviderCallEvent) => void): void {
    this.handlers.push(handler);
  }

  private emit(evt: ProviderCallEvent) {
    for (const h of this.handlers) h(evt);
  }

  async dial({ toNumber, agentId, callId }: DialOptions) {
    this.log.log(`Dialing ${toNumber} (callId=${callId})`);
    const externalCallId = `mock-${randomUUID()}`;
    // simulate ring quickly
    setTimeout(() => this.emit({ type: 'ringing', callId }), 200);
    // simulate answer after a short delay (or no-answer 20% of the time)
    setTimeout(() => {
      if (Math.random() < 0.2) {
        this.emit({ type: 'missed', callId });
      } else {
        this.emit({ type: 'answered', callId, agentId });
      }
    }, 1500);
    return { externalCallId, status: CallStatus.RINGING };
  }

  async hangup(callId: string): Promise<void> {
    this.emit({ type: 'hangup', callId, reason: 'manual' });
  }

  async answer(callId: string, agentId: string): Promise<void> {
    this.emit({ type: 'answered', callId, agentId });
  }

  async simulateInbound(opts: SimulateInboundOptions) {
    const callId = `cb-${randomUUID()}`;
    this.emit({
      type: 'inbound.queued',
      callId,
      fromNumber: opts.fromNumber,
      language: opts.language,
      productMenu: opts.productMenu,
    });
    return {
      callId,
      direction: CallDirection.INBOUND,
      status: CallStatus.QUEUED,
    };
  }
}
