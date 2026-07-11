import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  permissionActionEnum,
  permissions,
  permissionScopeEnum,
  rolePermissions,
  roles,
} from '@/database/schema';
import { AuditHelper } from '@/features/audit/audit-event.service';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

type ActionType = (typeof permissionActionEnum)[number];
type ScopeType = (typeof permissionScopeEnum)[number];

@Injectable()
export class AssignmentsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly auditHelper: AuditHelper,
  ) {}

  private async checkRoleOwnership(roleId: string, tenantId?: string) {
    const role = await this.db.query.roles.findFirst({
      where: tenantId
        ? and(eq(roles.id, roleId), eq(roles.tenantId, tenantId))
        : eq(roles.id, roleId),
    });

    if (!role) {
      throw new NotFoundException(`Role ${roleId} not found or access denied`);
    }
    return role;
  }

  async getRolePermissions(roleId: string, tenantId?: string) {
    const role = await this.checkRoleOwnership(roleId, tenantId);

    const list = await this.db.query.rolePermissions.findMany({
      where: eq(rolePermissions.roleId, roleId),
      with: {
        permission: true,
      },
    });

    return list.map((rp: any) => ({
      id: rp.id,
      permissionId: rp.permissionId,
      resource: rp.permission.resource,
      action: rp.permission.action,
      scope: rp.permission.scope,
      description: rp.permission.description,
      isCustom: rp.isCustom,
    }));
  }

  async assignPermissions(
    roleId: string,
    userId: string,
    permissionsParams: any[],
    tenantId?: string,
  ) {
    const role = await this.checkRoleOwnership(roleId, tenantId);

    // Sync: remove existing
    await this.db
      .delete(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));

    const insertedIds: string[] = [];

    for (const param of permissionsParams) {
      let permissionId: string | undefined;

      if (param.id) {
        permissionId = param.id;
      } else if (param.resource && param.action) {
        const found = await this.db.query.permissions.findFirst({
          where: and(
            eq(permissions.resource, param.resource),
            eq(permissions.action, param.action as ActionType),
            param.scope
              ? eq(permissions.scope, param.scope as ScopeType)
              : undefined,
          ),
        });
        permissionId = found?.id;
      }

      if (permissionId) {
        const [rp] = await this.db
          .insert(rolePermissions)
          .values({
            roleId: roleId,
            permissionId,
            isCustom: true,
          })
          .returning();
        insertedIds.push(rp.id);
      }
    }

    await this.auditHelper.logUpdate(
      role.tenantId,
      'role',
      {},
      { assigned: insertedIds },
      {
        targetId: roleId,
        description: `Assigned ${insertedIds.length} permissions to role ${role.name}`,
      },
    );
  }

  async removePermissions(
    roleId: string,
    userId: string,
    permissionsParams: any[],
    tenantId?: string,
  ) {
    const role = await this.checkRoleOwnership(roleId, tenantId);

    for (const param of permissionsParams) {
      let permissionId: string | undefined;

      if (param.id) {
        permissionId = param.id;
      } else {
        const found = await this.db.query.permissions.findFirst({
          where: and(
            eq(permissions.resource, param.resource),
            eq(permissions.action, param.action as ActionType),
            param.scope
              ? eq(permissions.scope, param.scope as ScopeType)
              : undefined,
          ),
        });
        permissionId = found?.id;
      }

      if (permissionId) {
        await this.db
          .delete(rolePermissions)
          .where(
            and(
              eq(rolePermissions.roleId, roleId),
              eq(rolePermissions.permissionId, permissionId),
            ),
          );
      }
    }

    await this.auditHelper.logUpdate(
      userId,
      'role',
      {},
      { removed: true },
      {
        targetId: roleId,
        description: `Removed specific permissions from role ${role.name}`,
      },
    );
  }
}
