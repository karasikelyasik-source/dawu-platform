import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get('active')
  findActive() {
    return this.sessionsService.findActive();
  }

  @Post('open')
  open(@Body() body: any) {
    return this.sessionsService.openSession(body);
  }

  @Post(':id/join')
  join(@Param('id') id: string, @Body() body: any) {
    return this.sessionsService.joinSession(id, body.name);
  }

  @Post(':id/close')
  close(@Param('id') id: string) {
    return this.sessionsService.closeSession(id);
  }
}