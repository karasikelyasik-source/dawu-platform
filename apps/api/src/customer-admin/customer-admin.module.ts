import { Module } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CustomerAdminController } from './customer-admin.controller';
import { CustomerAdminService } from './customer-admin.service';

@Module({
  controllers: [CustomerAdminController],
  providers: [
    CustomerAdminService,
    PrismaService,
  ],
})
export class CustomerAdminModule {}