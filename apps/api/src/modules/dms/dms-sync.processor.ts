import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DMS_SYNC_QUEUE } from './dms.tokens';
import { DmsService } from './dms.service';

@Processor(DMS_SYNC_QUEUE)
export class DmsSyncProcessor extends WorkerHost {
  private readonly log = new Logger('DmsSync');

  constructor(private readonly dms: DmsService) {
    super();
  }

  async process(job: Job<{ jobId: string }>) {
    this.log.debug(`Processing DMS sync job ${job.data.jobId} (attempt ${job.attemptsMade + 1})`);
    await this.dms.runSync(job.data.jobId);
    return { ok: true };
  }
}
