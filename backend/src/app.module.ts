import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { EmailSenderModule } from './email-sender/email-sender.module';
import { PaymongoModule } from './paymongo/paymongo.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { CacheModule } from '@nestjs/cache-manager';
import { CondoModule } from './condo/condo.module';
import { FileUploadModule } from './file-upload/file-upload.module';
import { MaintenanceModule } from './maintinance/maintinance.module';
import { CondoPaymentModule } from './condo-payment/condo-payment.module';
import { LeaseAgreementModule } from './lease-agreement/lease-agreement.module';
import { ReminderModule } from './reminder/reminder.module';
import { MaintenanceMessageModule } from './maintenance-message/maintenance-message.module';

@Module({
  imports: [
    AuthModule, 
    PrismaModule, 
    ConfigModule.forRoot({
      isGlobal: true
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 60 * 1000, // time to live of 60 seconds
    }),
    EmailSenderModule, PaymongoModule, SubscriptionModule, CondoModule, FileUploadModule, MaintenanceModule, CondoPaymentModule, LeaseAgreementModule, ReminderModule, MaintenanceMessageModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
