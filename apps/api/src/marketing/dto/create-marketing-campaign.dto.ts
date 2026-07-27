import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { MarketingAudienceType } from '@prisma/client';

export class CreateMarketingCampaignDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  subject!: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  previewText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  subtitle?: string;

  @IsString()
  @MinLength(1)
  body!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  buttonText?: string;

  @IsOptional()
  @IsUrl({
    require_protocol: true,
  })
  buttonUrl?: string;

  @IsOptional()
  @IsUrl({
    require_protocol: true,
  })
  imageUrl?: string;

  @IsOptional()
  @IsEnum(MarketingAudienceType)
  audienceType?: MarketingAudienceType;

  @IsOptional()
  @IsString()
  promoCodeId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  senderName?: string;

  @IsOptional()
  @IsEmail()
  senderEmail?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}