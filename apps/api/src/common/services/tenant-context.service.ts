import { ConflictException, Injectable, Scope } from '@nestjs/common';
import { Request } from 'express';
import { ClsService } from 'nestjs-cls';

@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  constructor(private readonly cls: ClsService) {}

  getTenantContext(req: Request, dto: any = {}) {
    const dtoTenantId = dto.tenantId ? dto.tenantId : dto;
    const isSystemAdmin = req['user']?.isSystemAdmin;
    const currentTenantId = this.cls.get('tenantId');
    const targetTenantId =
      (isSystemAdmin ? dtoTenantId : currentTenantId) || dtoTenantId;

    if (!targetTenantId) {
      throw new ConflictException('Tenant ID is required for this operation');
    }
    return { targetTenantId, userId: req['user'].sub, isSystemAdmin };
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
