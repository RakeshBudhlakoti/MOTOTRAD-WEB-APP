import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { EmailService } from '@/modules/email/email.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { SettingsService } from '@/modules/settings/settings.service';

@Injectable()
export class ContactService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private notificationsService: NotificationsService,
    private settingsService: SettingsService,
  ) {}

  async create(data: { name: string; email: string; phone?: string; subject: string; message: string }) {
    // 1. Save contact inquiry in database
    const inquiry = await this.prisma.contactInquiry.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        subject: data.subject,
        message: data.message,
        status: 'UNREAD',
      },
    });

    // 2. Fetch dyn admin email from Settings DB
    const adminEmail = await this.settingsService.getSystemAdminEmail();

    // 3. Send email to admin
    try {
      await this.emailService.sendContactAdminAlert(
        adminEmail,
        inquiry.name,
        inquiry.email,
        inquiry.phone || '',
        inquiry.subject,
        inquiry.message,
      );
    } catch (err) {
      console.error('Failed to send contact inquiry notification email to admin:', err);
    }

    // 4. Create in-app admin notifications for all administrators
    try {
      const admins = await this.prisma.user.findMany({
        where: {
          role: {
            name: {
              in: ['ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin', 'superadmin'],
            },
          },
        },
      });

      for (const admin of admins) {
        await this.notificationsService.notify(
          admin.id,
          'SYSTEM',
          'New Contact Inquiry Received',
          `New support inquiry from ${inquiry.name}: "${inquiry.subject}"`,
          { contactId: inquiry.id },
          `/contacts/${inquiry.id}`
        );
      }
    } catch (err) {
      console.error('Failed to dispatch admin notification:', err);
    }

    return inquiry;
  }

  async findAll(query: { page?: number; limit?: number; search?: string; status?: string }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { subject: { contains: query.search, mode: 'insensitive' } },
        { message: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.contactInquiry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contactInquiry.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const inquiry = await this.prisma.contactInquiry.findUnique({
      where: { id },
    });
    if (!inquiry) {
      throw new NotFoundException('Contact inquiry not found');
    }
    return inquiry;
  }

  async updateStatus(id: string, status: any) {
    const inquiry = await this.findOne(id);
    
    const updated = await this.prisma.contactInquiry.update({
      where: { id },
      data: { status },
    });

    if (status === 'CLOSED' && inquiry.status !== 'CLOSED') {
      try {
        await this.emailService.sendContactTicketClosed(
          inquiry.email,
          inquiry.name,
          inquiry.subject,
          inquiry.message
        );
      } catch (err) {
        console.error('Failed to send contact ticket closure email to user:', err);
      }
    }

    return updated;
  }

  async reply(id: string, replyText: string, adminName: string) {
    const inquiry = await this.findOne(id);

    // 1. Update DB Record
    const updated = await this.prisma.contactInquiry.update({
      where: { id },
      data: {
        adminReply: replyText,
        status: 'REPLIED',
        repliedBy: adminName,
        repliedAt: new Date(),
      },
    });

    // 2. Send email to user
    try {
      await this.emailService.sendContactUserReply(
        inquiry.email,
        inquiry.name,
        inquiry.subject,
        inquiry.message,
        replyText,
      );
    } catch (err) {
      console.error('Failed to send support reply email to user:', err);
    }

    return updated;
  }
}
