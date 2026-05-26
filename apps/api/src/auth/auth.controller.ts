import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: any) {
    return this.authService.register(body);
  }

  @Post('login')
  login(@Body() body: any, @Req() req: Request) {
    const ip =
      req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.socket.remoteAddress ||
      null;

    const userAgent = req.headers['user-agent'] || null;

    return this.authService.login(body, {
      ip,
      userAgent,
    });
  }
}