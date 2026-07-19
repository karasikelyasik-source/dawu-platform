import { Module } from '@nestjs/common';

import { AdminSessionsModule } from './admin-sessions/admin-sessions.module';
import { AuthModule } from './auth/auth.module';
import { CustomerAdminModule } from './customer-admin/customer-admin.module';
import { CustomerAuthModule } from './customer-auth/customer-auth.module';
import { MailModule } from './mail/mail.module';
import { MenuModule } from './menu/menu.module';
import { OrdersModule } from './orders/orders.module';
import { PublicReservationsModule } from './public-reservations/public-reservations.module';
import { ReservationsModule } from './reservations/reservations.module';
import { RestaurantSettingsModule } from './restaurant-settings/restaurant-settings.module';
import { SessionsModule } from './sessions/sessions.module';
import { SystemLogsModule } from './system-logs/system-logs.module';
import { TablesModule } from './tables/tables.module';
import { TakeAwayModule } from './take-away/take-away.module';

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
    PublicReservationsModule,
    MailModule,
    CustomerAuthModule,
    CustomerAdminModule,
    RestaurantSettingsModule,
  ],
})
export class AppModule {}