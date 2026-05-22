import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuctionsService } from './auctions.service';
import { CreateAuctionDto, UpdateAuctionDto, AuctionQueryDto } from './dto/auction.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('auctions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('auctions')
export class AuctionsController {
  constructor(private readonly auctionsService: AuctionsService) {}

  @Get()
  @Public()
  @Permissions('READ_AUCTION')
  @ApiOperation({ summary: 'Get all auctions with filters and pagination' })
  findAll(@Query() query: AuctionQueryDto) {
    return this.auctionsService.findAll(query);
  }

  @Get(':id')
  @Public()
  @Permissions('READ_AUCTION')
  @ApiOperation({ summary: 'Get auction details' })
  findOne(@Param('id') id: string) {
    return this.auctionsService.findOne(id);
  }

  @Post()
  @Permissions('CREATE_AUCTION')
  @ApiOperation({ summary: 'Create a new auction' })
  create(@Body() createAuctionDto: CreateAuctionDto) {
    return this.auctionsService.create(createAuctionDto);
  }

  @Patch(':id')
  @Permissions('UPDATE_AUCTION')
  @ApiOperation({ summary: 'Update auction details' })
  update(@Param('id') id: string, @Body() updateAuctionDto: UpdateAuctionDto) {
    return this.auctionsService.update(id, updateAuctionDto);
  }

  @Post(':id/pause')
  @Permissions('UPDATE_AUCTION')
  @ApiOperation({ summary: 'Pause an auction' })
  pause(@Param('id') id: string) {
    return this.auctionsService.pause(id);
  }

  @Post(':id/end-early')
  @Permissions('UPDATE_AUCTION')
  @ApiOperation({ summary: 'End an auction early' })
  endEarly(@Param('id') id: string) {
    return this.auctionsService.endEarly(id);
  }

  @Post(':id/relist')
  @Permissions('CREATE_AUCTION')
  @ApiOperation({ summary: 'Relist an ended auction' })
  relist(@Param('id') id: string, @Body('endTime') endTime: string) {
    return this.auctionsService.relist(id, new Date(endTime));
  }

  @Delete(':id')
  @Permissions('DELETE_AUCTION')
  @ApiOperation({ summary: 'Soft delete an auction' })
  remove(@Param('id') id: string) {
    return this.auctionsService.remove(id);
  }

  @Delete(':id/bids/:bidId')
  @Permissions('UPDATE_AUCTION')
  @ApiOperation({ summary: 'Remove a specific bid' })
  removeBid(@Param('id') id: string, @Param('bidId') bidId: string) {
    return this.auctionsService.removeBid(id, bidId);
  }
}
