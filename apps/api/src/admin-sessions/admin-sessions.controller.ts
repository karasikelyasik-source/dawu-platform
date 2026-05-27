import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { AdminSessionsService } from './admin-sessions.service';

@Controller('admin-sessions')
export class AdminSessionsController {
  constructor(private readonly service: AdminSessionsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

@Get(':id')
findOne(@Param('id') id: string) {
  return this.service.findOne(id);
}
  
  @Post('ban-ip')
  banIp(@Body() body: { ip: string }) {
    return this.service.banIp(body.ip);
  }

  @Post('unban-ip')
  unbanIp(@Body() body: { ip: string }) {
    return this.service.unbanIp(body.ip);
  }

@Post('ban-email')
banEmail(@Body() body: { email: string }) {
  return this.service.banEmail(body.email);
}

@Post('unban-email')
unbanEmail(@Body() body: { email: string }) {
  return this.service.unbanEmail(body.email);
}

@Post('ban')
ban(
  @Body()
  body: {
    type: 'EMAIL' | 'IP';
    value: string;
    reason?: string;
    expiresAt?: string | null;
  },
) {
  return this.service.ban(body);
}

  @Patch(':id/kick')
  kickSession(@Param('id') id: string) {
    return this.service.kickSession(id);
  }

  @Patch('users/:userId/role')
  changeRole(
    @Param('userId') userId: string,
    @Body() body: { role: 'ADMIN' | 'STAFF' },
  ) {
    return this.service.changeRole(userId, body.role);
  }
}