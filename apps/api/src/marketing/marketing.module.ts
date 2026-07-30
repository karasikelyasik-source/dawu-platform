import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { QueueModule } from '../queue/queue.module';

import { MarketingController } from './marketing.controller';
import { MarketingService } from './marketing.service';
import { MarketingEmailQueue } from './marketing-email.queue';
import { MarketingEmailProcessor } from './marketing-email.processor';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    QueueModule,
  ],

  controllers: [
    MarketingController,
  ],

  providers: [
    MarketingService,
    MarketingEmailQueue,
    MarketingEmailProcessor,
  ],

  exports: [
    MarketingService,
    MarketingEmailQueue,
  ],
})
export class MarketingModule {}