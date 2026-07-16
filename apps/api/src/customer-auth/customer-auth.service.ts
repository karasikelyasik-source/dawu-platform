import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';

type SessionInfo = {
  ip?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class CustomerAuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(
    data: {
      name?: string;
      email?: string;
      phone?: string;
      password?: string;
    },
    _sessionInfo?: SessionInfo,
  ) {
    const name = data.name?.trim();
    const email = data.email?.trim().toLowerCase();
    const phone = data.phone?.trim() || null;
    const password = data.password || '';

    if (!name) {
      throw new BadRequestException('Name is required');
    }

    if (!email) {
      throw new BadRequestException('Email is required');
    }

    if (!this.isValidEmail(email)) {
      throw new BadRequestException('Enter a valid email address');
    }

    if (password.length < 8) {
      throw new BadRequestException(
        'Password must contain at least 8 characters',
      );
    }

    const existingCustomer = await this.prisma.customer.findUnique({
      where: {
        email,
      },
    });

    if (existingCustomer) {
      throw new ConflictException(
        'An account with this email already exists',
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const token = this.createSessionToken();

    const result = await this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          name,
          email,
          phone,
          password: hashedPassword,
        },
      });

      await tx.customerSession.create({
        data: {
          customerId: customer.id,
          token,
        },
      });

      return customer;
    });

    return {
      customer: this.toPublicCustomer(result),
      token,
    };
  }


async getReservations(token?: string | null) {
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
      select: {
        customerId: true,
      },
    });

  if (!session) {
    throw new UnauthorizedException(
      'Session is invalid or has expired',
    );
  }

  const links =
    await this.prisma.customerReservation.findMany({
      where: {
        customerId: session.customerId,
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

  return links.map(({ reservation }) => reservation);
}
  async login(
    data: {
      email?: string;
      password?: string;
    },
    _sessionInfo?: SessionInfo,
  ) {
    const email = data.email?.trim().toLowerCase();
    const password = data.password || '';

    if (!email || !password) {
      throw new BadRequestException(
        'Email and password are required',
      );
    }

    const customer = await this.prisma.customer.findUnique({
      where: {
        email,
      },
    });

    if (!customer) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
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
      },
    });

    return {
      customer: this.toPublicCustomer(customer),
      token,
    };
  }

  async getCurrentCustomer(token?: string | null) {
    if (!token) {
      throw new UnauthorizedException('Not authenticated');
    }

    const session = await this.prisma.customerSession.findUnique({
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

    return this.toPublicCustomer(session.customer);
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

  private createSessionToken() {
    return randomBytes(48).toString('hex');
  }

  private isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private toPublicCustomer(customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }
}