import { ConflictException, Injectable, Scope } from '@nestjs/common';
import { Request } from 'express';
import { ClsService } from 'nestjs-cls';

@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  constructor(private readonly cls: ClsService) {}

 getTenantContext(req: Request, dto: any = {}) {
  // Solo tomamos el tenantId si viene explícitamente en el DTO
  const dtoTenantId = dto?.tenantId || null;
  const isSystemAdmin = req['user']?.isSystemAdmin;
  const currentTenantId = this.cls.get('tenantId');

  // Si es Admin del sistema, priorizamos el filtro del DTO. 
  // Si no hay filtro, targetTenantId será null (permitiendo ver todo).
  // Si NO es Admin, usamos obligatoriamente su currentTenantId.
  const targetTenantId = isSystemAdmin ? dtoTenantId : currentTenantId;

  // Solo lanzamos excepción si NO es superadmin y no tenemos un tenantId
  if (!isSystemAdmin && !targetTenantId) {
    throw new ConflictException('Tenant ID is required for this operation');
  }

  return { targetTenantId, userId: req['user']?.sub, isSystemAdmin };
}

  getTenantId() {
    return this.cls.get('tenantId');
  }

  getSystemAdmin(req: Request) {
    const isSystemAdmin = req['user']?.isSystemAdmin;
    return isSystemAdmin ? true : false;
  }

  getUserId(req: Request): string {
    return req['user'].sub;
  }
}
