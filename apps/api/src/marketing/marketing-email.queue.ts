import {
  Injectable,
  Logger,
} from '@nestjs/common';

import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import {
  MarketingCampaignStatus,
  MarketingRecipientStatus,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import {
  MARKETING_EMAIL_JOB,
  MARKETING_EMAIL_QUEUE,
} from '../queue/queue.constants';

import { MarketingEmailJobData } from './marketing-email.types';

@Injectable()
export class MarketingEmailQueue {
  private readonly logger = new Logger(
    MarketingEmailQueue.name,
  );

  constructor(
    @InjectQueue(MARKETING_EMAIL_QUEUE)
    private readonly queue: Queue<MarketingEmailJobData>,

    private readonly prisma: PrismaService,
  ) {}

  async enqueueCampaign(
    campaignId: string,
    recipientIds: string[],
  ) {
    if (recipientIds.length === 0) {
      return {
        queuedCount: 0,
      };
    }

    await this.prisma.$transaction([
      this.prisma.marketingRecipient.updateMany({
        where: {
          campaignId,
          id: {
            in: recipientIds,
          },
        },
        data: {
          status: MarketingRecipientStatus.QUEUED,
          errorMessage: null,
        },
      }),

      this.prisma.marketingCampaign.update({
        where: {
          id: campaignId,
        },
        data: {
          status: MarketingCampaignStatus.SENDING,
          startedAt: new Date(),
          completedAt: null,
          queuedCount: recipientIds.length,
        },
      }),
    ]);

    const batchSize = 500;
    let totalQueued = 0;

    try {
      for (
        let offset = 0;
        offset < recipientIds.length;
        offset += batchSize
      ) {
        const batch = recipientIds.slice(
          offset,
          offset + batchSize,
        );

        await this.queue.addBulk(
          batch.map((recipientId) => ({
            name: MARKETING_EMAIL_JOB,

            data: {
              campaignId,
              recipientId,
            },

            opts: {
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
          })),
        );

        totalQueued += batch.length;
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      this.logger.error(
        `Failed to queue campaign ${campaignId}: ${message}`,
      );

      await this.prisma.marketingCampaign.update({
        where: {
          id: campaignId,
        },
        data: {
          status: MarketingCampaignStatus.FAILED,
          completedAt: new Date(),
        },
      });

      throw error;
    }

    this.logger.log(
      `Campaign ${campaignId}: ${totalQueued} emails queued.`,
    );

    return {
      queuedCount: totalQueued,
    };
  }

  async getCampaignQueueStatus(
    campaignId: string,
  ) {
    const campaign =
      await this.prisma.marketingCampaign.findUnique({
        where: {
          id: campaignId,
        },
        select: {
          id: true,
          status: true,
          totalRecipients: true,
          queuedCount: true,
          sentCount: true,
          failedCount: true,
          startedAt: true,
          completedAt: true,
        },
      });

    if (!campaign) {
      return null;
    }

    const processed =
      campaign.sentCount +
      campaign.failedCount;

    const progress =
      campaign.totalRecipients > 0
        ? Number(
            (
              (processed /
                campaign.totalRecipients) *
              100
            ).toFixed(2),
          )
        : 0;

    return {
      ...campaign,
      processed,
      progress,
    };
  }
}