import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { ClsService } from 'nestjs-cls';
import {
  PERMISSIONS_KEY,
  type PermissionInput,
} from '../decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

const RESOURCE_MODULE_MAP: Record<string, string | null> = {
  savings: 'SAVINGS',
  'portfolio:loans': 'LOANS',
  'portfolio:credits': 'CREDITS',
  'portfolio:payments-loans': 'LOANS',
  'portfolio:payments-credits': 'CREDITS',
  accounting: 'ACCOUNTING',
  banking: 'BANKING',
  inventory: 'INVENTORY',
  purchasing: 'PURCHASING',
  iam: null,
  catalog: null,
  system: null,
};

function resourceToModule(resource: string): string | null {
  const match = RESOURCE_MODULE_MAP[resource];
  if (match !== undefined) return match;

  for (const [prefix, moduleCode] of Object.entries(RESOURCE_MODULE_MAP)) {
    if (resource.startsWith(prefix)) return moduleCode;
  }

  const firstSegment = resource.split(':')[0];
  if (firstSegment && RESOURCE_MODULE_MAP[firstSegment] !== undefined) {
    return RESOURCE_MODULE_MAP[firstSegment];
  }

  return null;
}

@Injectable()
export class TenantModulesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly cls: ClsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredPermissions = this.reflector.getAllAndOverride<
      PermissionInput[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);
    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException(
        'Autenticación requerida para validar módulos',
      );
    }

    if (user.isSystemAdmin) return true;

    const tenantId = request.tenantId;
    if (!tenantId) return true;

    const modulesToCheck = new Set<string>();

    for (const perm of requiredPermissions) {
      const resource = typeof perm === 'string' ? perm : perm.resource;
      const moduleCode = resourceToModule(resource);
      if (moduleCode) {
        modulesToCheck.add(moduleCode);
      }
    }

    if (modulesToCheck.size === 0) return true;

    let activeModules: Set<string> = this.cls.get('activeModules');

    if (!activeModules) {
      const rows = await this.db
        .select({ moduleCode: schema.tenantModules.moduleCode })
        .from(schema.tenantModules)
        .where(
          eq(schema.tenantModules.tenantId, tenantId) &&
            eq(schema.tenantModules.status as any, 'ENABLED'),
        );

      activeModules = new Set(rows.map((r) => r.moduleCode));

      this.cls.set('activeModules', activeModules);
    }

    for (const moduleCode of modulesToCheck) {
      if (!activeModules.has(moduleCode)) {
        throw new ForbiddenException(
          `El módulo ${moduleCode} no está activo para este Tenant`,
        );
      }
    }

    return true;
  }
}
