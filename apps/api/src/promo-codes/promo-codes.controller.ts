import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';

import { PromoCodesService } from './promo-codes.service';

const CUSTOMER_COOKIE = 'dawu_customer_session';

@Controller('promo-codes')
export class PromoCodesController {
  constructor(
    private readonly promoCodesService: PromoCodesService,
  ) {}

  @Get('admin')
  getAll(
    @Req() request: Request,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.promoCodesService.getAll(
      this.getToken(request),
      {
        search,
        status,
        page: Number(page) || 1,
        limit: Number(limit) || 20,
      },
    );
  }

  @Get('admin/:id')
  getOne(
    @Req() request: Request,
    @Param('id') id: string,
  ) {
    return this.promoCodesService.getOne(
      this.getToken(request),
      id,
    );
  }

  @Post('admin')
  create(
    @Req() request: Request,
    @Body() body: any,
  ) {
    return this.promoCodesService.create(
      this.getToken(request),
      body,
      this.getRequestInfo(request),
    );
  }

  @Patch('admin/:id')
  update(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.promoCodesService.update(
      this.getToken(request),
      id,
      body,
      this.getRequestInfo(request),
    );
  }

  @Patch('admin/:id/toggle')
  toggle(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.promoCodesService.toggle(
      this.getToken(request),
      id,
      body?.isActive,
      this.getRequestInfo(request),
    );
  }

  @Post('admin/:id/redeem')
  redeem(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.promoCodesService.redeem(
      this.getToken(request),
      id,
      body,
      this.getRequestInfo(request),
    );
  }

  @Delete('admin/:id')
  remove(
    @Req() request: Request,
    @Param('id') id: string,
  ) {
    return this.promoCodesService.remove(
      this.getToken(request),
      id,
      this.getRequestInfo(request),
    );
  }

  @Post('validate')
  validate(
    @Req() request: Request,
    @Body() body: any,
  ) {
    return this.promoCodesService.validate(
      this.getToken(request),
      body,
    );
  }

  private getToken(request: Request) {
    const cookieHeader = request.headers.cookie;
    if (!cookieHeader) return null;

    for (const part of cookieHeader.split(';')) {
      const [name, ...valueParts] = part.trim().split('=');
      if (name === CUSTOMER_COOKIE) {
        return decodeURIComponent(valueParts.join('='));
      }
    }

    return null;
  }

  private getRequestInfo(request: Request) {
    const forwardedFor = request.headers['x-forwarded-for'];
    const ip =
      typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0].trim()
        : request.socket.remoteAddress || null;

    return {
      ip,
      userAgent: request.headers['user-agent'] || null,
    };
  }
}
