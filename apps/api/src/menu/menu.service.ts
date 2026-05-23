import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.menuCategory.findMany({
      include: {
        items: {
          include: {
            station: true,
          },
        },
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });
  }

  findCategories() {
    return this.prisma.menuCategory.findMany({
      orderBy: {
        sortOrder: 'asc',
      },
    });
  }

 createItem(data: {
  name: string;
  description?: string;
  price?: number;
  btwRate?: number;
  categoryId: string;
  stationId?: string;
}) {
  return this.prisma.menuItem.create({
    data: {
      name: data.name,
      description: data.description,
      price: data.price,
      btwRate: data.btwRate ?? 9,
      categoryId: data.categoryId,
      stationId: data.stationId,
    },
  });
}
  deleteItem(id: string) {
    return this.prisma.menuItem.delete({
      where: { id },
    });
  }

  findPackages() {
    return this.prisma.package.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  createPackage(data: {
  name: string;
  price?: number;
  btwRate?: number;
}) {
  return this.prisma.package.create({
    data: {
      name: data.name,
      price: data.price ?? 0,
      btwRate: data.btwRate ?? 9,
    },
  });
}

  deletePackage(id: string) {
    return this.prisma.package.delete({
      where: { id },
    });
  }

  findStations() {
    return this.prisma.kitchenStation.findMany({
      include: {
        items: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  createStation(data: {
    name: string;
    type: 'DRINKS' | 'SUSHI' | 'HOT_KITCHEN';
    printerIp?: string;
  }) {
    return this.prisma.kitchenStation.create({
      data: {
        name: data.name,
        type: data.type,
        printerIp: data.printerIp,
      },
    });
  }

  deleteStation(id: string) {
    return this.prisma.kitchenStation.delete({
      where: { id },
    });
  }

  assignItemToStation(data: {
    menuItemId: string;
    stationId: string | null;
  }) {
    return this.prisma.menuItem.update({
      where: {
        id: data.menuItemId,
      },
      data: {
        stationId: data.stationId,
      },
    });
  }

  async setReceiptPrinter(id: string) {
    await this.prisma.kitchenStation.updateMany({
      data: {
        receiptPrinter: false,
      },
    });

    return this.prisma.kitchenStation.update({
      where: { id },
      data: {
        receiptPrinter: true,
      },
    });
  }

  findReceiptPrinter() {
    return this.prisma.kitchenStation.findFirst({
      where: {
        receiptPrinter: true,
      },
    });
  }
}