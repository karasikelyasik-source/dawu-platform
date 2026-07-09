import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { randomBytes } from 'crypto';

@Injectable()
export class PublicReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async create(data: {
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
    const qrToken = randomBytes(24).toString('hex');
    const reservation = await this.prisma.reservation.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        message: data.message || null,
        guests: Number(data.guests),
        startTime,
        endTime,
        status: 'CONFIRMED',
        qrToken,
      },
    });

await this.mailService.sendNewReservationEmail({
  ...data,
  qrToken,
});

if (data.email) {
  await this.mailService.sendCustomerReservationEmail({
    ...data,
    qrToken,
  });
}
    return reservation;
  }
}