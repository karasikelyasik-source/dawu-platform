import { Module } from '@nestjs/common';
import { TakeAwayController } from './take-away.controller';
import { TakeAwayService } from './take-away.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [TakeAwayController],
  providers: [TakeAwayService, PrismaService],
})
export class TakeAwayModule {}