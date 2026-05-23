import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(data: {
    sessionId: string;
    participantId: string;
    roundNumber: number;
    items: {
      menuItemId: string;
      quantity: number;
      notes?: string;
    }[];
  }) {
    return this.prisma.order.create({
      data: {
        sessionId: data.sessionId,
        participantId: data.participantId,
        roundNumber: data.roundNumber,
        items: {
          create: data.items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            notes: item.notes,
          })),
        },
      },
      include: {
        items: true,
      },
    });
  }
}