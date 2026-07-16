import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailModule } from '../mail/mail.module';
import { PublicReservationsController } from './public-reservations.controller';
import { PublicReservationsService } from './public-reservations.service';

@Module({
  imports: [MailModule],
  controllers: [PublicReservationsController],
  providers: [
    PublicReservationsService,
    PrismaService,
  ],
})
export class PublicReservationsModule {}