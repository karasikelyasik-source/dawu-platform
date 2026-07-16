import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';

type CustomerRole = 'CUSTOMER' | 'ADMIN' | 'OWNER';

type RequestInfo = {
  ip?: string | null;
  userAgent?: string | null;
};

type CustomerFilters = {
  search?: string;
  role?: string;
  status?: string;
  page: number;
  limit: number;
};

@Injectable()
export class CustomerAdminService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getDashboard(token?: string | null) {
    const actor = await this.requireAdmin(token);

    const [
      totalCustomers,
      blockedCustomers,
      deletedCustomers,
      admins,
      activeSessions,
      recentCustomers,
    ] = await Promise.all([
      this.prisma.customer.count({
        where: {
          deletedAt: null,
          role: 'CUSTOMER',
        },
      }),
      this.prisma.customer.count({
        where: {
          isBlocked: true,
          deletedAt: null,
        },
      }),
      this.prisma.customer.count({
        where: {
          deletedAt: {
            not: null,
          },
        },
      }),
      this.prisma.customer.count({
        where: {
          role: {
            in: ['ADMIN', 'OWNER'],
          },
          deletedAt: null,
        },
      }),
      this.prisma.customerSession.count(),
      this.prisma.customer.findMany({
        where: {
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
        select: this.customerSelect(),
      }),
    ]);

    return {
      actor: this.publicCustomer(actor),
      statistics: {
        totalCustomers,
        blockedCustomers,
        deletedCustomers,
        admins,
        activeSessions,
      },
      recentCustomers,
    };
  }

