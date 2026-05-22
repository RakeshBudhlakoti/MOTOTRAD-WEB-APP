import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { EmailService } from '@/modules/email/email.service';

@Injectable()
export class ShippingService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService
  ) {}

  async createShipment(orderId: string, data: any) {
    return this.prisma.$transaction(async (tx) => {
      // Fetch order and buyer to build dynamic default address
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { buyer: true }
      });

      const defaultAddress = {
        name: order?.buyer ? `${order.buyer.firstName || ''} ${order.buyer.lastName || ''}`.trim() : 'Bidder',
        email: order?.buyer?.email || 'N/A',
        phone: order?.buyer?.phone || 'N/A',
        deliveryType: 'Primary Handover'
      };

      const shipping = await tx.shipping.create({
        data: {
          carrier: data.carrier || 'Mototrad Logistics',
          trackingNumber: data.trackingNumber || `MT-LOG-${Date.now().toString().slice(-6)}`,
          estimatedDelivery: data.estimatedDelivery ? new Date(data.estimatedDelivery) : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          shippingMethod: data.shippingMethod || 'Standard Delivery',
          shippingAddress: data.shippingAddress || defaultAddress,
          orderId,
          status: 'PENDING',
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: { status: 'PROCESSING' },
      });

      await tx.trackingEvent.create({
        data: {
          shippingId: shipping.id,
          description: 'Shipment record created, awaiting pickup.',
          eventDate: new Date(),
        },
      });

      return shipping;
    });
  }

  async updateStatus(
    orderId: string, 
    status: any, 
    description: string, 
    location?: string,
    receiverName?: string,
    receiverPhone?: string,
    isRepresentative: boolean = false
  ) {
    return this.prisma.$transaction(async (tx) => {
      // If status is DELIVERED, customize the description with verification info
      let finalDescription = description;
      if (status === 'DELIVERED') {
        if (isRepresentative) {
          finalDescription = `Handed over to Authorized Representative: ${receiverName || 'N/A'}${receiverPhone ? ` (Phone: ${receiverPhone})` : ''}.`;
        } else {
          finalDescription = `Handed over directly to Bidder: ${receiverName || 'N/A'}${receiverPhone ? ` (Phone: ${receiverPhone})` : ''}.`;
        }
      }

      const shipping = await tx.shipping.update({
        where: { orderId },
        data: { status },
      });

      // Map ShippingStatus to OrderStatus
      let orderStatus: any = 'PROCESSING';
      if (status === 'DISPATCHED' || status === 'IN_TRANSIT') orderStatus = 'SHIPPED';
      if (status === 'DELIVERED') orderStatus = 'DELIVERED';
      if (status === 'EXCEPTION') orderStatus = 'PROCESSING';

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: orderStatus },
        include: {
          buyer: true,
          auction: { include: { product: true } }
        }
      });

      await tx.trackingEvent.create({
        data: {
          shippingId: shipping.id,
          description: finalDescription,
          location,
          eventDate: new Date(),
        },
      });

      // Trigger Delivery Confirmation Email if status is DELIVERED
      if (status === 'DELIVERED' && updatedOrder.buyer) {
        try {
          const buyerFullName = `${updatedOrder.buyer.firstName || ''} ${updatedOrder.buyer.lastName || ''}`.trim() || 'Bidder';
          const finalReceiverName = receiverName || buyerFullName;
          
          await this.emailService.sendDeliveryConfirmation(
            updatedOrder.buyer.email,
            buyerFullName,
            updatedOrder.orderNumber,
            updatedOrder.auction?.product?.title || 'Vehicle asset',
            finalReceiverName,
            receiverPhone,
            isRepresentative
          );
          console.log(`[DELIVERY EMAIL] Successfully sent delivery confirmation to ${updatedOrder.buyer.email}`);
        } catch (emailErr) {
          console.error('[DELIVERY EMAIL ERROR] Failed to send email:', emailErr);
        }
      }

      return shipping;
    });
  }

  async getTimeline(orderId: string) {
    const shipping = await this.prisma.shipping.findUnique({
      where: { orderId },
      include: { trackings: { orderBy: { eventDate: 'desc' } } },
    });
    if (!shipping) throw new NotFoundException('Shipping not found');
    return shipping.trackings;
  }
}
