import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProMemberGuard } from '../../common/guards/pro-member.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-order/:auctionId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ProMemberGuard)
  @ApiOperation({ summary: 'Create an order from a won auction' })
  createOrder(@Param('auctionId') auctionId: string, @Req() req: any) {
    return this.paymentsService.createOrderFromAuction(auctionId, req.user.sub);
  }

  @Post('initiate/:orderId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ProMemberGuard)
  @ApiOperation({ summary: 'Initiate a payment (Deposit or Full)' })
  initiatePayment(
    @Param('orderId') orderId: string,
    @Body('type') type: 'DEPOSIT' | 'FULL',
  ) {
    return this.paymentsService.initiatePayment(orderId, type);
  }

  @Post('webhook/paypal')
  @ApiOperation({ summary: 'PayPal Webhook Handler' })
  handleWebhook(@Body() data: any) {
    return this.paymentsService.handlePaypalWebhook(data);
  }

  @Get('history')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user transaction history' })
  getHistory(@Req() req: any) {
    return this.paymentsService.getTransactionHistory(req.user.sub);
  }
}
