import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { AdminSessionsService } from './admin-sessions.service';

@Controller('admin-sessions')
export class AdminSessionsController {
  constructor(private readonly service: AdminSessionsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post('ban-ip')
  banIp(@Body() body: { ip: string }) {
    return this.service.banIp(body.ip);
  }

  @Post('unban-ip')
  unbanIp(@Body() body: { ip: string }) {
    return this.service.unbanIp(body.ip);
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