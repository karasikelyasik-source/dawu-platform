import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class ReservationsService {
  constructor(
  private readonly prisma: PrismaService,
  private readonly mailService: MailService,
) {}

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

  
async updateStatus(
  id: string,
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW',
) {
  console.log('Reservation status update:', id, status);

  const reservation = await this.prisma.reservation.update({
    where: { id },
    data: { status },
  });

  console.log('Reservation updated:', {
    name: reservation.name,
    email: reservation.email,
    status: reservation.status,
  });

  if (status === 'CANCELLED') {
    console.log('Trying to send cancellation email to:', reservation.email);

    await this.mailService.sendReservationCancelledEmail({
      name: reservation.name,
      email: reservation.email,
      startTime: reservation.startTime,
      guests: reservation.guests,
    });
  }

  return reservation;
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
findByQrToken(qrToken: string) {
  return this.prisma.reservation.findUnique({
    where: { qrToken },
    include: {
      table: true,
    },
  });
}

async checkInByQrToken(qrToken: string) {
  const reservation = await this.prisma.reservation.findUnique({
    where: { qrToken },
    include: {
      table: true,
    },
  });

  if (!reservation) {
    return {
      success: false,
      message: 'Reservation not found',
    };
  }

  if (reservation.checkedInAt) {
    return {
      success: false,
      message: 'Reservation already checked in',
      reservation,
    };
  }

  const updated = await this.prisma.reservation.update({
    where: { id: reservation.id },
    data: {
      checkedInAt: new Date(),
    },
    include: {
      table: true,
    },
  });

  return {
    success: true,
    reservation: updated,
  };
}
}