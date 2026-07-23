import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

type PromoAppliesTo =
  | 'ALL'
  | 'RESERVATION'
  | 'DINE_IN'
  | 'TAKEAWAY'
  | 'DELIVERY';

type RequestInfo = {
  ip?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class PromoCodesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getAll(
    token: string | null | undefined,
    filters: {
      search?: string;
      status?: string;
      page: number;
      limit: number;
    },
  ) {
    await this.requireAdmin(token);

    const page = Math.max(filters.page, 1);
    const limit = Math.min(Math.max(filters.limit, 1), 100);
    const where: any = { deletedAt: null };
    const search = filters.search?.trim();

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (filters.status === 'active') where.isActive = true;
    if (filters.status === 'inactive') where.isActive = false;
    if (filters.status === 'expired') {
      where.expiresAt = { lt: new Date() };
    }

    const [promoCodes, total] = await Promise.all([
      this.prisma.promoCode.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          _count: { select: { usages: true } },
        },
      }),
      this.prisma.promoCode.count({ where }),
    ]);

    return {
      promoCodes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    };
  }

  async getOne(
    token: string | null | undefined,
    id: string,
  ) {
    await this.requireAdmin(token);

    const promoCode = await this.prisma.promoCode.findFirst({
      where: { id, deletedAt: null },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        usages: {
          orderBy: { usedAt: 'desc' },
          take: 100,
          include: {
            customer: {
              select: { id: true, name: true, email: true },
            },
            reservation: true,
          },
        },
        _count: { select: { usages: true } },
      },
    });

    if (!promoCode) {
      throw new NotFoundException('Promo code not found');
    }

    const totals = await this.prisma.promoCodeUsage.aggregate({
      where: { promoCodeId: id },
      _sum: { discountAmount: true, orderAmount: true },
      _avg: { orderAmount: true },
    });

    return {
      ...promoCode,
      statistics: {
        totalUses: promoCode._count.usages,
        totalDiscount: totals._sum.discountAmount || 0,
        generatedRevenue: totals._sum.orderAmount || 0,
        averageOrder: totals._avg.orderAmount || 0,
      },
    };
  }

  async create(
    token: string | null | undefined,
    body: any,
    requestInfo?: RequestInfo,
  ) {
    const actor = await this.requireAdmin(token);
    const data = this.normalise(body);

    const exists = await this.prisma.promoCode.findUnique({
      where: { code: data.code },
    });

    if (exists) {
      throw new ConflictException('This promo code already exists');
    }

    const created = await this.prisma.promoCode.create({
      data: { ...data, createdById: actor.id },
    });

    await this.audit(
      actor.id,
      'PROMO_CODE_CREATED',
      undefined,
      this.auditPromo(created),
      requestInfo,
    );

    return created;
  }

  async update(
    token: string | null | undefined,
    id: string,
    body: any,
    requestInfo?: RequestInfo,
  ) {
    const actor = await this.requireAdmin(token);
    const current = await this.requirePromo(id);

    const data = this.normalise({
      ...current,
      ...body,
    });

    if (data.code !== current.code) {
      const exists = await this.prisma.promoCode.findUnique({
        where: { code: data.code },
      });
      if (exists) {
        throw new ConflictException('This promo code already exists');
      }
    }

    const updated = await this.prisma.promoCode.update({
      where: { id },
      data,
    });

    await this.audit(
      actor.id,
      'PROMO_CODE_UPDATED',
      this.auditPromo(current),
      this.auditPromo(updated),
      requestInfo,
    );

    return updated;
  }

  async toggle(
    token: string | null | undefined,
    id: string,
    isActive: unknown,
    requestInfo?: RequestInfo,
  ) {
    const actor = await this.requireAdmin(token);
    const current = await this.requirePromo(id);

    if (typeof isActive !== 'boolean') {
      throw new BadRequestException('isActive must be true or false');
    }

    const updated = await this.prisma.promoCode.update({
      where: { id },
      data: { isActive },
    });

    await this.audit(
      actor.id,
      isActive ? 'PROMO_CODE_ENABLED' : 'PROMO_CODE_DISABLED',
      { id, code: current.code, isActive: current.isActive },
      { id, code: updated.code, isActive: updated.isActive },
      requestInfo,
    );

    return updated;
  }

  async remove(
    token: string | null | undefined,
    id: string,
    requestInfo?: RequestInfo,
  ) {
    const actor = await this.requireAdmin(token);
    const current = await this.requirePromo(id);

    const updated = await this.prisma.promoCode.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });

    await this.audit(
      actor.id,
      'PROMO_CODE_DELETED',
      this.auditPromo(current),
      this.auditPromo(updated),
      requestInfo,
    );

    return { success: true };
  }

  async validate(
    token: string | null | undefined,
    body: any,
  ) {
    const customer = await this.getOptionalCustomer(token);
    const code = this.code(body?.code);
    const orderAmount = this.money(body?.orderAmount, 'orderAmount', true);
    const appliesTo = this.appliesTo(body?.appliesTo || 'ALL');

    const promoCode = await this.prisma.promoCode.findFirst({
      where: { code, deletedAt: null },
    });

    if (!promoCode) {
      throw new NotFoundException('Promo code not found');
    }

    return this.calculate(promoCode, orderAmount, appliesTo, customer);
  }

  async redeem(
    token: string | null | undefined,
    id: string,
    body: any,
    requestInfo?: RequestInfo,
  ) {
    const actor = await this.requireAdmin(token);
    const promoCode = await this.requirePromo(id);
    const orderAmount = this.money(body?.orderAmount, 'orderAmount', true);
    const appliesTo = this.appliesTo(body?.appliesTo || 'ALL');

    const customer = body?.customerId
      ? await this.prisma.customer.findUnique({
          where: { id: body.customerId },
        })
      : null;

    if (body?.customerId && !customer) {
      throw new NotFoundException('Customer not found');
    }

    if (body?.reservationId) {
      const reservation = await this.prisma.reservation.findUnique({
        where: { id: body.reservationId },
      });
      if (!reservation) {
        throw new NotFoundException('Reservation not found');
      }
    }

    const validation = await this.calculate(
      promoCode,
      orderAmount,
      appliesTo,
      customer,
    );

    const usage = await this.prisma.$transaction(async (tx) => {
      const fresh = await tx.promoCode.findUnique({ where: { id } });

      if (!fresh || fresh.deletedAt || !fresh.isActive) {
        throw new BadRequestException('Promo code is unavailable');
      }

      if (
        fresh.usageLimit !== null &&
        fresh.usageCount >= fresh.usageLimit
      ) {
        throw new BadRequestException(
          'Promo code usage limit has been reached',
        );
      }

      if (customer) {
        const uses = await tx.promoCodeUsage.count({
          where: { promoCodeId: id, customerId: customer.id },
        });
        if (uses >= fresh.usageLimitPerCustomer) {
          throw new BadRequestException(
            'Customer has already used this promo code',
          );
        }
      }

      const created = await tx.promoCodeUsage.create({
        data: {
          promoCodeId: id,
          customerId: customer?.id || null,
          reservationId: body?.reservationId || null,
          orderAmount,
          discountAmount: validation.discountAmount,
          email:
            body?.email?.trim().toLowerCase() ||
            customer?.email ||
            null,
          phone: body?.phone?.trim() || customer?.phone || null,
        },
      });

      await tx.promoCode.update({
        where: { id },
        data: { usageCount: { increment: 1 } },
      });

      return created;
    });

    await this.audit(
      actor.id,
      'PROMO_CODE_REDEEMED',
      undefined,
      {
        promoCodeId: id,
        code: promoCode.code,
        usageId: usage.id,
        customerId: customer?.id || null,
        reservationId: body?.reservationId || null,
        orderAmount,
        discountAmount: validation.discountAmount,
      },
      requestInfo,
      customer?.id || null,
    );

    return {
      success: true,
      usage,
      discountAmount: validation.discountAmount,
      finalAmount: validation.finalAmount,
    };
  }

  private async calculate(
    promoCode: any,
    orderAmount: number,
    appliesTo: PromoAppliesTo,
    customer: any | null,
  ) {
    const now = Date.now();

    if (!promoCode.isActive) {
      throw new BadRequestException('Promo code is inactive');
    }
    if (promoCode.startsAt && promoCode.startsAt.getTime() > now) {
      throw new BadRequestException('Promo code is not active yet');
    }
    if (promoCode.expiresAt && promoCode.expiresAt.getTime() < now) {
      throw new BadRequestException('Promo code has expired');
    }
    if (
      promoCode.appliesTo !== 'ALL' &&
      promoCode.appliesTo !== appliesTo
    ) {
      throw new BadRequestException(
        `Promo code is only valid for ${promoCode.appliesTo}`,
      );
    }
    if (
      promoCode.minimumOrderAmount !== null &&
      orderAmount < promoCode.minimumOrderAmount
    ) {
      throw new BadRequestException(
        `Minimum order amount is €${promoCode.minimumOrderAmount.toFixed(2)}`,
      );
    }
    if (
      promoCode.usageLimit !== null &&
      promoCode.usageCount >= promoCode.usageLimit
    ) {
      throw new BadRequestException(
        'Promo code usage limit has been reached',
      );
    }
    if (promoCode.firstOrderOnly && !customer) {
      throw new UnauthorizedException(
        'Sign in to use this first-order promo code',
      );
    }

    if (customer) {
      const [uses, reservations] = await Promise.all([
        this.prisma.promoCodeUsage.count({
          where: { promoCodeId: promoCode.id, customerId: customer.id },
        }),
        promoCode.firstOrderOnly
          ? this.prisma.customerReservation.count({
              where: { customerId: customer.id },
            })
          : Promise.resolve(0),
      ]);

      if (uses >= promoCode.usageLimitPerCustomer) {
        throw new BadRequestException(
          'You have already used this promo code',
        );
      }
      if (promoCode.firstOrderOnly && reservations > 0) {
        throw new BadRequestException(
          'Promo code is only available for the first reservation',
        );
      }
    }

    let discountAmount =
      promoCode.discountType === 'PERCENTAGE'
        ? orderAmount * (promoCode.discountValue / 100)
        : promoCode.discountValue;

    if (promoCode.maximumDiscount !== null) {
      discountAmount = Math.min(
        discountAmount,
        promoCode.maximumDiscount,
      );
    }

    discountAmount = Math.min(discountAmount, orderAmount);
    discountAmount = Math.round(discountAmount * 100) / 100;
    const finalAmount =
      Math.round((orderAmount - discountAmount) * 100) / 100;

    return {
      valid: true,
      promoCode: {
        id: promoCode.id,
        code: promoCode.code,
        name: promoCode.name,
        description: promoCode.description,
        discountType: promoCode.discountType,
        discountValue: promoCode.discountValue,
        maximumDiscount: promoCode.maximumDiscount,
        minimumOrderAmount: promoCode.minimumOrderAmount,
        appliesTo: promoCode.appliesTo,
        expiresAt: promoCode.expiresAt,
      },
      orderAmount,
      discountAmount,
      finalAmount,
    };
  }

  private normalise(body: any) {
    const code = this.code(body?.code);
    const name = body?.name?.trim();
    if (!name) {
      throw new BadRequestException('Promo code name is required');
    }

    const discountType = body?.discountType;
    if (
      discountType !== 'PERCENTAGE' &&
      discountType !== 'FIXED_AMOUNT'
    ) {
      throw new BadRequestException(
        'discountType must be PERCENTAGE or FIXED_AMOUNT',
      );
    }

    const discountValue = this.money(
      body?.discountValue,
      'discountValue',
      false,
    );

    if (discountType === 'PERCENTAGE' && discountValue > 100) {
      throw new BadRequestException(
        'Percentage discount cannot exceed 100',
      );
    }

    const startsAt = this.date(body?.startsAt, 'startsAt');
    const expiresAt = this.date(body?.expiresAt, 'expiresAt');
    if (startsAt && expiresAt && startsAt >= expiresAt) {
      throw new BadRequestException(
        'expiresAt must be later than startsAt',
      );
    }

    return {
      code,
      name,
      description: body?.description?.trim() || null,
      discountType,
      discountValue,
      maximumDiscount: this.optionalMoney(
        body?.maximumDiscount,
        'maximumDiscount',
      ),
      minimumOrderAmount: this.optionalMoney(
        body?.minimumOrderAmount,
        'minimumOrderAmount',
      ),
      appliesTo: this.appliesTo(body?.appliesTo || 'ALL'),
      startsAt,
      expiresAt,
      usageLimit: this.optionalInteger(body?.usageLimit, 'usageLimit'),
      usageLimitPerCustomer: this.integer(
        body?.usageLimitPerCustomer ?? 1,
        'usageLimitPerCustomer',
      ),
      firstOrderOnly: body?.firstOrderOnly === true,
      isActive:
        typeof body?.isActive === 'boolean' ? body.isActive : true,
    };
  }

  private code(value: unknown) {
    const code = String(value || '').trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,40}$/.test(code)) {
      throw new BadRequestException(
        'Promo code must contain 3-40 letters, numbers, underscores or dashes',
      );
    }
    return code;
  }

  private appliesTo(value: unknown): PromoAppliesTo {
    const allowed: PromoAppliesTo[] = [
      'ALL',
      'RESERVATION',
      'DINE_IN',
      'TAKEAWAY',
      'DELIVERY',
    ];
    if (!allowed.includes(value as PromoAppliesTo)) {
      throw new BadRequestException('Invalid appliesTo value');
    }
    return value as PromoAppliesTo;
  }

  private money(value: unknown, field: string, allowZero: boolean) {
    const number = Number(value);
    if (
      !Number.isFinite(number) ||
      (allowZero ? number < 0 : number <= 0)
    ) {
      throw new BadRequestException(`${field} must be a valid number`);
    }
    return Math.round(number * 100) / 100;
  }

  private optionalMoney(value: unknown, field: string) {
    if (value === undefined || value === null || value === '') return null;
    return this.money(value, field, true);
  }

  private integer(value: unknown, field: string) {
    const number = Number(value);
    if (!Number.isInteger(number) || number < 1) {
      throw new BadRequestException(`${field} must be a positive integer`);
    }
    return number;
  }

  private optionalInteger(value: unknown, field: string) {
    if (value === undefined || value === null || value === '') return null;
    return this.integer(value, field);
  }

  private date(value: unknown, field: string) {
    if (value === undefined || value === null || value === '') return null;
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${field} must be a valid date`);
    }
    return date;
  }

  private async requirePromo(id: string) {
    const promoCode = await this.prisma.promoCode.findFirst({
      where: { id, deletedAt: null },
    });
    if (!promoCode) {
      throw new NotFoundException('Promo code not found');
    }
    return promoCode;
  }

  private async requireAdmin(token?: string | null) {
    const customer = await this.authenticatedCustomer(token);
    if (customer.role !== 'ADMIN' && customer.role !== 'OWNER') {
      throw new ForbiddenException('Administrator access required');
    }
    return customer;
  }

  private async getOptionalCustomer(token?: string | null) {
    if (!token) return null;
    try {
      return await this.authenticatedCustomer(token);
    } catch {
      return null;
    }
  }

  private async authenticatedCustomer(token?: string | null) {
    if (!token) {
      throw new UnauthorizedException('Not authenticated');
    }

    const session = await this.prisma.customerSession.findUnique({
      where: { token },
      include: { customer: true },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid session');
    }

    if (session.expiresAt && session.expiresAt.getTime() < Date.now()) {
      await this.prisma.customerSession.delete({
        where: { id: session.id },
      });
      throw new UnauthorizedException('Session has expired');
    }

    if (session.customer.deletedAt || session.customer.isBlocked) {
      await this.prisma.customerSession.deleteMany({
        where: { customerId: session.customer.id },
      });
      throw new UnauthorizedException('Account is unavailable');
    }

    return session.customer;
  }

  private async audit(
    actorId: string,
    action: string,
    beforeData?: any,
    afterData?: any,
    requestInfo?: RequestInfo,
    targetCustomerId?: string | null,
  ) {
    await this.prisma.customerAdminAuditLog.create({
      data: {
        actorId,
        targetCustomerId: targetCustomerId || null,
        action,
        beforeData: beforeData ?? undefined,
        afterData: afterData ?? undefined,
        ip: requestInfo?.ip || null,
        userAgent: requestInfo?.userAgent || null,
      },
    });
  }

  private auditPromo(promoCode: any) {
    return {
      id: promoCode.id,
      code: promoCode.code,
      name: promoCode.name,
      discountType: promoCode.discountType,
      discountValue: promoCode.discountValue,
      maximumDiscount: promoCode.maximumDiscount,
      minimumOrderAmount: promoCode.minimumOrderAmount,
      appliesTo: promoCode.appliesTo,
      startsAt: promoCode.startsAt,
      expiresAt: promoCode.expiresAt,
      usageLimit: promoCode.usageLimit,
      usageLimitPerCustomer: promoCode.usageLimitPerCustomer,
      usageCount: promoCode.usageCount,
      firstOrderOnly: promoCode.firstOrderOnly,
      isActive: promoCode.isActive,
      deletedAt: promoCode.deletedAt,
    };
  }
}
