import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from '@/modules/settings/settings.service';

@Injectable()
export class EmailService {
  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
    private settingsService: SettingsService
  ) {}

  private async getLogoUrl() {
    return await this.settingsService.getByKey('site_logo') || this.configService.get('logoUrl');
  }

  async sendWelcomeEmail(email: string, name: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Welcome to Mototrad!',
      template: './welcome',
      context: { 
        name, 
        year: new Date().getFullYear(),
        logoUrl: await this.getLogoUrl()
      },
    });
  }

  async sendAdminCreatedAccountEmail(email: string, name: string, tempPassword: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Your Mototrad Account Has Been Created',
      template: './admin-created-account',
      context: { 
        name, 
        email,
        tempPassword,
        loginUrl: this.configService.get('FRONTEND_URL') || 'http://localhost:3000/auth/login',
        year: new Date().getFullYear(),
        logoUrl: await this.getLogoUrl()
      },
    });
  }

  async sendActivationEmail(email: string, name: string, activationUrl: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Activate Your Mototrad Account',
      template: './activation',
      context: { 
        name, 
        activationUrl, 
        year: new Date().getFullYear(),
        logoUrl: await this.getLogoUrl()
      },
    });
  }

  async sendOutbidNotification(email: string, auctionTitle: string, currentBid: number) {
    await this.mailerService.sendMail({
      to: email,
      subject: `You've been outbid on ${auctionTitle}`,
      template: './outbid',
      context: { 
        auctionTitle, 
        currentBid, 
        year: new Date().getFullYear(),
        logoUrl: await this.getLogoUrl()
      },
    });
  }

  async sendPaymentConfirmation(
    email: string,
    orderNumber: string,
    amount: number,
    details?: {
      baseAmount: number;
      commissionAmount: number;
      paidAmount: number;
      remainingAmount: number;
      status: string;
      onlineDeposit?: number;
      cashPayment?: number;
    }
  ) {
    await this.mailerService.sendMail({
      to: email,
      subject: `Payment Confirmed - Order #${orderNumber}`,
      template: './payment-confirmed',
      context: { 
        orderNumber, 
        amount, 
        baseAmount: details?.baseAmount || amount,
        commissionAmount: details?.commissionAmount || 0,
        paidAmount: details?.paidAmount || amount,
        remainingAmount: details?.remainingAmount || 0,
        status: details?.status?.replace(/_/g, ' ') || 'Confirmed',
        onlineDeposit: details?.onlineDeposit || 0,
        cashPayment: details?.cashPayment || 0,
        isDeposit: details?.status === 'DEPOSIT_PAID',
        frontendUrl: this.configService.get('FRONTEND_URL') || 'http://localhost:3000',
        year: new Date().getFullYear(),
        logoUrl: await this.getLogoUrl()
      },
    });
  }

  async sendPaymentReminderEmail(
    email: string,
    orderNumber: string,
    productTitle: string,
    baseAmount: number,
    commissionAmount: number,
    paidAmount: number,
    remainingAmount: number
  ) {
    await this.mailerService.sendMail({
      to: email,
      subject: `Payment Reminder: Order #${orderNumber} - Balance Due`,
      template: './payment-reminder',
      context: {
        orderNumber,
        productTitle,
        baseAmount,
        commissionAmount,
        paidAmount,
        remainingAmount,
        frontendUrl: this.configService.get('FRONTEND_URL') || 'http://localhost:3000',
        year: new Date().getFullYear(),
        logoUrl: await this.getLogoUrl()
      },
    });
  }

  async sendAuctionWon(email: string, auctionTitle: string, amount: number) {
    await this.mailerService.sendMail({
      to: email,
      subject: `Congratulations! You won the auction: ${auctionTitle}`,
      template: './auction-won',
      context: { 
        auctionTitle, 
        amount, 
        frontendUrl: this.configService.get('FRONTEND_URL') || 'http://localhost:3000',
        year: new Date().getFullYear(),
        logoUrl: await this.getLogoUrl()
      },
    });
  }

  async sendAdminAuctionCompletedNotification(
    details: {
      auctionTitle: string;
      winningBid: number;
      winnerEmail: string;
      winnerName: string;
      endedAt: Date;
      bidCount: number;
      commissionAmount: number;
      totalAmount: number;
    }
  ) {
    const adminEmail = await this.settingsService.getSystemAdminEmail();
    await this.mailerService.sendMail({
      to: adminEmail,
      subject: `[Admin Alert] Auction Successfully Completed: ${details.auctionTitle}`,
      template: './admin-auction-completed',
      context: {
        ...details,
        endedAtFormatted: details.endedAt.toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short'
        }),
        year: new Date().getFullYear(),
        logoUrl: await this.getLogoUrl()
      }
    });
  }

  async sendAuctionUnsold(email: string, auctionTitle: string, highestBid: number) {
    await this.mailerService.sendMail({
      to: email,
      subject: `Auction Ended: ${auctionTitle}`,
      template: './auction-unsold',
      context: { 
        auctionTitle, 
        highestBid, 
        year: new Date().getFullYear(),
        logoUrl: await this.getLogoUrl()
      },
    });
  }

  async sendAuctionEndedNotification(email: string, auctionTitle: string, reason: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: `Auction Finished: ${auctionTitle}`,
      template: './auction-ended',
      context: { 
        auctionTitle, 
        reason,
        year: new Date().getFullYear(),
        logoUrl: await this.getLogoUrl()
      },
    });
  }

  async sendBidConfirmation(email: string, auctionTitle: string, amount: number) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Your Bid Has Been Placed Successfully',
      template: './bid-confirmation',
      context: { 
        auctionTitle, 
        amount, 
        year: new Date().getFullYear(),
        logoUrl: await this.getLogoUrl()
      },
    });
  }

  async sendAuctionLost(email: string, auctionTitle: string, finalPrice: number) {
    await this.mailerService.sendMail({
      to: email,
      subject: `Auction Ended: ${auctionTitle}`,
      template: './auction-lost',
      context: { 
        auctionTitle, 
        finalPrice, 
        year: new Date().getFullYear(),
        logoUrl: await this.getLogoUrl()
      },
    });
  }

  async sendAdminNewBidNotification(auctionTitle: string, amount: number, bidderName: string) {
    const adminEmail = await this.settingsService.getSystemAdminEmail();
    
    await this.mailerService.sendMail({
      to: adminEmail,
      subject: 'New Bid Placed on Auction',
      template: './admin-new-bid',
      context: { 
        auctionTitle, 
        amount, 
        bidderName,
        year: new Date().getFullYear(),
        logoUrl: await this.getLogoUrl()
      },
    });
  }

  async sendPasswordResetEmail(email: string, name: string, resetUrl: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Reset Your Mototrad Password',
      template: './password-reset',
      context: { 
        name, 
        resetUrl, 
        year: new Date().getFullYear(),
        logoUrl: await this.getLogoUrl()
      },
    });
  }

  async sendDeliveryConfirmation(
    email: string,
    buyerName: string,
    orderNumber: string,
    vehicleTitle: string,
    receiverName: string,
    receiverPhone?: string,
    isRepresentative: boolean = false
  ) {
    await this.mailerService.sendMail({
      to: email,
      subject: `Fulfillment Completed: Your Vehicle has been Delivered! - Order #${orderNumber}`,
      template: './delivery-confirmed',
      context: {
        buyerName,
        orderNumber,
        vehicleTitle,
        receiverName,
        receiverPhone,
        isRepresentative,
        dateDelivered: new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        year: new Date().getFullYear(),
        logoUrl: await this.getLogoUrl()
      }
    });
  }

  async sendContactAdminAlert(
    adminEmail: string,
    senderName: string,
    senderEmail: string,
    senderPhone: string,
    subject: string,
    message: string
  ) {
    await this.mailerService.sendMail({
      to: adminEmail,
      subject: `[Contact Form] ${subject}`,
      template: './contact-admin-alert',
      context: {
        senderName,
        senderEmail,
        senderPhone: senderPhone || 'N/A',
        subject,
        message,
        year: new Date().getFullYear(),
        logoUrl: await this.getLogoUrl()
      }
    });
  }

  async sendContactUserReply(
    userEmail: string,
    userName: string,
    subject: string,
    originalMessage: string,
    replyText: string
  ) {
    await this.mailerService.sendMail({
      to: userEmail,
      subject: `Re: ${subject} - Mototrad Support`,
      template: './contact-user-reply',
      context: {
        userName,
        subject,
        originalMessage,
        replyText,
        year: new Date().getFullYear(),
        logoUrl: await this.getLogoUrl()
      }
    });
  }

  async sendContactTicketClosed(
    userEmail: string,
    userName: string,
    subject: string,
    originalMessage: string
  ) {
    await this.mailerService.sendMail({
      to: userEmail,
      subject: `[Resolved] Re: ${subject} - Mototrad Support`,
      template: './contact-ticket-closed',
      context: {
        userName,
        subject,
        originalMessage,
        year: new Date().getFullYear(),
        logoUrl: await this.getLogoUrl()
      }
    });
  }
}
