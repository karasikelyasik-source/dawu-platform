import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { randomBytes } from 'crypto';

import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { PromoCodesService } from '../promo-codes/promo-codes.service';

type CreatePublicReservationData = {
  name: string;
  phone: string;
  email?: string;
  guests: number;
  date: string;
  time: string;
  message?: string;
  promoCode?: string;
};

type AppliedPromoCode = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discountType:
    | 'PERCENTAGE'
    | 'FIXED_AMOUNT';
  discountValue: number;
  discountAmount: number;
  finalAmount: number;
};

@Injectable()
export class PublicReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly promoCodesService: PromoCodesService,
  ) {}

  async create(
    data: CreatePublicReservationData,
    customerSessionToken?: string | null,
  ) {
    const customerSession = customerSessionToken
      ? await this.prisma.customerSession.findUnique({
          where: {
            token: customerSessionToken,
          },
          include: {
            customer: true,
          },
        })
      : null;

    const customer =
      customerSession?.customer || null;

    const hasAdminAccess =
      customer?.role === 'ADMIN' ||
      customer?.role === 'OWNER';

    const restaurantSettings =
      await this.prisma.restaurantSettings.findUnique({
        where: {
          id: 1,
        },
      });

    if (
      restaurantSettings &&
      !restaurantSettings.restaurantOpen &&
      !hasAdminAccess
    ) {
      throw new ForbiddenException(
        restaurantSettings.closedMessage ||
          'The restaurant is temporarily closed.',
      );
    }

    const name = data.name?.trim();
    const phone = data.phone?.trim();

    const email =
      data.email?.trim().toLowerCase() ||
      null;

    const message =
      data.message?.trim() || null;

    const promoCode =
      data.promoCode
        ?.trim()
        .toUpperCase() || null;

    const guests = Number(data.guests);

    if (!name) {
      throw new BadRequestException(
        'Name is required',
      );
    }

    if (!phone) {
      throw new BadRequestException(
        'Phone is required',
      );
    }

    if (
      !Number.isInteger(guests) ||
      guests < 1
    ) {
      throw new BadRequestException(
        'Guests must be at least 1',
      );
    }

    if (!data.date || !data.time) {
      throw new BadRequestException(
        'Date and time are required',
      );
    }

    const startTime = new Date(
      `${data.date}T${data.time}:00`,
    );

    if (
      Number.isNaN(startTime.getTime())
    ) {
      throw new BadRequestException(
        'Invalid reservation date or time',
      );
    }

    const endTime = new Date(
      startTime.getTime() +
        2.5 * 60 * 60 * 1000,
    );

    const qrToken =
      randomBytes(24).toString('hex');

   let promoValidation: Awaited<
  ReturnType<PromoCodesService['validate']>
> | null = null;

    /*
     * A reservation itself currently has no monetary
     * amount, so orderAmount is 0.
     *
     * PromoCodesService still checks:
     * - activation status
     * - start and expiry dates
     * - RESERVATION applicability
     * - total usage limit
     * - per-customer limit
     * - first-reservation restriction
     * - minimum order amount
     */
    if (promoCode) {
      promoValidation =
        await this.promoCodesService.validate(
          customerSessionToken,
          {
            code: promoCode,
            orderAmount: 0,
            appliesTo: 'RESERVATION',
          },
        );
    }

    const transactionResult =
      await this.prisma.$transaction(
        async (tx) => {
          /*
           * Re-read the promo code inside the transaction.
           * This prevents applying a promo that was disabled
           * after the initial public validation.
           */
          let freshPromo:
            | Awaited<
                ReturnType<
                  typeof tx.promoCode.findUnique
                >
              >
            | null = null;

          if (promoValidation) {
            freshPromo =
              await tx.promoCode.findUnique({
                where: {
                  id: promoValidation.promoCode.id,
                },
              });

            if (
              !freshPromo ||
              freshPromo.deletedAt ||
              !freshPromo.isActive
            ) {
              throw new BadRequestException(
                'Promo code is unavailable',
              );
            }

            const now = new Date();

            if (
              freshPromo.startsAt &&
              freshPromo.startsAt > now
            ) {
              throw new BadRequestException(
                'Promo code is not active yet',
              );
            }

            if (
              freshPromo.expiresAt &&
              freshPromo.expiresAt < now
            ) {
              throw new BadRequestException(
                'Promo code has expired',
              );
            }

            if (
              freshPromo.appliesTo !==
                'ALL' &&
              freshPromo.appliesTo !==
                'RESERVATION'
            ) {
              throw new BadRequestException(
                `Promo code is only valid for ${freshPromo.appliesTo}`,
              );
            }

            if (
              freshPromo
                .minimumOrderAmount !==
                null &&
              freshPromo.minimumOrderAmount >
                0
            ) {
              throw new BadRequestException(
                `Minimum order amount is €${freshPromo.minimumOrderAmount.toFixed(
                  2,
                )}`,
              );
            }

            if (
              freshPromo.usageLimit !==
                null &&
              freshPromo.usageCount >=
                freshPromo.usageLimit
            ) {
              throw new BadRequestException(
                'Promo code usage limit has been reached',
              );
            }

            if (
              freshPromo.firstOrderOnly &&
              !customer
            ) {
              throw new BadRequestException(
                'Sign in to use this first-order promo code',
              );
            }

            if (customer) {
              const [
                customerPromoUses,
                previousReservations,
              ] = await Promise.all([
                tx.promoCodeUsage.count({
                  where: {
                    promoCodeId:
                      freshPromo.id,
                    customerId:
                      customer.id,
                  },
                }),

                freshPromo.firstOrderOnly
                  ? tx.customerReservation.count(
                      {
                        where: {
                          customerId:
                            customer.id,
                        },
                      },
                    )
                  : Promise.resolve(0),
              ]);

              if (
                customerPromoUses >=
                freshPromo
                  .usageLimitPerCustomer
              ) {
                throw new BadRequestException(
                  'You have already used this promo code',
                );
              }

              if (
                freshPromo.firstOrderOnly &&
                previousReservations > 0
              ) {
                throw new BadRequestException(
                  'Promo code is only available for the first reservation',
                );
              }
            }
          }

          const createdReservation =
            await tx.reservation.create({
              data: {
                name,
                phone,
                email,
                message,
                guests,
                startTime,
                endTime,
                status: 'CONFIRMED',
                qrToken,
              },
            });

          if (customerSession) {
            await tx.customerReservation.create({
              data: {
                customerId:
                  customerSession.customerId,
                reservationId:
                  createdReservation.id,
              },
            });
          }

          if (
            promoValidation &&
            freshPromo
          ) {
            await tx.promoCodeUsage.create({
              data: {
                promoCodeId:
                  freshPromo.id,

                customerId:
                  customer?.id || null,

                reservationId:
                  createdReservation.id,

                orderAmount:
                  promoValidation.orderAmount,

                discountAmount:
                  promoValidation.discountAmount,

                email:
                  email ||
                  customer?.email ||
                  null,

                phone:
                  phone ||
                  customer?.phone ||
                  null,
              },
            });

            await tx.promoCode.update({
              where: {
                id: freshPromo.id,
              },
              data: {
                usageCount: {
                  increment: 1,
                },
              },
            });
          }

          return {
            reservation:
              createdReservation,
            promoCode:
              promoValidation && freshPromo
                ? {
                    id: freshPromo.id,
                    code: freshPromo.code,
                    name: freshPromo.name,
                    description:
                      freshPromo.description,
                    discountType:
                      freshPromo.discountType,
                    discountValue:
                      freshPromo.discountValue,
                    discountAmount:
                      promoValidation.discountAmount,
                    finalAmount:
                      promoValidation.finalAmount,
                  }
                : null,
          };
        },
      );

    const emailData = {
      name,
      phone,
      email: email || undefined,
      guests,
      date: data.date,
      time: data.time,
      message:
        message || undefined,
      qrToken,
    };

    await this.mailService.sendNewReservationEmail(
      emailData,
    );

    if (email) {
      await this.mailService.sendCustomerReservationEmail(
        emailData,
      );
    }

    return {
      success: true,
      reservation:
        transactionResult.reservation,

      linkedToAccount:
        Boolean(customerSession),

      appliedPromoCode:
        transactionResult.promoCode as AppliedPromoCode | null,
    };
  }
}