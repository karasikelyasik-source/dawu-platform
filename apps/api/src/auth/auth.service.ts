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
        email: data.email,
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
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValid = await bcrypt.compare(data.password, user.password);

    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const bannedIp = sessionData?.ip
      ? await this.prisma.bannedIp.findUnique({
          where: { ip: sessionData.ip },
        })
      : null;

    if (bannedIp) {
      throw new UnauthorizedException('IP banned');
    }

    await this.prisma.session.create({
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
    };
  }
}