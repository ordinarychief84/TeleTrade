import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { SkusController } from './skus.controller';

@Module({
  controllers: [CustomersController, SkusController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
