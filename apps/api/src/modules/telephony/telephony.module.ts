import { Module } from '@nestjs/common';
import { TELEPHONY_PROVIDER } from './telephony.tokens';
import { MockTelephonyProvider } from './mock-telephony.provider';
import { TelephonyService } from './telephony.service';
import { TelephonyController } from './telephony.controller';
import { SoftphoneGateway } from './softphone.gateway';
import { CallsModule } from '../calls/calls.module';

@Module({
  imports: [CallsModule],
  controllers: [TelephonyController],
  providers: [
    MockTelephonyProvider,
    {
      provide: TELEPHONY_PROVIDER,
      useFactory: (mock: MockTelephonyProvider) => {
        const kind = process.env.TELEPHONY_PROVIDER ?? 'mock';
        switch (kind) {
          case 'mock':
          default:
            return mock;
          // case 'twilio': return new TwilioProvider(...);
        }
      },
      inject: [MockTelephonyProvider],
    },
    TelephonyService,
    SoftphoneGateway,
  ],
  exports: [TELEPHONY_PROVIDER, TelephonyService, SoftphoneGateway],
})
export class TelephonyModule {}
