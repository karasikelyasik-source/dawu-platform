import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminSessionsController } from './admin-sessions.controller';
import { AdminSessionsService } from './admin-sessions.service';

@Module({
  controllers: [AdminSessionsController],
  providers: [AdminSessionsService, PrismaService],
})
export class AdminSessionsModule {}