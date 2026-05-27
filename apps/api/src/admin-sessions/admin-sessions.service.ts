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

  async banIp(ip: string) {
    await this.prisma.bannedIp.upsert({
      where: { ip },
      update: {},
      create: {
        ip,
        reason: 'Banned from admin panel',
      },
    });

    await this.prisma.session.updateMany({
      where: { ip },
      data: {
        banned: true,
        online: false,
      },
    });

    return { success: true };
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