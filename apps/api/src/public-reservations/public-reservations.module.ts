import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PublicReservationsController } from './public-reservations.controller';
import { PublicReservationsService } from './public-reservations.service';

@Module({
  controllers: [PublicReservationsController],
  providers: [PublicReservationsService, PrismaService],
})
export class PublicReservationsModule {}