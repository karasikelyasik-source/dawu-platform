import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { TakeAwayService } from './take-away.service';

@Controller('take-away')
export class TakeAwayController {
  constructor(private readonly takeAwayService: TakeAwayService) {}

  @Get()
  findAll() {
    return this.takeAwayService.findAll();
  }

  @Post('categories')
  createCategory(@Body() body: { name: string }) {
    return this.takeAwayService.createCategory(body.name);
  }

  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() body: { name: string }) {
    return this.takeAwayService.updateCategory(id, body.name);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.takeAwayService.deleteCategory(id);
  }

  @Post('items')
  createItem(
    @Body() body: { categoryId: string; name: string; price: number; btwRate?: number },
  ) {
    return this.takeAwayService.createItem(body);
  }

  @Patch('items/:id')
  updateItem(
    @Param('id') id: string,
    @Body() body: { name: string; price: number; btwRate?: number },
  ) {
    return this.takeAwayService.updateItem(id, body);
  }

  @Delete('items/:id')
  deleteItem(@Param('id') id: string) {
    return this.takeAwayService.deleteItem(id);
  }
}