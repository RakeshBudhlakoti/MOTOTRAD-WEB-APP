import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BiddingService } from './bidding.service';
import { BidQueryDto, UpdateBidStatusDto } from './dto/bid.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('bids')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('bids')
export class BiddingController {
  constructor(private readonly biddingService: BiddingService) {}

  @Get()
  @Permissions('READ_BID')
  @ApiOperation({ summary: 'Get all bids with filters and pagination' })
  findAll(@Query() query: BidQueryDto) {
    return this.biddingService.findAll(query);
  }

  @Get('live')
  @Permissions('READ_BID')
  @ApiOperation({ summary: 'Get live bids for monitoring' })
  getLiveBids(@Query('limit') limit?: number) {
    return this.biddingService.getLiveBids(limit);
  }

  @Get(':id')
  @Permissions('READ_BID')
  @ApiOperation({ summary: 'Get bid details' })
  findOne(@Param('id') id: string) {
    return this.biddingService.findOne(id);
  }

  @Patch(':id/status')
  @Permissions('UPDATE_BID')
  @ApiOperation({ summary: 'Update bid status (Suspicious bid controls)' })
  updateStatus(
    @Param('id') id: string, 
    @Body() dto: UpdateBidStatusDto,
    @Req() req: any
  ) {
    return this.biddingService.updateStatus(id, dto, req.user.sub);
  }
}
