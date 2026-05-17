import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';
import { TargetingService } from './targeting.service';
import { DialerProcessor } from './dialer.processor';
import { OUTBOUND_DIALER_QUEUE } from './dialer.tokens';

@Module({
  imports: [BullModule.registerQueue({ name: OUTBOUND_DIALER_QUEUE })],
  controllers: [CampaignsController],
  providers: [CampaignsService, TargetingService, DialerProcessor],
  exports: [CampaignsService, TargetingService],
})
export class CampaignsModule {}
