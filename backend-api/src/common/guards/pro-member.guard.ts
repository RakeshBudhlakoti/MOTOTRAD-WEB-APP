import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../modules/prisma/prisma.service';

@Injectable()
export class ProMemberGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    const userData: any = await (this.prisma.user as any).findUnique({
      where: { id: user.sub },
      select: { isProMember: true, membershipExpiry: true },
    });

    if (!userData || !userData.isProMember) {
      throw new ForbiddenException('Pro Membership required to perform this action');
    }

    return true;
  }
}
