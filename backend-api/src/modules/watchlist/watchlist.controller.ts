import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WatchlistService } from './watchlist.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@ApiTags('watchlist')
@Controller('watchlist')
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Post('toggle')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add or remove an auction from watchlist' })
  toggle(@Req() req: any, @Body('auctionId') auctionId: string) {
    return this.watchlistService.toggle(req.user.sub, auctionId);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user watchlist' })
  findAll(@Req() req: any) {
    return this.watchlistService.findAll(req.user.sub);
  }
}
