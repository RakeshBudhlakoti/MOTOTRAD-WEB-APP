import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../modules/prisma/prisma.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredPermissions) {
      return true;
    }

    // Check if the route is marked as Public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (isPublic && !user) {
      return true;
    }

    if (!user) {
      return false;
    }
    
    // Fetch user's role and its permissions
    const userWithPermissions = await this.prisma.user.findUnique({
      where: { id: user.sub },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!userWithPermissions || !userWithPermissions.role) {
      return false;
    }

    const userPermissions = userWithPermissions.role.permissions.map(
      (rp) => `${rp.permission.action}_${rp.permission.resource}`,
    );

    return requiredPermissions.every((permission) => 
      userPermissions.includes(permission) || 
      userPermissions.some(up => up.startsWith(`${permission}_`))
    );
  }
}
