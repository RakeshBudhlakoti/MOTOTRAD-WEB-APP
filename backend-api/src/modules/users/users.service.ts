import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService
  ) {}

  async getMyBids(userId: string) {
    return this.prisma.bid.findMany({
      where: { userId },
      include: {
        auction: {
          include: {
            product: {
              include: {
                media: {
                  where: { isPrimary: true },
                  take: 1
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { buyerId: userId },
      include: {
        auction: {
          include: {
            product: {
              include: {
                media: {
                  where: { isPrimary: true },
                  take: 1
                }
              }
            }
          }
        },
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findAll(query: { page?: number; limit?: number; search?: string; status?: string }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.status) {
      where.status = query.status;
    } else {
      where.status = { not: 'DELETED' };
    }

    const [items, total, activeCount, inactiveCount, deletedCount] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { 
          role: true,
          _count: {
            select: { bids: true }
          }
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { status: 'INACTIVE' } }),
      this.prisma.user.count({ where: { status: 'DELETED' } }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        counts: {
          all: activeCount + inactiveCount,
          active: activeCount,
          inactive: inactiveCount,
          trash: deletedCount
        }
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async checkAvailability(type: 'email' | 'username', value: string) {
    const count = await this.prisma.user.count({
      where: { [type]: value }
    });
    return { available: count === 0 };
  }

  async updateProfile(userId: string, data: { firstName?: string; lastName?: string; phone?: string; avatar?: string }) {
    if (data.phone) {
      const existingPhone = await this.prisma.user.findFirst({
        where: { phone: data.phone, id: { not: userId } }
      });
      if (existingPhone) {
        throw new ConflictException('Phone number is already registered to another user');
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data,
      include: { role: true }
    });
  }
  async create(data: { email: string; username: string; firstName: string; lastName: string; roleId: string; password?: string }) {
    const existingEmail = await this.prisma.user.findFirst({ where: { email: data.email } });
    if (existingEmail) throw new ConflictException('Email address is already registered');

    const existingUser = await this.prisma.user.findFirst({ where: { username: data.username } });
    if (existingUser) throw new ConflictException('Username is already taken');

    const password = data.password || Math.random().toString(36).slice(-10);
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        passwordHash,
        roleId: data.roleId,
        status: 'ACTIVE',
        isEmailVerified: true,
      },
      include: { role: true }
    });

    try {
      // Send welcome email with dummy credentials
      await this.emailService.sendAdminCreatedAccountEmail(user.email, user.firstName || 'User', password);
      console.log(`Admin Created Account Email Sent: Credentials for ${user.email} -> password: ${password}`);
    } catch (error) {
      console.error('Failed to send credentials email:', error);
    }

    return user;
  }

  private async checkAccess(actor: any, targetUserId: string, action: string) {
    if (!actor) return; // Skip checking if no actor is provided (e.g., seeding/internal processes)

    const actorId = actor.sub;
    const actorRole = actor.role?.toUpperCase();

    // 1. You CAN update your own account, but you cannot delete, restore, or deactivate yourself
    if (actorId === targetUserId) {
      if (action === 'update') {
        return; // Allow self-profile updates!
      }
      throw new ConflictException(`Access Denied: You cannot ${action} your own account.`);
    }

    // Fetch target user and their role
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { role: true }
    });
    
    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    const targetUserRole = targetUser.role?.name?.toUpperCase();

    if (targetUserRole === 'SUPER_ADMIN' && (action === 'delete' || action === 'restore' || action.includes('status') || action.includes('deactivate'))) {
      throw new ConflictException('Access Denied: Superadministrators cannot be deleted, deactivated, or restored under any conditions.');
    }

    // 2. Super Admin can do anything except self-actions (which is blocked above)
    if (actorRole === 'SUPER_ADMIN' || actorRole === 'SUPERADMIN' || actorRole?.includes('SUPER')) {
      return;
    }

    // 3. Admin restrictions:
    if (actorRole === 'ADMIN') {
      const isTargetAdmin = targetUserRole === 'ADMIN';
      const isTargetSuper = targetUserRole === 'SUPER_ADMIN' || targetUserRole === 'SUPERADMIN' || targetUserRole?.includes('SUPER');
      
      if (isTargetAdmin || isTargetSuper) {
        throw new ConflictException(`Access Denied: Admins are not authorized to ${action} other Admins or Super Admins.`);
      }
      return;
    }

    // 4. Other roles are unauthorized
    throw new ConflictException(`Access Denied: You do not have permissions to ${action} this user.`);
  }

  async update(userId: string, data: any, actor?: any) {
    await this.checkAccess(actor, userId, 'update');

    const { password, ...updateData } = data;

    // Check if email is already registered to a DIFFERENT user
    if (updateData.email) {
      const existingEmail = await this.prisma.user.findFirst({
        where: { email: updateData.email, id: { not: userId } }
      });
      if (existingEmail) {
        throw new ConflictException('Email address is already registered to another user');
      }
    }

    // Check if phone is already registered to a DIFFERENT user
    if (updateData.phone) {
      const existingPhone = await this.prisma.user.findFirst({
        where: { phone: updateData.phone, id: { not: userId } }
      });
      if (existingPhone) {
        throw new ConflictException('Phone number is already registered to another user');
      }
    }

    // Check if username is already taken by a DIFFERENT user
    if (updateData.username) {
      const existingUsername = await this.prisma.user.findFirst({
        where: { username: updateData.username, id: { not: userId } }
      });
      if (existingUsername) {
        throw new ConflictException('Username is already taken by another user');
      }
    }

    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: { role: true }
    });
  }

  async updateStatus(userId: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED', actor?: any) {
    await this.checkAccess(actor, userId, 'modify the status of');
    return this.prisma.user.update({
      where: { id: userId },
      data: { status },
      include: { role: true }
    });
  }

  async remove(userId: string, actor?: any) {
    await this.checkAccess(actor, userId, 'delete');

    return this.prisma.user.update({ 
      where: { id: userId },
      data: { 
        deletedAt: new Date(),
        status: 'DELETED'
      }
    });
  }

  async restore(userId: string, actor?: any) {
    await this.checkAccess(actor, userId, 'restore');

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: null,
        status: 'ACTIVE'
      }
    });
  }
}
