import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';

import { MARKETING_EMAIL_QUEUE } from './queue.constants';

@Module({
  imports: [
    ConfigModule,

    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        connection: {
          host:
            configService.get<string>('REDIS_HOST') ||
            '127.0.0.1',

          port:
            configService.get<number>('REDIS_PORT') ||
            6379,

          password:
            configService.get<string>('REDIS_PASSWORD') ||
            undefined,
        },
      }),
    }),

    BullModule.registerQueue({
      name: MARKETING_EMAIL_QUEUE,

      defaultJobOptions: {
        attempts: 3,

        backoff: {
          type: 'exponential',
          delay: 5000,
        },

        removeOnComplete: {
          age: 24 * 60 * 60,
          count: 5000,
        },

        removeOnFail: {
          age: 7 * 24 * 60 * 60,
          count: 10000,
        },
      },
    }),
  ],

  exports: [BullModule],
})
export class QueueModule {}