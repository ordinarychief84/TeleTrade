import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { configValidationSchema } from './config/env';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CustomersModule } from './modules/customers/customers.module';
import { TelephonyModule } from './modules/telephony/telephony.module';
import { CallsModule } from './modules/calls/calls.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { SuggestionsModule } from './modules/suggestions/suggestions.module';
import { OrdersModule } from './modules/orders/orders.module';
import { DmsModule } from './modules/dms/dms.module';
import { TerritoriesModule } from './modules/territories/territories.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AuditModule } from './modules/audit/audit.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { DeliveriesModule } from './modules/deliveries/deliveries.module';
import { InboxModule } from './modules/inbox/inbox.module';
import { TeamModule } from './modules/team/team.module';
import { AccountModule } from './modules/account/account.module';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (env) => configValidationSchema.parse(env),
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    CustomersModule,
    TelephonyModule,
    CallsModule,
    CampaignsModule,
    SuggestionsModule,
    OrdersModule,
    DmsModule,
    TerritoriesModule,
    ReportsModule,
    AuditModule,
    RealtimeModule,
    DeliveriesModule,
    InboxModule,
    TeamModule,
    AccountModule,
  ],
  providers: [{ provide: APP_INTERCEPTOR, useClass: AuditInterceptor }],
})
export class AppModule {}
