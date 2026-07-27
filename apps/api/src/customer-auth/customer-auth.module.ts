import { Module } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { MailModule } from '../mail/mail.module';

import { CustomerAuthController } from './customer-auth.controller';
import { CustomerAuthService } from './customer-auth.service';

@Module({
  imports: [MailModule],

  controllers: [CustomerAuthController],

  providers: [
    CustomerAuthService,
    PrismaService,
  ],

  exports: [CustomerAuthService],
})
export class CustomerAuthModule {}