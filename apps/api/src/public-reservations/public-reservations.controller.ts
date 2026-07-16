import {
  Body,
  Controller,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';

import { PublicReservationsService } from './public-reservations.service';

const CUSTOMER_COOKIE = 'dawu_customer_session';

@Controller('public/reservations')
export class PublicReservationsController {
  constructor(
    private readonly publicReservationsService: PublicReservationsService,
  ) {}

  @Post()
  create(
    @Body() body: any,
    @Req() request: Request,
  ) {
    const customerSessionToken = this.readCookie(
      request,
      CUSTOMER_COOKIE,
    );

    return this.publicReservationsService.create(
      {
        name: body.name,
        phone: body.phone,
        email: body.email,
        guests: Number(body.guests),
        date: body.date,
        time: body.time,
        message: body.message,
      },
      customerSessionToken,
    );
  }

  private readCookie(
    request: Request,
    cookieName: string,
  ) {
    const cookieHeader = request.headers.cookie;

    if (!cookieHeader) {
      return null;
    }

    for (const cookiePart of cookieHeader.split(';')) {
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