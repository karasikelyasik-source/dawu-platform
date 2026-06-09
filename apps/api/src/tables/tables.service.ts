import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TablesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.table.findMany({
      orderBy: {
        number: 'asc',
      },
    });
  }

  findOne(id: string) {
    return this.prisma.table.findUnique({
      where: { id },
    });
  }

  findTableSessions(id: string) {
    return this.prisma.tableSession.findMany({
      where: { tableId: id },
      include: {
        participants: true,
        orders: {
          include: {
            items: {
              include: {
                menuItem: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findOrderLogs(tableId: string) {
    return this.prisma.tableOrderLog.findMany({
      where: { tableId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findLogs(tableId: string) {
    return this.prisma.tableLog.findMany({
      where: { tableId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findAllLogs() {
    return this.prisma.tableLog.findMany({
      include: {
        table: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

async deleteTable(id: string) {
  const table = await this.prisma.table.findUnique({
    where: { id },
  });

  if (!table) {
    return {
      success: false,
      message: 'Table not found',
    };
  }

  if (table.status === 'OCCUPIED') {
    return {
      success: false,
      message: 'Cannot delete occupied table',
    };
  }

  await this.prisma.$transaction(async (tx) => {
    await tx.tableLog.deleteMany({
      where: { tableId: id },
    });

    await tx.tableOrderLog.deleteMany({
      where: { tableId: id },
    });

    await tx.kitchenTicket.deleteMany({
      where: { tableId: id },
    });

    await tx.payment.deleteMany({
      where: { tableId: id },
    });

    await tx.table.delete({
      where: { id },
    });
  });

  return {
    success: true,
  };
}

async createTable(data: {
  number: number;
  seats: number;
  note?: string;
}) {
  const table = await this.prisma.table.create({
    data: {
      number: data.number,
      seats: data.seats,
      note: data.note?.trim() || null,
      status: 'AVAILABLE',
    },
  });

  await this.createLog({
    tableId: table.id,
    type: 'TABLE_CREATED',
    message: `Table ${table.number} created`,
    afterData: table as any,
  });

  return table;
}

async updateTableNote(id: string, note?: string) {
  const before = await this.prisma.table.findUnique({
    where: { id },
  });

  const table = await this.prisma.table.update({
    where: { id },
    data: {
      note: note?.trim() || null,
    },
  });

  await this.createLog({
    tableId: id,
    type: 'TABLE_NOTE_CHANGED',
    message: 'Table note changed',
    beforeData: before as any,
    afterData: table as any,
  });

  return table;
}

  findPendingKitchenTickets() {
    return this.prisma.kitchenTicket.findMany({
      where: {
        printed: false,
      },
      include: {
        station: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  markKitchenTicketPrinted(id: string) {
    return this.prisma.kitchenTicket.update({
      where: { id },
      data: {
        printed: true,
      },
    });
  }

  createLog(data: {
    tableId: string;
    type: string;
    message: string;
    beforeData?: Prisma.InputJsonValue;
    afterData?: Prisma.InputJsonValue;
  }) {
    return this.prisma.tableLog.create({
      data: {
        tableId: data.tableId,
        type: data.type,
        message: data.message,
        beforeData: data.beforeData,
        afterData: data.afterData,
      },
    });
  }

  async createOrderLog(data: {
    tableId: string;
    itemName: string;
    price: number;
    menuItemId?: string;
  }) {
    const menuItem = data.menuItemId
      ? await this.prisma.menuItem.findUnique({
          where: { id: data.menuItemId },
          include: {
            station: true,
          },
        })
      : null;

    const order = await this.prisma.tableOrderLog.create({
      data: {
        tableId: data.tableId,
        itemName: data.itemName,
        price: data.price,
        btwRate: menuItem?.btwRate ?? 9,
      },
    });

    const table = await this.prisma.table.findUnique({
      where: { id: data.tableId },
    });

    if (menuItem?.station && table) {
      await this.prisma.kitchenTicket.create({
        data: {
          tableId: data.tableId,
          tableNumber: table.number,
          itemName: menuItem.name,
          quantity: 1,
          stationId: menuItem.station.id,
          printerName: menuItem.station.printerIp,
        },
      });
    }

    await this.createLog({
      tableId: data.tableId,
      type: 'ORDER_ADDED',
      message: `Added ${data.itemName} (€${data.price})`,
    });

    return order;
  }

  async deleteOrderLog(id: string) {
    const order = await this.prisma.tableOrderLog.findUnique({
      where: { id },
    });

    const deleted = await this.prisma.tableOrderLog.delete({
      where: { id },
    });

    if (order) {
      await this.createLog({
        tableId: order.tableId,
        type: 'ORDER_REMOVED',
        message: `Removed ${order.itemName} (€${order.price})`,
      });
    }

    return deleted;
  }
  
  async updateSelectedPackage(
    id: string,
    selectedPackage: string,
    selectedGuests?: number,
    selectedPackages?: Prisma.InputJsonValue,
  ) {
    const table = await this.prisma.table.update({
      where: { id },
      data: {
        selectedPackage,
        selectedGuests,
        selectedPackages,
      },
    });

    await this.createLog({
      tableId: id,
      type: 'MENU_CHANGED',
      message: `Menu changed: ${selectedPackage}`,
    });

    return table;
  }

async createPayment(data: {
  tableId: string;
  tableNumber: number;
  method: string;
  total: number;
  paid?: number;
  change?: number;
  tip?: number;
}) {
  const payment = await this.prisma.payment.create({
    data,
  });

  await this.createLog({
    tableId: data.tableId,
    type: 'PAYMENT_ADDED',
    message: `Payment added: ${data.method} €${data.total}`,
    afterData: payment as any,
  });

  return payment;
}

findPayments() {
  return this.prisma.payment.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
}


async removeTip(paymentId: string) {
  const oldPayment = await this.prisma.payment.findUnique({
    where: { id: paymentId },
  });

  const payment = await this.prisma.payment.update({
    where: { id: paymentId },
    data: {
      tip: 0,
    },
  });

  await this.createLog({
    tableId: payment.tableId,
    type: 'TIP_REMOVED',
    message: `Tip removed (€${oldPayment?.tip || 0})`,
    beforeData: oldPayment as any,
    afterData: payment as any,
  });

  return payment;
}

async deletePayment(id: string) {
  const payment = await this.prisma.payment.findUnique({
    where: { id },
  });

  const deleted = await this.prisma.payment.delete({
    where: { id },
  });

  await this.createLog({
    tableId: payment?.tableId || '',
    type: 'PAYMENT_DELETED',
    message: `Payment deleted (€${payment?.total || 0})`,
    beforeData: payment as any,
  });

  return deleted;
}

async deleteAllPayments() {
  const payments = await this.prisma.payment.findMany();

  const deleted = await this.prisma.payment.deleteMany();

  for (const payment of payments) {
    await this.createLog({
      tableId: payment.tableId,
      type: 'REVENUE_CLEARED',
      message: `Revenue cleared payment: Table ${payment.tableNumber} (€${payment.total})`,
      beforeData: payment as any,
    });
  }

  return deleted;
}


async mergeTable(
  targetTableId: string,
  fromTableId: string,
) {
  if (targetTableId === fromTableId) {
    return {
      success: false,
      message: 'Cannot merge same table',
    };
  }

  const targetTable = await this.prisma.table.findUnique({
    where: { id: targetTableId },
  });

  const fromTable = await this.prisma.table.findUnique({
    where: { id: fromTableId },
  });

  if (!targetTable || !fromTable) {
    return {
      success: false,
      message: 'Table not found',
    };
  }

  const targetPackages = Array.isArray(targetTable.selectedPackages)
    ? (targetTable.selectedPackages as any[])
    : [];

  const fromPackages = Array.isArray(fromTable.selectedPackages)
    ? (fromTable.selectedPackages as any[])
    : [];

  await this.prisma.$transaction(async (tx) => {
    await tx.tableOrderLog.updateMany({
      where: {
        tableId: fromTableId,
      },
      data: {
        tableId: targetTableId,
      },
    });

    await tx.kitchenTicket.updateMany({
      where: {
        tableId: fromTableId,
      },
      data: {
        tableId: targetTableId,
        tableNumber: targetTable.number,
      },
    });

    await tx.payment.updateMany({
      where: {
        tableId: fromTableId,
      },
      data: {
        tableId: targetTableId,
        tableNumber: targetTable.number,
      },
    });

    await tx.table.update({
      where: {
        id: targetTableId,
      },
      data: {
        status: 'OCCUPIED',
        selectedGuests:
          (targetTable.selectedGuests || 0) +
          (fromTable.selectedGuests || 0),
        selectedPackages: [
          ...targetPackages,
          ...fromPackages,
        ] as any,
      },
    });

    await tx.table.update({
      where: {
        id: fromTableId,
      },
      data: {
        status: 'AVAILABLE',
        selectedPackage: null,
        selectedGuests: null,
        selectedPackages: Prisma.JsonNull,
      },
    });
  });

  await this.createLog({
    tableId: targetTableId,
    type: 'TABLE_MERGED',
    message: `Merged table ${fromTable.number} into table ${targetTable.number}`,
  });

  return {
    success: true,
  };
}

async transferTable(fromTableId: string, toTableId: string) {
  if (fromTableId === toTableId) {
    return { success: false, message: 'Same table' };
  }

  const fromTable = await this.prisma.table.findUnique({
    where: { id: fromTableId },
  });

  const toTable = await this.prisma.table.findUnique({
    where: { id: toTableId },
  });

  if (!fromTable || !toTable) {
    return { success: false, message: 'Table not found' };
  }

  const orders = await this.prisma.tableOrderLog.findMany({
    where: { tableId: fromTableId },
  });

  
  await this.prisma.$transaction(async (tx) => {
    await tx.table.update({
      where: { id: toTableId },
      data: {
        status: fromTable.status,
        selectedPackage: fromTable.selectedPackage,
        selectedGuests: fromTable.selectedGuests,
        selectedPackages: fromTable.selectedPackages ?? Prisma.JsonNull,
      },
    });

    
    await tx.tableOrderLog.updateMany({
      where: { tableId: fromTableId },
      data: { tableId: toTableId },
    });

    await tx.kitchenTicket.updateMany({
      where: { tableId: fromTableId },
      data: {
        tableId: toTableId,
        tableNumber: toTable.number,
      },
    });

    await tx.table.update({
      where: { id: fromTableId },
      data: {
        status: 'AVAILABLE',
        selectedPackage: null,
        selectedGuests: null,
        selectedPackages: Prisma.JsonNull,
      },
    });
  });

  await this.createLog({
    tableId: fromTableId,
    type: 'TABLE_TRANSFERRED',
    message: `Transferred table ${fromTable.number} to table ${toTable.number}`,
    beforeData: {
      fromTable,
      toTable,
      orders,
    } as any,
  });

  await this.createLog({
    tableId: toTableId,
    type: 'TABLE_TRANSFER_RECEIVED',
    message: `Received transfer from table ${fromTable.number}`,
    afterData: {
      fromTable,
      toTable,
      orders,
    } as any,
  });

  return {
    success: true,
    fromTable,
    toTable,
  };
}

  async updateStatus(
    id: string,
    status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING',
  ) {
    const before = await this.prisma.table.findUnique({
      where: { id },
    });

    const table = await this.prisma.table.update({
      where: { id },
      data: { status },
    });

    await this.createLog({
      tableId: id,
      type: 'STATUS_CHANGED',
      message: `Status changed from ${before?.status} to ${status}`,
      beforeData: {
        status: before?.status,
      },
      afterData: {
        status,
      },
    });

    return table;
  }

  async markReady(id: string) {
    const beforeTable = await this.prisma.table.findUnique({
      where: { id },
    });

    const beforeOrders = await this.prisma.tableOrderLog.findMany({
      where: {
        tableId: id,
      },
    });

   await this.prisma.payment.deleteMany({
  where: {
    tableId: id,
  },
});

await this.prisma.tableOrderLog.deleteMany({
  where: {
    tableId: id,
  },
});

    const table = await this.prisma.table.update({
      where: { id },
      data: {
        status: 'AVAILABLE',
        selectedPackage: null,
        selectedGuests: null,
        selectedPackages: Prisma.JsonNull,
      },
    });

    await this.createLog({
      tableId: id,
      type: 'TABLE_READY',
      message: 'Table reset and marked as ready',
      beforeData: {
        table: beforeTable,
        orders: beforeOrders,
      },
      afterData: {
        table,
      },
    });

    return table;
  }

  async undoLog(id: string) {
    const log = await this.prisma.tableLog.findUnique({
      where: { id },
    });

    if (!log || log.undone) {
      return log;
    }

    if (log.type === 'STATUS_CHANGED') {
      const beforeData = log.beforeData as any;

      await this.prisma.table.update({
        where: { id: log.tableId },
        data: {
          status: beforeData.status,
        },
      });
    }

    if (log.type === 'TABLE_READY') {
      const beforeData = log.beforeData as any;

      if (beforeData?.table) {
        await this.prisma.table.update({
          where: { id: log.tableId },
          data: {
            status: beforeData.table.status,
            selectedPackage: beforeData.table.selectedPackage,
            selectedGuests: beforeData.table.selectedGuests,
            selectedPackages:
              beforeData.table.selectedPackages ?? Prisma.JsonNull,
          },
        });
      }

      if (Array.isArray(beforeData?.orders)) {
        for (const order of beforeData.orders) {
          await this.prisma.tableOrderLog.create({
            data: {
              tableId: log.tableId,
              itemName: order.itemName,
              price: order.price,
              btwRate: order.btwRate ?? 9,
            },
          });
        }
      }
    }

if (log.type === 'PAYMENT_DELETED') {
  const beforeData = log.beforeData as any;

  if (beforeData) {
    await this.prisma.payment.create({
      data: {
        tableId: beforeData.tableId,
        tableNumber: beforeData.tableNumber,
        method: beforeData.method,
        total: beforeData.total,
        paid: beforeData.paid,
        change: beforeData.change,
        tip: beforeData.tip ?? 0,
        createdAt: beforeData.createdAt,
      },
    });
  }
}

if (log.type === 'TIP_REMOVED') {
  const beforeData = log.beforeData as any;

  if (beforeData) {
    await this.prisma.payment.update({
      where: { id: beforeData.id },
      data: {
        tip: beforeData.tip ?? 0,
      },
    });
  }
}

if (log.type === 'REVENUE_CLEARED') {
  const beforeData = log.beforeData as any;

  if (beforeData) {
    await this.prisma.payment.create({
      data: {
        tableId: beforeData.tableId,
        tableNumber: beforeData.tableNumber,
        method: beforeData.method,
        total: beforeData.total,
        paid: beforeData.paid,
        change: beforeData.change,
        tip: beforeData.tip ?? 0,
        createdAt: beforeData.createdAt,
      },
    });
  }
}
    
    return this.prisma.tableLog.update({
      where: { id },
      data: {
        undone: true,
      },
    });
  }

  clearLogs() {
    return this.prisma.tableLog.deleteMany();
  }
}