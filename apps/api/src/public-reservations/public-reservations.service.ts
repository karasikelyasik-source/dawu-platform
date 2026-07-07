import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PublicReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    name: string;
    phone: string;
    email?: string;
    guests: number;
    date: string;
    time: string;
    message?: string;
  }) {
    const startTime = new Date(`${data.date}T${data.time}:00`);
    const endTime = new Date(startTime.getTime() + 2.5 * 60 * 60 * 1000);

    return this.prisma.reservation.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        message: data.message || null,
        guests: Number(data.guests),
        startTime,
        endTime,
        status: 'PENDING',
      },
    });
  }
}