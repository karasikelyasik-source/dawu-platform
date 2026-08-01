import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { CreateMarketingCampaignDto } from './dto/create-marketing-campaign.dto';
import { UpdateMarketingCampaignDto } from './dto/update-marketing-campaign.dto';
import { MarketingEmailQueue } from './marketing-email.queue';
import { MarketingService } from './marketing.service';
import { SendMarketingContactDto } from './dto/send-marketing-contact.dto';

@Controller('marketing')
export class MarketingController {
  constructor(
    private readonly marketingService: MarketingService,
    private readonly marketingEmailQueue: MarketingEmailQueue,
  ) {}

  @Get('dashboard')
  getDashboard() {
    return this.marketingService.getDashboard();
  }

  @Get('campaigns')
  findAll() {
    return this.marketingService.findAll();
  }

  @Get('campaigns/:id/queue-status')
  async getQueueStatus(@Param('id') id: string) {
    const status =
      await this.marketingEmailQueue.getCampaignQueueStatus(id);

    if (!status) {
      throw new NotFoundException(
        'Marketing campaign not found.',
      );
    }

    return status;
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
  @Post('campaigns/:id/send-to-contact')
sendToContact(
  @Param('id') id: string,
  @Body() dto: SendMarketingContactDto,
) {
  return this.marketingService.sendToContact(
    id,
    dto,
  );
}
}