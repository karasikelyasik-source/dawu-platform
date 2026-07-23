import { Module } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { PromoCodesController } from './promo-codes.controller';
import { PromoCodesService } from './promo-codes.service';

@Module({
  controllers: [PromoCodesController],
  providers: [PromoCodesService, PrismaService],
  exports: [PromoCodesService],
})
export class PromoCodesModule {}
