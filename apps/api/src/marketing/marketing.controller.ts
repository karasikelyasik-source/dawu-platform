import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { CreateMarketingCampaignDto } from './dto/create-marketing-campaign.dto';
import { UpdateMarketingCampaignDto } from './dto/update-marketing-campaign.dto';
import { MarketingService } from './marketing.service';

@Controller('marketing')
export class MarketingController {
  constructor(
    private readonly marketingService: MarketingService,
  ) {}

  @Get('dashboard')
  getDashboard() {
    return this.marketingService.getDashboard();
  }

  @Get('campaigns')
  findAll() {
    return this.marketingService.findAll();
  }

  @Get('campaigns/:id')
  findOne(@Param('id') id: string) {
    return this.marketingService.findOne(id);
  }

  @Post('campaigns')
  create(@Body() dto: CreateMarketingCampaignDto) {
    return this.marketingService.create(dto);
  }

  @Patch('campaigns/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMarketingCampaignDto,
  ) {
    return this.marketingService.update(id, dto);
  }

  @Delete('campaigns/:id')
  remove(@Param('id') id: string) {
    return this.marketingService.remove(id);
  }

  @Post('campaigns/:id/prepare')
  prepareRecipients(@Param('id') id: string) {
    return this.marketingService.prepareRecipients(id);
  }

  @Post('campaigns/:id/send')
  sendCampaign(@Param('id') id: string) {
    return this.marketingService.sendCampaign(id);
  }
}