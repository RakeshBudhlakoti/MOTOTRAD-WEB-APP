import { Controller, Post, Body, UseGuards, Req, Get, Param, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('buy-now')
  @ApiOperation({ summary: 'Create a Buy Now order' })
  createBuyNow(
    @Req() req: any,
    @Body('auctionId') auctionId: string,
    @Body('isPartial') isPartial: boolean,
  ) {
    return this.ordersService.createBuyNowOrder(req.user.sub, auctionId, isPartial);
  }

  @Post('capture-buynow')
  @ApiOperation({ summary: 'Capture Buy Now payment' })
  captureBuyNow(
    @Req() req: any,
    @Body('paypalOrderId') paypalOrderId: string,
  ) {
    return this.ordersService.captureBuyNowPayment(req.user.sub, paypalOrderId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders (Admin)' })
  findAll(@Query() query: any) {
    return this.ordersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Get('auction/:auctionId')
  @ApiOperation({ summary: 'Get order by auction ID' })
  findByAuctionId(@Param('auctionId') auctionId: string) {
    return this.ordersService.findByAuctionId(auctionId);
  }

  @Post(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.ordersService.updateStatus(id, status);
  }

  @Post(':id/initiate-balance')
  @ApiOperation({ summary: 'Initiate balance payment for partial order' })
  initiateBalance(@Req() req: any, @Param('id') id: string) {
    return this.ordersService.createBalancePayment(req.user.sub, id);
  }

  @Post(':id/capture-balance')
  @ApiOperation({ summary: 'Capture balance payment for partial order' })
  captureBalance(
    @Req() req: any,
    @Param('id') id: string,
    @Body('paypalOrderId') paypalOrderId: string,
  ) {
    return this.ordersService.captureBalancePayment(req.user.sub, id, paypalOrderId);
  }

  @Post(':id/initiate-deposit')
  @ApiOperation({ summary: 'Initiate deposit payment for auction winner' })
  initiateDeposit(@Req() req: any, @Param('id') id: string) {
    return this.ordersService.initiateAuctionDeposit(req.user.sub, id);
  }

  @Post(':id/capture-deposit')
  @ApiOperation({ summary: 'Capture deposit payment for auction winner' })
  captureDeposit(
    @Req() req: any,
    @Param('id') id: string,
    @Body('paypalOrderId') paypalOrderId: string,
  ) {
    return this.ordersService.captureAuctionDeposit(req.user.sub, id, paypalOrderId);
  }

  // --- Admin Endpoints ---

  @Post(':id/cash-payment')
  @ApiOperation({ summary: 'Record offline cash payment' })
  markCashPayment(@Req() req: any, @Param('id') id: string, @Body() body: { amount: number, notes?: string }) {
    return this.ordersService.markCashPayment(id, body.amount, req.user.sub, body.notes);
  }

  @Post(':id/mark-cash')
  @ApiOperation({ summary: 'Record offline cash payment (alias)' })
  markCashPaymentAlias(@Req() req: any, @Param('id') id: string, @Body() body: { amount: number, notes?: string }) {
    return this.ordersService.markCashPayment(id, body.amount, req.user.sub, body.notes);
  }

  @Post(':id/remarks')
  @ApiOperation({ summary: 'Append admin remarks to order' })
  addAdminRemark(@Req() req: any, @Param('id') id: string, @Body('remark') remark: string) {
    return this.ordersService.addAdminRemark(id, remark, req.user.sub);
  }

  @Post(':id/remind')
  @ApiOperation({ summary: 'Send payment reminder email' })
  sendPaymentReminder(@Param('id') id: string) {
    return this.ordersService.sendPaymentReminder(id);
  }

  @Get(':id/invoice')
  @ApiOperation({ summary: 'Generate and download PDF invoice' })
  generateInvoicePdf(@Param('id') id: string) {
    return this.ordersService.generateInvoicePdf(id);
  }
}
