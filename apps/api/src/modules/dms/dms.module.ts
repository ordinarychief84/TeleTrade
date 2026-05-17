import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DmsService } from './dms.service';
import { DmsController } from './dms.controller';
import { DmsRegistry } from './dms.registry';
import { OdooAdapter } from './adapters/odoo.adapter';
import { SapB1Adapter } from './adapters/sap-b1.adapter';
import { Dynamics365Adapter } from './adapters/dynamics-365.adapter';
import { CustomApiAdapter } from './adapters/custom.adapter';
import { DmsSyncProcessor } from './dms-sync.processor';
import { DMS_SYNC_QUEUE } from './dms.tokens';

@Module({
  imports: [BullModule.registerQueue({ name: DMS_SYNC_QUEUE })],
  controllers: [DmsController],
  providers: [
    DmsService,
    DmsRegistry,
    OdooAdapter,
    SapB1Adapter,
    Dynamics365Adapter,
    CustomApiAdapter,
    DmsSyncProcessor,
  ],
  exports: [DmsService, DmsRegistry],
})
export class DmsModule {}
