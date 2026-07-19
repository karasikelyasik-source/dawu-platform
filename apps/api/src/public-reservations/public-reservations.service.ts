import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { randomBytes } from 'crypto';

import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * false — ресторан временно закрыт:
 * бронирование доступно только ADMIN и OWNER.
 *
 * true — ресторан открыт:
 * бронирование доступно всем.
 */
const RESTAURANT_OPEN = false;

type CreatePublicReservationData = {
  name: string;
  phone: string;
  email?: string;
  guests: number;
  date: string;
  time: string;
  message?: string;
};

@Injectable()
export class PublicReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async create(
    data: CreatePublicReservationData,
    customerSessionToken?: string | null,
  ) {
    const customerSession = customerSessionToken
      ? await this.prisma.customerSession.findUnique({
          where: {
            token: customerSessionToken,
          },
          include: {
            customer: true,
          },
        })
      : null;

    const hasAdminAccess =
      customerSession?.customer.role === 'ADMIN' ||
      customerSession?.customer.role === 'OWNER';

    if (!RESTAURANT_OPEN && !hasAdminAccess) {
      throw new ForbiddenException(
        'Reservations are temporarily unavailable.',
      );
    }

    const name = data.name?.trim();
    const phone = data.phone?.trim();
    const email =
      data.email?.trim().toLowerCase() || null;
    const guests = Number(data.guests);

    if (!name) {
      throw new BadRequestException(
        'Name is required',
      );
    }

    if (!phone) {
      throw new BadRequestException(
        'Phone is required',
      );
    }

    if (!Number.isInteger(guests) || guests < 1) {
      throw new BadRequestException(
        'Guests must be at least 1',
      );
    }

    if (!data.date || !data.time) {
      throw new BadRequestException(
        'Date and time are required',
      );
    }

    const startTime = new Date(
      `${data.date}T${data.time}:00`,
    );

    if (Number.isNaN(startTime.getTime())) {
      throw new BadRequestException(
        'Invalid reservation date or time',
      );
    }

    const endTime = new Date(
      startTime.getTime() +
        2.5 * 60 * 60 * 1000,
    );

    const qrToken =
      randomBytes(24).toString('hex');

    const reservation =
      await this.prisma.$transaction(
        async (tx) => {
          const createdReservation =
            await tx.reservation.create({
              data: {
                name,
                phone,
                email,
                message:
                  data.message?.trim() || null,
                guests,
                startTime,
                endTime,
                status: 'CONFIRMED',
                qrToken,
              },
            });

          if (customerSession) {
            await tx.customerReservation.create({
              data: {
                customerId:
                  customerSession.customerId,
                reservationId:
                  createdReservation.id,
              },
            });
          }

          return createdReservation;
        },
      );

    const emailData = {
      name,
      phone,
      email: email || undefined,
      guests,
      date: data.date,
      time: data.time,
      message:
        data.message?.trim() || undefined,
      qrToken,
    };

    await this.mailService.sendNewReservationEmail(
      emailData,
    );

    if (email) {
      await this.mailService.sendCustomerReservationEmail(
        emailData,
      );
    }

    return {
      success: true,
      reservation,
      linkedToAccount: Boolean(customerSession),
    };
  }
}