import { Module } from '@nestjs/common';

import { MailModule } from '../mail/mail.module';
import { PrismaService } from '../prisma/prisma.service';
import { PromoCodesModule } from '../promo-codes/promo-codes.module';

import { PublicReservationsController } from './public-reservations.controller';
import { PublicReservationsService } from './public-reservations.service';

@Module({
  imports: [
    MailModule,
    PromoCodesModule,
  ],
  controllers: [
    PublicReservationsController,
  ],
  providers: [
    PublicReservationsService,
    PrismaService,
  ],
  exports: [
    PublicReservationsService,
  ],
})
export class PublicReservationsModule {}