// src/common/interceptors/tenant-cls.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { Observable } from 'rxjs';

/**
 * Interceptor que sincroniza el CLS con el tenantId ya validado por TenantGuard.
 * Se ejecuta DESPUÉS de los guards, garantizando que el valor es legítimo.
 */
@Injectable()
export class TenantClsInterceptor implements NestInterceptor {
  constructor(private readonly cls: ClsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    if (request.tenantId) {
      this.cls.set('tenantId', request.tenantId);
    }
    if (request.userRole) {
      this.cls.set('userRole', request.userRole);
    }
    if (request.user?.sub) {
      this.cls.set('userId', request.user.sub);
    }
    return next.handle();
  }
}
