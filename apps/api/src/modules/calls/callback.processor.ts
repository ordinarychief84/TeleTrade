import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CALLBACK_QUEUE } from './callback.tokens';

/**
 * Processes scheduled callbacks. In production this would dispatch an SMS
 * via Twilio / Africa's Talking. For the MVP we log + record an audit row.
 */
@Processor(CALLBACK_QUEUE)
export class CallbackProcessor extends WorkerHost {
  private readonly log = new Logger('Callback');

  async process(job: Job<{ tenantId: string; callId: string; customerId: string | null }>) {
    this.log.log(`Dispatching callback SMS for call=${job.data.callId} customer=${job.data.customerId ?? 'unknown'}`);
    // TODO: integrate real SMS provider.
    return { ok: true, dispatchedAt: new Date().toISOString() };
  }
}
