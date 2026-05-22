import { Controller, Get, Query, ParseFloatPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CommissionService } from './commissions.service';

@ApiTags('commissions')
@Controller('commissions')
export class CommissionsController {
  constructor(private readonly commissionService: CommissionService) {}

  @Get('calculate')
  @ApiOperation({ summary: 'Calculate commission for a product and amount' })
  async calculate(
    @Query('productId') productId: string,
    @Query('amount', ParseFloatPipe) amount: number,
  ) {
    return this.commissionService.calculateCommission(productId, amount);
  }
}
