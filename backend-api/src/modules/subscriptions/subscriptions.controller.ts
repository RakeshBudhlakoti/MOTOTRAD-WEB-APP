import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('create-order')
  @ApiOperation({ summary: 'Create a PayPal order for Pro Membership' })
  createOrder(@Req() req: any) {
    return this.subscriptionsService.createSubscriptionOrder(req.user.sub);
  }

  @Post('capture')
  @ApiOperation({ summary: 'Capture a PayPal order and activate membership' })
  capture(@Req() req: any, @Body('orderId') orderId: string) {
    return this.subscriptionsService.captureSubscription(req.user.sub, orderId);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get current user membership status' })
  getStatus(@Req() req: any) {
    return this.subscriptionsService.getMembershipStatus(req.user.sub);
  }
}
