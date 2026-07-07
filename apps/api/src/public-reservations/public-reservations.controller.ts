import { Body, Controller, Post } from '@nestjs/common';
import { PublicReservationsService } from './public-reservations.service';

@Controller('public/reservations')
export class PublicReservationsController {
  constructor(
    private readonly publicReservationsService: PublicReservationsService,
  ) {}

  @Post()
  create(@Body() body: any) {
    return this.publicReservationsService.create({
      name: body.name,
      phone: body.phone,
      email: body.email,
      guests: Number(body.guests),
      date: body.date,
      time: body.time,
      message: body.message,
    });
  }
}