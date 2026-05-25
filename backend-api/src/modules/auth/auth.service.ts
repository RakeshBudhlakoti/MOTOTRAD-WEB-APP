import { Injectable, UnauthorizedException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
    private notificationsService: NotificationsService,
  ) {}

  async register(dto: RegisterDto) {
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingEmail) throw new ConflictException('Email already exists');

    const existingUsername = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existingUsername) throw new ConflictException('Username already exists');

    if (dto.phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (existingPhone) throw new ConflictException('Phone number already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    
    // Generate activation token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Find or create role
    let role = await this.prisma.role.findUnique({
      where: { name: dto.role },
    });

    if (!role) {
      role = await this.prisma.role.create({
        data: { name: dto.role },
      });
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        phone: dto.phone,
        avatar: dto.avatar,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        roleId: role.id,
        verificationToken,
        verificationTokenExpires,
        status: 'INACTIVE', // Explicitly set to INACTIVE
      },
    });

    // Notify all admins and super admins of the new user registration
    try {
      const admins = await this.prisma.user.findMany({
        where: {
          role: {
            name: {
              in: ['ADMIN', 'SUPER_ADMIN']
            }
          }
        }
      });
      for (const admin of admins) {
        await this.notificationsService.notify(
          admin.id,
          'MEMBERSHIP',
          'New User Registered',
          `A new user @${user.username || user.email} (${user.firstName || ''} ${user.lastName || ''}) has registered on the platform.`,
          { userId: user.id }
        );
      }
    } catch (notiError) {
      console.error('Failed to send registration notification:', notiError);
    }

    // Send activation email
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const activationUrl = `${frontendUrl}/auth/verify?token=${verificationToken}`;
    
    try {
      await this.emailService.sendActivationEmail(user.email, user.firstName || user.username || 'User', activationUrl);
    } catch (error) {
      console.error('Failed to send activation email:', error);
      // We don't throw here to not break registration, but ideally we should handle this
    }

    return { message: 'Registration successful. Please check your email to activate your account.' };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email },
          { username: dto.email },
        ],
      },
      include: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check user status
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('Your account is not active. Please verify your email or connect to admin.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role.name);
    
    // Update Refresh Token and Last Login
    const hash = await bcrypt.hash(tokens.refresh_token, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { 
        refreshTokenHash: hash,
        lastLoginAt: new Date()
      },
    });
    
    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        role: user.role,
        isProMember: (user as any).isProMember,
        membershipStatus: (user as any).membershipStatus,
        membershipExpiry: (user as any).membershipExpiry,
      },
    };
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Access Denied');
    }

    const isRefreshTokenValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Access Denied');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role.name);
    await this.updateRefreshToken(user.id, tokens.refresh_token);
    
    return tokens;
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: hash },
    });
  }

  async generateTokens(userId: string, email: string, role: string) {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email, role },
        {
          secret: this.configService.get('JWT_SECRET'),
          expiresIn: '15m',
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, email, role },
        {
          secret: this.configService.get('JWT_SECRET'), // Use a separate secret for RT in prod
          expiresIn: '7d',
        },
      ),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }

  async checkAvailability(field: 'email' | 'username' | 'phone', value: string) {
    const user = await this.prisma.user.findUnique({
      where: { [field]: value } as any,
    });
    return { available: !user };
  }

  async forgotPassword(email: string, origin: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    // To prevent email enumeration, return a generic success message even if the user does not exist or has an unsupported status.
    // We allow password resets for both ACTIVE and INACTIVE (unverified) accounts.
    if (!user || (user.status !== 'ACTIVE' && user.status !== 'INACTIVE')) {
      return { message: 'If account exists, reset email sent.' };
    }

    // Determine if the request originates from the Admin Portal (port 3000 or custom admin domain)
    const isAdminOrigin = origin.includes(':3000') || origin.toLowerCase().includes('admin');
    const userRole = user.role?.name?.toUpperCase();

    if (isAdminOrigin) {
      // Enforce that only ADMIN and SELLER accounts can recover via the Admin Portal.
      // We return the same generic message on failure to maintain security.
      if (userRole !== 'ADMIN' && userRole !== 'SELLER') {
        return { message: 'If account exists, reset email sent.' };
      }
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetTokenHash,
        resetTokenExpires,
      },
    });

    const resetUrl = isAdminOrigin
      ? `${origin}/auth/reset-password?token=${resetToken}`
      : `${this.configService.get('FRONTEND_URL') || 'http://localhost:3001'}/reset-password?token=${resetToken}`;
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'User';

    await this.emailService.sendPasswordResetEmail(user.email, name, resetUrl);

    return { message: 'If account exists, reset email sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        resetTokenHash,
        resetTokenExpires: { gt: new Date() },
      },
    });

    if (!user || (user.status !== 'ACTIVE' && user.status !== 'INACTIVE')) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetTokenHash: null,
        resetTokenExpires: null,
        status: 'ACTIVE',
        isEmailVerified: true,
      },
    });

    return { message: 'Password reset successful' };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationTokenExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        status: 'ACTIVE',
        verificationToken: null,
        verificationTokenExpires: null,
      },
    });

    // Send Welcome Email
    try {
      await this.emailService.sendWelcomeEmail(user.email, user.firstName || user.username || 'User');
    } catch (error) {
      console.error('Failed to send welcome email after verification:', error);
    }

    return { message: 'Email verified successfully. You can now login.' };
  }
}
