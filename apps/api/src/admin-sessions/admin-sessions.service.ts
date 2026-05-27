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

async banEmail(email: string) {
  const banned = await this.prisma.bannedEmail.upsert({
    where: { email },
    update: {},
    create: {
      email,
      reason: 'Banned from admin panel',
    },
  });

  const user = await this.prisma.user.findUnique({
    where: { email },
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