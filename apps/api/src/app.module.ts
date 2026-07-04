import { Module } from '@nestjs/common';
import { TablesModule } from './tables/tables.module';
import { SessionsModule } from './sessions/sessions.module';
import { OrdersModule } from './orders/orders.module';
import { ReservationsModule } from './reservations/reservations.module';
import { MenuModule } from './menu/menu.module';
import { AuthModule } from './auth/auth.module';
import { AdminSessionsModule } from './admin-sessions/admin-sessions.module';
import { TakeAwayModule } from './take-away/take-away.module';
import { SystemLogsModule } from './system-logs/system-logs.module';

@Module({
imports: [
  TablesModule,
  SessionsModule,
  OrdersModule,
  ReservationsModule,
  MenuModule,
  AuthModule,
  AdminSessionsModule,
  TakeAwayModule,
  SystemLogsModule,
],
})
export class AppModule {}