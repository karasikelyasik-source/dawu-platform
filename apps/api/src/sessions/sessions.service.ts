import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async openSession(data: {
    tableId: string;
    guests: number;
    packageType: 'STANDARD' | 'DELUXE';
  }) {
    const expiresAt = new Date(Date.now() + 2.5 * 60 * 60 * 1000);

    return this.prisma.$transaction(async (tx) => {
      const session = await tx.tableSession.create({
        data: {
          tableId: data.tableId,
          guests: data.guests,
          packageType: data.packageType,
          expiresAt,
        },
      });

      await tx.table.update({
        where: {
          id: data.tableId,
        },
        data: {
          status: 'OCCUPIED',
        },
      });

      return session;
    });
  }

  async joinSession(sessionId: string, name?: string) {
    return this.prisma.sessionParticipant.create({
      data: {
        sessionId,
        name,
      },
    });
  }

  async closeSession(sessionId: string) {
    return this.prisma.$transaction(async (tx) => {
      const session = await tx.tableSession.update({
        where: {
          id: sessionId,
        },
        data: {
          status: 'FINISHED',
        },
      });

      await tx.table.update({
        where: {
          id: session.tableId,
        },
        data: {
          status: 'CLEANING',
        },
      });

      return session;
    });
  }

  findActive() {
    return this.prisma.tableSession.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        table: true,
        participants: true,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });
  }
}