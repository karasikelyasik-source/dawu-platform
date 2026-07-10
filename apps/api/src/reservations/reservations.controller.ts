import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { ReservationsService } from './reservations.service';

@Controller('reservations')
export class ReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
  ) {}

  @Post()
  create(@Body() body: any) {
    return this.reservationsService.create(body);
  }

  @Get()
  findAll() {
    return this.reservationsService.findAll();
  }

  @Get('today')
  findToday() {
    return this.reservationsService.findToday();
  }

  @Get('scan/:token')
  scanReservation(@Param('token') token: string) {
    return this.reservationsService.findByQrToken(token);
  }

  @Post('scan/:token/check-in')
  checkInReservation(@Param('token') token: string) {
    return this.reservationsService.checkInByQrToken(token);
  }

  @Post('scan/:token/open-table')
  openTable(
    @Param('token') token: string,
    @Body() body: any,
  ) {
    return this.reservationsService.openTableByQrToken(
      token,
      body.packageId,
    );
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.reservationsService.updateStatus(
      id,
      body.status,
    );
  }

  @Patch(':id/assign-table')
  assignTable(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.reservationsService.assignTable(
      id,
      body.tableId,
    );
  }
}