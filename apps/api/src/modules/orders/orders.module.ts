import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { DuplicateDetectorService } from './duplicate-detector.service';
import { DmsModule } from '../dms/dms.module';

@Module({
  imports: [DmsModule],
  controllers: [OrdersController],
  providers: [OrdersService, DuplicateDetectorService],
  exports: [OrdersService],
})
export class OrdersModule {}
