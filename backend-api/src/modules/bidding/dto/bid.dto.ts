import { IsOptional, IsString, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class BidQueryDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  auctionId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  userId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  productId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  status?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional()
  toDate?: string;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional()
  minAmount?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional()
  maxAmount?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional()
  page?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional()
  limit?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  search?: string;
}

export class UpdateBidStatusDto {
  @IsEnum(['VALID', 'OUTBID', 'RETRACTED', 'WINNING', 'SUSPICIOUS'])
  status: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
