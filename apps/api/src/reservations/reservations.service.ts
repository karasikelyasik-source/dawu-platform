import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    name: string;
    phone: string;
    guests: number;
    startTime: string;
  }) {
    const startTime = new Date(data.startTime);
    const endTime = new Date(startTime.getTime() + 2.5 * 60 * 60 * 1000);

    return this.prisma.reservation.create({
      data: {
        name: data.name,
        phone: data.phone,
        guests: data.guests,
        startTime,
        endTime,
        status: 'CONFIRMED',
      },
    });
  }

  findAll() {
    return this.prisma.reservation.findMany({
      orderBy: {
        startTime: 'asc',
      },
    });
  }

  findToday() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return this.prisma.reservation.findMany({
      where: {
        startTime: {
          gte: start,
          lte: end,
        },
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });
  }

  updateStatus(
    id: string,
    status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW',
  ) {
    return this.prisma.reservation.update({
      where: { id },
      data: { status },
    });
  }
  assignTable(id: string, tableId: string) {
  return this.prisma.reservation.update({
    where: { id },
    data: {
      tableId,
      status: 'CONFIRMED',
    },
    include: {
      table: true,
    },
  });
}
}