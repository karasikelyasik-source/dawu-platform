import { Module } from '@nestjs/common';
import { TablesModule } from './tables/tables.module';
import { SessionsModule } from './sessions/sessions.module';
import { OrdersModule } from './orders/orders.module';
import { ReservationsModule } from './reservations/reservations.module';
import { MenuModule } from './menu/menu.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    TablesModule,
    SessionsModule,
    OrdersModule,
    ReservationsModule,
    MenuModule,
    AuthModule,
  ],
})
export class AppModule {}