import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(data: { email: string; password: string }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: data.email.trim().toLowerCase(),
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }

  async login(
    data: { email: string; password: string },
    sessionData?: {
      ip?: string | null;
      userAgent?: string | null;
    },
  ) {
    const email = data.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    const isValid = await bcrypt.compare(
      data.password,
      user.password,
    );

    if (!isValid) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    const bannedEmail =
      await this.prisma.bannedEmail.findUnique({
        where: {
          email: user.email,
        },
      });

    if (bannedEmail) {
      throw new UnauthorizedException({
        message: 'Email banned',
        reason: bannedEmail.reason,
        expiresAt: bannedEmail.expiresAt,
      });
    }

    const bannedIp = sessionData?.ip
      ? await this.prisma.bannedIp.findUnique({
          where: {
            ip: sessionData.ip,
          },
        })
      : null;

    if (bannedIp) {
      throw new UnauthorizedException({
        message: 'IP banned',
        reason: bannedIp.reason,
        expiresAt: bannedIp.expiresAt,
      });
    }

    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        ip: sessionData?.ip || null,
        userAgent: sessionData?.userAgent || null,
        online: true,
      },
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id,
    };
  }

  async changeEmail(data: {
    userId: string;
    newEmail: string;
    password: string;
  }) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: data.userId,
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'User not found',
      );
    }

    const isValid = await bcrypt.compare(
      data.password,
      user.password,
    );

    if (!isValid) {
      throw new UnauthorizedException(
        'Wrong password',
      );
    }

    const newEmail = data.newEmail
      .trim()
      .toLowerCase();

    const existing =
      await this.prisma.user.findUnique({
        where: {
          email: newEmail,
        },
      });

    if (existing && existing.id !== user.id) {
      throw new UnauthorizedException(
        'Email already used',
      );
    }

    const updated =
      await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          email: newEmail,
        },
      });

    return {
      id: updated.id,
      email: updated.email,
      role: updated.role,
    };
  }

  async changePassword(data: {
    userId: string;
    oldPassword: string;
    newPassword: string;
  }) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: data.userId,
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'User not found',
      );
    }

    const isValid = await bcrypt.compare(
      data.oldPassword,
      user.password,
    );

    if (!isValid) {
      throw new UnauthorizedException(
        'Wrong password',
      );
    }

    const hashedPassword = await bcrypt.hash(
      data.newPassword,
      10,
    );

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      },
    });

    return {
      success: true,
    };
  }

  async deleteAccount(data: {
    userId: string;
    password: string;
  }) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: data.userId,
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'User not found',
      );
    }

    const isValid = await bcrypt.compare(
      data.password,
      user.password,
    );

    if (!isValid) {
      throw new UnauthorizedException(
        'Wrong password',
      );
    }

    await this.prisma.user.delete({
      where: {
        id: user.id,
      },
    });

    return {
      success: true,
    };
  }
}