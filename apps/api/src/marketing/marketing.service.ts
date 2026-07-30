import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  MarketingCampaignStatus,
  MarketingRecipientStatus,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { MarketingEmailQueue } from './marketing-email.queue';

import { CreateMarketingCampaignDto } from './dto/create-marketing-campaign.dto';
import { UpdateMarketingCampaignDto } from './dto/update-marketing-campaign.dto';

@Injectable()
export class MarketingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly marketingEmailQueue: MarketingEmailQueue,
  ) {}

  async getDashboard() {
    const [
      totalCustomers,
      totalCampaigns,
      activePromoCodes,
      campaignStatistics,
      recentCampaigns,
    ] = await Promise.all([
      this.prisma.customer.count({
        where: {
          deletedAt: null,
          isBlocked: false,
        },
      }),

      this.prisma.marketingCampaign.count(),

      this.prisma.promoCode.count({
        where: {
          isActive: true,
          deletedAt: null,
          OR: [
            {
              expiresAt: null,
            },
            {
              expiresAt: {
                gt: new Date(),
              },
            },
          ],
        },
      }),

      this.prisma.marketingCampaign.aggregate({
        _sum: {
          totalRecipients: true,
          sentCount: true,
          deliveredCount: true,
          openedCount: true,
          clickedCount: true,
          failedCount: true,
        },
      }),

      this.prisma.marketingCampaign.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          name: true,
          subject: true,
          status: true,
          totalRecipients: true,
          sentCount: true,
          failedCount: true,
          scheduledAt: true,
          completedAt: true,
          createdAt: true,
        },
      }),
    ]);

    const sentCount = campaignStatistics._sum.sentCount ?? 0;
    const openedCount = campaignStatistics._sum.openedCount ?? 0;
    const clickedCount = campaignStatistics._sum.clickedCount ?? 0;

    return {
      totalCustomers,
      totalCampaigns,
      activePromoCodes,

      totalRecipients:
        campaignStatistics._sum.totalRecipients ?? 0,

      emailsSent: sentCount,

      deliveredCount:
        campaignStatistics._sum.deliveredCount ?? 0,

      openedCount,
      clickedCount,

      failedCount:
        campaignStatistics._sum.failedCount ?? 0,

      openRate:
        sentCount > 0
          ? Number(((openedCount / sentCount) * 100).toFixed(2))
          : 0,

      clickRate:
        sentCount > 0
          ? Number(((clickedCount / sentCount) * 100).toFixed(2))
          : 0,

      recentCampaigns,
    };
  }

  async findAll() {
    return this.prisma.marketingCampaign.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        promoCode: {
          select: {
            id: true,
            code: true,
            name: true,
            discountType: true,
            discountValue: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            recipients: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const campaign =
      await this.prisma.marketingCampaign.findUnique({
        where: {
          id,
        },
        include: {
          promoCode: true,

          recipients: {
            take: 100,
            orderBy: {
              createdAt: 'desc',
            },
          },

          _count: {
            select: {
              recipients: true,
            },
          },
        },
      });

    if (!campaign) {
      throw new NotFoundException(
        'Marketing campaign not found.',
      );
    }

    return campaign;
  }

  async create(
    dto: CreateMarketingCampaignDto,
    createdById?: string,
  ) {
    if (dto.promoCodeId) {
      await this.ensurePromoCodeExists(dto.promoCodeId);
    }

    return this.prisma.marketingCampaign.create({
      data: {
        name: dto.name.trim(),
        subject: dto.subject.trim(),
        previewText: dto.previewText?.trim() || null,

        title: dto.title?.trim() || null,
        subtitle: dto.subtitle?.trim() || null,
        body: dto.body,

        buttonText: dto.buttonText?.trim() || null,
        buttonUrl: dto.buttonUrl?.trim() || null,
        imageUrl: dto.imageUrl?.trim() || null,

        audienceType: dto.audienceType,

        promoCodeId: dto.promoCodeId || null,

        senderName: dto.senderName?.trim() || null,
        senderEmail: dto.senderEmail?.trim() || null,

        scheduledAt: dto.scheduledAt
          ? new Date(dto.scheduledAt)
          : null,

        status: dto.scheduledAt
          ? MarketingCampaignStatus.SCHEDULED
          : MarketingCampaignStatus.DRAFT,

        createdById: createdById || null,
      },
      include: {
        promoCode: true,
      },
    });
  }

  async update(
    id: string,
    dto: UpdateMarketingCampaignDto,
  ) {
    const campaign = await this.findCampaignOrThrow(id);

    if (
      campaign.status === MarketingCampaignStatus.SENDING ||
      campaign.status === MarketingCampaignStatus.SENT
    ) {
      throw new BadRequestException(
        'A sending or sent campaign cannot be edited.',
      );
    }

    if (dto.promoCodeId) {
      await this.ensurePromoCodeExists(dto.promoCodeId);
    }

    const data: Prisma.MarketingCampaignUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }

    if (dto.subject !== undefined) {
      data.subject = dto.subject.trim();
    }

    if (dto.previewText !== undefined) {
      data.previewText = dto.previewText.trim() || null;
    }

    if (dto.title !== undefined) {
      data.title = dto.title.trim() || null;
    }

    if (dto.subtitle !== undefined) {
      data.subtitle = dto.subtitle.trim() || null;
    }

    if (dto.body !== undefined) {
      data.body = dto.body;
    }

    if (dto.buttonText !== undefined) {
      data.buttonText = dto.buttonText.trim() || null;
    }

    if (dto.buttonUrl !== undefined) {
      data.buttonUrl = dto.buttonUrl.trim() || null;
    }

    if (dto.imageUrl !== undefined) {
      data.imageUrl = dto.imageUrl.trim() || null;
    }

    if (dto.audienceType !== undefined) {
      data.audienceType = dto.audienceType;
    }

    if (dto.senderName !== undefined) {
      data.senderName = dto.senderName.trim() || null;
    }

    if (dto.senderEmail !== undefined) {
      data.senderEmail = dto.senderEmail.trim() || null;
    }

    if (dto.promoCodeId !== undefined) {
      data.promoCode = dto.promoCodeId
        ? {
            connect: {
              id: dto.promoCodeId,
            },
          }
        : {
            disconnect: true,
          };
    }

    if (dto.scheduledAt !== undefined) {
      data.scheduledAt = dto.scheduledAt
        ? new Date(dto.scheduledAt)
        : null;

      data.status = dto.scheduledAt
        ? MarketingCampaignStatus.SCHEDULED
        : MarketingCampaignStatus.DRAFT;
    }

    return this.prisma.marketingCampaign.update({
      where: {
        id,
      },
      data,
      include: {
        promoCode: true,
      },
    });
  }

  async remove(id: string) {
    const campaign = await this.findCampaignOrThrow(id);

    if (
      campaign.status === MarketingCampaignStatus.SENDING
    ) {
      throw new BadRequestException(
        'A campaign currently being sent cannot be deleted.',
      );
    }

    await this.prisma.marketingCampaign.delete({
      where: {
        id,
      },
    });

    return {
      success: true,
    };
  }

  async prepareRecipients(id: string) {
    const campaign = await this.findCampaignOrThrow(id);

    if (
      campaign.status === MarketingCampaignStatus.SENDING ||
      campaign.status === MarketingCampaignStatus.SENT
    ) {
      throw new BadRequestException(
        'Recipients cannot be rebuilt for a sending or sent campaign.',
      );
    }

    const customers = await this.prisma.customer.findMany({
      where: {
        deletedAt: null,
        isBlocked: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    await this.prisma.$transaction(async (transaction) => {
      await transaction.marketingRecipient.deleteMany({
        where: {
          campaignId: id,
        },
      });

      if (customers.length > 0) {
        await transaction.marketingRecipient.createMany({
          data: customers.map((customer) => ({
            campaignId: id,
            customerId: customer.id,
            name: customer.name,
            email: customer.email.toLowerCase().trim(),
            status: MarketingRecipientStatus.PENDING,
          })),
          skipDuplicates: true,
        });
      }

      await transaction.marketingCampaign.update({
        where: {
          id,
        },
        data: {
          totalRecipients: customers.length,
          queuedCount: 0,
          sentCount: 0,
          deliveredCount: 0,
          openedCount: 0,
          clickedCount: 0,
          failedCount: 0,
          skippedCount: 0,
          status: MarketingCampaignStatus.QUEUED,
        },
      });
    });

    return this.findOne(id);
  }

  async sendCampaign(id: string) {
    const campaign =
      await this.prisma.marketingCampaign.findUnique({
        where: {
          id,
        },
      });

    if (!campaign) {
      throw new NotFoundException(
        'Marketing campaign not found.',
      );
    }

    if (
      campaign.status ===
      MarketingCampaignStatus.SENDING
    ) {
      throw new BadRequestException(
        'This campaign is already being sent.',
      );
    }

    if (
      campaign.status ===
      MarketingCampaignStatus.SENT
    ) {
      throw new BadRequestException(
        'This campaign has already been sent.',
      );
    }

    let recipients =
      await this.prisma.marketingRecipient.findMany({
        where: {
          campaignId: id,
          status: {
            in: [
              MarketingRecipientStatus.PENDING,
              MarketingRecipientStatus.QUEUED,
              MarketingRecipientStatus.FAILED,
            ],
          },
        },
        select: {
          id: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

    if (recipients.length === 0) {
      await this.prepareRecipients(id);

      recipients =
        await this.prisma.marketingRecipient.findMany({
          where: {
            campaignId: id,
            status: MarketingRecipientStatus.PENDING,
          },
          select: {
            id: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        });
    }

    if (recipients.length === 0) {
      throw new BadRequestException(
        'There are no recipients for this campaign.',
      );
    }

    const result =
      await this.marketingEmailQueue.enqueueCampaign(
        id,
        recipients.map((recipient) => recipient.id),
      );

    return {
      success: true,
      queuedCount: result.queuedCount,
      message: `${result.queuedCount} emails were added to the sending queue.`,
      campaign: await this.findOne(id),
    };
  }

  private async refreshCampaignStatistics(
    campaignId: string,
  ) {
    const grouped =
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
      grouped.map((group) => [
        group.status,
        group._count._all,
      ]),
    );

    await this.prisma.marketingCampaign.update({
      where: {
        id: campaignId,
      },
      data: {
        totalRecipients: grouped.reduce(
          (total, group) => total + group._count._all,
          0,
        ),

        queuedCount:
          counts.get(MarketingRecipientStatus.QUEUED) ?? 0,

        sentCount:
          (counts.get(MarketingRecipientStatus.SENT) ?? 0) +
          (counts.get(MarketingRecipientStatus.DELIVERED) ?? 0) +
          (counts.get(MarketingRecipientStatus.OPENED) ?? 0) +
          (counts.get(MarketingRecipientStatus.CLICKED) ?? 0),

        deliveredCount:
          (counts.get(MarketingRecipientStatus.DELIVERED) ?? 0) +
          (counts.get(MarketingRecipientStatus.OPENED) ?? 0) +
          (counts.get(MarketingRecipientStatus.CLICKED) ?? 0),

        openedCount:
          (counts.get(MarketingRecipientStatus.OPENED) ?? 0) +
          (counts.get(MarketingRecipientStatus.CLICKED) ?? 0),

        clickedCount:
          counts.get(MarketingRecipientStatus.CLICKED) ?? 0,

        failedCount:
          counts.get(MarketingRecipientStatus.FAILED) ?? 0,

        skippedCount:
          counts.get(MarketingRecipientStatus.SKIPPED) ?? 0,
      },
    });
  }

  private async findCampaignOrThrow(id: string) {
    const campaign =
      await this.prisma.marketingCampaign.findUnique({
        where: {
          id,
        },
      });

    if (!campaign) {
      throw new NotFoundException(
        'Marketing campaign not found.',
      );
    }

    return campaign;
  }

  private async ensurePromoCodeExists(id: string) {
    const promoCode = await this.prisma.promoCode.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!promoCode) {
      throw new BadRequestException(
        'Selected promo code does not exist.',
      );
    }
  }

}