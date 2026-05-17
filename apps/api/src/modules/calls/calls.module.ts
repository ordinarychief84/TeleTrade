import { Module } from '@nestjs/common';
import { CallsService } from './calls.service';
import { CallsController } from './calls.controller';
import { BullModule } from '@nestjs/bullmq';
import { CallbackProcessor } from './callback.processor';
import { CALLBACK_QUEUE } from './callback.tokens';

@Module({
  imports: [BullModule.registerQueue({ name: CALLBACK_QUEUE })],
  controllers: [CallsController],
  providers: [CallsService, CallbackProcessor],
  exports: [CallsService],
})
export class CallsModule {}
