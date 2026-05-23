import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { MenuService } from './menu.service';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  findAll() {
    return this.menuService.findAll();
  }

  @Get('categories')
  findCategories() {
    return this.menuService.findCategories();
  }

  @Post('items')
  createItem(@Body() body: any) {
    return this.menuService.createItem(body);
  }

  @Delete('items/:id')
  deleteItem(@Param('id') id: string) {
    return this.menuService.deleteItem(id);
  }

  @Get('packages')
  findPackages() {
    return this.menuService.findPackages();
  }

  @Post('packages')
  createPackage(@Body() body: any) {
    return this.menuService.createPackage(body);
  }

  @Delete('packages/:id')
  deletePackage(@Param('id') id: string) {
    return this.menuService.deletePackage(id);
  }

  @Get('stations')
  findStations() {
    return this.menuService.findStations();
  }

  @Post('stations')
  createStation(@Body() body: any) {
    return this.menuService.createStation(body);
  }

  @Delete('stations/:id')
  deleteStation(@Param('id') id: string) {
    return this.menuService.deleteStation(id);
  }

  @Patch('items/station')
  assignItemToStation(@Body() body: any) {
    return this.menuService.assignItemToStation(body);
  }

  @Patch('stations/:id/receipt-printer')
setReceiptPrinter(@Param('id') id: string) {
  return this.menuService.setReceiptPrinter(id);
}

@Get('receipt-printer')
findReceiptPrinter() {
  return this.menuService.findReceiptPrinter();
}
}