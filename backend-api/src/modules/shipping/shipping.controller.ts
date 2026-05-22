import { Controller, Post, Get, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ShippingService } from '@/modules/shipping/shipping.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@ApiTags('shipping')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Post(':orderId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a shipment for an order' })
  create(@Param('orderId') orderId: string, @Body() data: any) {
    return this.shippingService.createShipment(orderId, data);
  }

  @Get(':orderId/timeline')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get shipping timeline' })
  getTimeline(@Param('orderId') orderId: string) {
    return this.shippingService.getTimeline(orderId);
  }

  @Patch(':orderId/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update shipment status and add timeline event' })
  updateStatus(
    @Param('orderId') orderId: string,
    @Body('status') status: any,
    @Body('description') description: string,
    @Body('location') location?: string,
    @Body('receiverName') receiverName?: string,
    @Body('receiverPhone') receiverPhone?: string,
    @Body('isRepresentative') isRepresentative?: boolean,
  ) {
    return this.shippingService.updateStatus(
      orderId,
      status,
      description,
      location,
      receiverName,
      receiverPhone,
      isRepresentative
    );
  }
}
