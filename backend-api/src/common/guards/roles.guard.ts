import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    
    const request = context.switchToHttp().getRequest();
    const { user, params } = request;

    // Permit users to access or update their own account resource (delegating specific rules to the service layer)
    if (user && params && user.sub === params.id) {
      return true;
    }

    const userRoles = (Array.isArray(user?.roles) ? user.roles : user?.role ? [user.role] : []).map(r => r.toLowerCase());
    return requiredRoles.some((role) => userRoles.includes(role.toLowerCase()));
  }
}
