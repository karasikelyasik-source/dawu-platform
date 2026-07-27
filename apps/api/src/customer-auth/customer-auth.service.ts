import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';

import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

type SessionInfo = {
  ip?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class CustomerAuthService {
  private readonly logger = new Logger(CustomerAuthService.name);
  constructor(
  private readonly prisma: PrismaService,
  private readonly mailService: MailService,
) {}

  async register(
    data: {
      name?: string;
      email?: string;
      phone?: string;
      password?: string;
    },
    sessionInfo?: SessionInfo,
  ) {
    const name = data?.name?.trim();
    const email = data?.email?.trim().toLowerCase();
    const phone = data?.phone?.trim() || null;
    const password = data?.password || '';

    if (!name) {
      throw new BadRequestException('Name is required');
    }

    if (!email) {
      throw new BadRequestException('Email is required');
    }

    if (!this.isValidEmail(email)) {
      throw new BadRequestException(
        'Enter a valid email address',
      );
    }

    if (password.length < 8) {
      throw new BadRequestException(
        'Password must contain at least 8 characters',
      );
    }

    const existingCustomer =
      await this.prisma.customer.findUnique({
        where: {
          email,
        },
      });

    if (existingCustomer) {
      throw new ConflictException(
        'An account with this email already exists',
      );
    }

    const hashedPassword = await bcrypt.hash(
      password,
      12,
    );

    const token = this.createSessionToken();

    const customer =
      await this.prisma.$transaction(async (tx) => {
        const createdCustomer =
          await tx.customer.create({
            data: {
              name,
              email,
              phone,
              password: hashedPassword,
              role: 'CUSTOMER',
              isBlocked: false,
              mustChangePassword: false,
            },
          });

        await tx.customerSession.create({
          data: {
            customerId: createdCustomer.id,
            token,
            ip: sessionInfo?.ip || null,
            userAgent:
              sessionInfo?.userAgent || null,
            lastSeenAt: new Date(),
            expiresAt: this.createSessionExpiry(),
          },
        });

        return createdCustomer;
      });

try {
  await this.mailService.sendCustomerWelcomeEmail({
    name: customer.name,
    email: customer.email,
  });
} catch (error) {
  this.logger.error(
    `Failed to send welcome email to ${customer.email}`,
    error instanceof Error
      ? error.stack
      : String(error),
  );
}

    return {
      customer: this.toPublicCustomer(customer),
      token,
    };
  }

  async login(
    data: {
      email?: string;
      password?: string;
    },
    sessionInfo?: SessionInfo,
  ) {
    const email = data?.email
      ?.trim()
      .toLowerCase();

    const password = data?.password || '';

    if (!email || !password) {
      throw new BadRequestException(
        'Email and password are required',
      );
    }

    const customer =
      await this.prisma.customer.findUnique({
        where: {
          email,
        },
      });

    if (!customer) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    if (customer.deletedAt) {
      throw new UnauthorizedException(
        'This account is no longer active',
      );
    }

    if (customer.isBlocked) {
      throw new UnauthorizedException({
        message: 'This account has been blocked',
        reason:
          customer.blockedReason ||
          'Please contact DaWu support',
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      customer.password,
    );

    if (!validPassword) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    const token = this.createSessionToken();

    await this.prisma.customerSession.create({
      data: {
        customerId: customer.id,
        token,
        ip: sessionInfo?.ip || null,
        userAgent:
          sessionInfo?.userAgent || null,
        lastSeenAt: new Date(),
        expiresAt: this.createSessionExpiry(),
      },
    });

    return {
      customer: this.toPublicCustomer(customer),
      token,
    };
  }

  async getCurrentCustomer(
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
        'Session is invalid or has expired',
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

    if (session.customer.deletedAt) {
      await this.prisma.customerSession.deleteMany({
        where: {
          customerId: session.customer.id,
        },
      });

      throw new UnauthorizedException(
        'This account is no longer active',
      );
    }

    if (session.customer.isBlocked) {
      await this.prisma.customerSession.deleteMany({
        where: {
          customerId: session.customer.id,
        },
      });

      throw new UnauthorizedException({
        message: 'This account has been blocked',
        reason:
          session.customer.blockedReason ||
          'Please contact DaWu support',
      });
    }

    await this.prisma.customerSession.update({
      where: {
        id: session.id,
      },
      data: {
        lastSeenAt: new Date(),
      },
    });

    return this.toPublicCustomer(
      session.customer,
    );
  }

  async getReservations(
    token?: string | null,
  ) {
    const customer =
      await this.getAuthenticatedCustomer(token);

    const links =
      await this.prisma.customerReservation.findMany({
        where: {
          customerId: customer.id,
        },
        include: {
          reservation: {
            include: {
              table: true,
            },
          },
        },
        orderBy: {
          reservation: {
            startTime: 'desc',
          },
        },
      });

    return links.map(
      ({ reservation }) => reservation,
    );
  }

  async logout(token?: string | null) {
    if (!token) {
      return {
        success: true,
      };
    }

    await this.prisma.customerSession.deleteMany({
      where: {
        token,
      },
    });

    return {
      success: true,
    };
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
        'Session is invalid or has expired',
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

    if (session.customer.deletedAt) {
      await this.prisma.customerSession.deleteMany({
        where: {
          customerId: session.customer.id,
        },
      });

      throw new UnauthorizedException(
        'This account is no longer active',
      );
    }

    if (session.customer.isBlocked) {
      await this.prisma.customerSession.deleteMany({
        where: {
          customerId: session.customer.id,
        },
      });

      throw new UnauthorizedException({
        message: 'This account has been blocked',
        reason:
          session.customer.blockedReason ||
          'Please contact DaWu support',
      });
    }

    await this.prisma.customerSession.update({
      where: {
        id: session.id,
      },
      data: {
        lastSeenAt: new Date(),
      },
    });

    return session.customer;
  }

  private createSessionToken() {
    return randomBytes(48).toString('hex');
  }

  private createSessionExpiry() {
    return new Date(
      Date.now() +
        30 * 24 * 60 * 60 * 1000,
    );
  }

  private isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email,
    );
  }

  private toPublicCustomer(customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: 'CUSTOMER' | 'ADMIN' | 'OWNER';
    isBlocked: boolean;
    blockedReason: string | null;
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
      blockedReason:
        customer.blockedReason,
      mustChangePassword:
        customer.mustChangePassword,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }
}