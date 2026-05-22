import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../modules/prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user, ip } = request;
    const userAgent = request.get('user-agent');

    // Skip GET requests from audit logs usually, or customize as needed
    if (method === 'GET') {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (response) => {
        try {
          await this.prisma.auditLog.create({
            data: {
              userId: user?.sub || null,
              action: `${method} ${url}`,
              entityType: this.getEntityType(url),
              entityId: response?.id || body?.id || null,
              newValues: body,
              ipAddress: ip,
              userAgent: userAgent,
            },
          });
        } catch (error) {
          console.error('Failed to create audit log', error);
        }
      }),
    );
  }

  private getEntityType(url: string): string {
    const parts = url.split('/');
    return parts[2] || 'unknown';
  }
}
