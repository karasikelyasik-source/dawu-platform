import { Module } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { RestaurantSettingsController } from './restaurant-settings.controller';
import { RestaurantSettingsService } from './restaurant-settings.service';

@Module({
  controllers: [
    RestaurantSettingsController,
  ],
  providers: [
    RestaurantSettingsService,
    PrismaService,
  ],
  exports: [
    RestaurantSettingsService,
  ],
})
export class RestaurantSettingsModule {}