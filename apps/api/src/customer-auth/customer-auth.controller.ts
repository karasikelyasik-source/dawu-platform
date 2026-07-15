import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type {
  Request,
  Response,
} from 'express';

import { CustomerAuthService } from './customer-auth.service';

const CUSTOMER_COOKIE = 'dawu_customer_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

@Controller('customer')
export class CustomerAuthController {
  constructor(
    private readonly customerAuthService: CustomerAuthService,
  ) {}

  @Post('register')
  async register(
    @Body() body: any,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.customerAuthService.register(
      body,
      this.getSessionInfo(request),
    );

    this.setSessionCookie(response, result.token);

    return {
      success: true,
      customer: result.customer,
    };
  }

  @Post('login')
  async login(
    @Body() body: any,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.customerAuthService.login(
      body,
      this.getSessionInfo(request),
    );

    this.setSessionCookie(response, result.token);

    return {
      success: true,
      customer: result.customer,
    };
  }

  @Get('me')
  me(@Req() request: Request) {
    const token = this.readCookie(
      request,
      CUSTOMER_COOKIE,
    );

    return this.customerAuthService.getCurrentCustomer(token);
  }

  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = this.readCookie(
      request,
      CUSTOMER_COOKIE,
    );

    await this.customerAuthService.logout(token);
    this.clearSessionCookie(response);

    return {
      success: true,
    };
  }

  private getSessionInfo(request: Request) {
    const forwardedFor =
      request.headers['x-forwarded-for'];

    const ip =
      typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0].trim()
        : request.socket.remoteAddress || null;

    return {
      ip,
      userAgent:
        request.headers['user-agent'] || null,
    };
  }

  private setSessionCookie(
    response: Response,
    token: string,
  ) {
    response.setHeader(
      'Set-Cookie',
      [
        `${CUSTOMER_COOKIE}=${encodeURIComponent(token)}`,
        'Path=/',
        'HttpOnly',
        'Secure',
        'SameSite=Lax',
        `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
      ].join('; '),
    );
  }

  private clearSessionCookie(response: Response) {
    response.setHeader(
      'Set-Cookie',
      [
        `${CUSTOMER_COOKIE}=`,
        'Path=/',
        'HttpOnly',
        'Secure',
        'SameSite=Lax',
        'Max-Age=0',
      ].join('; '),
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