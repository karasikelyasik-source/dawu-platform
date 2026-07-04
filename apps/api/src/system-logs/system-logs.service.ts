import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SystemLogsService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    type: string;
    level?: string;
    message: string;
    tableId?: string;
    tableNumber?: number;
    userId?: string;
    userEmail?: string;
    ip?: string;
    userAgent?: string;
    beforeData?: Prisma.InputJsonValue;
    afterData?: Prisma.InputJsonValue;
    metadata?: Prisma.InputJsonValue;
  }) {
    return this.prisma.systemLog.create({
      data: {
        type: data.type,
        level: data.level || 'INFO',
        message: data.message,
        tableId: data.tableId,
        tableNumber: data.tableNumber,
        userId: data.userId,
        userEmail: data.userEmail,
        ip: data.ip,
        userAgent: data.userAgent,
        beforeData: data.beforeData,
        afterData: data.afterData,
        metadata: data.metadata,
      },
    });
  }

  findAll() {
    return this.prisma.systemLog.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 500,
    });
  }

  clear() {
    return this.prisma.systemLog.deleteMany();
  }
}