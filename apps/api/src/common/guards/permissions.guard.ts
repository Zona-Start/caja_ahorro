import { IS_PUBLIC_KEY } from '@/common/decorators';
import { RolePermissionsService } from '@/features/role-permissions/role-permissions.service';
import { RoutePermissionsService } from '@/features/route-permissions/route-permissions.service';
import { UserRolesService } from '@/features/user-roles/user-roles.service';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rolePermissionsService: RolePermissionsService,
    private userRolesService: UserRolesService,
    private routePermissionsService: RoutePermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    const { user } = request;

    // If no user is found, deny access
    if (!user) {
      return false;
    }

    // Get the current route
    const route = request.route?.path;

    // If no route is found or no permissions are required, allow access
    if (!route || !requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Get user roles
    const userRoles = await this.userRolesService.getRolesByUserId(user.id);

    // Get permissions required for this route from the database
    const routePermissionsData =
      await this.routePermissionsService.getPermissionsByRoute(route);

    // If no specific route permissions are defined in the database, use the ones from the decorator
    const permissionsToCheck =
      routePermissionsData.length > 0
        ? routePermissionsData.map((p) => p.name)
        : requiredPermissions;

    // For each role, check if it has the required permissions
    for (const role of userRoles) {
      // Ensure role.id is not null before passing to service
      if (role.id === null) {
        continue;
      }

      const rolePermissions =
        await this.rolePermissionsService.getPermissionsByRoleId(role.id);

      // Check if the role has all required permissions
      const hasAllPermissions = permissionsToCheck.every((requiredPermission) =>
        rolePermissions.some(
          (permission) => permission.name === requiredPermission,
        ),
      );

      if (hasAllPermissions) {
        return true;
      }
    }

    return false;
  }
}
