import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminSessionsService {
  constructor(private readonly prisma: PrismaService) {}

  findOne(id: string) {
    return this.prisma.session.findUnique({
      where: { id },
    });
  }

  findAll() {
    return this.prisma.session.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        lastSeenAt: 'desc',
      },
    });
  }

  async ban(data: {
    type: 'EMAIL' | 'IP';
    value: string;
    reason?: string;
    expiresAt?: string | null;
  }) {
    const expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;

    if (data.type === 'EMAIL') {
      const banned = await this.prisma.bannedEmail.upsert({
        where: { email: data.value },
        update: {
          reason: data.reason || null,
          expiresAt,
        },
        create: {
          email: data.value,
          reason: data.reason || null,
          expiresAt,
        },
      });

      const user = await this.prisma.user.findUnique({
        where: { email: data.value },
      });

      if (user) {
        await this.prisma.session.updateMany({
          where: { userId: user.id },
          data: {
            banned: true,
            online: false,
          },
        });
      }

      return banned;
    }

    const banned = await this.prisma.bannedIp.upsert({
      where: { ip: data.value },
      update: {
        reason: data.reason || null,
        expiresAt,
      },
      create: {
        ip: data.value,
        reason: data.reason || null,
        expiresAt,
      },
    });

    await this.prisma.session.updateMany({
      where: { ip: data.value },
      data: {
        banned: true,
        online: false,
      },
    });

    return banned;
  }

  async banIp(ip: string) {
    return this.ban({
      type: 'IP',
      value: ip,
      reason: 'Banned from admin panel',
    });
  }

  async banEmail(email: string) {
    return this.ban({
      type: 'EMAIL',
      value: email,
      reason: 'Banned from admin panel',
    });
  }

  async unbanEmail(email: string) {
    return this.prisma.bannedEmail.deleteMany({
      where: { email },
    });
  }

  async unbanIp(ip: string) {
    await this.prisma.bannedIp.deleteMany({
      where: { ip },
    });

    await this.prisma.session.updateMany({
      where: { ip },
      data: {
        banned: false,
      },
    });

    return { success: true };
  }

  kickSession(id: string) {
    return this.prisma.session.update({
      where: { id },
      data: {
        online: false,
      },
    });
  }

  changeRole(userId: string, role: 'ADMIN' | 'STAFF') {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }
}