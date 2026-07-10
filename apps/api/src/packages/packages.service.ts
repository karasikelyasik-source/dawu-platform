import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PackagesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.package.findMany({
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: {
        price: 'asc',
      },
    });
  }

  findOne(id: string) {
    return this.prisma.package.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });
  }
}