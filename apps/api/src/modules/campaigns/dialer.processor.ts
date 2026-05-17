import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { OUTBOUND_DIALER_QUEUE } from './dialer.tokens';

/**
 * Background queue for outbound dialing. In MVP it just logs — actual dialing
 * happens interactively when an agent picks up the next target. A future
 * version can auto-dial via TelephonyService when an agent is idle.
 *
 * The retry-on-no-answer (up to 3 attempts) is handled at the
 * CampaignTarget level when an agent records a NO_ANSWER outcome.
 */
@Processor(OUTBOUND_DIALER_QUEUE)
export class DialerProcessor extends WorkerHost {
  private readonly log = new Logger('Dialer');

  async process(job: Job<{ tenantId: string; campaignId: string; customerId: string }>) {
    this.log.debug(
      `Dialer queued: tenant=${job.data.tenantId} campaign=${job.data.campaignId} customer=${job.data.customerId}`
    );
    return { ok: true };
  }
}
