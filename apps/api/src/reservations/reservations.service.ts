import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

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

    const endTime = new Date(
      startTime.getTime() + 2.5 * 60 * 60 * 1000,
    );

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
      include: {
        table: true,
      },
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
      include: {
        table: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });
  }

  async updateStatus(
    id: string,
    status:
      | 'CONFIRMED'
      | 'CANCELLED'
      | 'COMPLETED'
      | 'NO_SHOW',
  ) {
    const reservation =
      await this.prisma.reservation.update({
        where: {
          id,
        },
        data: {
          status,
        },
        include: {
          table: true,
        },
      });

    if (status === 'CANCELLED') {
      await this.mailService.sendReservationCancelledEmail({
        name: reservation.name,
        email: reservation.email,
        startTime: reservation.startTime,
        guests: reservation.guests,
      });
    }

    return reservation;
  }

  async assignTable(
    id: string,
    tableId: string,
  ) {
    if (!tableId) {
      throw new BadRequestException(
        'Table is required',
      );
    }

    const table = await this.prisma.table.findUnique({
      where: {
        id: tableId,
      },
    });

    if (!table) {
      throw new NotFoundException(
        'Table not found',
      );
    }

    if (table.status === 'OCCUPIED') {
      throw new ConflictException(
        'This table is already occupied',
      );
    }

    if (table.status === 'CLEANING') {
      throw new ConflictException(
        'This table is currently being cleaned',
      );
    }

    return this.prisma.reservation.update({
      where: {
        id,
      },
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
      where: {
        qrToken,
      },
      include: {
        table: true,
      },
    });
  }

  async checkInByQrToken(qrToken: string) {
    const reservation =
      await this.prisma.reservation.findUnique({
        where: {
          qrToken,
        },
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

    const updated =
      await this.prisma.reservation.update({
        where: {
          id: reservation.id,
        },
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

  async openTableByQrToken(
    qrToken: string,
    packageId: string,
  ) {
    if (!packageId) {
      throw new BadRequestException(
        'Package is required',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const reservation =
        await tx.reservation.findUnique({
          where: {
            qrToken,
          },
          include: {
            table: true,
          },
        });

      if (!reservation) {
        throw new NotFoundException(
          'Reservation not found',
        );
      }

      if (!reservation.checkedInAt) {
        throw new BadRequestException(
          'Reservation must be checked in first',
        );
      }

      if (!reservation.tableId) {
        throw new BadRequestException(
          'Assign a table before opening it',
        );
      }

      const selectedPackage =
        await tx.package.findUnique({
          where: {
            id: packageId,
          },
        });

      if (!selectedPackage) {
        throw new NotFoundException(
          'Package not found',
        );
      }

      const normalizedPackageName =
        selectedPackage.name
          .trim()
          .toUpperCase();

      let packageType: 'STANDARD' | 'DELUXE';

      if (normalizedPackageName === 'STANDARD') {
        packageType = 'STANDARD';
      } else if (
        normalizedPackageName === 'DELUXE'
      ) {
        packageType = 'DELUXE';
      } else {
        throw new BadRequestException(
          `Package "${selectedPackage.name}" is not supported`,
        );
      }

      const table = await tx.table.findUnique({
        where: {
          id: reservation.tableId,
        },
      });

      if (!table) {
        throw new NotFoundException(
          'Table not found',
        );
      }

      const activeSession =
        await tx.tableSession.findFirst({
          where: {
            tableId: table.id,
            status: 'ACTIVE',
          },
        });

      if (activeSession) {
        throw new ConflictException(
          'This table already has an active session',
        );
      }

      if (table.status === 'OCCUPIED') {
        throw new ConflictException(
          'This table is already occupied',
        );
      }

      if (table.status === 'CLEANING') {
        throw new ConflictException(
          'This table is being cleaned',
        );
      }

      const expiresAt = new Date(
        Date.now() + 2.5 * 60 * 60 * 1000,
      );

      const selectedPackages = [
        {
          packageId: selectedPackage.id,
          name: selectedPackage.name,
          guests: reservation.guests,
          price: selectedPackage.price,
          btwRate: selectedPackage.btwRate,
        },
      ];

      const updatedTable = await tx.table.update({
        where: {
          id: table.id,
        },
        data: {
          status: 'OCCUPIED',
          selectedPackage: `${selectedPackage.name} x${reservation.guests}`,
          selectedGuests: reservation.guests,
          selectedPackages,
        },
      });

      const session =
        await tx.tableSession.create({
          data: {
            tableId: table.id,
            guests: reservation.guests,
            packageType,
            expiresAt,
            status: 'ACTIVE',
          },
        });

      const updatedReservation =
        await tx.reservation.findUnique({
          where: {
            id: reservation.id,
          },
          include: {
            table: true,
          },
        });

      return {
        success: true,
        reservation: updatedReservation,
        table: updatedTable,
        session,
        package: selectedPackage,
      };
    });
  }
}