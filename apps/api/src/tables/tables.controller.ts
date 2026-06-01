<<<<<<< HEAD
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { TablesService } from './tables.service';

@Controller('tables')
export class TablesController {
  constructor(
    private readonly tablesService: TablesService,
  ) {}

  @Get()
  findAll() {
    return this.tablesService.findAll();
  }

  @Get('logs/all')
  findAllLogs() {
    return this.tablesService.findAllLogs();
  }

@Get('payments/all')
findPayments() {
  return this.tablesService.findPayments();
}

@Delete('payments/:id')
deletePayment(@Param('id') id: string) {
  return this.tablesService.deletePayment(id);
}

@Delete('payments/all/delete')
deleteAllPayments() {
  return this.tablesService.deleteAllPayments();
}

@Post(':id/pay')
createPayment(
  @Param('id') id: string,
  @Body() body: any,
) {
  return this.tablesService.createPayment({
    tableId: id,
    tableNumber: body.tableNumber,
    method: body.method,
    total: body.total,
    paid: body.paid,
    change: body.change,
    tip: body.tip,
  });
}

  @Post('logs/:id/undo')
  undoLog(@Param('id') id: string) {
    return this.tablesService.undoLog(id);
  }

  @Delete('logs/clear/all')
  clearLogs() {
    return this.tablesService.clearLogs();
  }

  @Get('kitchen-tickets/pending')
  findPendingKitchenTickets() {
    return this.tablesService.findPendingKitchenTickets();
  }

  @Patch('kitchen-tickets/:id/printed')
  markKitchenTicketPrinted(@Param('id') id: string) {
    return this.tablesService.markKitchenTicketPrinted(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tablesService.findOne(id);
  }

  @Get(':id/sessions')
  findTableSessions(@Param('id') id: string) {
    return this.tablesService.findTableSessions(id);
  }

  @Get(':id/order-logs')
  findOrderLogs(@Param('id') id: string) {
    return this.tablesService.findOrderLogs(id);
  }

  @Get(':id/logs')
  findLogs(@Param('id') id: string) {
    return this.tablesService.findLogs(id);
  }

  @Post(':id/order-logs')
  createOrderLog(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.tablesService.createOrderLog({
      tableId: id,
      itemName: body.itemName,
      price: body.price,
      menuItemId: body.menuItemId,
    });
  }

@Patch('payments/:id/remove-tip')
removeTip(@Param('id') id: string) {
  return this.tablesService.removeTip(id);
}

  @Delete('order-logs/:id')
  deleteOrderLog(@Param('id') id: string) {
    return this.tablesService.deleteOrderLog(id);
  }

  @Patch(':id/package')
  updateSelectedPackage(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.tablesService.updateSelectedPackage(
      id,
      body.selectedPackage,
      body.selectedGuests,
      body.selectedPackages,
    );
  }

  @Post(':id/ready')
  markReady(@Param('id') id: string) {
    return this.tablesService.markReady(id);
  }
  
@Post(':id/transfer')
transferTable(
  @Param('id') id: string,
  @Body() body: any,
) {
  return this.tablesService.transferTable(
    id,
    body.toTableId,
  );
}

@Post(':id/merge')
mergeTable(
  @Param('id') id: string,
  @Body() body: any,
) {
  return this.tablesService.mergeTable(
    id,
    body.fromTableId,
  );
}

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.tablesService.updateStatus(
      id,
      body.status,
    );
  }
}
=======
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { TablesService } from './tables.service';

@Controller('tables')
export class TablesController {
  constructor(
    private readonly tablesService: TablesService,
  ) {}

  @Get()
  findAll() {
    return this.tablesService.findAll();
  }

  @Get('logs/all')
  findAllLogs() {
    return this.tablesService.findAllLogs();
  }

@Get('payments/all')
findPayments() {
  return this.tablesService.findPayments();
}

@Delete('payments/:id')
deletePayment(@Param('id') id: string) {
  return this.tablesService.deletePayment(id);
}

@Delete('payments/all/delete')
deleteAllPayments() {
  return this.tablesService.deleteAllPayments();
}

@Post(':id/pay')
createPayment(
  @Param('id') id: string,
  @Body() body: any,
) {
  return this.tablesService.createPayment({
    tableId: id,
    tableNumber: body.tableNumber,
    method: body.method,
    total: body.total,
    paid: body.paid,
    change: body.change,
    tip: body.tip,
  });
}

  @Post('logs/:id/undo')
  undoLog(@Param('id') id: string) {
    return this.tablesService.undoLog(id);
  }

  @Delete('logs/clear/all')
  clearLogs() {
    return this.tablesService.clearLogs();
  }

  @Get('kitchen-tickets/pending')
  findPendingKitchenTickets() {
    return this.tablesService.findPendingKitchenTickets();
  }

  @Patch('kitchen-tickets/:id/printed')
  markKitchenTicketPrinted(@Param('id') id: string) {
    return this.tablesService.markKitchenTicketPrinted(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tablesService.findOne(id);
  }

  @Get(':id/sessions')
  findTableSessions(@Param('id') id: string) {
    return this.tablesService.findTableSessions(id);
  }

  @Get(':id/order-logs')
  findOrderLogs(@Param('id') id: string) {
    return this.tablesService.findOrderLogs(id);
  }

  @Get(':id/logs')
  findLogs(@Param('id') id: string) {
    return this.tablesService.findLogs(id);
  }

  @Post(':id/order-logs')
  createOrderLog(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.tablesService.createOrderLog({
      tableId: id,
      itemName: body.itemName,
      price: body.price,
      menuItemId: body.menuItemId,
    });
  }

@Patch('payments/:id/remove-tip')
removeTip(@Param('id') id: string) {
  return this.tablesService.removeTip(id);
}

  @Delete('order-logs/:id')
  deleteOrderLog(@Param('id') id: string) {
    return this.tablesService.deleteOrderLog(id);
  }

  @Patch(':id/package')
  updateSelectedPackage(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.tablesService.updateSelectedPackage(
      id,
      body.selectedPackage,
      body.selectedGuests,
      body.selectedPackages,
    );
  }

  @Post(':id/ready')
  markReady(@Param('id') id: string) {
    return this.tablesService.markReady(id);
  }
  
@Post(':id/transfer')
transferTable(
  @Param('id') id: string,
  @Body() body: any,
) {
  return this.tablesService.transferTable(
    id,
    body.toTableId,
  );
}

@Post(':id/merge')
mergeTable(
  @Param('id') id: string,
  @Body() body: any,
) {
  return this.tablesService.mergeTable(
    id,
    body.fromTableId,
  );
}

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.tablesService.updateStatus(
      id,
      body.status,
    );
  }
}
>>>>>>> b809c9c36b4377ad2c52e2bd3bb5efabacf67364
