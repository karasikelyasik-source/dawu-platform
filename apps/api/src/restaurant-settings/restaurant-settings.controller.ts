import {
  Body,
  Controller,
  Get,
  Patch,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';

import { RestaurantSettingsService } from './restaurant-settings.service';

const CUSTOMER_COOKIE =
  'dawu_customer_session';

@Controller('restaurant-settings')
export class RestaurantSettingsController {
  constructor(
    private readonly restaurantSettingsService: RestaurantSettingsService,
  ) {}

  @Get('public')
  getPublicSettings() {
    return this.restaurantSettingsService
      .getPublicSettings();
  }

  @Patch('admin')
  updateSettings(
    @Body()
    body: {
      restaurantOpen?: boolean;
      closedMessage?: string;
    },
    @Req() request: Request,
  ) {
    const customerSessionToken =
      this.readCookie(
        request,
        CUSTOMER_COOKIE,
      );

    return this.restaurantSettingsService
      .updateSettings(
        customerSessionToken,
        {
          restaurantOpen:
            body.restaurantOpen,
          closedMessage:
            body.closedMessage,
        },
      );
  }

  private readCookie(
    request: Request,
    cookieName: string,
  ) {
    const cookieHeader =
      request.headers.cookie;

    if (!cookieHeader) {
      return null;
    }

    for (
      const cookiePart of
      cookieHeader.split(';')
    ) {
      const [name, ...valueParts] =
        cookiePart.trim().split('=');

      if (name === cookieName) {
        return decodeURIComponent(
          valueParts.join('='),
        );
      }
    }

    return null;
  }
}