// src/common/middleware/tenant-cls.middleware.ts
import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { ClsService } from "nestjs-cls";

/**
 * Middleware que toma el tenantId ya validado por TenantGuard
 * y lo guarda en el CLS (Continuation-Local Storage) para
 * acceso transparente en cualquier servicio downstream.
 *
 * NOTA: Este middleware se ejecuta ANTES de los guards,
 * pero el valor de tenantId se setea de nuevo en el interceptor
 * porque guards corren después de middlewares.
 */
@Injectable()
export class TenantClsInterceptorMiddleware implements NestMiddleware {
  constructor(private readonly cls: ClsService) {}

  use(req: Request, _res: Response, next: NextFunction) {
    // Pre-set desde header (será validado/sobrescrito por TenantGuard)
    const tenantId = req.headers["x-tenant-id"] as string | undefined;
    if (tenantId) {
      this.cls.set("tenantId", tenantId);
    }
    next();
  }
}
