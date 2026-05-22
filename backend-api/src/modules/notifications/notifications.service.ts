import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '@/modules/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectQueue('notifications') private readonly notificationsQueue: Queue,
    private prisma: PrismaService,
  ) {}

  async notify(userId: string, type: string, title: string, message: string, data?: any, actionUrl?: string) {
    // 1. Create In-app Notification record
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type: type as any,
        title,
        message,
        actionUrl,
        data: data || {},
      } as any,
    });

    // 2. Queue background tasks (Email, Push, etc.)
    await this.notificationsQueue.add('send-notification', {
      notificationId: notification.id,
      userId,
      type,
      title,
      message,
    });

    return notification;
  }

  async findAll(query?: any) {
    const { userId, type, isRead, page = 1, limit = 20, search } = query || {};
    const skip = (page - 1) * limit;

    const where: any = {};
    if (userId) where.userId = userId;
    if (type && type !== 'ALL') where.type = type;
    if (isRead !== undefined && isRead !== 'ALL') where.isRead = isRead === 'true' || isRead === true;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          user: { select: { firstName: true, lastName: true, email: true, username: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page: Number(page),
        lastPage: Math.ceil(total / Number(limit)),
      },
    };
  }

  async findOne(id: string) {
    return this.prisma.notification.findUnique({
      where: { id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, username: true } },
      },
    });
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
