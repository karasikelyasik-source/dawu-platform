import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TakeAwayService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.takeAwayCategory.findMany({
      orderBy: {
        sortOrder: 'asc',
      },
      include: {
        items: {
          where: {
            isActive: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }

  createCategory(name: string) {
    return this.prisma.takeAwayCategory.create({
      data: {
        name,
      },
    });
  }

  updateCategory(id: string, name: string) {
    return this.prisma.takeAwayCategory.update({
      where: { id },
      data: { name },
    });
  }

  deleteCategory(id: string) {
    return this.prisma.takeAwayCategory.delete({
      where: { id },
    });
  }

  createItem(data: {
    categoryId: string;
    name: string;
    price: number;
    btwRate?: number;
  }) {
    return this.prisma.takeAwayItem.create({
      data: {
        categoryId: data.categoryId,
        name: data.name,
        price: Number(data.price),
        btwRate: data.btwRate ?? 9,
      },
    });
  }

  updateItem(
    id: string,
    data: {
      name: string;
      price: number;
      btwRate?: number;
    },
  ) {
    return this.prisma.takeAwayItem.update({
      where: { id },
      data: {
        name: data.name,
        price: Number(data.price),
        btwRate: data.btwRate ?? 9,
      },
    });
  }

  deleteItem(id: string) {
    return this.prisma.takeAwayItem.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }
}