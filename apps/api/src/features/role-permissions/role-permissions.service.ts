import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { permissions, roles, rolesPermissions } from 'src/database/index';
import { AssignPermissionDto } from './dto/assign-permission.dto';

@Injectable()
export class RolePermissionsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async getPermissionsByRoleId(roleId: number) {
    // Check if role exists
    const role = await this.drizzle
      .select()
      .from(roles)
      .where(eq(roles.id, roleId));

    if (role.length === 0) {
      throw new HttpException('Role not found', HttpStatus.NOT_FOUND);
    }

    // Get permissions for the role
    const rolePermissions = await this.drizzle
      .select({
        id: permissions.id,
        name: permissions.name,
      })
      .from(rolesPermissions)
      .leftJoin(permissions, eq(permissions.id, rolesPermissions.permissionId))
      .where(eq(rolesPermissions.roleId, roleId));

    return rolePermissions;
  }

  async assignPermissionsToRole(assignPermissionDto: AssignPermissionDto) {
    const { roleId, permissionIds } = assignPermissionDto;

    // Check if role exists
    const role = await this.drizzle
      .select()
      .from(roles)
      .where(eq(roles.id, roleId));

    if (role.length === 0) {
      throw new HttpException('Role not found', HttpStatus.NOT_FOUND);
    }

    // Check if all permissions exist
    for (const permissionId of permissionIds) {
      const permission = await this.drizzle
        .select()
        .from(permissions)
        .where(eq(permissions.id, permissionId));

      if (permission.length === 0) {
        throw new HttpException(
          `Permission with ID ${permissionId} not found`,
          HttpStatus.NOT_FOUND,
        );
      }
    }

    // Start a transaction
    return await this.drizzle.transaction(async (tx) => {
      // Remove existing permissions for the role
      await tx
        .delete(rolesPermissions)
        .where(eq(rolesPermissions.roleId, roleId));

      // Assign new permissions
      for (const permissionId of permissionIds) {
        await tx.insert(rolesPermissions).values({
          roleId,
          permissionId: permissionId,
        });
      }

      // Return the updated permissions
      const updatedPermissions = await tx
        .select({
          id: permissions.id,
          name: permissions.name,
        })
        .from(rolesPermissions)
        .leftJoin(
          permissions,
          eq(permissions.id, rolesPermissions.permissionId),
        )
        .where(eq(rolesPermissions.roleId, roleId));

      return updatedPermissions;
    });
  }

  async removePermissionFromRole(roleId: number, permissionId: number) {
    // Check if the role-permission relationship exists
    const rolePermission = await this.drizzle
      .select()
      .from(rolesPermissions)
      .where(
        and(
          eq(rolesPermissions.roleId, roleId),
          eq(rolesPermissions.permissionId, permissionId),
        ),
      );

    if (rolePermission.length === 0) {
      throw new HttpException(
        'Role-permission relationship not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Remove the permission from the role
    await this.drizzle
      .delete(rolesPermissions)
      .where(
        and(
          eq(rolesPermissions.roleId, roleId),
          eq(rolesPermissions.permissionId, permissionId),
        ),
      );

    return { message: 'Permission removed from role successfully' };
  }
}
