import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString, IsBoolean, IsUUID, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAuctionDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  startingBid: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  reservePrice?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  buyItNowPrice?: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  bidIncrement: number;

  @ApiProperty()
  @IsDateString()
  startTime: string;

  @ApiProperty()
  @IsDateString()
  endTime: string;

  @ApiProperty({ default: 300 })
  @IsNumber()
  @IsOptional()
  autoExtensionWindowSecs?: number = 300;

  @ApiProperty({ default: 300 })
  @IsNumber()
  @IsOptional()
  autoExtensionBySecs?: number = 300;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean = false;
}

export class UpdateAuctionDto extends CreateAuctionDto {
  @ApiProperty({ required: false })
  @IsEnum(['PENDING', 'ACTIVE', 'ENDED_SOLD', 'ENDED_UNSOLD', 'CANCELLED'])
  @IsOptional()
  status?: any;
}

export class AuctionQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, enum: ['PENDING', 'ACTIVE', 'ENDED_SOLD', 'ENDED_UNSOLD', 'CANCELLED', 'PAST', 'LIVE_AND_UPCOMING'] })
  @IsOptional()
  @IsEnum(['PENDING', 'ACTIVE', 'ENDED_SOLD', 'ENDED_UNSOLD', 'CANCELLED', 'PAST', 'LIVE_AND_UPCOMING'])
  status?: string;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  limit?: number = 10;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  basket?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({ required: false, default: 'desc' })
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
