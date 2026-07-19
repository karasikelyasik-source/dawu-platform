import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

const SETTINGS_ID = 1;

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
            'DaWu Sushi Fusion is temporarily closed. Reservations and online ordering are currently unavailable.',
        },
      });

    return {
      restaurantOpen:
        settings.restaurantOpen,
      closedMessage:
        settings.closedMessage,
      updatedAt: settings.updatedAt,
    };
  }

  async updateSettings(
    customerSessionToken: string | null,
    data: {
      restaurantOpen?: boolean;
      closedMessage?: string;
    },
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
      customerSession?.customer.role === 'ADMIN' ||
      customerSession?.customer.role === 'OWNER';

    if (!hasAdminAccess) {
      throw new ForbiddenException(
        'Administrator access required.',
      );
    }

    const updateData: {
      restaurantOpen?: boolean;
      closedMessage?: string;
    } = {};

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
      updateData.closedMessage =
        data.closedMessage.trim();
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
            updateData.closedMessage ||
            'DaWu Sushi Fusion is temporarily closed. Reservations and online ordering are currently unavailable.',
        },
        update: updateData,
      });

    return {
      success: true,
      restaurantOpen:
        settings.restaurantOpen,
      closedMessage:
        settings.closedMessage,
      updatedAt: settings.updatedAt,
    };
  }
}