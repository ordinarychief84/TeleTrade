import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditMeta {
  entity: string;
  action: string;
}

export const AUDIT_KEY = 'audit:meta';
export const Audited = (entity: string, action: string) => SetMetadata(AUDIT_KEY, { entity, action });

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(Reflector) private readonly reflector: Reflector
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const meta = this.reflector.get<AuditMeta>(AUDIT_KEY, context.getHandler());
    if (!meta) return next.handle();

    const req = context.switchToHttp().getRequest();
    const actorId = req.user?.userId ?? null;
    const tenantId = req.user?.tenantId ?? null;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];

    return next.handle().pipe(
      tap((result) => {
        if (!tenantId) return;
        const entityId =
          (result && typeof result === 'object' && 'id' in result ? (result as { id: string }).id : null) ??
          req.params?.id ??
          null;
        // fire-and-forget
        this.prisma.auditLog
          .create({
            data: {
              tenantId,
              actorId,
              action: meta.action,
              entity: meta.entity,
              entityId,
              after: result as any,
              ip,
              userAgent,
            },
          })
          .catch(() => {});
      })
    );
  }
}
