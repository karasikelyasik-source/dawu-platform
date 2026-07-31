import {
  Logger,
} from '@nestjs/common';

import {
  Processor,
  WorkerHost,
} from '@nestjs/bullmq';

import {
  Job,
} from 'bullmq';

import {
  MarketingCampaignStatus,
  MarketingRecipientStatus,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

import {
  MARKETING_CONTACT_EMAIL_JOB,
  MARKETING_EMAIL_JOB,
  MARKETING_EMAIL_QUEUE,
} from '../queue/queue.constants';

import {
  MarketingCampaignEmailJobData,
  MarketingContactEmailJobData,
  MarketingEmailJobData,
} from './marketing-email.types';

@Processor(MARKETING_EMAIL_QUEUE, {
  concurrency: 2,

  limiter: {
    max: 20,
    duration: 60_000,
  },
})
export class MarketingEmailProcessor extends WorkerHost {
  private readonly logger = new Logger(
    MarketingEmailProcessor.name,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {
    super();
  }

  async process(
    job: Job<MarketingEmailJobData>,
  ): Promise<void> {
    if (job.name === MARKETING_EMAIL_JOB) {
      await this.processCampaignEmail(
        job as Job<MarketingCampaignEmailJobData>,
      );

      return;
    }

    if (job.name === MARKETING_CONTACT_EMAIL_JOB) {
      await this.processContactEmail(
        job as Job<MarketingContactEmailJobData>,
      );

      return;
    }

    this.logger.warn(
      `Unknown marketing job: ${job.name}`,
    );
  }

  private async processCampaignEmail(
    job: Job<MarketingCampaignEmailJobData>,
  ): Promise<void> {
    const {
      campaignId,
      recipientId,
    } = job.data;

    const recipient =
      await this.prisma.marketingRecipient.findUnique({
        where: {
          id: recipientId,
        },

        include: {
          campaign: {
            include: {
              promoCode: true,
            },
          },
        },
      });

    if (!recipient) {
      this.logger.warn(
        `Recipient ${recipientId} no longer exists.`,
      );

      return;
    }

    if (recipient.campaignId !== campaignId) {
      throw new Error(
        `Recipient ${recipientId} does not belong to campaign ${campaignId}.`,
      );
    }

    if (
      recipient.status ===
        MarketingRecipientStatus.SENT ||
      recipient.status ===
        MarketingRecipientStatus.DELIVERED ||
      recipient.status ===
        MarketingRecipientStatus.OPENED ||
      recipient.status ===
        MarketingRecipientStatus.CLICKED
    ) {
      this.logger.warn(
        `Recipient ${recipientId} was already processed.`,
      );

      return;
    }

    const campaign = recipient.campaign;

    if (
      campaign.status !==
        MarketingCampaignStatus.SENDING &&
      campaign.status !==
        MarketingCampaignStatus.QUEUED
    ) {
      this.logger.warn(
        `Campaign ${campaignId} has status ${campaign.status}; job skipped.`,
      );

      return;
    }

    await this.prisma.marketingRecipient.update({
      where: {
        id: recipientId,
      },

      data: {
        status: MarketingRecipientStatus.SENDING,

        attempts: {
          increment: 1,
        },

        errorMessage: null,
      },
    });

    try {
      await this.mailService.sendMarketingCampaignEmail({
        name: recipient.name || 'Guest',
        email: recipient.email,

        subject: campaign.subject,
        previewText: campaign.previewText,

        title: campaign.title,
        subtitle: campaign.subtitle,
        body: campaign.body,

        buttonText: campaign.buttonText,
        buttonUrl: campaign.buttonUrl,
        imageUrl: campaign.imageUrl,

        promoCode: campaign.promoCode
          ? {
              code: campaign.promoCode.code,

              discountType:
                campaign.promoCode.discountType,

              discountValue:
                campaign.promoCode.discountValue,
            }
          : null,
      });

      await this.markRecipientAsSent(
        campaignId,
        recipientId,
      );

      this.logger.log(
        `Campaign ${campaignId}: email sent to ${recipient.email}.`,
      );

      await this.completeCampaignIfFinished(
        campaignId,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : String(error);

      const maximumAttempts =
        job.opts.attempts ?? 1;

      const currentAttempt =
        job.attemptsMade + 1;

      const isFinalAttempt =
        currentAttempt >= maximumAttempts;

      this.logger.error(
        `Campaign ${campaignId}: failed to send to ${recipient.email}. Attempt ${currentAttempt}/${maximumAttempts}. ${errorMessage}`,
      );

      if (isFinalAttempt) {
        await this.markRecipientAsFailed(
          campaignId,
          recipientId,
          errorMessage,
        );

        await this.completeCampaignIfFinished(
          campaignId,
        );
      } else {
        await this.prisma.marketingRecipient.update({
          where: {
            id: recipientId,
          },

          data: {
            status:
              MarketingRecipientStatus.QUEUED,

            errorMessage,
          },
        });
      }

      throw error;
    }
  }

  private async processContactEmail(
    job: Job<MarketingContactEmailJobData>,
  ): Promise<void> {
    const {
      campaignId,
      email,
      name,
    } = job.data;

    const normalizedEmail =
      email.toLowerCase().trim();

    const normalizedName =
      name?.trim() || 'Guest';

    const campaign =
      await this.prisma.marketingCampaign.findUnique({
        where: {
          id: campaignId,
        },

        include: {
          promoCode: true,
        },
      });

    if (!campaign) {
      throw new Error(
        `Marketing campaign ${campaignId} no longer exists.`,
      );
    }

    try {
      await this.mailService.sendMarketingCampaignEmail({
        name: normalizedName,
        email: normalizedEmail,

        subject: campaign.subject,
        previewText: campaign.previewText,

        title: campaign.title,
        subtitle: campaign.subtitle,
        body: campaign.body,

        buttonText: campaign.buttonText,
        buttonUrl: campaign.buttonUrl,
        imageUrl: campaign.imageUrl,

        promoCode: campaign.promoCode
          ? {
              code: campaign.promoCode.code,

              discountType:
                campaign.promoCode.discountType,

              discountValue:
                campaign.promoCode.discountValue,
            }
          : null,
      });

      this.logger.log(
        `Campaign ${campaignId}: individual email sent to ${normalizedEmail}.`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : String(error);

      const maximumAttempts =
        job.opts.attempts ?? 1;

      const currentAttempt =
        job.attemptsMade + 1;

      this.logger.error(
        `Campaign ${campaignId}: individual email to ${normalizedEmail} failed. Attempt ${currentAttempt}/${maximumAttempts}. ${errorMessage}`,
      );

      throw error;
    }
  }

  private async markRecipientAsSent(
    campaignId: string,
    recipientId: string,
  ) {
    await this.prisma.$transaction([
      this.prisma.marketingRecipient.update({
        where: {
          id: recipientId,
        },

        data: {
          status: MarketingRecipientStatus.SENT,
          sentAt: new Date(),
          failedAt: null,
          errorMessage: null,
        },
      }),

      this.prisma.marketingCampaign.update({
        where: {
          id: campaignId,
        },

        data: {
          sentCount: {
            increment: 1,
          },

          queuedCount: {
            decrement: 1,
          },
        },
      }),
    ]);
  }

  private async markRecipientAsFailed(
    campaignId: string,
    recipientId: string,
    errorMessage: string,
  ) {
    await this.prisma.$transaction([
      this.prisma.marketingRecipient.update({
        where: {
          id: recipientId,
        },

        data: {
          status:
            MarketingRecipientStatus.FAILED,

          failedAt: new Date(),
          errorMessage,
        },
      }),

      this.prisma.marketingCampaign.update({
        where: {
          id: campaignId,
        },

        data: {
          failedCount: {
            increment: 1,
          },

          queuedCount: {
            decrement: 1,
          },
        },
      }),
    ]);
  }

  private async completeCampaignIfFinished(
    campaignId: string,
  ) {
    const remaining =
      await this.prisma.marketingRecipient.count({
        where: {
          campaignId,

          status: {
            in: [
              MarketingRecipientStatus.PENDING,
              MarketingRecipientStatus.QUEUED,
              MarketingRecipientStatus.SENDING,
            ],
          },
        },
      });

    if (remaining > 0) {
      return;
    }

    const result =
      await this.prisma.marketingRecipient.groupBy({
        by: ['status'],

        where: {
          campaignId,
        },

        _count: {
          _all: true,
        },
      });

    const counts = new Map(
      result.map((item) => [
        item.status,
        item._count._all,
      ]),
    );

    const sentCount =
      (counts.get(
        MarketingRecipientStatus.SENT,
      ) ?? 0) +
      (counts.get(
        MarketingRecipientStatus.DELIVERED,
      ) ?? 0) +
      (counts.get(
        MarketingRecipientStatus.OPENED,
      ) ?? 0) +
      (counts.get(
        MarketingRecipientStatus.CLICKED,
      ) ?? 0);

    const deliveredCount =
      (counts.get(
        MarketingRecipientStatus.DELIVERED,
      ) ?? 0) +
      (counts.get(
        MarketingRecipientStatus.OPENED,
      ) ?? 0) +
      (counts.get(
        MarketingRecipientStatus.CLICKED,
      ) ?? 0);

    const openedCount =
      (counts.get(
        MarketingRecipientStatus.OPENED,
      ) ?? 0) +
      (counts.get(
        MarketingRecipientStatus.CLICKED,
      ) ?? 0);

    const clickedCount =
      counts.get(
        MarketingRecipientStatus.CLICKED,
      ) ?? 0;

    const failedCount =
      counts.get(
        MarketingRecipientStatus.FAILED,
      ) ?? 0;

    const skippedCount =
      counts.get(
        MarketingRecipientStatus.SKIPPED,
      ) ?? 0;

    await this.prisma.marketingCampaign.update({
      where: {
        id: campaignId,
      },

      data: {
        status:
          sentCount > 0
            ? MarketingCampaignStatus.SENT
            : MarketingCampaignStatus.FAILED,

        queuedCount: 0,

        sentCount,
        deliveredCount,
        openedCount,
        clickedCount,
        failedCount,
        skippedCount,

        completedAt: new Date(),
      },
    });

    this.logger.log(
      `Campaign ${campaignId} completed. Sent: ${sentCount}, failed: ${failedCount}.`,
    );
  }
}