  async getCustomers(
    token: string | null | undefined,
    filters: CustomerFilters,
  ) {
    await this.requireAdmin(token);

    const page = Math.max(filters.page, 1);
    const limit = Math.min(
      Math.max(filters.limit, 1),
      100,
    );

    const search = filters.search?.trim();

    const role =
      filters.role === 'CUSTOMER' ||
      filters.role === 'ADMIN' ||
      filters.role === 'OWNER'
        ? filters.role
        : undefined;

    const where: any = {};

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          phone: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (filters.status === 'active') {
      where.deletedAt = null;
      where.isBlocked = false;
    }

    if (filters.status === 'blocked') {
      where.deletedAt = null;
      where.isBlocked = true;
    }

    if (filters.status === 'deleted') {
      where.deletedAt = {
        not: null,
      };
    }

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          ...this.customerSelect(),
          _count: {
            select: {
              sessions: true,
              reservations: true,
            },
          },
        },
      }),
      this.prisma.customer.count({
        where,
      }),
    ]);

    return {
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(
          Math.ceil(total / limit),
          1,
        ),
      },
    };
  }

  async getCustomer(
    token: string | null | undefined,
    customerId: string,
  ) {
    await this.requireAdmin(token);

    const customer =
      await this.prisma.customer.findUnique({
        where: {
          id: customerId,
        },
        select: {
          ...this.customerSelect(),
          sessions: {
            orderBy: {
              lastSeenAt: 'desc',
            },
            select: {
              id: true,
              ip: true,
              userAgent: true,
              createdAt: true,
              lastSeenAt: true,
              expiresAt: true,
            },
          },
          reservations: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 20,
            include: {
              reservation: {
                include: {
                  table: true,
                },
              },
            },
          },
          _count: {
            select: {
              sessions: true,
              reservations: true,
            },
          },
        },
      });

    if (!customer) {
      throw new NotFoundException(
        'Customer not found',
      );
    }

    return customer;
  }

  async updateProfile(
    token: string | null | undefined,
    customerId: string,
    data: {
      name?: string;
      email?: string;
      phone?: string | null;
    },
    requestInfo?: RequestInfo,
  ) {
    const actor = await this.requireAdmin(token);
    const target = await this.requireTarget(customerId);

    this.assertCanManage(actor, target);

    const name = data.name?.trim();
    const email = data.email
      ?.trim()
      .toLowerCase();

    if (!name) {
      throw new BadRequestException(
        'Name is required',
      );
    }

    if (!email || !this.isValidEmail(email)) {
      throw new BadRequestException(
        'A valid email is required',
      );
    }

    const duplicate =
      await this.prisma.customer.findFirst({
        where: {
          email,
          id: {
            not: target.id,
          },
        },
      });

    if (duplicate) {
      throw new ConflictException(
        'This email is already in use',
      );
    }

    const updated =
      await this.prisma.customer.update({
        where: {
          id: target.id,
        },
        data: {
          name,
          email,
          phone:
            data.phone?.trim() || null,
        },
      });

    await this.audit({
      actorId: actor.id,
      targetCustomerId: target.id,
      action: 'CUSTOMER_PROFILE_UPDATED',
      beforeData: {
        name: target.name,
        email: target.email,
        phone: target.phone,
      },
      afterData: {
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
      },
      requestInfo,
    });

    return this.publicCustomer(updated);
  }

  async blockCustomer(
    token: string | null | undefined,
    customerId: string,
    reason?: string,
    requestInfo?: RequestInfo,
  ) {
    const actor = await this.requireAdmin(token);
    const target = await this.requireTarget(customerId);

    this.assertCanManage(actor, target);

    const blockedReason = reason?.trim();

    if (!blockedReason) {
      throw new BadRequestException(
        'A block reason is required',
      );
    }

    const updated =
      await this.prisma.$transaction(
        async (tx) => {
          const customer =
            await tx.customer.update({
              where: {
                id: target.id,
              },
              data: {
                isBlocked: true,
                blockedAt: new Date(),
                blockedReason,
              },
            });

          await tx.customerSession.deleteMany({
            where: {
              customerId: target.id,
            },
          });

          return customer;
        },
      );

    await this.audit({
      actorId: actor.id,
      targetCustomerId: target.id,
      action: 'CUSTOMER_BLOCKED',
      beforeData: {
        isBlocked: target.isBlocked,
        blockedReason:
          target.blockedReason,
      },
      afterData: {
        isBlocked: true,
        blockedReason,
      },
      requestInfo,
    });

    return this.publicCustomer(updated);
  }

  async unblockCustomer(
    token: string | null | undefined,
    customerId: string,
    requestInfo?: RequestInfo,
  ) {
    const actor = await this.requireAdmin(token);
    const target = await this.requireTarget(customerId);

    this.assertCanManage(actor, target);

    const updated =
      await this.prisma.customer.update({
        where: {
          id: target.id,
        },
        data: {
          isBlocked: false,
          blockedAt: null,
          blockedReason: null,
        },
      });

    await this.audit({
      actorId: actor.id,
      targetCustomerId: target.id,
      action: 'CUSTOMER_UNBLOCKED',
      beforeData: {
        isBlocked: target.isBlocked,
        blockedReason:
          target.blockedReason,
      },
      afterData: {
        isBlocked: false,
        blockedReason: null,
      },
      requestInfo,
    });

    return this.publicCustomer(updated);
  }

  async resetPassword(
    token: string | null | undefined,
    customerId: string,
    password?: string,
    requestInfo?: RequestInfo,
  ) {
    const actor = await this.requireAdmin(token);
    const target = await this.requireTarget(customerId);

    this.assertCanManage(actor, target);

    if (!password || password.length < 8) {
      throw new BadRequestException(
        'Password must contain at least 8 characters',
      );
    }

    const hashedPassword = await bcrypt.hash(
      password,
      12,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.customer.update({
        where: {
          id: target.id,
        },
        data: {
          password: hashedPassword,
          mustChangePassword: true,
        },
      });

      await tx.customerSession.deleteMany({
        where: {
          customerId: target.id,
        },
      });
    });

    await this.audit({
      actorId: actor.id,
      targetCustomerId: target.id,
      action: 'CUSTOMER_PASSWORD_RESET',
      beforeData: null,
      afterData: {
        mustChangePassword: true,
        sessionsRevoked: true,
      },
      requestInfo,
    });

    return {
      success: true,
      mustChangePassword: true,
    };
  }

  async revokeSessions(
    token: string | null | undefined,
    customerId: string,
    requestInfo?: RequestInfo,
  ) {
    const actor = await this.requireAdmin(token);
    const target = await this.requireTarget(customerId);

    this.assertCanManage(actor, target);

    const result =
      await this.prisma.customerSession.deleteMany({
        where: {
          customerId: target.id,
        },
      });

    await this.audit({
      actorId: actor.id,
      targetCustomerId: target.id,
      action: 'CUSTOMER_SESSIONS_REVOKED',
      beforeData: null,
      afterData: {
        revokedSessions: result.count,
      },
      requestInfo,
    });

    return {
      success: true,
      revokedSessions: result.count,
    };
  }

  async updateRole(
    token: string | null | undefined,
    customerId: string,
    role?: CustomerRole,
    requestInfo?: RequestInfo,
  ) {
    const actor = await this.requireOwner(token);
    const target = await this.requireTarget(customerId);

    if (
      role !== 'CUSTOMER' &&
      role !== 'ADMIN'
    ) {
      throw new BadRequestException(
        'Role must be CUSTOMER or ADMIN',
      );
    }

    if (target.role === 'OWNER') {
      throw new ForbiddenException(
        'The OWNER role cannot be changed',
      );
    }

    if (actor.id === target.id) {
      throw new ForbiddenException(
        'You cannot change your own role',
      );
    }

    const updated =
      await this.prisma.customer.update({
        where: {
          id: target.id,
        },
        data: {
          role,
        },
      });

    await this.audit({
      actorId: actor.id,
      targetCustomerId: target.id,
      action: 'CUSTOMER_ROLE_CHANGED',
      beforeData: {
        role: target.role,
      },
      afterData: {
        role: updated.role,
      },
      requestInfo,
    });

    return this.publicCustomer(updated);
  }

  async deleteCustomer(
    token: string | null | undefined,
    customerId: string,
    requestInfo?: RequestInfo,
  ) {
    const actor = await this.requireAdmin(token);
    const target = await this.requireTarget(customerId);

    this.assertCanManage(actor, target);

    const updated =
      await this.prisma.$transaction(
        async (tx) => {
          const customer =
            await tx.customer.update({
              where: {
                id: target.id,
              },
              data: {
                deletedAt: new Date(),
              },
            });

          await tx.customerSession.deleteMany({
            where: {
              customerId: target.id,
            },
          });

          return customer;
        },
      );

    await this.audit({
      actorId: actor.id,
      targetCustomerId: target.id,
      action: 'CUSTOMER_SOFT_DELETED',
      beforeData: {
        deletedAt: target.deletedAt,
      },
      afterData: {
        deletedAt: updated.deletedAt,
      },
      requestInfo,
    });

    return {
      success: true,
      customer: this.publicCustomer(updated),
    };
  }

  async restoreCustomer(
    token: string | null | undefined,
    customerId: string,
    requestInfo?: RequestInfo,
  ) {
    const actor = await this.requireAdmin(token);
    const target = await this.requireTarget(customerId);

    this.assertCanManage(actor, target);

    const updated =
      await this.prisma.customer.update({
        where: {
          id: target.id,
        },
        data: {
          deletedAt: null,
        },
      });

    await this.audit({
      actorId: actor.id,
      targetCustomerId: target.id,
      action: 'CUSTOMER_RESTORED',
      beforeData: {
        deletedAt: target.deletedAt,
      },
      afterData: {
        deletedAt: null,
      },
      requestInfo,
    });

    return {
      success: true,
      customer: this.publicCustomer(updated),
    };
  }

  async getAuditLogs(
    token: string | null | undefined,
    filters: {
      page: number;
      limit: number;
      search?: string;
    },
  ) {
    await this.requireOwner(token);

    const page = Math.max(filters.page, 1);
    const limit = Math.min(
      Math.max(filters.limit, 1),
      100,
    );

    const search = filters.search?.trim();

    const where: any = search
      ? {
          OR: [
            {
              action: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              actor: {
                email: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            },
          ],
        }
      : {};

    const [logs, total] = await Promise.all([
      this.prisma.customerAdminAuditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.customerAdminAuditLog.count({
        where,
      }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(
          Math.ceil(total / limit),
          1,
        ),
      },
    };
  }

  private async requireAdmin(
    token?: string | null,
  ) {
    const customer =
      await this.getAuthenticatedCustomer(token);

    if (
      customer.role !== 'ADMIN' &&
      customer.role !== 'OWNER'
    ) {
      throw new ForbiddenException(
        'Administrator access required',
      );
    }

    return customer;
  }

  private async requireOwner(
    token?: string | null,
  ) {
    const customer =
      await this.getAuthenticatedCustomer(token);

    if (customer.role !== 'OWNER') {
      throw new ForbiddenException(
        'OWNER access required',
      );
    }

    return customer;
  }

  private async getAuthenticatedCustomer(
    token?: string | null,
  ) {
    if (!token) {
      throw new UnauthorizedException(
        'Not authenticated',
      );
    }

    const session =
      await this.prisma.customerSession.findUnique({
        where: {
          token,
        },
        include: {
          customer: true,
        },
      });

    if (!session) {
      throw new UnauthorizedException(
        'Invalid session',
      );
    }

    if (
      session.expiresAt &&
      session.expiresAt.getTime() < Date.now()
    ) {
      await this.prisma.customerSession.delete({
        where: {
          id: session.id,
        },
      });

      throw new UnauthorizedException(
        'Session has expired',
      );
    }

    if (
      session.customer.deletedAt ||
      session.customer.isBlocked
    ) {
      await this.prisma.customerSession.deleteMany({
        where: {
          customerId: session.customer.id,
        },
      });

      throw new UnauthorizedException(
        'Account is unavailable',
      );
    }

    return session.customer;
  }

  private async requireTarget(
    customerId: string,
  ) {
    const customer =
      await this.prisma.customer.findUnique({
        where: {
          id: customerId,
        },
      });

    if (!customer) {
      throw new NotFoundException(
        'Customer not found',
      );
    }

    return customer;
  }

  private assertCanManage(
    actor: {
      id: string;
      role: CustomerRole;
    },
    target: {
      id: string;
      role: CustomerRole;
    },
  ) {
    if (actor.id === target.id) {
      throw new ForbiddenException(
        'You cannot perform this action on your own account',
      );
    }

    if (target.role === 'OWNER') {
      throw new ForbiddenException(
        'The OWNER account cannot be modified',
      );
    }

    if (
      actor.role === 'ADMIN' &&
      target.role !== 'CUSTOMER'
    ) {
      throw new ForbiddenException(
        'Administrators may only manage customer accounts',
      );
    }
  }

  private async audit(data: {
    actorId: string;
    targetCustomerId?: string | null;
    action: string;
    beforeData?: any;
    afterData?: any;
    requestInfo?: RequestInfo;
  }) {
    await this.prisma.customerAdminAuditLog.create({
      data: {
        actorId: data.actorId,
        targetCustomerId:
          data.targetCustomerId || null,
        action: data.action,
        beforeData:
          data.beforeData ?? undefined,
        afterData:
          data.afterData ?? undefined,
        ip: data.requestInfo?.ip || null,
        userAgent:
          data.requestInfo?.userAgent ||
          null,
      },
    });
  }

  private customerSelect() {
    return {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isBlocked: true,
      blockedAt: true,
      blockedReason: true,
      deletedAt: true,
      mustChangePassword: true,
      createdAt: true,
      updatedAt: true,
    } as const;
  }

  private publicCustomer(customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: CustomerRole;
    isBlocked: boolean;
    blockedAt: Date | null;
    blockedReason: string | null;
    deletedAt: Date | null;
    mustChangePassword: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      role: customer.role,
      isBlocked: customer.isBlocked,
      blockedAt: customer.blockedAt,
      blockedReason:
        customer.blockedReason,
      deletedAt: customer.deletedAt,
      mustChangePassword:
        customer.mustChangePassword,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }

  private isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email,
    );
  }
}