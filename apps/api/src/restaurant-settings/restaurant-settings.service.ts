import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

const SETTINGS_ID = 1;

const DEFAULT_CLOSED_MESSAGE =
  'DaWu Sushi Fusion is temporarily closed. Reservations and online ordering are currently unavailable.';

const DEFAULT_RESERVATION_START_TIME = '16:00';
const DEFAULT_RESERVATION_END_TIME = '22:00';
const DEFAULT_RESERVATION_INTERVAL = 15;

type UpdateRestaurantSettingsData = {
  restaurantOpen?: boolean;
  closedMessage?: string;
  reservationStartTime?: string;
  reservationEndTime?: string;
  reservationInterval?: number;
};

@Injectable()
export class RestaurantSettingsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getPublicSettings() {
    const settings =
      await this.prisma.restaurantSettings.upsert({
        where: {
          id: SETTINGS_ID,
        },
        update: {},
        create: {
          id: SETTINGS_ID,
          restaurantOpen: false,
          closedMessage:
            DEFAULT_CLOSED_MESSAGE,
          reservationStartTime:
            DEFAULT_RESERVATION_START_TIME,
          reservationEndTime:
            DEFAULT_RESERVATION_END_TIME,
          reservationInterval:
            DEFAULT_RESERVATION_INTERVAL,
        },
      });

    return {
      restaurantOpen:
        settings.restaurantOpen,

      closedMessage:
        settings.closedMessage,

      reservationStartTime:
        settings.reservationStartTime,

      reservationEndTime:
        settings.reservationEndTime,

      reservationInterval:
        settings.reservationInterval,

      updatedAt:
        settings.updatedAt,
    };
  }

  async updateSettings(
    customerSessionToken: string | null,
    data: UpdateRestaurantSettingsData,
  ) {
    if (!customerSessionToken) {
      throw new ForbiddenException(
        'Administrator access required.',
      );
    }

    const customerSession =
      await this.prisma.customerSession.findUnique({
        where: {
          token: customerSessionToken,
        },
        include: {
          customer: true,
        },
      });

    const hasAdminAccess =
      customerSession?.customer.role ===
        'ADMIN' ||
      customerSession?.customer.role ===
        'OWNER';

    if (!hasAdminAccess) {
      throw new ForbiddenException(
        'Administrator access required.',
      );
    }

    const updateData: UpdateRestaurantSettingsData =
      {};

    if (
      typeof data.restaurantOpen ===
      'boolean'
    ) {
      updateData.restaurantOpen =
        data.restaurantOpen;
    }

    if (
      typeof data.closedMessage ===
      'string'
    ) {
      const cleanMessage =
        data.closedMessage.trim();

      if (!cleanMessage) {
        throw new BadRequestException(
          'Closed message is required.',
        );
      }

      if (cleanMessage.length > 500) {
        throw new BadRequestException(
          'Closed message may not exceed 500 characters.',
        );
      }

      updateData.closedMessage =
        cleanMessage;
    }

    if (
      typeof data.reservationStartTime ===
      'string'
    ) {
      const reservationStartTime =
        data.reservationStartTime.trim();

      this.validateTime(
        reservationStartTime,
        'Reservation start time',
      );

      updateData.reservationStartTime =
        reservationStartTime;
    }

    if (
      typeof data.reservationEndTime ===
      'string'
    ) {
      const reservationEndTime =
        data.reservationEndTime.trim();

      this.validateTime(
        reservationEndTime,
        'Reservation end time',
      );

      updateData.reservationEndTime =
        reservationEndTime;
    }

    if (
      data.reservationInterval !==
      undefined
    ) {
      const reservationInterval =
        Number(data.reservationInterval);

      if (
        !Number.isInteger(
          reservationInterval,
        ) ||
        reservationInterval < 5 ||
        reservationInterval > 60
      ) {
        throw new BadRequestException(
          'Reservation interval must be a whole number between 5 and 60 minutes.',
        );
      }

      updateData.reservationInterval =
        reservationInterval;
    }

    const currentSettings =
      await this.prisma.restaurantSettings.findUnique({
        where: {
          id: SETTINGS_ID,
        },
      });

    const reservationStartTime =
      updateData.reservationStartTime ??
      currentSettings?.reservationStartTime ??
      DEFAULT_RESERVATION_START_TIME;

    const reservationEndTime =
      updateData.reservationEndTime ??
      currentSettings?.reservationEndTime ??
      DEFAULT_RESERVATION_END_TIME;

    if (
      this.timeToMinutes(
        reservationStartTime,
      ) >=
      this.timeToMinutes(
        reservationEndTime,
      )
    ) {
      throw new BadRequestException(
        'Reservation end time must be later than the start time.',
      );
    }

    const settings =
      await this.prisma.restaurantSettings.upsert({
        where: {
          id: SETTINGS_ID,
        },

        create: {
          id: SETTINGS_ID,

          restaurantOpen:
            updateData.restaurantOpen ??
            false,

          closedMessage:
            updateData.closedMessage ??
            DEFAULT_CLOSED_MESSAGE,

          reservationStartTime:
            updateData.reservationStartTime ??
            DEFAULT_RESERVATION_START_TIME,

          reservationEndTime:
            updateData.reservationEndTime ??
            DEFAULT_RESERVATION_END_TIME,

          reservationInterval:
            updateData.reservationInterval ??
            DEFAULT_RESERVATION_INTERVAL,
        },

        update:
          updateData,
      });

    return {
      success: true,

      restaurantOpen:
        settings.restaurantOpen,

      closedMessage:
        settings.closedMessage,

      reservationStartTime:
        settings.reservationStartTime,

      reservationEndTime:
        settings.reservationEndTime,

      reservationInterval:
        settings.reservationInterval,

      updatedAt:
        settings.updatedAt,
    };
  }

  private validateTime(
    value: string,
    fieldName: string,
  ) {
    if (
      !/^([01]\d|2[0-3]):([0-5]\d)$/.test(
        value,
      )
    ) {
      throw new BadRequestException(
        `${fieldName} must use HH:mm format.`,
      );
    }
  }

  private timeToMinutes(
    value: string,
  ) {
    const [hours, minutes] =
      value.split(':').map(Number);

    return hours * 60 + minutes;
  }
}