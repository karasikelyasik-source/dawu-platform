import { Controller, Delete, Get } from '@nestjs/common';
import { SystemLogsService } from './system-logs.service';

@Controller('system-logs')
export class SystemLogsController {
  constructor(private readonly systemLogsService: SystemLogsService) {}

  @Get()
  findAll() {
    return this.systemLogsService.findAll();
  }

  @Delete('clear')
  clear() {
    return this.systemLogsService.clear();
  }
}